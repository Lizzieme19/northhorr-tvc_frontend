'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '@/lib/api';
import { toast } from 'sonner';
import Pagination from '@/components/Pagination';
import { FilterSelect, FilterSearch } from '@/components/ListFilters';
import { useDebounced } from '@/lib/hooks';
import { termLabel } from '@/lib/terms';
import { feeBilling } from '@/lib/feeTypes';

// Amounts that differ from student to student (an exam fee, a re-sit, a replacement ID, a trip...).
// Pick the fee type and the term, give each student their amount, review what it does to the fees, then save.
// Nothing is saved until the review has been confirmed.

type Row = { student_id: string; admission_no: string; name: string; level: string; course: string; student_type: string | null; amount: number | null; note: string };
type Draft = { amount: string; note: string };
type Preview = {
  counts: { added: number; changed: number; removed: number; unchanged: number; nothing_to_remove: number };
  problems: { row: number; admission_no: string; reason: string }[];
  impact: { students_changed: number; fees_before: number; fees_after: number; fees_change: number; outstanding_change: number } | null;
  items: { student_id: string; admission_no: string; before: number | null; after: number | null }[];
};

const kes = (n: number) => `KES ${Math.round(n || 0).toLocaleString()}`;
const signed = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${kes(Math.abs(n))}`;
const errOf = (e: any, fallback: string) => e?.response?.data?.error || fallback;
const same = (a: number | null, text: string) => (text.trim() === '' ? a === null : a !== null && Math.abs(Number(text.replace(/,/g, '')) - a) < 0.009);

export default function StudentCharges() {
  const [feeTypes, setFeeTypes] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [feeTypeId, setFeeTypeId] = useState('');
  const [termId, setTermId] = useState('');
  const [search, setSearch] = useState('');
  const [courseId, setCourseId] = useState('');
  const [typeId, setTypeId] = useState('');
  const [show, setShow] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [data, setData] = useState<{ students: Row[]; total: number; set_count: number; set_total: number } | null>(null);
  const [loading, setLoading] = useState(false);
  // unsaved changes, by admission number, kept while moving between pages and filters
  const [draft, setDraft] = useState<Record<string, Draft>>({});
  const [fillAmount, setFillAmount] = useState('');
  const [pasting, setPasting] = useState(false);
  const [review, setReview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);
  const q = useDebounced(search, 350);

  useEffect(() => {
    api.get('/fee-types').then(r => setFeeTypes((r.data.fee_types || []).filter((f: any) => f.is_active && f.code !== 'TUITION'))).catch(() => toast.error('Could not load the fee types'));
    api.get('/terms').then(r => {
      const l = (r.data.terms || r.data || []) as any[];
      const sorted = [...l].sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
      setTerms(sorted);
      const now = Date.now();
      setTermId(prev => prev || (sorted.find(t => new Date(t.start_date).getTime() <= now && new Date(t.end_date).getTime() >= now) || sorted[0])?.id || '');
    }).catch(() => { });
    api.get('/courses').then(r => { const c = r.data?.courses || r.data; setCourses(Array.isArray(c) ? c : []); }).catch(() => { });
    api.get('/student-types').then(r => setTypes((r.data.types || []).filter((t: any) => t.is_active))).catch(() => { });
  }, []);

  // fee types that are set per student come first
  const ordered = useMemo(() => [...feeTypes].sort((a, b) => Number(feeBilling(b) === 'PER_STUDENT') - Number(feeBilling(a) === 'PER_STUDENT') || a.name.localeCompare(b.name)), [feeTypes]);
  const feeType = feeTypes.find(f => f.id === feeTypeId);
  const ready = Boolean(feeTypeId && termId);

  const load = useCallback(async () => {
    if (!feeTypeId || !termId) { setData(null); return; }
    setLoading(true);
    try {
      const r = await api.get('/student-charges/sheet', { params: { fee_type_id: feeTypeId, term_id: termId, search: q || undefined, course_id: courseId || undefined, student_type_id: typeId || undefined, only_set: show || undefined, page, limit: pageSize } });
      setData(r.data);
    } catch (e: any) { toast.error(errOf(e, 'Could not load the students')); setData(null); }
    finally { setLoading(false); }
  }, [feeTypeId, termId, q, courseId, typeId, show, page, pageSize]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [feeTypeId, termId, q, courseId, typeId, show, pageSize]);
  // changing the fee type or the term starts a fresh set of changes
  useEffect(() => { setDraft({}); }, [feeTypeId, termId]);

  const edit = (r: Row, patch: Partial<Draft>) => setDraft(d => {
    const cur = d[r.admission_no] || { amount: r.amount === null ? '' : String(r.amount), note: r.note || '' };
    const next = { ...cur, ...patch };
    const copy = { ...d };
    if (same(r.amount, next.amount) && (next.note || '') === (r.note || '')) delete copy[r.admission_no]; else copy[r.admission_no] = next;
    return copy;
  });
  const rows = data?.students || [];
  const changes = Object.keys(draft).length;

  const fillShown = () => {
    if (fillAmount.trim() === '' || isNaN(Number(fillAmount))) { toast.error('Type the amount to fill in first'); return; }
    rows.forEach(r => edit(r, { amount: fillAmount.trim() }));
    toast.success(`Filled ${rows.length} student${rows.length === 1 ? '' : 's'} shown. Review before saving.`);
  };
  const clearShown = () => rows.forEach(r => { if (r.amount !== null || draft[r.admission_no]) edit(r, { amount: '' }); });

  // lines of: admission number, amount, optional note (from Excel or typed)
  const pasteRows = (text: string) => {
    let n = 0;
    const add: Record<string, Draft> = {};
    for (const line of text.split(/\r?\n/)) {
      const m = line.trim().match(/^(\S+)\s*([\d,.]*)\s*(.*)$/);
      if (!m || /^admission/i.test(m[1])) continue;
      add[m[1]] = { amount: m[2].replace(/,/g, ''), note: m[3].trim() };
      n++;
    }
    setDraft(d => ({ ...d, ...add }));
    setPasting(false);
    toast.success(`${n} line${n === 1 ? '' : 's'} added. Review before saving.`);
  };

  const payload = () => ({ fee_type_id: feeTypeId, term_id: termId, entries: Object.entries(draft).map(([admission_no, d]) => ({ admission_no, amount: d.amount.trim() === '' ? null : d.amount, note: d.note })) });
  const showReview = async () => {
    setBusy(true);
    try { const r = await api.post('/student-charges/save', { ...payload(), apply: false }); setReview(r.data); }
    catch (e: any) { toast.error(errOf(e, 'Could not work out the effect')); }
    finally { setBusy(false); }
  };
  const save = async () => {
    setBusy(true);
    try {
      const r = await api.post('/student-charges/save', { ...payload(), apply: true });
      const c = r.data.counts;
      toast.success(`Saved: ${c.added} added, ${c.changed} changed, ${c.removed} removed`);
      setReview(null); setDraft({}); load();
    } catch (e: any) { toast.error(errOf(e, 'That could not be saved')); }
    finally { setBusy(false); }
  };

  const draftTotal = rows.reduce((t, r) => t + (draft[r.admission_no] ? Number(draft[r.admission_no].amount.replace(/,/g, '')) || 0 : r.amount || 0), 0);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-stone/10 px-5 py-4">
        <h2 className="font-display text-xl text-brand-dark">Student charges</h2>
        <p className="text-sm text-stone mt-1 max-w-4xl">
          For a fee that is a different amount for each student: exam fees, re-sits, a replacement ID, a trip. Choose the fee type and the term, give each student their amount, and review what it does to the fees before you save.
          An amount set here is what that student is billed for that fee type in that term. A student with no amount is billed the usual way for it (nothing, for a fee type set to &quot;Set per student&quot;).
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-stone/10 shadow-sm p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          <FilterSelect label="Fee type" value={feeTypeId} onChange={setFeeTypeId} className="xl:col-span-2">
            <option value="">Choose a fee type…</option>
            {ordered.map(f => <option key={f.id} value={f.id}>{f.name}{feeBilling(f) === 'PER_STUDENT' ? ' (set per student)' : ''}</option>)}
          </FilterSelect>
          <FilterSelect label="Term" value={termId} onChange={setTermId} className="xl:col-span-2">
            <option value="">Choose a term…</option>
            {terms.map(t => <option key={t.id} value={t.id}>{termLabel(t)}</option>)}
          </FilterSelect>
          <FilterSearch value={search} onChange={setSearch} placeholder="Name or admission number" className="xl:col-span-2" />
          <FilterSelect label="Course" value={courseId} onChange={setCourseId}>
            <option value="">All courses</option>
            {courses.map((c: any) => <option key={c.id} value={c.id}>{c.shortcode || c.name}</option>)}
          </FilterSelect>
          {types.length > 0 && (
            <FilterSelect label="Student type" value={typeId} onChange={setTypeId}>
              <option value="">All types</option>
              {types.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </FilterSelect>
          )}
          <FilterSelect label="Show" value={show} onChange={setShow}>
            <option value="">Everyone in the term</option>
            <option value="true">Only those with an amount</option>
            <option value="false">Only those without</option>
          </FilterSelect>
        </div>
        {feeType && (
          <p className="text-xs text-stone mt-3">
            {feeType.name}: usual amount KES {Number(feeType.amount || 0).toLocaleString()}.{' '}
            {feeBilling(feeType) === 'PER_STUDENT' ? 'This fee type is not billed to anyone until an amount is set for them here.'
              : feeBilling(feeType) === 'NOT_BILLED' ? 'This fee type is not normally billed. An amount set here is billed to that student.'
                : 'An amount set here replaces the usual amount for that student.'}
          </p>
        )}
      </div>

      {!ready && <div className="bg-white rounded-2xl border border-dashed border-stone/25 px-6 py-12 text-center text-stone text-sm">Choose a fee type and a term to see the students.</div>}

      {ready && (
        <>
          <div className="flex flex-wrap items-end gap-3">
            <div className="text-sm text-stone mr-auto">
              {data ? <><strong className="text-brand-dark">{data.set_count}</strong> student{data.set_count === 1 ? '' : 's'} in this term {data.set_count === 1 ? 'has' : 'have'} an amount, <strong className="text-brand-dark">{kes(data.set_total)}</strong> in all.</> : ' '}
            </div>
            <label className="block">
              <span className="block text-[11px] font-semibold text-stone uppercase tracking-wide mb-1">Fill the students shown</span>
              <span className="flex gap-1.5">
                <input value={fillAmount} onChange={e => setFillAmount(e.target.value)} inputMode="decimal" placeholder="Amount" className="w-28 px-3 py-2 rounded-xl border border-stone/25 text-sm text-right tabular-nums focus:outline-none focus:border-brand" />
                <button onClick={fillShown} className="px-3 py-2 rounded-xl border border-stone/25 text-sm text-brand-dark hover:bg-cream-deep">Fill</button>
              </span>
            </label>
            <button onClick={() => setPasting(true)} className="px-3 py-2 rounded-xl border border-stone/25 text-sm text-brand-dark hover:bg-cream-deep">Paste from Excel</button>
            <button onClick={clearShown} className="px-3 py-2 rounded-xl border border-stone/25 text-sm text-stone hover:bg-cream-deep" title="Takes away the amount of each student shown">Clear shown</button>
          </div>

          <div className="bg-white rounded-2xl border border-stone/10 shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream-deep text-stone text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Admission no.</th>
                  <th className="px-4 py-3 text-left">Student</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">Course</th>
                  <th className="px-4 py-3 text-left hidden lg:table-cell">Level</th>
                  <th className="px-4 py-3 text-right">Amount (KES)</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone/10">
                {rows.map(r => {
                  const d = draft[r.admission_no];
                  const value = d ? d.amount : r.amount === null ? '' : String(r.amount);
                  return (
                    <tr key={r.student_id} className={d ? 'bg-amber-50' : ''}>
                      <td className="px-4 py-2 font-medium text-brand-dark whitespace-nowrap">{r.admission_no}</td>
                      <td className="px-4 py-2"><div className="text-brand-dark">{r.name}</div>{r.student_type && <div className="text-[11px] text-stone">{r.student_type}</div>}</td>
                      <td className="px-4 py-2 text-stone hidden md:table-cell">{r.course}</td>
                      <td className="px-4 py-2 text-stone hidden lg:table-cell">{r.level}</td>
                      <td className="px-4 py-2 text-right">
                        <input value={value} onChange={e => edit(r, { amount: e.target.value })} inputMode="decimal" placeholder="—" aria-label={`Amount for ${r.admission_no}`}
                          className={`w-32 px-3 py-1.5 rounded-lg border text-sm text-right tabular-nums focus:outline-none focus:border-brand ${d ? 'border-amber-400' : 'border-stone/25'}`} />
                      </td>
                      <td className="px-4 py-2 hidden md:table-cell">
                        <input value={d ? d.note : r.note} onChange={e => edit(r, { note: e.target.value })} maxLength={200} placeholder="Optional" aria-label={`Note for ${r.admission_no}`}
                          className="w-full min-w-[9rem] px-3 py-1.5 rounded-lg border border-stone/25 text-sm focus:outline-none focus:border-brand" />
                      </td>
                    </tr>
                  );
                })}
                {!loading && rows.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-stone">No students match.</td></tr>}
                {loading && rows.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-stone">Loading…</td></tr>}
              </tbody>
              {rows.length > 0 && (
                <tfoot><tr className="bg-cream-deep/60 font-semibold text-brand-dark"><td className="px-4 py-2" colSpan={4}>Shown on this page</td><td className="px-4 py-2 text-right tabular-nums">{kes(draftTotal)}</td><td className="hidden md:table-cell" /></tr></tfoot>
              )}
            </table>
          </div>
          {data && <Pagination page={page} pageSize={pageSize} total={data.total} onPage={setPage} onPageSize={setPageSize} />}
        </>
      )}

      {changes > 0 && (
        <div className="sticky bottom-3 z-30 mx-auto max-w-3xl bg-brand-dark text-cream rounded-2xl shadow-xl px-5 py-3 flex items-center gap-3">
          <span className="text-sm mr-auto"><strong>{changes}</strong> unsaved change{changes === 1 ? '' : 's'}</span>
          <button onClick={() => setDraft({})} className="px-3 py-1.5 rounded-xl text-sm text-cream/80 hover:text-cream">Discard</button>
          <button disabled={busy} onClick={showReview} className="px-4 py-2 rounded-xl bg-cream text-brand-dark text-sm font-semibold hover:bg-white disabled:opacity-50">{busy ? 'Working…' : 'Review and save'}</button>
        </div>
      )}

      {pasting && <PasteDialog onClose={() => setPasting(false)} onAdd={pasteRows} />}
      {review && <ReviewDialog preview={review} feeName={feeType?.name || ''} termName={terms.find(t => t.id === termId)?.name || ''} working={busy} onSave={save} onClose={() => setReview(null)} />}
    </div>
  );
}

function PasteDialog({ onClose, onAdd }: { onClose: () => void; onAdd: (text: string) => void }) {
  const [text, setText] = useState('');
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="px-6 pt-5 pb-3 border-b border-stone/10">
          <h3 className="font-display text-lg text-brand-dark">Paste from Excel</h3>
          <p className="text-sm text-stone mt-1">One student per line: admission number, then the amount, then an optional note. Copy the columns straight from Excel. Leave the amount empty to take an amount away.</p>
        </div>
        <div className="px-6 py-4">
          <textarea autoFocus value={text} onChange={e => setText(e.target.value)} rows={9} placeholder={'CGA/018/2024\t1500\nDGA/006/2026J\t800\tRe-sit'} className="w-full px-3 py-2 rounded-xl border border-stone/25 text-sm font-mono focus:outline-none focus:border-brand" />
          <p className="text-xs text-stone mt-1.5">Nothing is saved yet. You will review the changes first.</p>
        </div>
        <div className="px-6 py-4 border-t border-stone/10 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-stone/25 text-sm text-stone hover:bg-cream-deep">Cancel</button>
          <button disabled={!text.trim()} onClick={() => onAdd(text)} className="px-5 py-2 rounded-xl bg-brand text-cream text-sm font-semibold hover:bg-brand-dark disabled:opacity-50">Add to the list</button>
        </div>
      </div>
    </div>, document.body);
}

function ReviewDialog({ preview, feeName, termName, working, onSave, onClose }: { preview: Preview; feeName: string; termName: string; working: boolean; onSave: () => void; onClose: () => void }) {
  if (typeof document === 'undefined') return null;
  const c = preview.counts;
  const nothing = c.added + c.changed + c.removed === 0;
  return createPortal(
    <div className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-6 pt-5 pb-3 border-b border-stone/10">
          <h3 className="font-display text-lg text-brand-dark">Review: {feeName}, {termName}</h3>
          <p className="text-sm text-stone mt-1">This is what will change. Nothing is saved until you confirm.</p>
        </div>
        <div className="px-6 py-4 overflow-y-auto space-y-4">
          <div className="rounded-xl bg-cream-deep px-4 py-3 text-sm">
            {nothing ? <strong className="text-brand-dark">Nothing would change.</strong> : (
              <ul className="space-y-1 text-brand-dark">
                <li>{[c.added && `${c.added} amount${c.added === 1 ? '' : 's'} added`, c.changed && `${c.changed} changed`, c.removed && `${c.removed} removed`].filter(Boolean).join(', ')}{c.unchanged ? ` (${c.unchanged} already the same)` : ''}</li>
                {preview.impact && <li>Fees billed: {kes(preview.impact.fees_before)} → {kes(preview.impact.fees_after)} (<strong>{signed(preview.impact.fees_change)}</strong>)</li>}
                {preview.impact && <li>Amount still owed changes by <strong>{signed(preview.impact.outstanding_change)}</strong></li>}
              </ul>
            )}
          </div>

          {preview.problems.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-1">{preview.problems.length} line{preview.problems.length === 1 ? '' : 's'} need attention (these are left out)</p>
              <ul className="divide-y divide-stone/10 text-sm border border-red-200 bg-red-50/50 rounded-xl max-h-44 overflow-y-auto">
                {preview.problems.map((p, i) => <li key={i} className="px-3 py-1.5"><span className="font-semibold text-brand-dark">{p.admission_no}</span> <span className="text-xs text-red-700">{p.reason}</span></li>)}
              </ul>
            </div>
          )}

          {preview.items.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-stone uppercase tracking-wider mb-1">Changes{preview.counts.added + preview.counts.changed + preview.counts.removed > preview.items.length ? ` (first ${preview.items.length})` : ''}</p>
              <ul className="divide-y divide-stone/10 text-sm border border-stone/10 rounded-xl max-h-56 overflow-y-auto">
                {preview.items.map(it => (
                  <li key={it.student_id} className="px-3 py-1.5 flex justify-between gap-3">
                    <span className="font-semibold text-brand-dark">{it.admission_no}</span>
                    <span className="text-stone tabular-nums">{it.before === null ? 'none' : kes(it.before)} → {it.after === null ? 'removed' : kes(it.after)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-stone/10 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-stone/25 text-sm text-stone hover:bg-cream-deep">Back</button>
          <button disabled={working || nothing} onClick={onSave} className="px-5 py-2 rounded-xl bg-brand text-cream text-sm font-semibold hover:bg-brand-dark disabled:opacity-50">{working ? 'Saving…' : 'Save and update fees'}</button>
        </div>
      </div>
    </div>, document.body);
}
