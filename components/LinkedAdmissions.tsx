'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { studentsApi } from '@/lib/services';
import { toast } from 'sonner';

// One person's admissions (say Level 5, then Level 6) share one login. Each admission keeps its own bills, payments and
// documents; this shows them together, and lets an administrator undo a link made in error.

const kes = (n: number) => `KES ${Math.round(n || 0).toLocaleString()}`;
const fmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
const title = (s?: string | null) => (s ? s.charAt(0) + s.slice(1).toLowerCase() : '—');

function Tile({ label, value, tone }: { label: string; value: string; tone?: 'good' | 'bad' | 'plain' }) {
  const cls = tone === 'bad' ? 'bg-red-50 text-red-600' : tone === 'good' ? 'bg-green-50 text-green-700' : 'bg-cream-deep text-brand-dark';
  return <div className={`rounded-xl p-3 text-center ${cls}`}><div className="text-base font-bold">{value}</div><div className="text-xs text-stone">{label}</div></div>;
}

// The statement across every admission of one person
export function CombinedStatement({ load }: { load: () => Promise<any> }) {
  const [data, setData] = useState<any>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => { load().then(r => setData(r.data)).catch(() => setFailed(true)); /* eslint-disable-next-line */ }, []);
  if (failed) return <p className="text-sm text-stone py-4">The statement is not available right now.</p>;
  if (!data) return <p className="text-sm text-stone py-4">Loading…</p>;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <Tile label="Billed (all admissions)" value={kes(data.combined.billed)} />
        <Tile label="Paid" value={kes(data.combined.paid)} tone="good" />
        <Tile label="Still owed" value={kes(data.combined.outstanding)} tone={data.combined.outstanding > 0 ? 'bad' : 'good'} />
      </div>
      {data.admissions.map((a: any) => (
        <div key={a.id} className="border border-stone/15 rounded-2xl p-4">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="font-mono text-sm font-semibold text-brand">{a.admission_no}</span>
            <span className="text-xs text-stone">{a.level} · {a.course} · {title(a.intake)} {a.year}</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-cream-deep text-stone">{title(a.status)}</span>
            {a.is_login_owner && <span className="text-[11px] px-2 py-0.5 rounded-full bg-brand/10 text-brand font-semibold">Holds the login</span>}
            <span className="ml-auto text-xs text-stone">Billed {kes(a.billed)} · Paid {kes(a.paid)} · <strong className={a.outstanding > 0 ? 'text-red-600' : 'text-green-700'}>Owed {kes(a.outstanding)}</strong></span>
          </div>
          {a.terms.length === 0 ? <p className="text-xs text-stone">No terms billed on this admission.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-stone uppercase tracking-wider"><tr><th className="text-left py-1">Term</th><th className="text-left">Level</th><th className="text-right">Billed</th><th className="text-right">Brought fwd</th><th className="text-right">Paid</th><th className="text-right">Balance</th></tr></thead>
                <tbody className="divide-y divide-stone/10">
                  {a.terms.map((t: any, i: number) => (
                    <tr key={i}><td className="py-1.5">{t.term}</td><td>{t.level}</td><td className="text-right tabular-nums">{kes(t.billed)}</td><td className="text-right tabular-nums">{t.carried_forward ? kes(t.carried_forward) : '—'}</td><td className="text-right tabular-nums">{kes(t.paid)}</td><td className="text-right tabular-nums font-medium">{kes(t.balance)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {a.payments.length > 0 && (
            <details className="mt-3">
              <summary className="text-xs font-semibold text-brand cursor-pointer">Payments ({a.payments.length})</summary>
              <ul className="mt-2 divide-y divide-stone/10 text-xs">
                {a.payments.map((p: any, i: number) => (
                  <li key={i} className="py-1.5 flex flex-wrap gap-x-4"><span className="w-24">{fmt(p.paid_at)}</span><span className="tabular-nums font-medium w-24">{kes(p.amount)}</span><span className="text-stone">{p.fee_type || 'Payment'}{p.term ? ` · ${p.term}` : ''}{p.reference ? ` · ${p.reference}` : ''}</span></li>
                ))}
              </ul>
            </details>
          )}
        </div>
      ))}
    </div>
  );
}

// Staff view: the admissions that share this student's login, their combined statement, and unlink
export function LinkedAdmissionsModal({ student, canUnlink, canSeeFees, onClose, onChanged }: { student: any; canUnlink: boolean; canSeeFees: boolean; onClose: () => void; onChanged?: () => void }) {
  const [busy, setBusy] = useState(false);
  const owner = student.primary_student ? student.primary_student : { id: student.id, admission_no: student.admission_no };
  const linked: any[] = student.primary_student ? [{ id: student.id, admission_no: student.admission_no, level: student.level, status: student.status }] : (student.linked_admissions || []);

  const unlink = async (a: any) => {
    if (!confirm(`Unlink ${a.admission_no}? It gets its own login back, with the password it had before it was linked. Nothing else changes.`)) return;
    setBusy(true);
    try { const r = await studentsApi.unlinkAdmission(a.id); toast.success(r.data.message); onChanged?.(); onClose(); }
    catch (e: any) { toast.error(e?.response?.data?.error || 'Could not unlink'); }
    finally { setBusy(false); }
  };

  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[88vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-6 pt-5 pb-3 border-b border-stone/10 flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-lg text-brand-dark">Linked admissions</h3>
            <p className="text-sm text-stone mt-1">These admissions are one person and share one login (<strong>{owner.admission_no}</strong>). Each keeps its own bills, payments and documents.</p>
          </div>
          <button onClick={onClose} className="text-stone hover:text-brand" aria-label="Close">✕</button>
        </div>
        <div className="px-6 py-4 overflow-y-auto space-y-5">
          <ul className="divide-y divide-stone/10 border border-stone/10 rounded-xl text-sm">
            <li className="px-4 py-2.5 flex items-center gap-3"><span className="font-mono text-brand font-semibold">{owner.admission_no}</span><span className="text-[11px] px-2 py-0.5 rounded-full bg-brand/10 text-brand font-semibold">Holds the login</span></li>
            {linked.map(a => (
              <li key={a.id} className="px-4 py-2.5 flex items-center gap-3">
                <span className="font-mono text-brand font-semibold">{a.admission_no}</span>
                <span className="text-xs text-stone flex-1">{a.level ? `${a.level} · ` : ''}{title(a.status)}</span>
                {canUnlink && <button disabled={busy} onClick={() => unlink(a)} className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50">Unlink</button>}
              </li>
            ))}
          </ul>
          {canSeeFees ? (
            <div>
              <h4 className="text-sm font-semibold text-terracotta uppercase tracking-widest mb-3">Fee statement, all admissions</h4>
              <CombinedStatement load={() => studentsApi.statement(student.id)} />
            </div>
          ) : <p className="text-xs text-stone">Fee statements are shown to administrators and the finance office.</p>}
        </div>
        <div className="px-6 py-4 border-t border-stone/10 flex justify-end"><button onClick={onClose} className="px-5 py-2 rounded-xl bg-brand text-cream text-sm font-semibold hover:bg-brand-dark">Close</button></div>
      </div>
    </div>, document.body);
}
