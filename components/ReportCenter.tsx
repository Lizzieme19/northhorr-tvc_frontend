'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '@/lib/api';
import { financeApi, reportsApi } from '@/lib/services';
import { termLabel } from '@/lib/terms';
import { toast } from 'sonner';
import ReportView, { ReportPayload } from '@/components/ReportView';
import ReportsExport from '@/components/ReportsExport';

type Def = { id: string; group: string; title: string; blurb: string; filters: string[]; options: { group_by?: [string, string][]; sort?: [string, string][] } };

const label = 'block text-[11px] font-semibold text-stone uppercase tracking-wide mb-1';
const input = 'w-full px-2.5 py-1.5 rounded-lg border border-stone/25 bg-white text-sm focus:outline-none focus:border-brand';

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const PRESETS: [string, () => [string, string]][] = [
  ['Today', () => { const t = new Date(); return [iso(t), iso(t)]; }],
  ['This month', () => { const t = new Date(); return [iso(new Date(t.getFullYear(), t.getMonth(), 1)), iso(t)]; }],
  ['Last month', () => { const t = new Date(); return [iso(new Date(t.getFullYear(), t.getMonth() - 1, 1)), iso(new Date(t.getFullYear(), t.getMonth(), 0))]; }],
  ['This year', () => { const t = new Date(); return [iso(new Date(t.getFullYear(), 0, 1)), iso(t)]; }],
];

const readBlobError = async (e: any): Promise<string> => {
  try { const d = e?.response?.data; if (d instanceof Blob) return JSON.parse(await d.text())?.error || 'That report could not be made'; } catch { /* fall through */ }
  return e?.response?.data?.error || 'That report could not be made';
};
const nameFrom = (disposition: string | undefined, fallback: string) => disposition?.match(/filename="?([^";]+)"?/i)?.[1] || fallback;

// Reports: pick one, set only the filters that apply, look at it on screen, then download it as a PDF on the college
// letterhead or as Excel. `rawTypes` keeps the older every-column Excel export one click away.
export default function ReportCenter({ onClose, initialReport, rawTypes = [], hideFinance = false }: { onClose: () => void; initialReport?: string; rawTypes?: ('fees' | 'students')[]; hideFinance?: boolean }) {
  const [defs, setDefs] = useState<Def[] | null>(null);
  const [options, setOptions] = useState<any>(null);
  const [studentTypes, setStudentTypes] = useState<any[]>([]);
  const [id, setId] = useState<string>('');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [data, setData] = useState<ReportPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [stale, setStale] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const seq = useRef(0);

  const def = defs?.find(d => d.id === id) || null;

  useEffect(() => {
    reportsApi.catalog().then(r => {
      const list: Def[] = r.data.reports || [];
      setDefs(list);
      const start = list.find(d => d.id === initialReport) || list[0];
      if (start) setId(start.id);
    }).catch(() => toast.error('Could not load the reports'));
    financeApi.getReportFilters().then(r => setOptions(r.data)).catch(() => { });
    api.get('/student-types').then(r => setStudentTypes((r.data.types || []).filter((t: any) => t.is_active))).catch(() => { });
  }, [initialReport]);

  // the filters that apply to the chosen report, with what was typed in; empty ones are not sent
  const params = useMemo(() => {
    const p: Record<string, string> = {};
    Object.entries(filters).forEach(([k, v]) => { if (v !== '' && v !== false && v !== undefined && def && (def.filters.includes(k) || k === 'group_by' || k === 'sort')) p[k] = String(v); });
    return p;
  }, [filters, def]);

  const run = async (reportId = id, p = params) => {
    if (!reportId) return;
    const mine = ++seq.current;
    setLoading(true);
    try {
      const r = await reportsApi.preview(reportId, p);
      if (mine === seq.current) { setData(r.data); setStale(false); }
    } catch (e: any) {
      if (mine === seq.current) toast.error(e?.response?.data?.error || 'Could not build the report');
    } finally { if (mine === seq.current) setLoading(false); }
  };

  // choosing a report starts with its defaults, and shows it straight away
  const choose = (next: string) => { setId(next); setFilters({}); setData(null); setStale(false); run(next, {}); };
  useEffect(() => { if (id && defs && !data && !loading) run(id, {}); /* first report on opening */ // eslint-disable-next-line
  }, [defs]);

  const set = (k: string, v: any) => { setFilters(f => ({ ...f, ...(k === 'department_id' ? { course_id: '' } : {}), [k]: v })); setStale(true); };
  const has = (k: string) => !!def?.filters.includes(k);
  const courses = useMemo(() => (options?.courses || []).filter((c: any) => !filters.department_id || c.department_id === filters.department_id), [options, filters.department_id]);
  const activeCount = Object.keys(params).filter(k => k !== 'group_by' && k !== 'sort').length;

  const save = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };
  const download = async (kind: 'pdf' | 'xlsx') => {
    setBusy(kind);
    try {
      const r = await reportsApi.file(id, kind, params);
      save(r.data, nameFrom(r.headers?.['content-disposition'], `${id}.${kind}`));
      toast.success(kind === 'pdf' ? 'PDF downloaded' : 'Excel file downloaded');
    } catch (e: any) { toast.error(await readBlobError(e)); }
    finally { setBusy(null); }
  };
  // opens the real PDF (letterhead and all) in a new tab, where it can be read or printed
  const openPdf = async () => {
    const w = window.open('', '_blank');
    setBusy('view');
    try {
      const r = await reportsApi.file(id, 'pdf', { ...params, inline: '1' });
      const url = URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' }));
      if (w) w.location.href = url; else save(r.data, `${id}.pdf`);
    } catch (e: any) { w?.close(); toast.error(await readBlobError(e)); }
    finally { setBusy(null); }
  };

  const groups = useMemo(() => {
    const m = new Map<string, Def[]>();
    (defs || []).forEach(d => { if (!m.has(d.group)) m.set(d.group, []); m.get(d.group)!.push(d); });
    return [...m.entries()];
  }, [defs]);

  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className="fixed inset-0 z-[70] bg-cream-deep flex flex-col">
      <div className="bg-brand-dark text-cream px-4 sm:px-6 h-14 flex items-center gap-3 shrink-0 shadow-lg">
        <span className="font-display font-semibold">Reports</span>
        <span className="text-cream/50 text-sm hidden sm:inline">View first, then download</span>
        <div className="flex-1" />
        <button onClick={() => setShowFilters(s => !s)} className="lg:hidden text-sm px-3 py-1.5 rounded-lg bg-white/10">{showFilters ? 'Hide filters' : 'Filters'}</button>
        <button onClick={onClose} aria-label="Close reports" className="h-9 w-9 grid place-items-center rounded-lg hover:bg-white/10 text-lg">✕</button>
      </div>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
        {/* Report, filters, options */}
        <aside className={`${showFilters ? 'block' : 'hidden'} lg:block lg:w-[340px] shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-stone/15 overflow-y-auto max-h-[55vh] lg:max-h-none`}>
          <div className="p-4 space-y-5">
            {!defs && <p className="text-sm text-stone">Loading…</p>}
            {groups.map(([g, list]) => (
              <div key={g}>
                <div className="text-[11px] font-semibold uppercase tracking-widest text-terracotta mb-2">{g}</div>
                <div className="space-y-1.5">
                  {list.map(d => (
                    <button key={d.id} onClick={() => choose(d.id)} className={`w-full text-left rounded-xl border px-3 py-2.5 transition ${id === d.id ? 'border-brand bg-brand/5' : 'border-stone/15 hover:border-brand/40'}`}>
                      <div className="text-sm font-semibold text-brand-dark">{d.title}</div>
                      {id === d.id && <div className="text-[11px] text-stone mt-0.5 leading-snug">{d.blurb}</div>}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {def && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[11px] font-semibold uppercase tracking-widest text-terracotta">Filters {activeCount > 0 && <span className="text-stone normal-case tracking-normal font-normal">({activeCount})</span>}</div>
                  {activeCount > 0 && <button onClick={() => { setFilters({}); setStale(true); }} className="text-xs text-stone hover:text-brand">Clear</button>}
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {has('date_from') && (
                    <div className="col-span-2">
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {PRESETS.map(([name, fn]) => <button key={name} onClick={() => { const [a, b] = fn(); setFilters(f => ({ ...f, date_from: a, date_to: b })); setStale(true); }} className="text-[11px] px-2 py-1 rounded-full border border-stone/25 text-brand hover:bg-brand/5">{name}</button>)}
                      </div>
                      <div className="grid grid-cols-2 gap-2.5">
                        <label><span className={label}>Payments from</span><input type="date" className={input} value={filters.date_from || ''} onChange={e => set('date_from', e.target.value)} /></label>
                        <label><span className={label}>Payments to</span><input type="date" className={input} value={filters.date_to || ''} onChange={e => set('date_to', e.target.value)} /></label>
                      </div>
                    </div>
                  )}
                  {has('term_id') && <label className="col-span-2"><span className={label}>Term</span><select className={input} value={filters.term_id || ''} onChange={e => set('term_id', e.target.value)}><option value="">All terms</option>{(options?.terms || []).map((t: any) => <option key={t.id} value={t.id}>{termLabel(t)}</option>)}</select></label>}
                  {has('department_id') && <label className="col-span-2"><span className={label}>Department</span><select className={input} value={filters.department_id || ''} onChange={e => set('department_id', e.target.value)}><option value="">All departments</option>{(options?.departments || []).map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>}
                  {has('course_id') && <label className="col-span-2"><span className={label}>Course</span><select className={input} value={filters.course_id || ''} onChange={e => set('course_id', e.target.value)}><option value="">All courses</option>{courses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>}
                  {has('level') && <label><span className={label}>Level</span><select className={input} value={filters.level || ''} onChange={e => set('level', e.target.value)}><option value="">All</option>{(options?.levels || []).map((l: string) => <option key={l} value={l}>{l}</option>)}</select></label>}
                  {has('intake') && <label><span className={label}>Intake</span><select className={input} value={filters.intake || ''} onChange={e => set('intake', e.target.value)}><option value="">All</option>{(options?.intakes || []).map((i: string) => <option key={i} value={i}>{i.charAt(0) + i.slice(1).toLowerCase()}</option>)}</select></label>}
                  {has('year') && <label><span className={label}>Year</span><select className={input} value={filters.year || ''} onChange={e => set('year', e.target.value)}><option value="">All</option>{(options?.years || []).map((y: number) => <option key={y} value={y}>{y}</option>)}</select></label>}
                  {has('status') && <label><span className={label}>Student status</span><select className={input} value={filters.status || ''} onChange={e => set('status', e.target.value)}><option value="">All</option>{(options?.student_statuses || []).map((s: string) => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}</select></label>}
                  {has('student_type_id') && studentTypes.length > 0 && <label><span className={label}>Student type</span><select className={input} value={filters.student_type_id || ''} onChange={e => set('student_type_id', e.target.value)}><option value="">All</option>{studentTypes.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>}
                  {has('gender') && <label><span className={label}>Gender</span><select className={input} value={filters.gender || ''} onChange={e => set('gender', e.target.value)}><option value="">All</option><option>Male</option><option>Female</option></select></label>}
                  {has('helb') && <label><span className={label}>HELB</span><select className={input} value={filters.helb || ''} onChange={e => set('helb', e.target.value)}><option value="">All</option><option value="true">Applied</option><option value="false">Not applied</option></select></label>}
                  {has('fee_status') && !hideFinance && <label><span className={label}>Fee status</span><select className={input} value={filters.fee_status || ''} onChange={e => set('fee_status', e.target.value)}><option value="">All</option>{(options?.fee_statuses || []).map((s: string) => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}</select></label>}
                  {has('fee_type_id') && <label><span className={label}>Fee type</span><select className={input} value={filters.fee_type_id || ''} onChange={e => set('fee_type_id', e.target.value)}><option value="">All</option>{(options?.fee_types || []).map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}</select></label>}
                  {has('min_balance') && <label><span className={label}>Owing at least (KES)</span><input inputMode="decimal" className={input} placeholder="e.g. 5000" value={filters.min_balance || ''} onChange={e => set('min_balance', e.target.value.replace(/[^0-9.]/g, ''))} /></label>}
                  {has('outstanding_only') && <label className="col-span-2 flex items-center gap-2 text-sm text-brand-dark"><input type="checkbox" className="h-4 w-4 accent-brand" checked={!!filters.outstanding_only} onChange={e => set('outstanding_only', e.target.checked ? 'true' : false)} />Only students who owe</label>}
                  {has('search') && <label className="col-span-2"><span className={label}>Search</span><input className={input} placeholder="Admission no, name, phone…" value={filters.search || ''} onChange={e => set('search', e.target.value)} /></label>}
                </div>

                {(def.options.group_by || def.options.sort) && (
                  <div className="grid grid-cols-2 gap-2.5 mt-3 pt-3 border-t border-stone/10">
                    {def.options.group_by && <label className="col-span-2"><span className={label}>Group by</span><select className={input} value={filters.group_by || 'auto'} onChange={e => set('group_by', e.target.value)}>{def.options.group_by.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>}
                    {def.options.sort && <label className="col-span-2"><span className={label}>Sort by</span><select className={input} value={filters.sort || def.options.sort[0][0]} onChange={e => set('sort', e.target.value)}>{def.options.sort.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>}
                  </div>
                )}

                <button onClick={() => { run(); if (window.innerWidth < 1024) setShowFilters(false); }} disabled={loading} className={`mt-4 w-full py-2.5 rounded-xl font-semibold text-sm transition disabled:opacity-50 ${stale ? 'bg-gold text-brand-dark hover:opacity-90' : 'bg-brand text-cream hover:bg-brand-dark'}`}>
                  {loading ? 'Building…' : stale ? 'Update the preview' : 'Refresh'}
                </button>
              </div>
            )}

            {rawTypes.length > 0 && (
              <button onClick={() => setShowRaw(true)} className="w-full text-left rounded-xl border border-dashed border-stone/30 px-3 py-2.5 hover:border-brand/40 transition">
                <div className="text-sm font-semibold text-brand-dark">Every-column Excel export</div>
                <div className="text-[11px] text-stone mt-0.5">The full data, for your own analysis.</div>
              </button>
            )}
          </div>
        </aside>

        {/* The report on screen */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          <div className="sticky top-0 z-10 bg-cream-deep/95 backdrop-blur border-b border-stone/10 px-4 sm:px-6 py-2.5 flex flex-wrap items-center gap-2">
            <div className="text-sm font-semibold text-brand-dark mr-auto truncate">{def?.title || ''}{stale && <span className="ml-2 text-xs font-normal text-amber-700">filters changed: update the preview</span>}</div>
            <button onClick={openPdf} disabled={!data || busy === 'view'} className="px-3 py-1.5 rounded-lg border border-stone/25 bg-white text-sm font-medium text-brand hover:bg-brand/5 disabled:opacity-50">{busy === 'view' ? 'Opening…' : '👁 View / print PDF'}</button>
            <button onClick={() => download('pdf')} disabled={!data || !!busy} className="px-3 py-1.5 rounded-lg bg-brand text-cream text-sm font-semibold hover:bg-brand-dark disabled:opacity-50">{busy === 'pdf' ? 'Preparing…' : '⬇ PDF'}</button>
            <button onClick={() => download('xlsx')} disabled={!data || !!busy} className="px-3 py-1.5 rounded-lg bg-white border border-brand/40 text-brand text-sm font-semibold hover:bg-brand/5 disabled:opacity-50">{busy === 'xlsx' ? 'Preparing…' : '⬇ Excel'}</button>
          </div>
          <div className="p-3 sm:p-6">
            {loading && !data && <div className="py-24 text-center text-stone text-sm">Building the report…</div>}
            {data && <div className={loading ? 'opacity-60 transition' : 'transition'}><ReportView data={data} /></div>}
          </div>
        </main>
      </div>

      {showRaw && <ReportsExport onClose={() => setShowRaw(false)} types={rawTypes} initialType={rawTypes[0]} hideFinance={hideFinance} />}
    </div>, document.body);
}
