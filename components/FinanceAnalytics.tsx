'use client';
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { financeApi } from '@/lib/services';
import { termLabel } from '@/lib/terms';
import ReconcileFees from '@/components/ReconcileFees';

// ─────────────────────────────────────────────────────────────────────────────
// Finance analytics. Every number comes from /finance/analytics, which works them out from the term bills
// and the recorded payments. Colours: one blue for a single series, grey for "everything else", the fixed
// status colours for payment states (always with an icon and a label), and a validated one-hue ramp for the
// ordered debt sizes.
// ─────────────────────────────────────────────────────────────────────────────

const COLORS = {
  series: '#2a78d6',       // categorical slot 1
  seriesHover: '#3987e5',
  muted: '#c9c5b8',        // de-emphasis grey
  mutedHover: '#b6b2a4',
  grid: '#e7e3d8',
  track: '#cde2fb',        // lighter step of the series ramp
  good: '#0ca30c',
  warning: '#fab219',
  critical: '#d03b3b',
  // one hue, light -> dark, for ordered debt sizes (validated as an ordinal ramp)
  ramp: ['#86b6ef', '#5598e7', '#2a78d6', '#1c5cab', '#104281'],
};

const kes = (n: number | null | undefined) => `KES ${Math.round(n || 0).toLocaleString()}`;
const compact = (n: number) => {
  const a = Math.abs(n);
  if (a >= 1e6) return `${+(n / 1e6).toFixed(1)}M`;
  if (a >= 1e3) return `${+(n / 1e3).toFixed(a >= 1e4 ? 0 : 1)}K`;
  return String(Math.round(n));
};
const pct = (n: number | null | undefined) => (n == null ? '—' : `${n.toFixed(n % 1 === 0 ? 0 : 1)}%`);
const day = (d?: string | null) => (d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

// A round upper bound and tick step for an axis
const niceScale = (max: number) => {
  if (max <= 0) return { top: 1, step: 0.25 };
  const exp = Math.pow(10, Math.floor(Math.log10(max)));
  const f = max / exp;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  const top = nice * exp;
  return { top, step: top / 4 };
};

// white or near-black text for a coloured fill, by its luminance
const inkOn = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4 ? '#0b0b0b' : '#ffffff';
};

// Width of an element, kept up to date, so a chart is drawn at its real size and its text is not scaled down
function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setW(el.clientWidth);
    const ro = new ResizeObserver(entries => setW(Math.floor(entries[0].contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

// ── Tooltip: one for the whole dashboard, value first and name second ──
type Tip = { x: number; y: number; title: string; rows: { label: string; value: string; color?: string }[] } | null;

function useTip() {
  const [tip, setTip] = useState<Tip>(null);
  const show = (e: { clientX: number; clientY: number }, title: string, rows: NonNullable<Tip>['rows']) => setTip({ x: e.clientX, y: e.clientY, title, rows });
  // keyboard focus: show next to the focused mark
  const focus = (el: Element, title: string, rows: NonNullable<Tip>['rows']) => {
    const r = el.getBoundingClientRect();
    setTip({ x: r.left + r.width / 2, y: r.top, title, rows });
  };
  const hide = () => setTip(null);
  return { tip, show, focus, hide };
}

function TipBox({ tip }: { tip: Tip }) {
  if (!tip) return null;
  const left = Math.min(tip.x + 14, (typeof window !== 'undefined' ? window.innerWidth : 1200) - 250);
  return (
    <div role="tooltip" className="pointer-events-none fixed z-[80] rounded-xl border border-stone/15 bg-white px-3 py-2 shadow-lg text-xs" style={{ left, top: tip.y + 16 }}>
      <div className="text-stone mb-1">{tip.title}</div>
      {tip.rows.map((r, i) => (
        <div key={i} className="flex items-center gap-2 leading-5">
          {r.color && <span className="inline-block h-0.5 w-3 rounded" style={{ background: r.color }} aria-hidden />}
          <span className="font-semibold text-brand-dark tabular-nums">{r.value}</span>
          <span className="text-stone">{r.label}</span>
        </div>
      ))}
    </div>
  );
}

// ── A chart card with a Chart / Table switch, so every value is reachable without hovering ──
function Card({ title, subtitle, chart, table, right, className = '' }: { title: string; subtitle?: string; chart: ReactNode; table?: ReactNode; right?: ReactNode; className?: string }) {
  const [view, setView] = useState<'chart' | 'table'>('chart');
  return (
    <section className={`bg-white rounded-2xl border border-stone/10 shadow-sm p-5 ${className}`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="font-display text-base text-brand-dark">{title}</h3>
          {subtitle && <p className="text-xs text-stone mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {right}
          {table && (
            <div className="flex text-xs rounded-lg bg-cream-deep p-0.5" role="group" aria-label="View as">
              {(['chart', 'table'] as const).map(v => (
                <button key={v} onClick={() => setView(v)} aria-pressed={view === v} className={`px-2.5 py-1 rounded-md font-medium capitalize transition ${view === v ? 'bg-white shadow text-brand' : 'text-stone hover:text-brand-dark'}`}>{v}</button>
              ))}
            </div>
          )}
        </div>
      </div>
      {view === 'chart' || !table ? chart : <div className="overflow-x-auto">{table}</div>}
    </section>
  );
}

const Th = ({ children, right }: { children: ReactNode; right?: boolean }) => <th className={`px-3 py-2 text-xs font-semibold text-stone uppercase tracking-wide ${right ? 'text-right' : 'text-left'}`}>{children}</th>;
const Td = ({ children, right, mono }: { children: ReactNode; right?: boolean; mono?: boolean }) => <td className={`px-3 py-2 text-sm text-brand-dark ${right ? 'text-right tabular-nums whitespace-nowrap' : ''} ${mono ? 'font-mono text-xs' : ''}`}>{children}</td>;
const Table = ({ head, children }: { head: ReactNode; children: ReactNode }) => (
  <table className="w-full"><thead className="border-b border-stone/10"><tr>{head}</tr></thead><tbody className="divide-y divide-stone/10">{children}</tbody></table>
);

// ── Stat tile ──
function Tile({ label, value, note, children }: { label: string; value: string; note?: string; children?: ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-stone/10 shadow-sm p-5">
      <div className="text-sm text-stone">{label}</div>
      <div className="font-display text-2xl font-semibold text-brand-dark mt-1">{value}</div>
      {children}
      {note && <div className="text-xs text-stone mt-1.5">{note}</div>}
    </div>
  );
}

// ── Collections by month: columns, thin, rounded at the top, one series ──
function ColumnChart({ data }: { data: { label: string; value: number; count: number }[] }) {
  const { tip, show, focus, hide } = useTip();
  const [hover, setHover] = useState<number | null>(null);
  const [boxRef, boxW] = useWidth();
  const W = Math.max(280, boxW || 600), H = 240, L = 44, R = 6, T = 22, B = 28;
  const max = Math.max(...data.map(d => d.value), 0);
  const { top, step } = niceScale(max);
  const iw = W - L - R, ih = H - T - B;
  const slot = iw / Math.max(data.length, 1);
  const bw = Math.min(24, slot * 0.6);
  const y = (v: number) => T + ih - (v / top) * ih;
  const peak = data.findIndex(d => d.value === max && max > 0);
  const ticks = [0, 1, 2, 3, 4].map(i => i * step);

  return (
    <div className="relative" ref={boxRef}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block" role="img" aria-label={`Money collected each month. Highest: ${peak >= 0 ? `${data[peak].label}, ${kes(max)}` : 'none'}.`}>
        {ticks.map(t => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke={COLORS.grid} strokeWidth={1} />
            <text x={L - 8} y={y(t) + 3.5} textAnchor="end" fontSize={10.5} fill="#6b6b6b">{compact(t)}</text>
          </g>
        ))}
        {data.map((d, i) => {
          const cx = L + slot * i + slot / 2;
          const h = Math.max(0, ih - (y(d.value) - T));
          const r = Math.min(4, bw / 2, h);
          const x0 = cx - bw / 2;
          const yTop = y(d.value);
          return (
            <g key={d.label}>
              {d.value > 0 && (
                // square at the baseline, 4px rounded at the data end
                <path
                  d={`M${x0},${T + ih} V${yTop + r} Q${x0},${yTop} ${x0 + r},${yTop} H${x0 + bw - r} Q${x0 + bw},${yTop} ${x0 + bw},${yTop + r} V${T + ih} Z`}
                  fill={hover === i ? COLORS.seriesHover : COLORS.series}
                />
              )}
              {(slot >= 40 || i % 2 === 0) && <text x={cx} y={H - 10} textAnchor="middle" fontSize={10.5} fill="#6b6b6b">{d.label}</text>}
              {i === peak && <text x={cx} y={yTop - 6} textAnchor="middle" fontSize={11.5} fontWeight={600} fill="#1f2a24">{compact(d.value)}</text>}
              {/* hit area is the whole column slot, far bigger than the mark */}
              <rect
                x={L + slot * i} y={T} width={slot} height={ih + B}
                fill="transparent" tabIndex={0}
                aria-label={`${d.label}: ${kes(d.value)} in ${d.count} payments`}
                onPointerMove={e => { setHover(i); show(e, d.label, [{ label: 'collected', value: kes(d.value), color: COLORS.series }, { label: 'payments', value: String(d.count) }]); }}
                onPointerLeave={() => { setHover(null); hide(); }}
                onFocus={e => { setHover(i); focus(e.currentTarget, d.label, [{ label: 'collected', value: kes(d.value), color: COLORS.series }, { label: 'payments', value: String(d.count) }]); }}
                onBlur={() => { setHover(null); hide(); }}
              />
            </g>
          );
        })}
      </svg>
      <TipBox tip={tip} />
    </div>
  );
}

// ── Ranked horizontal bars: one hue, the value at the tip of each bar ──
type BarRow = { name: string; value: number; sub?: string; muted?: boolean; tip: { label: string; value: string }[] };
function HBars({ rows, valueFmt = kes, emptyText = 'Nothing to show for this selection.' }: { rows: BarRow[]; valueFmt?: (n: number) => string; emptyText?: string }) {
  const { tip, show, focus, hide } = useTip();
  const max = Math.max(...rows.map(r => r.value), 0);
  if (rows.length === 0 || max <= 0) return <p className="text-sm text-stone py-6 text-center">{emptyText}</p>;
  return (
    <div className="relative space-y-3">
      {rows.map((r, i) => (
        <div
          key={r.name + i}
          tabIndex={0}
          className="grid grid-cols-[minmax(0,10rem)_1fr] sm:grid-cols-[12rem_1fr] items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          onPointerMove={e => show(e, r.name, r.tip)}
          onPointerLeave={hide}
          onFocus={e => focus(e.currentTarget, r.name, r.tip)}
          onBlur={hide}
        >
          <div className="min-w-0">
            <div className="text-sm text-brand-dark truncate" title={r.name}>{r.name}</div>
            {r.sub && <div className="text-xs text-stone truncate">{r.sub}</div>}
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="h-3.5 transition-opacity hover:opacity-80"
              style={{ width: `${Math.max(1.5, (r.value / max) * 100)}%`, maxWidth: 'calc(100% - 4.5rem)', background: r.muted ? COLORS.muted : COLORS.series, borderRadius: '0 4px 4px 0' }}
            />
            <span className="text-xs font-semibold text-brand-dark tabular-nums whitespace-nowrap">{valueFmt(r.value)}</span>
          </div>
        </div>
      ))}
      <TipBox tip={tip} />
    </div>
  );
}

// ── Segmented bar: one whole split into a few parts ──
type Seg = { key: string; name: string; value: number; color: string; icon: string };
function SegmentedBar({ segs, total, unit }: { segs: Seg[]; total: number; unit: string }) {
  const { tip, show, focus, hide } = useTip();
  const shown = segs.filter(s => s.value > 0);
  if (total <= 0) return <p className="text-sm text-stone py-4 text-center">No students are billed in this selection.</p>;
  const describe = (s: Seg) => [{ label: s.name, value: `${s.value.toLocaleString()} ${unit}`, color: s.color }, { label: 'share', value: pct((s.value / total) * 100) }];
  return (
    <div className="relative">
      <div className="flex gap-[2px]" style={{ height: 28 }} role="img" aria-label={segs.map(s => `${s.name} ${s.value}`).join(', ')}>
        {shown.map(s => {
          const share = (s.value / total) * 100;
          return (
            <div
              key={s.key}
              tabIndex={0}
              className="flex items-center justify-start px-2 text-xs font-semibold overflow-hidden whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
              style={{ width: `${share}%`, background: s.color, color: inkOn(s.color), borderRadius: 4 }}
              onPointerMove={e => show(e, s.name, describe(s))}
              onPointerLeave={hide}
              onFocus={e => focus(e.currentTarget, s.name, describe(s))}
              onBlur={hide}
            >
              {/* a block too narrow for its label prints none; the value stays in the legend and table */}
              {share >= 12 ? `${Math.round(share)}%` : ''}
            </div>
          );
        })}
      </div>
      <ul className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3 text-xs text-stone">
        {segs.map(s => (
          <li key={s.key} className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} aria-hidden />
            <span aria-hidden>{s.icon}</span>
            <span>{s.name}</span>
          </li>
        ))}
      </ul>
      <TipBox tip={tip} />
    </div>
  );
}

// ── Term by term: what was billed, split into collected and not yet paid ──
function TermBars({ terms }: { terms: any[] }) {
  const { tip, show, focus, hide } = useTip();
  const max = Math.max(...terms.map(t => t.billed), 0);
  if (!terms.length || max <= 0) return <p className="text-sm text-stone py-6 text-center">No term bills in this selection.</p>;
  return (
    <div className="relative">
      <ul className="flex gap-5 mb-3 text-xs text-stone">
        <li className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: COLORS.series }} aria-hidden />Collected</li>
        <li className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: COLORS.muted }} aria-hidden />Not yet paid</li>
      </ul>
      <div className="space-y-3">
        {terms.map(t => {
          const collected = Math.min(t.collected, t.billed);
          const rows = [
            { label: 'billed', value: kes(t.billed) },
            { label: 'collected', value: kes(t.collected), color: COLORS.series },
            { label: 'not yet paid (this term only)', value: kes(t.unpaid), color: COLORS.muted },
            { label: 'students', value: String(t.students) },
          ];
          return (
            <div
              key={t.term_id}
              tabIndex={0}
              className="grid grid-cols-[7.5rem_1fr_3.5rem] sm:grid-cols-[10rem_1fr_4rem] items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              onPointerMove={e => show(e, `${t.name} · ${t.academic_year}`, rows)}
              onPointerLeave={hide}
              onFocus={e => focus(e.currentTarget, `${t.name} · ${t.academic_year}`, rows)}
              onBlur={hide}
            >
              <div className="min-w-0"><div className="text-sm text-brand-dark truncate">{t.name}</div><div className="text-xs text-stone">{t.academic_year}</div></div>
              <div className="flex gap-[2px] h-3.5" style={{ width: `${Math.max(3, (t.billed / max) * 100)}%` }}>
                {collected > 0 && <div style={{ width: `${(collected / t.billed) * 100}%`, background: COLORS.series, borderRadius: '4px 0 0 4px' }} />}
                {t.billed - collected > 0 && <div style={{ width: `${((t.billed - collected) / t.billed) * 100}%`, background: COLORS.muted, borderRadius: collected > 0 ? '0 4px 4px 0' : 4 }} />}
              </div>
              <div className="text-xs font-semibold text-brand-dark tabular-nums text-right">{pct(t.rate)}</div>
            </div>
          );
        })}
      </div>
      <TipBox tip={tip} />
    </div>
  );
}

// ── Debt sizes: ordered bands, one hue light -> dark ──
function BandColumns({ bands }: { bands: any[] }) {
  const { tip, show, focus, hide } = useTip();
  const max = Math.max(...bands.map(b => b.students), 0);
  if (max <= 0) return <p className="text-sm text-stone py-6 text-center">Nobody owes anything in this selection.</p>;
  return (
    <div className="relative">
      <div className="grid grid-cols-5 gap-3 items-end" style={{ height: 150 }}>
        {bands.map((b, i) => {
          const rows = [{ label: 'students', value: b.students.toLocaleString(), color: COLORS.ramp[i] }, { label: 'owed in total', value: kes(b.amount) }];
          return (
            <div
              key={b.key}
              tabIndex={0}
              className="flex flex-col items-center justify-end h-full outline-none focus-visible:ring-2 focus-visible:ring-brand/40 rounded"
              onPointerMove={e => show(e, b.label, rows)}
              onPointerLeave={hide}
              onFocus={e => focus(e.currentTarget, b.label, rows)}
              onBlur={hide}
            >
              <span className="text-xs font-semibold text-brand-dark mb-1 tabular-nums">{b.students}</span>
              <div className="w-full hover:opacity-80 transition-opacity" style={{ maxWidth: 24, height: `${Math.max(b.students > 0 ? 3 : 0, (b.students / max) * 100)}%`, background: COLORS.ramp[i], borderRadius: '4px 4px 0 0' }} />
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-5 gap-3 mt-2 border-t border-stone/15 pt-2">
        {bands.map(b => <div key={b.key} className="text-[11px] text-stone text-center leading-tight">{b.label}</div>)}
      </div>
      <TipBox tip={tip} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

const PRESETS = [
  { key: 'all', label: 'All time' },
  { key: '30', label: 'Last 30 days' },
  { key: '90', label: 'Last 90 days' },
  { key: 'year', label: 'This year' },
  { key: 'custom', label: 'Custom range…' },
];
const iso = (d: Date) => d.toISOString().slice(0, 10);

// refreshKey: change it to reload (for example after a payment is recorded)
export default function FinanceAnalytics({ canApplyFixes = false, refreshKey = 0 }: { canApplyFixes?: boolean; refreshKey?: number }) {
  const [options, setOptions] = useState<any>(null);
  const [preset, setPreset] = useState('all');
  const [custom, setCustom] = useState({ from: '', to: '' });
  const [f, setF] = useState({ term_id: '', department_id: '', course_id: '' });
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [health, setHealth] = useState<any>(null);
  const [showReconcile, setShowReconcile] = useState(false);
  const [dim, setDim] = useState<'department' | 'course' | 'level'>('department');
  const seq = useRef(0);

  useEffect(() => { financeApi.getReportFilters().then(r => setOptions(r.data)).catch(() => { }); }, []);

  const range = useMemo(() => {
    const today = new Date();
    if (preset === '30') return { date_from: iso(new Date(today.getTime() - 30 * 864e5)), date_to: iso(today) };
    if (preset === '90') return { date_from: iso(new Date(today.getTime() - 90 * 864e5)), date_to: iso(today) };
    if (preset === 'year') return { date_from: `${today.getFullYear()}-01-01`, date_to: iso(today) };
    if (preset === 'custom') return { date_from: custom.from, date_to: custom.to };
    return { date_from: '', date_to: '' };
  }, [preset, custom]);

  const params = useMemo(() => {
    const p: any = {};
    Object.entries({ ...f, ...range }).forEach(([k, v]) => { if (v) p[k] = v; });
    return p;
  }, [f, range]);

  // Reload when the filters change. The previous figures stay on screen, dimmed, until the new ones arrive.
  useEffect(() => {
    const mine = ++seq.current;
    setLoading(true);
    financeApi.getAnalytics(params)
      .then(r => { if (mine === seq.current) { setData(r.data); setFailed(false); } })
      .catch(() => { if (mine === seq.current) setFailed(true); })
      .finally(() => { if (mine === seq.current) setLoading(false); });
  }, [params, refreshKey]);

  const loadHealth = () => financeApi.getAnalyticsHealth().then(r => setHealth(r.data)).catch(() => setHealth(null));
  useEffect(() => { loadHealth(); }, [refreshKey]);

  const s = data?.summary;
  const activeFilters = [f.term_id, f.department_id, f.course_id].filter(Boolean).length + (preset !== 'all' ? 1 : 0);
  const reset = () => { setF({ term_id: '', department_id: '', course_id: '' }); setPreset('all'); setCustom({ from: '', to: '' }); };
  const termScoped = Boolean(data?.scope?.term_id);

  const groupRows: any[] = data ? (dim === 'department' ? data.by_department : dim === 'course' ? data.by_course : data.by_level) : [];
  const segs: Seg[] = s ? [
    { key: 'fully_paid', name: 'Fully paid', value: s.counts.fully_paid, color: COLORS.good, icon: '✓' },
    { key: 'part_paid', name: 'Part-paid', value: s.counts.part_paid, color: COLORS.warning, icon: '◐' },
    { key: 'not_paid', name: 'Not paid', value: s.counts.not_paid, color: COLORS.critical, icon: '✕' },
    { key: 'in_credit', name: 'In credit (overpaid)', value: s.counts.in_credit, color: COLORS.series, icon: '+' },
  ] : [];
  const studentTotal = segs.reduce((a, x) => a + x.value, 0);
  const owingStudents = s ? s.counts.part_paid + s.counts.not_paid : 0;

  const select = 'px-3 py-2 rounded-xl border border-stone/25 bg-white text-sm focus:outline-none focus:border-brand w-full';
  const label = 'block text-[11px] font-semibold text-stone uppercase tracking-wide mb-1';

  return (
    <div>
      {/* ── One filter row above everything it scopes: date range first ── */}
      <div className="bg-white rounded-2xl border border-stone/10 shadow-sm p-4 mb-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label><span className={label}>Collections period</span>
            <select value={preset} onChange={e => setPreset(e.target.value)} className={select}>{PRESETS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}</select>
          </label>
          <label><span className={label}>Term</span>
            <select value={f.term_id} onChange={e => setF({ ...f, term_id: e.target.value })} className={select}>
              <option value="">All terms</option>
              {(options?.terms || []).map((t: any) => <option key={t.id} value={t.id}>{termLabel(t)}</option>)}
            </select>
          </label>
          <label><span className={label}>Department</span>
            <select value={f.department_id} onChange={e => setF({ ...f, department_id: e.target.value, course_id: '' })} className={select}>
              <option value="">All departments</option>
              {(options?.departments || []).map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </label>
          <label><span className={label}>Course</span>
            <select value={f.course_id} onChange={e => setF({ ...f, course_id: e.target.value })} className={select}>
              <option value="">All courses</option>
              {(options?.courses || []).filter((c: any) => !f.department_id || c.department_id === f.department_id).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
        </div>
        {preset === 'custom' && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mt-3">
            <label><span className={label}>From</span><input type="date" value={custom.from} onChange={e => setCustom({ ...custom, from: e.target.value })} className={select} /></label>
            <label><span className={label}>To</span><input type="date" value={custom.to} onChange={e => setCustom({ ...custom, to: e.target.value })} className={select} /></label>
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-3 text-xs text-stone">
          <span>
            {data?.scope?.period_filtered ? 'Money collected is for the period chosen. ' : ''}
            What is owed is always the position today, not limited to the period.
          </span>
          {activeFilters > 0 && <button onClick={reset} className="text-brand hover:underline font-medium">Clear {activeFilters} filter{activeFilters === 1 ? '' : 's'}</button>}
        </div>
      </div>

      {failed && !data && <div className="rounded-2xl border border-red-200 bg-red-50 text-red-800 text-sm px-4 py-3 mb-5">The analytics could not be loaded. Please refresh the page.</div>}

      {/* ── Where the numbers could be wrong ── */}
      {health && health.students_out_of_date > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 mb-4 text-sm text-amber-900 flex flex-wrap items-center justify-between gap-3">
          <span>
            <strong>{health.students_out_of_date} student{health.students_out_of_date === 1 ? '' : 's'}</strong> have term balances that don&apos;t match the payments and current fee settings (KES {Math.abs(health.owing_would_change_by).toLocaleString()} {health.owing_would_change_by < 0 ? 'less' : 'more'} would be owed once corrected). The figures below use the stored bills until that is fixed.
          </span>
          <button onClick={() => setShowReconcile(true)} className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition">Review balances</button>
        </div>
      )}
      {data?.data_quality?.unlinked_payments?.count > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 mb-4 text-sm text-amber-900">
          <strong>{data.data_quality.unlinked_payments.count} payment{data.data_quality.unlinked_payments.count === 1 ? '' : 's'} ({kes(data.data_quality.unlinked_payments.amount)})</strong> {data.data_quality.unlinked_payments.count === 1 ? 'is' : 'are'} not tied to any term. They count as money collected, but can&apos;t reduce a student&apos;s balance until a term is chosen for them.
        </div>
      )}
      {data?.data_quality?.paid_mismatch_rows > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 mb-4 text-sm text-amber-900">
          {data.data_quality.paid_mismatch_rows} term balance{data.data_quality.paid_mismatch_rows === 1 ? ' shows' : 's show'} a different amount paid than the payments recorded. This page uses the recorded payments.
        </div>
      )}

      <div className={`transition-opacity ${loading && data ? 'opacity-60' : 'opacity-100'}`} aria-busy={loading}>
        {!data ? (
          !failed && <div className="py-16 text-center text-sm text-stone">Working out the figures…</div>
        ) : (
          <>
            {/* ── Headline: one hero number and the tiles that explain it ── */}
            <div className="grid gap-4 lg:grid-cols-3 mb-5">
              <div className="bg-white rounded-2xl border border-stone/10 shadow-sm p-6 lg:row-span-1">
                <div className="text-sm text-stone">Outstanding</div>
                <div className="font-display font-semibold text-brand-dark leading-none mt-2" style={{ fontSize: 'clamp(2.25rem, 5vw, 3.25rem)' }}>{kes(s.outstanding)}</div>
                <div className="text-sm text-stone mt-3">
                  owed by <strong className="text-brand-dark">{owingStudents.toLocaleString()}</strong> student{owingStudents === 1 ? '' : 's'}
                  {owingStudents > 0 && <> · average <strong className="text-brand-dark">{kes(s.average_owing)}</strong></>}
                </div>
                <div className="text-xs text-stone mt-1.5">
                  {termScoped ? 'Fees for this term plus what was brought into it, minus payments.' : 'Billed plus any opening balance, minus payments.'}
                  {s.credit > 0 && ` Overpayments (${kes(s.credit)}) are not netted off.`}
                </div>
              </div>
              <div className="lg:col-span-2 grid gap-4 sm:grid-cols-3">
                <Tile label="Billed" value={kes(s.billed)} note={`${s.students_billed.toLocaleString()} student${s.students_billed === 1 ? '' : 's'} billed${s.opening_balance ? ` · plus ${kes(s.opening_balance)} opening balances` : ''}${termScoped && s.carried_forward ? ` · ${kes(s.carried_forward)} brought forward` : ''}`} />
                <Tile label={data.scope.period_filtered ? 'Collected in period' : 'Collected'} value={kes(s.collected)} note="Every payment recorded, whether or not allocated to a fee type." />
                <Tile label="Collection rate" value={pct(s.collection_rate)} note="Share of what was billed that has been paid.">
                  <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ background: COLORS.track }} role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={s.collection_rate ?? 0} aria-label="Collection rate">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, s.collection_rate ?? 0))}%`, background: COLORS.series }} />
                  </div>
                </Tile>
              </div>
            </div>

            {/* ── Students by payment state ── */}
            <Card
              className="mb-5"
              title="Students by payment status"
              subtitle={`${studentTotal.toLocaleString()} billed student${studentTotal === 1 ? '' : 's'}${s.students_not_billed ? ` · ${s.students_not_billed} more not yet billed for any term` : ''}`}
              chart={<SegmentedBar segs={segs} total={studentTotal} unit="students" />}
              table={<Table head={<><Th>Status</Th><Th right>Students</Th><Th right>Share</Th></>}>{segs.map(x => <tr key={x.key}><Td>{x.icon} {x.name}</Td><Td right>{x.value.toLocaleString()}</Td><Td right>{studentTotal ? pct((x.value / studentTotal) * 100) : '—'}</Td></tr>)}</Table>}
            />

            <div className="grid gap-5 lg:grid-cols-2 mb-5 items-start">
              <Card
                title="Money collected each month"
                subtitle={data.scope.date_from || data.scope.date_to ? 'Over the chosen period' : 'Last 12 months'}
                chart={<ColumnChart data={data.trend.map((m: any) => ({ label: m.label, value: m.amount, count: m.count }))} />}
                table={<Table head={<><Th>Month</Th><Th right>Collected</Th><Th right>Payments</Th></>}>{data.trend.map((m: any) => <tr key={m.month}><Td>{m.label}</Td><Td right>{kes(m.amount)}</Td><Td right>{m.count}</Td></tr>)}</Table>}
              />
              {data.by_term ? (
                <Card
                  title="Collection by term"
                  subtitle="Bar length is what was billed for the term. Collected is the blue part."
                  chart={<TermBars terms={data.by_term.filter((t: any) => t.billed > 0).slice(-8)} />}
                  table={<Table head={<><Th>Term</Th><Th right>Students</Th><Th right>Billed</Th><Th right>Collected</Th><Th right>Rate</Th></>}>{data.by_term.map((t: any) => <tr key={t.term_id}><Td>{t.name} · {t.academic_year}</Td><Td right>{t.students}</Td><Td right>{kes(t.billed)}</Td><Td right>{kes(t.collected)}</Td><Td right>{pct(t.rate)}</Td></tr>)}</Table>}
                />
              ) : (
                <Card
                  title="Where the money went"
                  subtitle="Payments by fee type"
                  chart={<HBars rows={data.by_fee_type.map((x: any) => ({ name: x.name, value: x.amount, muted: x.unallocated, tip: [{ label: 'received', value: kes(x.amount) }] }))} />}
                />
              )}
            </div>

            <div className="grid gap-5 lg:grid-cols-2 mb-5 items-start">
              <Card
                title="Who owes the most"
                subtitle="Amount owed, by"
                right={
                  <div className="flex text-xs rounded-lg bg-cream-deep p-0.5" role="group" aria-label="Group by">
                    {(['department', 'course', 'level'] as const).map(d => (
                      <button key={d} onClick={() => setDim(d)} aria-pressed={dim === d} className={`px-2.5 py-1 rounded-md font-medium capitalize transition ${dim === d ? 'bg-white shadow text-brand' : 'text-stone hover:text-brand-dark'}`}>{d}</button>
                    ))}
                  </div>
                }
                chart={<HBars rows={groupRows.filter(g => g.owing > 0).slice(0, 8).map(g => ({
                  name: g.name, value: g.owing,
                  sub: `${g.students} student${g.students === 1 ? '' : 's'} · ${pct(g.rate)} collected`,
                  tip: [{ label: 'owed', value: kes(g.owing) }, { label: 'billed', value: kes(g.billed) }, { label: 'paid', value: kes(g.paid) }, { label: 'collected', value: pct(g.rate) }],
                }))} emptyText="Nobody owes anything in this selection." />}
                table={<Table head={<><Th>{dim}</Th><Th right>Students</Th><Th right>Billed</Th><Th right>Paid</Th><Th right>Owed</Th><Th right>Rate</Th></>}>{groupRows.map(g => <tr key={g.name}><Td>{g.name}</Td><Td right>{g.students}</Td><Td right>{kes(g.billed)}</Td><Td right>{kes(g.paid)}</Td><Td right>{kes(g.owing)}</Td><Td right>{pct(g.rate)}</Td></tr>)}</Table>}
              />
              <Card
                title="How big the debts are"
                subtitle="Students by the amount they owe"
                chart={<BandColumns bands={data.debt_bands} />}
                table={<Table head={<><Th>Amount owed</Th><Th right>Students</Th><Th right>Total owed</Th></>}>{data.debt_bands.map((b: any) => <tr key={b.key}><Td>{b.label}</Td><Td right>{b.students}</Td><Td right>{kes(b.amount)}</Td></tr>)}</Table>}
              />
            </div>

            {data.by_term && (
              <Card
                className="mb-5"
                title="Where the money went"
                subtitle={`Payments by fee type${data.data_quality.unallocated_amount > 0 ? ` · ${kes(data.data_quality.unallocated_amount)} not yet allocated (grey)` : ''}`}
                chart={<HBars rows={data.by_fee_type.map((x: any) => ({ name: x.name, value: x.amount, muted: x.unallocated, tip: [{ label: 'received', value: kes(x.amount) }] }))} />}
                table={<Table head={<><Th>Fee type</Th><Th right>Received</Th></>}>{data.by_fee_type.map((x: any) => <tr key={x.name}><Td>{x.name}</Td><Td right>{kes(x.amount)}</Td></tr>)}</Table>}
              />
            )}

            <div className="grid gap-5 lg:grid-cols-2 mb-2 items-start">
              <Card
                title="Biggest balances"
                subtitle="The ten students who owe the most"
                chart={data.top_debtors.length === 0 ? <p className="text-sm text-stone py-6 text-center">Nobody owes anything in this selection.</p> : (
                  <Table head={<><Th>Student</Th><Th right>Paid</Th><Th right>Owes</Th><Th>Last paid</Th></>}>
                    {data.top_debtors.map((d: any) => (
                      <tr key={d.student_id}>
                        <Td><div className="font-medium">{d.name}</div><div className="font-mono text-xs text-stone">{d.admission_no}</div><div className="text-xs text-stone">{d.level}</div></Td>
                        <Td right>{kes(d.paid)}</Td>
                        <Td right><span className="font-semibold">{kes(d.owing)}</span></Td>
                        <Td>{d.last_payment ? day(d.last_payment) : <span className="text-stone">Never</span>}</Td>
                      </tr>
                    ))}
                  </Table>
                )}
              />
              <Card
                title="Latest payments"
                subtitle="Most recent first"
                chart={data.recent_payments.length === 0 ? <p className="text-sm text-stone py-6 text-center">No payments in this selection.</p> : (
                  <Table head={<><Th>Student</Th><Th>Paid for</Th><Th right>Amount</Th></>}>
                    {data.recent_payments.map((p: any) => (
                      <tr key={p.id}>
                        <Td><div className="font-medium">{p.student}</div><div className="font-mono text-xs text-stone">{p.admission_no} · {day(p.paid_at)}</div></Td>
                        <Td><div>{p.fee_type || <span className="text-stone">Not allocated</span>}</div><div className="text-xs text-stone">{p.term || ''}</div></Td>
                        <Td right>{kes(p.amount)}</Td>
                      </tr>
                    ))}
                  </Table>
                )}
              />
            </div>
            <p className="text-xs text-stone mt-3">
              Calculated {new Date(data.generated_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} from the term bills and the payments recorded. A student&apos;s balance is billed minus paid; debt brought forward from an earlier term is counted once.
            </p>
          </>
        )}
      </div>

      {showReconcile && <ReconcileFees terms={options?.terms || []} canApply={canApplyFixes} onClose={() => setShowReconcile(false)} onApplied={() => { loadHealth(); setF(x => ({ ...x })); }} />}
    </div>
  );
}
