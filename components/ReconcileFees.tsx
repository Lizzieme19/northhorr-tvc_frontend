'use client';
import { useState } from 'react';
import { feeCorrectionsApi } from '@/lib/services';
import { termLabel } from '@/lib/terms';
import { toast } from 'sonner';

const n = (v: number) => v.toLocaleString();
const signed = (v: number) => `${v > 0 ? '+' : ''}${n(v)}`;

// Compares every student's stored balances with the payments and fee settings on file, shows the
// differences, and (Admin) applies the fix. Nothing changes until "Apply" is pressed.
export default function ReconcileFees({ terms, canApply, onClose, onApplied }: { terms: any[]; canApply: boolean; onClose: () => void; onApplied?: () => void }) {
  const [termId, setTermId] = useState('');
  const [result, setResult] = useState<any>(null);
  const [working, setWorking] = useState(false);

  const check = async () => {
    setWorking(true);
    setResult(null);
    try {
      const r = await feeCorrectionsApi.reconcile({ term_id: termId || undefined, apply: false });
      setResult(r.data);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Could not check the fees');
    } finally {
      setWorking(false);
    }
  };

  const apply = () => {
    toast(`Fix ${result.rows_changed} term balance${result.rows_changed === 1 ? '' : 's'} for ${result.students_changed} student${result.students_changed === 1 ? '' : 's'}? Payments are not changed.`, {
      duration: 15000,
      action: {
        label: 'Apply fixes',
        onClick: async () => {
          setWorking(true);
          try {
            const r = await feeCorrectionsApi.reconcile({ term_id: termId || undefined, apply: true });
            toast.success(`Fixed ${r.data.rows_changed} balances for ${r.data.students_changed} students`);
            onApplied?.();
            setResult({ ...r.data, items: [], rows_changed: 0, students_changed: 0, applied: true });
          } catch (e: any) {
            toast.error(e?.response?.data?.error || 'Could not apply the fixes');
          } finally {
            setWorking(false);
          }
        },
      },
    });
  };

  return (
    <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 py-6 overflow-y-auto">
      <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-3xl shadow-2xl my-auto">
        <div className="flex items-start justify-between mb-1">
          <h2 className="font-display text-xl text-brand-dark">Check fee balances</h2>
          <button onClick={onClose} className="text-stone hover:text-brand transition" aria-label="Close">✕</button>
        </div>
        <p className="text-sm text-stone mb-4">
          Rebuilds each student&apos;s term balances from the payments recorded and the current term fees and fee types, and lists what would change. Nothing is saved until you apply it.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <select value={termId} onChange={e => { setTermId(e.target.value); setResult(null); }} className="flex-1 px-3 py-2.5 rounded-xl border border-stone/25 bg-white text-sm focus:outline-none focus:border-brand">
            <option value="">All students</option>
            {terms.map(t => <option key={t.id} value={t.id}>Only students in {termLabel(t)}</option>)}
          </select>
          <button onClick={check} disabled={working} className="px-5 py-2.5 rounded-xl bg-brand text-cream font-semibold hover:bg-brand-dark transition disabled:opacity-50 text-sm">
            {working && !result ? 'Checking…' : 'Check now'}
          </button>
        </div>

        {result && (
          result.applied ? (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800">Fixes applied. Everything now matches the payments and fee settings.</div>
          ) : result.rows_changed === 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800">
              ✅ All {result.students_checked} students are already correct. Nothing to change.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-center">
                <div className="bg-cream-deep rounded-xl p-3"><div className="text-lg font-bold text-brand-dark">{result.students_changed}</div><div className="text-xs text-stone">of {result.students_checked} students differ</div></div>
                <div className="bg-cream-deep rounded-xl p-3"><div className="text-lg font-bold text-brand-dark">{result.rows_changed}</div><div className="text-xs text-stone">term balances</div></div>
                <div className="bg-cream-deep rounded-xl p-3"><div className="text-lg font-bold text-brand-dark">{signed(result.fees_change)}</div><div className="text-xs text-stone">KES billed</div></div>
                <div className="bg-cream-deep rounded-xl p-3"><div className={`text-lg font-bold ${result.outstanding_change > 0 ? 'text-red-600' : 'text-green-700'}`}>{signed(result.outstanding_change)}</div><div className="text-xs text-stone">KES owing</div></div>
              </div>

              <div className="border border-stone/15 rounded-2xl overflow-hidden mb-4">
                <div className="max-h-80 overflow-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-cream-deep text-stone uppercase tracking-wider sticky top-0">
                      <tr><th className="px-3 py-2 text-left">Student</th><th className="px-3 py-2 text-left">Term</th><th className="px-3 py-2 text-right">Fee</th><th className="px-3 py-2 text-right">B/F</th><th className="px-3 py-2 text-right">Paid</th><th className="px-3 py-2 text-right">Balance</th></tr>
                    </thead>
                    <tbody className="divide-y divide-stone/10">
                      {result.items.flatMap((it: any) => it.rows.map((r: any, i: number) => (
                        <tr key={`${it.student_id}-${i}`}>
                          <td className="px-3 py-2 font-mono text-brand">{i === 0 ? it.admission_no : ''}</td>
                          <td className="px-3 py-2 text-stone">{r.term}</td>
                          <td className="px-3 py-2 text-right">{n(r.before.total_fees)} → <strong>{n(r.after.total_fees)}</strong></td>
                          <td className="px-3 py-2 text-right">{n(r.before.carryover)} → <strong>{n(r.after.carryover)}</strong></td>
                          <td className="px-3 py-2 text-right">{n(r.before.amount_paid)} → <strong>{n(r.after.amount_paid)}</strong></td>
                          <td className="px-3 py-2 text-right">{n(r.before.balance)} → <strong>{n(r.after.balance)}</strong></td>
                        </tr>
                      )))}
                    </tbody>
                  </table>
                </div>
                {result.students_changed > result.items.length && (
                  <div className="px-3 py-2 text-xs text-stone bg-cream-deep/60">Showing the first {result.items.length} students. Applying fixes all {result.students_changed}.</div>
                )}
              </div>

              {canApply ? (
                <button onClick={apply} disabled={working} className="w-full py-2.5 rounded-xl bg-brand text-cream font-semibold hover:bg-brand-dark transition disabled:opacity-50">
                  {working ? 'Applying…' : `Apply fixes to ${result.students_changed} student${result.students_changed === 1 ? '' : 's'}`}
                </button>
              ) : (
                <p className="text-xs text-stone text-center">Only an Admin can apply fixes to many students at once.</p>
              )}
            </>
          )
        )}

        <button onClick={onClose} className="mt-4 w-full py-2.5 rounded-xl border border-stone/25 text-brand font-semibold hover:bg-stone/5 transition">Close</button>
      </div>
    </div>
  );
}
