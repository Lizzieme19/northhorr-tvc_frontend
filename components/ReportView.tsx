'use client';

// A report as it will print: the college letterhead, what was asked for, the headline numbers, then the tables.
// Used for the on-screen preview; the PDF and Excel files are made from the same report on the server.

type Col = { key: string; label: string; type?: 'text' | 'money' | 'int' | 'percent' | 'date'; w?: number };
export type Report = {
  id: string; title: string; subtitle: string; filters: [string, string][];
  kpis: { label: string; value: any; type: string }[];
  sections: { heading: string; columns: Col[]; rows: any[]; subtotal?: { label: string; values: Record<string, any> } | null; omitted?: number; total_rows?: number }[];
  notes: string[]; signoff?: boolean;
};
export type ReportPayload = { report: Report; letterhead: any; generated_at: string; generated_by: string };

const thousands = (s: string) => s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const money = (n: any) => { const v = Number(n); if (!isFinite(v)) return ''; return `${v < 0 ? '(' : ''}${thousands(Math.abs(v).toFixed(2))}${v < 0 ? ')' : ''}`; };
const cell = (c: Col, v: any) => {
  if (v === null || v === undefined || v === '') return '';
  if (c.type === 'money') return money(v);
  if (c.type === 'int') return thousands(String(Math.round(Number(v) || 0)));
  if (c.type === 'percent') return `${Number(v).toFixed(1)}%`;
  if (c.type === 'date') { const d = new Date(v); return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
  return String(v);
};
const kpi = (k: { value: any; type: string }) => (k.type === 'money' ? `KES ${money(k.value)}` : k.type === 'percent' ? `${Number(k.value).toFixed(1)}%` : k.type === 'int' ? thousands(String(Math.round(Number(k.value) || 0))) : String(k.value));
const right = (c: Col) => ['money', 'int', 'percent'].includes(c.type || '');

const STATUS_CHIP: Record<string, string> = {
  Cleared: 'bg-green-100 text-green-800', Partial: 'bg-amber-100 text-amber-800', Unpaid: 'bg-red-100 text-red-700', Overdue: 'bg-red-200 text-red-900',
  Active: 'bg-green-100 text-green-800', Completed: 'bg-sky-100 text-sky-800', Graduated: 'bg-stone/20 text-stone', Withdrawn: 'bg-red-100 text-red-700', Deferred: 'bg-amber-100 text-amber-800', Attachment: 'bg-purple-100 text-purple-800',
};

export default function ReportView({ data }: { data: ReportPayload }) {
  const { report: r, letterhead: lh } = data;
  const accent = lh?.accent || '#1F6F4A';
  const generated = new Date(data.generated_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <article className="bg-white rounded-xl shadow-lg border border-stone/10 max-w-[1180px] mx-auto overflow-hidden" aria-label={r.title}>
      {/* Letterhead */}
      <header className="px-6 sm:px-10 pt-8 pb-4">
        <div className="flex items-center justify-between gap-4">
          {lh?.show_ministry_logo !== false ? <img src="/Logo/Ministry.png" alt="" className="h-14 w-14 sm:h-16 sm:w-16 object-contain shrink-0" /> : <span className="w-14" />}
          <div className="text-center min-w-0">
            {lh?.ministry_line && <div className="text-[10px] text-stone leading-tight">{lh.ministry_line}</div>}
            <div className="font-bold text-lg sm:text-xl leading-tight" style={{ color: accent }}>{lh?.college_name || 'North Horr Technical and Vocational College'}</div>
            {lh?.contact_line && <div className="text-[11px] text-stone mt-1">{lh.contact_line}</div>}
            {lh?.extra_line && <div className="text-[11px] text-stone">{lh.extra_line}</div>}
          </div>
          {lh?.show_college_logo !== false ? <img src="/Logo/NorthHorr.png" alt="" className="h-14 w-14 sm:h-16 sm:w-16 object-contain shrink-0" /> : <span className="w-14" />}
        </div>
        <div className="mt-4 text-center font-bold tracking-wide text-brand-dark">{r.title.toUpperCase()}</div>
        <div className="mt-2 border-t-2" style={{ borderColor: accent }} />
      </header>

      <div className="px-6 sm:px-10 pb-8">
        <div className="text-center">
          <div className="font-semibold text-brand-dark">{r.subtitle}</div>
          <div className="text-xs text-stone mt-1">
            {r.filters.length ? <>Filters: {r.filters.map(([k, v]) => `${k}: ${v}`).join('   |   ')}</> : 'No filters: everything is included'}
          </div>
          <div className="text-[11px] text-stone/80 mt-0.5">Generated {generated}{data.generated_by ? ` by ${data.generated_by}` : ''}</div>
        </div>

        {/* Headline numbers */}
        {r.kpis.length > 0 && (
          <div className="mt-5 grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
            {r.kpis.map(k => (
              <div key={k.label} className="rounded-lg border border-stone/15 bg-cream-deep/50 px-3 py-2">
                <div className="text-[10px] uppercase tracking-wider text-stone">{k.label}</div>
                <div className={`font-bold text-brand-dark tabular-nums ${kpi(k).length > 18 ? 'text-xs pt-1' : 'text-base'}`}>{kpi(k)}</div>
              </div>
            ))}
          </div>
        )}

        {r.sections.length === 0 && (
          <div className="mt-10 mb-6 text-center">
            <div className="font-semibold text-stone">No records match these filters.</div>
            <div className="text-sm text-stone mt-1">Try widening them: a different term, a wider date range, or all courses.</div>
          </div>
        )}

        {/* Sections */}
        {r.sections.map((s, si) => {
          const compact = s.columns.reduce((t, c) => t + (c.w || 10), 0) < 95;
          return (
            <section key={si} className="mt-7">
              <h3 className="font-semibold text-brand-dark text-sm flex items-center gap-2 mb-2"><span className="inline-block w-1 h-4 rounded" style={{ background: accent }} />{s.heading}{s.total_rows !== undefined && <span className="text-xs text-stone font-normal">({s.total_rows})</span>}</h3>
              <div className="overflow-x-auto rounded-lg border border-stone/10" style={compact ? { maxWidth: `${Math.max(55, Math.round(s.columns.reduce((t, c) => t + (c.w || 10), 0) / 95 * 100))}%` } : undefined}>
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ background: accent }} className="text-white">
                      {s.columns.map(c => <th key={c.key} className={`px-2.5 py-2 font-semibold whitespace-nowrap ${/status/.test(c.key) ? 'text-center' : right(c) ? 'text-right' : 'text-left'}`}>{c.label}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {s.rows.map((row, ri) => (
                      <tr key={ri} className={ri % 2 ? 'bg-cream-deep/40' : ''}>
                        {s.columns.map(c => {
                          const text = cell(c, row[c.key]);
                          const chip = /status/.test(c.key) && STATUS_CHIP[text];
                          return (
                            <td key={c.key} className={`px-2.5 py-1.5 border-t border-stone/5 ${right(c) ? 'text-right tabular-nums' : /status/.test(c.key) ? 'text-center' : ''}`}>
                              {chip ? <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${chip}`}>{text}</span> : text}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    {s.subtotal && (() => {
                      const vals = s.subtotal.values || {};
                      const first = s.columns.findIndex(c => vals[c.key] !== undefined);
                      return (
                        <tr className="font-semibold" style={{ background: `${accent}18`, borderTop: `1.5px solid ${accent}` }}>
                          {first > 0 ? <td className="px-2.5 py-2" colSpan={first}>{s.subtotal.label}</td> : null}
                          {s.columns.slice(Math.max(first, 0)).map(c => <td key={c.key} className={`px-2.5 py-2 ${right(c) ? 'text-right tabular-nums' : ''}`}>{first <= 0 && c === s.columns[0] ? s.subtotal!.label : cell(c, vals[c.key])}</td>)}
                        </tr>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
              {!!s.omitted && <p className="text-[11px] text-stone italic mt-1.5">Showing the first {s.rows.length} of {s.total_rows} rows. The PDF and Excel files include all of them.</p>}
            </section>
          );
        })}

        {r.notes.length > 0 && <div className="mt-6 space-y-1">{r.notes.map((n, i) => <p key={i} className="text-[11px] text-stone italic">Note: {n}</p>)}</div>}

        {r.signoff && r.sections.length > 0 && (
          <div className="mt-10 grid grid-cols-2 gap-10 text-xs">
            {['Prepared by', 'Checked and approved by'].map(l => (
              <div key={l}><div className="border-b border-stone/40 h-8" /><div className="font-semibold text-brand-dark mt-1.5">{l}</div><div className="text-stone">Signature and date</div></div>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
