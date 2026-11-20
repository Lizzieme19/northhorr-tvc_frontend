'use client';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { feeCorrectionsApi, feeTypesApi, feesApi } from '@/lib/services';
import StudentPicker from '@/components/StudentPicker';
import PaymentDate, { todayStr } from '@/components/PaymentDate';
import { termLabel } from '@/lib/terms';
import { toast } from 'sonner';
import { useEffect } from 'react';

// Record payments for several students in one go: one date and (optionally) one fee type for the batch, then a row
// per student with the term, the amount and the M-Pesa or receipt reference. Each row is recorded on its own, so a
// row that cannot be recorded never stops the others, and a payment that looks already recorded is held back.

const money = (n: number) => `KES ${Math.round(n).toLocaleString()}`;
const inputCls = 'w-full px-3 py-2 rounded-xl border border-stone/25 bg-white text-sm focus:outline-none focus:border-brand';
const blank = () => ({ key: Math.random().toString(36).slice(2), student: null as any, terms: [] as any[], termId: '', amount: '', reference: '' });
const nameOf = (s: any) => `${s?.application?.surname || ''} ${s?.application?.other_names || ''}`.trim();

export default function BulkPayments({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [date, setDate] = useState(todayStr());
  const [feeTypeId, setFeeTypeId] = useState('');
  const [feeTypes, setFeeTypes] = useState<any[]>([]);
  const [rows, setRows] = useState<any[]>([blank(), blank(), blank()]);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); feeTypesApi.getAll().then(r => setFeeTypes(r.data.fee_types || [])).catch(() => { }); }, []);

  const update = (i: number, patch: any) => setRows(rs => rs.map((r, x) => (x === i ? { ...r, ...patch } : r)));

  const pick = async (i: number, student: any) => {
    update(i, { student, terms: [], termId: '' });
    if (!student) return;
    try {
      const r = await feeCorrectionsApi.getSummary(student.id);
      const terms = [...(r.data.termBreakdown || [])].sort((a: any, b: any) => new Date(a.term.start_date || 0).getTime() - new Date(b.term.start_date || 0).getTime());
      // the most recent term that still has something to pay, else the latest
      const owing = [...terms].reverse().find((b: any) => b.balance > 0) || terms[terms.length - 1];
      update(i, { terms, termId: owing?.term.id || '' });
    } catch { toast.error('Could not load that student’s terms'); }
  };

  const filled = rows.filter(r => r.student || r.amount);
  const valid = (r: any) => r.student && r.termId && parseFloat(r.amount) > 0;
  const total = rows.filter(valid).reduce((n, r) => n + parseFloat(r.amount), 0);
  const dupKey = (r: any) => `${r.student?.id}|${r.termId}`;
  const dupCount = rows.filter(valid).reduce<Record<string, number>>((m, r) => { m[dupKey(r)] = (m[dupKey(r)] || 0) + 1; return m; }, {});

  const submit = async (allowDuplicates = false, only?: any[]) => {
    const list = only || rows.filter(valid);
    if (list.length === 0) { toast.warning('Add at least one student with a term and an amount'); return; }
    if (filled.some(r => !valid(r)) && !only) { toast.warning('Some rows are incomplete. Finish or clear them first.'); return; }
    setSaving(true);
    try {
      const r = await feesApi.bulkRecord({
        paid_at: date, fee_type_id: feeTypeId || undefined, allow_duplicates: allowDuplicates,
        payments: list.map(x => ({ studentId: x.student.id, termId: x.termId, amount: parseFloat(x.amount), reference: x.reference || undefined })),
      });
      setResult((prev: any) => allowDuplicates && prev ? { ...r.data, results: [...prev.results, ...r.data.results], errors: [...prev.errors, ...r.data.errors], held: [], summary: { ...r.data.summary, successful: prev.summary.successful + r.data.summary.successful, amount: prev.summary.amount + r.data.summary.amount, failed: prev.summary.failed + r.data.summary.failed, held: 0 } } : r.data);
      onDone();
      if (r.data.summary.successful > 0) toast.success(`Recorded ${r.data.summary.successful} payment${r.data.summary.successful === 1 ? '' : 's'}`);
    } catch (e: any) { toast.error(e?.response?.data?.error || 'Could not record the payments'); }
    finally { setSaving(false); }
  };

  // the held-back rows can be recorded anyway
  const recordHeldAnyway = () => {
    const keys = new Set(result.held.map((h: any) => `${h.studentId}|${h.termId}|${h.amount}`));
    submit(true, rows.filter(r => valid(r) && keys.has(`${r.student.id}|${r.termId}|${parseFloat(r.amount)}`)));
  };

  if (!mounted) return null;
  return createPortal(
    <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 py-6 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-5xl shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-1">
          <h2 className="font-display text-xl text-brand-dark">Record payments for several students</h2>
          <button onClick={onClose} className="text-stone hover:text-brand" aria-label="Close">✕</button>
        </div>

        {result ? (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
              {[[result.summary.successful, 'recorded', 'bg-green-50'], [money(result.summary.amount), 'received in total', 'bg-green-50'], [result.summary.held, 'held back (possible duplicates)', result.summary.held ? 'bg-amber-50' : 'bg-cream-deep'], [result.summary.failed, 'could not be recorded', result.summary.failed ? 'bg-red-50' : 'bg-cream-deep']].map(([n, t, tone]: any) => (
                <div key={t} className={`rounded-xl p-3 text-center ${tone}`}><div className="text-xl font-bold text-brand-dark">{n}</div><div className="text-xs text-stone">{t}</div></div>
              ))}
            </div>
            {result.results.length > 0 && (
              <div className="border border-stone/15 rounded-xl overflow-hidden mb-4">
                <table className="w-full text-sm"><thead className="bg-cream-deep text-stone text-xs uppercase"><tr><th className="text-left px-3 py-2">Student</th><th className="text-right px-3 py-2">Amount</th><th className="text-right px-3 py-2">Balance now</th></tr></thead>
                  <tbody className="divide-y divide-stone/10">{result.results.map((x: any) => <tr key={x.feeRecordId}><td className="px-3 py-2 text-brand-dark">{x.admission_no}</td><td className="px-3 py-2 text-right">{money(x.amount)}</td><td className="px-3 py-2 text-right">{money(x.newBalance)}</td></tr>)}</tbody></table>
              </div>
            )}
            {result.held.length > 0 && (
              <div className="border border-amber-200 bg-amber-50/60 rounded-xl p-3 mb-4 text-sm">
                <div className="font-semibold text-amber-900 mb-1">Held back: these look like payments already recorded</div>
                {result.held.map((h: any, i: number) => <div key={i} className="text-xs text-amber-900">{h.admission_no} · {money(h.amount)}: {h.reason}</div>)}
                <button onClick={recordHeldAnyway} disabled={saving} className="mt-2 px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition disabled:opacity-60">They are different payments: record them anyway</button>
              </div>
            )}
            {result.errors.length > 0 && (
              <div className="border border-red-200 bg-red-50/60 rounded-xl p-3 mb-4 text-xs text-red-800">
                <div className="font-semibold mb-1">Not recorded</div>
                {result.errors.map((e: any, i: number) => <div key={i}>{e.error}</div>)}
              </div>
            )}
            <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-brand text-cream font-semibold hover:bg-brand-dark transition">Done</button>
          </div>
        ) : (
          <>
            <p className="text-sm text-stone mb-4">One date for the whole batch (backdating is allowed), then a row for each student. Each payment is recorded on its own, and one that cannot be recorded does not stop the rest.</p>
            <div className="grid sm:grid-cols-3 gap-4 mb-5">
              <PaymentDate value={date} onChange={setDate} />
              <div>
                <label className="block text-xs font-semibold text-brand-dark mb-1">Fee type <span className="font-normal text-stone">(optional, can be allocated later)</span></label>
                <select value={feeTypeId} onChange={e => setFeeTypeId(e.target.value)} className={inputCls}>
                  <option value="">Not allocated yet</option>
                  {feeTypes.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="hidden md:grid grid-cols-12 gap-3 text-[11px] font-semibold text-stone uppercase tracking-wide px-1"><div className="col-span-4">Student</div><div className="col-span-3">Term</div><div className="col-span-2">Amount (KES)</div><div className="col-span-2">M-Pesa / receipt ref</div><div className="col-span-1" /></div>
              {rows.map((r, i) => {
                const b = r.terms.find((t: any) => t.term.id === r.termId);
                const amt = parseFloat(r.amount) || 0;
                return (
                  <div key={r.key} className="grid md:grid-cols-12 gap-3 items-start rounded-xl border border-stone/10 p-2">
                    <div className="md:col-span-4"><StudentPicker value={r.student} onChange={s => pick(i, s)} /></div>
                    <div className="md:col-span-3">
                      <select value={r.termId} onChange={e => update(i, { termId: e.target.value })} disabled={!r.student} className={inputCls}>
                        <option value="">{r.student ? (r.terms.length ? 'Select term' : 'No terms') : 'Pick a student first'}</option>
                        {r.terms.map((t: any) => <option key={t.term.id} value={t.term.id}>{termLabel(t.term, `Balance: ${money(t.balance)}`)}</option>)}
                      </select>
                      {b && amt > b.balance && <p className="text-[11px] text-amber-700 mt-1">More than the {money(b.balance)} owed: the extra shows as credit.</p>}
                      {r.student && r.termId && dupCount[dupKey(r)] > 1 && <p className="text-[11px] text-amber-700 mt-1">This student and term appear more than once.</p>}
                    </div>
                    <div className="md:col-span-2"><input type="number" min="0" step="0.01" value={r.amount} onChange={e => update(i, { amount: e.target.value })} placeholder="0" className={inputCls} /></div>
                    <div className="md:col-span-2"><input value={r.reference} onChange={e => update(i, { reference: e.target.value })} placeholder="e.g. QK11AB12CD" className={inputCls} /></div>
                    <div className="md:col-span-1 text-right">{rows.length > 1 && <button onClick={() => setRows(rs => rs.filter((_, x) => x !== i))} className="text-xs text-red-600 hover:underline pt-2" aria-label="Remove this row">Remove</button>}</div>
                    {r.student && <div className="md:col-span-12 text-[11px] text-stone -mt-1 pl-1">{r.student.admission_no} · {nameOf(r.student)}</div>}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
              <button onClick={() => setRows(rs => [...rs, blank(), blank()])} className="px-4 py-2 rounded-xl border border-brand/40 text-brand text-sm font-semibold hover:bg-brand/5 transition">＋ Add more rows</button>
              <div className="text-sm text-stone">{rows.filter(valid).length} payment{rows.filter(valid).length === 1 ? '' : 's'} · Total <span className="font-semibold text-brand-dark">{money(total)}</span></div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => submit()} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-brand text-cream font-semibold hover:bg-brand-dark transition disabled:opacity-60">{saving ? 'Recording…' : `Record ${rows.filter(valid).length || ''} payment${rows.filter(valid).length === 1 ? '' : 's'}`}</button>
              <button onClick={onClose} className="px-6 py-2.5 rounded-xl border border-stone/25 text-brand font-semibold hover:bg-stone/5 transition">Cancel</button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
