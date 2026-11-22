'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { studentsApi, studentMergesApi } from '@/lib/services';
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

// ── Put an earlier merged admission back as its own record ──
function RestorePanel({ merge, onBack, onDone }: { merge: any; onBack: () => void; onDone: () => void }) {
  const [plan, setPlan] = useState<any>(null);
  const [picked, setPicked] = useState<string[] | null>(null); // null = the terms the server chose
  const [status, setStatus] = useState('GRADUATED');
  const [ack, setAck] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = async (terms?: string[], st?: string) => {
    try { const r = await studentMergesApi.preview(merge.progression_id, terms, st); setPlan(r.data); }
    catch (e: any) { toast.error(e?.response?.data?.error || 'Could not work out the restore'); onBack(); }
  };
  useEffect(() => { load(undefined, status); /* eslint-disable-next-line */ }, []);

  const current = picked ?? (plan ? plan.terms.filter((t: any) => t.moves).map((t: any) => t.term_id) : []);
  const toggle = (id: string) => { const next = current.includes(id) ? current.filter((x: string) => x !== id) : [...current, id]; setPicked(next); setAck(false); load(next, status); };

  const restore = async () => {
    setBusy(true);
    try { const r = await studentMergesApi.restore(merge.progression_id, { term_ids: picked ?? undefined, status, acknowledge_warnings: ack }); toast.success(r.data.message, { duration: 10000 }); onDone(); }
    catch (e: any) { toast.error(e?.response?.data?.error || 'Could not restore'); }
    finally { setBusy(false); }
  };

  if (!plan) return <p className="py-10 text-center text-sm text-stone">Working out what restoring would do…</p>;
  const m = plan.money;
  return (
    <div className="space-y-4 text-sm">
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="border border-stone/15 rounded-xl p-3 text-xs"><div className="text-[11px] uppercase tracking-wider text-stone mb-1">Comes back as its own admission</div><div className="font-mono text-sm text-brand font-semibold">{plan.restore.admission_no}</div><div className="text-brand-dark font-medium">{plan.current.name}</div><div className="text-stone mt-1">{plan.restore.level} · {title(plan.restore.intake)} {plan.restore.year}{plan.restore.course ? ` · ${plan.restore.course}` : ''}</div><div className="text-stone">Admitted {fmt(plan.restore.admitted_on)} · application {plan.restore.application_no || '—'}</div></div>
        <div className="border border-stone/15 rounded-xl p-3 text-xs"><div className="text-[11px] uppercase tracking-wider text-stone mb-1">Stays as the current admission</div><div className="font-mono text-sm text-brand font-semibold">{plan.current.admission_no}</div><div className="text-brand-dark font-medium">{plan.current.name}</div><div className="text-stone mt-1">{plan.current.level} · {plan.current.course}</div><div className="text-stone">Keeps the login; the restored admission is linked under it.</div></div>
      </div>
      <label className="block"><span className="text-xs text-stone">Status of the restored admission</span>
        <select value={status} onChange={e => { setStatus(e.target.value); setAck(false); load(picked ?? undefined, e.target.value); }} className="mt-1 w-full sm:w-64 px-3 py-2 rounded-xl border border-stone/25">
          {['GRADUATED', 'WITHDRAWN', 'DEFERRED', 'ACTIVE', 'ATTACHMENT'].map(s => <option key={s} value={s}>{title(s)}</option>)}
        </select></label>
      <div>
        <p className="text-xs font-semibold text-stone uppercase tracking-wider mb-1">Term bills: tick the ones that belong to {plan.restore.admission_no} ({plan.payments_moving} payment{plan.payments_moving === 1 ? '' : 's'} move with them)</p>
        <div className="border border-stone/10 rounded-xl divide-y divide-stone/10 max-h-52 overflow-y-auto">
          {plan.terms.map((t: any) => (
            <label key={t.term_id} className="flex items-center gap-3 px-3 py-1.5 text-xs cursor-pointer">
              <input type="checkbox" checked={current.includes(t.term_id)} onChange={() => toggle(t.term_id)} />
              <span className="flex-1">{t.term} · {t.level}</span><span className="tabular-nums text-stone">Billed {kes(t.billed)} · Paid {kes(t.paid)}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Tile label={`Owed on ${plan.current.admission_no}: now → after`} value={`${Math.round(m.current_before).toLocaleString()} → ${Math.round(m.current_after).toLocaleString()}`} />
        <Tile label={`Owed on ${plan.restore.admission_no}: after`} value={kes(m.restored_after)} />
        <Tile label="Total owed across both" value={Math.abs(m.total_before - m.total_after) < 0.01 ? 'unchanged' : `${Math.round(m.total_before).toLocaleString()} → ${Math.round(m.total_after).toLocaleString()}`} tone={Math.abs(m.total_before - m.total_after) < 0.01 ? 'good' : 'bad'} />
      </div>
      {plan.blockers.length > 0 && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-800 space-y-1">{plan.blockers.map((b: string, i: number) => <p key={i}>{b}</p>)}</div>}
      {plan.warnings.length > 0 && <ul className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-900 space-y-1 list-disc pl-8">{plan.warnings.map((w: string, i: number) => <li key={i}>{w}</li>)}</ul>}
      <p className="text-xs text-stone">Documents and the admission letter stay with the current admission. The restored admission gets its own login, switched off while it is linked.</p>
      {plan.can_restore && plan.warnings.length > 0 && <label className="flex items-start gap-2 cursor-pointer"><input type="checkbox" checked={ack} onChange={e => setAck(e.target.checked)} className="mt-1" /><span>I have read the notes above and want to restore this admission.</span></label>}
      <div className="flex gap-3">
        <button onClick={restore} disabled={busy || !plan.can_restore || (plan.warnings.length > 0 && !ack)} className="flex-1 py-2.5 rounded-xl bg-brand text-cream font-semibold hover:bg-brand-dark transition disabled:opacity-50">{busy ? 'Restoring…' : 'Restore admission'}</button>
        <button onClick={onBack} disabled={busy} className="px-5 py-2.5 rounded-xl border border-stone/25 text-brand font-semibold hover:bg-stone/5">Back</button>
      </div>
    </div>
  );
}

// Admin: every earlier merge, each with a way to put the older admission back as its own record
export function PastMergesModal({ onClose, onChanged }: { onClose: () => void; onChanged?: () => void }) {
  const [merges, setMerges] = useState<any[] | null>(null);
  const [open, setOpen] = useState<any>(null);
  const [q, setQ] = useState('');
  const load = () => studentMergesApi.list().then(r => setMerges(r.data.merges)).catch(() => { toast.error('Could not load the earlier merges'); onClose(); });
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);
  const shown = (merges || []).filter(m => !q.trim() || `${m.name} ${m.earlier_admission_no} ${m.current_admission_no}`.toLowerCase().includes(q.trim().toLowerCase()));
  if (typeof document === 'undefined') return null;
  return createPortal(
    <div className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[88vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-6 pt-5 pb-3 border-b border-stone/10 flex items-start justify-between gap-3">
          <div><h3 className="font-display text-lg text-brand-dark">Restore merged admissions</h3><p className="text-sm text-stone mt-1">Older admissions that were folded into a later one can be put back as their own admission, with their own bills and payments, sharing one login.</p></div>
          <button onClick={onClose} className="text-stone hover:text-brand" aria-label="Close">✕</button>
        </div>
        <div className="px-6 py-4 overflow-y-auto">
          {open ? <RestorePanel merge={open} onBack={() => setOpen(null)} onDone={() => { setOpen(null); load(); onChanged?.(); }} /> : !merges ? <p className="py-8 text-center text-sm text-stone">Loading…</p> : merges.length === 0 ? <p className="py-8 text-center text-sm text-stone">No earlier merges to restore.</p> : (
            <>
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name or admission number…" className="w-full mb-3 px-3 py-2 rounded-xl border border-stone/25 text-sm" />
              <ul className="divide-y divide-stone/10 border border-stone/10 rounded-xl text-sm">
                {shown.map(m => (
                  <li key={m.progression_id} className="px-4 py-2.5 flex items-center gap-3">
                    <div className="flex-1 min-w-0"><div className="font-medium text-brand-dark truncate">{m.name || m.current_admission_no}</div><div className="text-xs text-stone"><span className="font-mono">{m.earlier_admission_no}</span> ({m.earlier_level}) folded into <span className="font-mono">{m.current_admission_no}</span> ({m.current_level}) · {m.terms_to_move} term{m.terms_to_move === 1 ? '' : 's'}, {m.payments_to_move} payment{m.payments_to_move === 1 ? '' : 's'} to move</div>{!m.can_restore && m.blocker && <div className="text-[11px] text-red-600 mt-0.5">{m.blocker}</div>}</div>
                    <button onClick={() => setOpen(m)} disabled={!m.can_restore} className="text-xs font-semibold text-brand hover:underline disabled:opacity-40">Review &amp; restore</button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        <div className="px-6 py-4 border-t border-stone/10 flex justify-end"><button onClick={onClose} className="px-5 py-2 rounded-xl bg-brand text-cream text-sm font-semibold hover:bg-brand-dark">Close</button></div>
      </div>
    </div>, document.body);
}
