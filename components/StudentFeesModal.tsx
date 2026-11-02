'use client';
import { useEffect, useMemo, useState } from 'react';
import { feeCorrectionsApi, feeTypesApi, termsApi } from '@/lib/services';
import { termLabel } from '@/lib/terms';
import { toast } from 'sonner';

const money = (n: number | null | undefined) => `KES ${(n || 0).toLocaleString()}`;
const dateOf = (d?: string | null) => (d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
const dateTimeOf = (d?: string | null) => (d ? new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');

const STATUS_STYLE: Record<string, string> = {
  PAID: 'bg-green-100 text-green-800',
  PARTIAL: 'bg-yellow-100 text-yellow-800',
  PENDING: 'bg-red-100 text-red-800',
  OVERDUE: 'bg-red-200 text-red-900',
};

const ACTION_LABEL: Record<string, string> = {
  PAYMENT_EDITED: 'Payment corrected',
  PAYMENT_VOIDED: 'Payment voided',
  TERM_REASSIGNED: 'Term changed',
  TERM_REMOVED: 'Term assignment removed',
  TERM_FEE_OVERRIDE_SET: 'Term fee set manually',
  TERM_FEE_OVERRIDE_CLEARED: 'Term fee set back to calculated',
  FEES_RECONCILED: 'Fees recalculated',
};

// What changed, in words
const describeChange = (h: any): string => {
  const o = h.old_values || {};
  const n = h.new_values || {};
  switch (h.action) {
    case 'PAYMENT_EDITED': {
      const bits: string[] = [];
      if (o.amount !== n.amount) bits.push(`amount ${money(o.amount)} → ${money(n.amount)}`);
      if (o.term_id !== n.term_id) bits.push('moved to another term');
      if (o.fee_type_id !== n.fee_type_id) bits.push('fee type changed');
      if (String(o.paid_at) !== String(n.paid_at)) bits.push(`date ${dateOf(o.paid_at)} → ${dateOf(n.paid_at)}`);
      if ((o.notes || '') !== (n.notes || '')) bits.push('notes changed');
      return bits.join(', ') || 'details changed';
    }
    case 'PAYMENT_VOIDED': return `${money(o.amount)} payment${o.reference_code ? ` (${o.reference_code})` : ''} removed`;
    case 'TERM_REASSIGNED': return `${o.term} → ${n.term}`;
    case 'TERM_REMOVED': return `${o.term} (fee was ${money(o.total_fees)})`;
    case 'TERM_FEE_OVERRIDE_SET': return `fee fixed at ${money(n.fee_override)} (was ${money(o.total_fees)})`;
    case 'TERM_FEE_OVERRIDE_CLEARED': return 'back to the calculated fee';
    default: return '';
  }
};

type Dialog =
  | { type: 'edit'; record: any }
  | { type: 'void'; record: any }
  | { type: 'override'; term: any }
  | { type: 'reassign'; term: any }
  | { type: 'remove'; term: any }
  | { type: 'pay' }
  | null;

const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-stone/25 bg-white text-sm focus:outline-none focus:border-brand';
const labelCls = 'block text-xs font-semibold text-brand-dark mb-1';

export default function StudentFeesModal({
  student, onClose, onChanged, onRecordPayment, canCorrect = true,
}: {
  student: any;
  onClose: () => void;
  onChanged?: () => void;
  onRecordPayment?: (student: any) => void;
  canCorrect?: boolean;
}) {
  const [summary, setSummary] = useState<any>(null);
  const [history, setHistory] = useState<any[] | null>(null);
  const [tab, setTab] = useState<'terms' | 'history'>('terms');
  const [allTerms, setAllTerms] = useState<any[]>([]);
  const [feeTypes, setFeeTypes] = useState<any[]>([]);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const r = await feeCorrectionsApi.getSummary(student.id);
      setSummary(r.data);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to load fees');
      onClose();
    }
  };
  const loadHistory = () => feeCorrectionsApi.getHistory(student.id).then(r => setHistory(r.data.history)).catch(() => setHistory([]));

  useEffect(() => {
    load();
    termsApi.getAll().then(r => setAllTerms(r.data.terms || [])).catch(() => { });
    feeTypesApi.getAll().then(r => setFeeTypes(r.data.fee_types || [])).catch(() => { });
  }, [student.id]);

  useEffect(() => { if (tab === 'history' && history === null) loadHistory(); }, [tab]);

  // oldest first, the order the carried-forward balance builds up
  const terms = useMemo(
    () => [...(summary?.termBreakdown || [])].sort((a: any, b: any) => new Date(a.term.start_date || 0).getTime() - new Date(b.term.start_date || 0).getTime()),
    [summary]
  );
  const freeTerms = useMemo(
    () => allTerms.filter(t => !terms.some((b: any) => b.term.id === t.id)),
    [allTerms, terms]
  );

  const open = (d: Dialog, initial: any = {}) => { setDialog(d); setForm({ reason: '', ...initial }); };
  const close = () => { setDialog(null); setForm({}); };

  const done = async (message: string) => {
    toast.success(message);
    close();
    await load();
    if (history !== null) loadHistory();
    onChanged?.();
  };

  const run = async (fn: () => Promise<any>, successMessage: string) => {
    setSaving(true);
    try {
      await fn();
      await done(successMessage);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'That could not be saved');
    } finally {
      setSaving(false);
    }
  };

  const needReason = () => {
    if (!form.reason || form.reason.trim().length < 3) { toast.warning('Please give a short reason — it is kept in the history'); return true; }
    return false;
  };

  const submitDialog = () => {
    if (!dialog) return;
    if (dialog.type === 'edit') {
      if (needReason()) return;
      const r = dialog.record;
      const data: any = { reason: form.reason.trim() };
      if (parseFloat(form.amount) !== r.amount) data.amount = parseFloat(form.amount);
      if (form.paid_at && form.paid_at !== r.paid_at.split('T')[0]) data.paid_at = form.paid_at;
      if ((form.notes || '') !== (r.notes || '')) data.notes = form.notes;
      if ((form.fee_type_id || '') !== (r.fee_type_id || '')) data.fee_type_id = form.fee_type_id || null;
      if (form.term_id && form.term_id !== r.term_id) data.term_id = form.term_id;
      if (Object.keys(data).length === 1) { toast.info('Nothing was changed'); return; }
      run(() => feeCorrectionsApi.editPayment(r.id, data), 'Payment corrected and balances recalculated');
    } else if (dialog.type === 'void') {
      if (needReason()) return;
      run(() => feeCorrectionsApi.voidPayment(dialog.record.id, form.reason.trim()), 'Payment voided and balances recalculated');
    } else if (dialog.type === 'override') {
      if (needReason()) return;
      const v = parseFloat(form.total_fees);
      if (isNaN(v) || v < 0) { toast.warning('Enter the fee for this term'); return; }
      run(() => feeCorrectionsApi.setTermFee(student.id, dialog.term.term.id, v, form.reason.trim()), 'Fee updated and balances recalculated');
    } else if (dialog.type === 'reassign') {
      if (!form.to_term_id) { toast.warning('Choose the correct term'); return; }
      run(() => feeCorrectionsApi.reassignTerm(student.id, dialog.term.term.id, form.to_term_id, form.reason?.trim()), 'Moved to the correct term and fees recalculated');
    } else if (dialog.type === 'pay') {
      const amount = parseFloat(form.amount);
      if (!form.term_id) { toast.warning('Choose the term'); return; }
      if (!(amount > 0)) { toast.warning('Enter the amount received'); return; }
      run(() => feeCorrectionsApi.recordPayment(student.id, form.term_id, amount, form.notes), 'Payment recorded');
    } else if (dialog.type === 'remove') {
      run(() => feeCorrectionsApi.removeTerm(student.id, dialog.term.term.id, form.reason?.trim()), 'Term assignment removed');
    }
  };

  const clearOverride = (b: any) => {
    toast(`Use the calculated fee for ${b.term.name} again?`, {
      action: { label: 'Yes, clear it', onClick: () => run(() => feeCorrectionsApi.setTermFee(student.id, b.term.id, null, 'Back to the calculated fee'), 'Fee set back to the calculated amount') },
    });
  };

  const s = summary?.summary;

  return (
    <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 py-6 overflow-y-auto">
      <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-3xl shadow-2xl my-auto">
        <div className="flex items-start justify-between mb-1">
          <h2 className="font-display text-xl text-brand-dark">Fees</h2>
          <button onClick={onClose} className="text-stone hover:text-brand transition" aria-label="Close">✕</button>
        </div>
        <p className="text-sm text-stone mb-4">
          {student.admission_no} — {student.application?.surname} {student.application?.other_names}
          {summary?.student?.level ? ` · ${summary.student.level}` : ''}
        </p>

        {!summary ? (
          <div className="py-12 text-center text-sm text-stone">Loading…</div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-cream-deep rounded-xl p-3 text-center"><div className="text-lg font-bold text-brand-dark">{(s.totalFees).toLocaleString()}</div><div className="text-xs text-stone">Billed</div></div>
              <div className="bg-green-50 rounded-xl p-3 text-center"><div className="text-lg font-bold text-green-700">{(s.totalPaid).toLocaleString()}</div><div className="text-xs text-stone">Paid</div></div>
              <div className={`rounded-xl p-3 text-center ${s.totalBalance > 0 ? 'bg-red-50' : 'bg-green-50'}`}><div className={`text-lg font-bold ${s.totalBalance > 0 ? 'text-red-600' : 'text-green-700'}`}>{(s.totalBalance).toLocaleString()}</div><div className="text-xs text-stone">{s.totalBalance < 0 ? 'Credit' : 'Owing'}</div></div>
            </div>

            <div className="flex items-center justify-between mb-4 gap-3">
              <div className="flex gap-1 bg-cream-deep rounded-xl p-1 text-sm">
                {(['terms', 'history'] as const).map(t => (
                  <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-lg font-medium transition ${tab === t ? 'bg-white shadow text-brand' : 'text-stone hover:text-brand-dark'}`}>
                    {t === 'terms' ? 'Terms & payments' : 'Change history'}
                  </button>
                ))}
              </div>
              {canCorrect && (
                <button
                  onClick={() => (onRecordPayment ? onRecordPayment(student) : open({ type: 'pay' }, { term_id: terms.length ? terms[terms.length - 1].term.id : '', amount: '', notes: '' }))}
                  disabled={terms.length === 0}
                  className="px-4 py-2 rounded-xl bg-brand text-cream text-sm font-semibold hover:bg-brand-dark transition disabled:opacity-50"
                >
                  💵 Record payment
                </button>
              )}
            </div>

            {tab === 'terms' && (
              <div className="space-y-4">
                {terms.length === 0 && <p className="text-sm text-stone text-center py-6">This student is not assigned to any term yet.</p>}
                {terms.map((b: any) => (
                  <div key={b.term.id} className="border border-stone/15 rounded-2xl p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="font-semibold text-brand-dark">{termLabel(b.term)}</div>
                        <div className="text-xs text-stone">Level {b.level}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[b.status] || 'bg-stone/15 text-stone'}`}>{b.status}</span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-xs mb-1">
                      <div><div className="text-stone">Term fee</div><div className="font-medium">{(b.total_fees).toLocaleString()}{b.fee_override != null && <span className="ml-1 text-amber-700" title={b.override_reason || ''}>(fixed)</span>}</div></div>
                      <div><div className="text-stone">Brought forward</div><div className="font-medium">{b.carryover ? b.carryover.toLocaleString() : '—'}</div></div>
                      <div><div className="text-stone">Paid</div><div className="font-medium text-green-700">{(b.amount_paid).toLocaleString()}</div></div>
                      <div><div className="text-stone">Balance</div><div className={`font-semibold ${b.balance > 0 ? 'text-red-600' : 'text-green-700'}`}>{(b.balance).toLocaleString()}</div></div>
                    </div>
                    {b.fee_override != null && b.override_reason && <p className="text-[11px] text-amber-700 mb-1">Fee fixed manually: {b.override_reason}</p>}

                    {b.payments.length > 0 && (
                      <div className="mt-3 border-t border-stone/10 pt-2 space-y-1.5">
                        {b.payments.map((p: any) => (
                          <div key={p.id} className="flex items-center justify-between gap-3 text-xs">
                            <div className="min-w-0">
                              <span className="font-medium text-brand-dark">{money(p.amount)}</span>
                              <span className="text-stone"> · {dateOf(p.paid_at)} · {p.feeType?.name || 'Unallocated'}{p.reference_code ? ` · ${p.reference_code}` : ''}</span>
                              {p.notes && <span className="text-stone italic"> · {p.notes}</span>}
                            </div>
                            {canCorrect && (
                              <div className="flex gap-3 shrink-0">
                                <button onClick={() => open({ type: 'edit', record: p }, { amount: String(p.amount), paid_at: p.paid_at.split('T')[0], notes: p.notes || '', fee_type_id: p.fee_type_id || '', term_id: p.term_id || b.term.id })} className="text-brand hover:underline font-medium">Edit</button>
                                <button onClick={() => open({ type: 'void', record: p })} className="text-red-600 hover:underline font-medium">Void</button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {canCorrect && (
                      <div className="mt-3 pt-2 border-t border-stone/10 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                        <button onClick={() => open({ type: 'override', term: b }, { total_fees: String(b.total_fees) })} className="text-brand hover:underline font-medium">Change this term&apos;s fee</button>
                        {b.fee_override != null && <button onClick={() => clearOverride(b)} className="text-stone hover:underline">Use calculated fee</button>}
                        <button onClick={() => open({ type: 'reassign', term: b })} className="text-brand hover:underline font-medium">Wrong term? Move</button>
                        {b.payment_count === 0 && <button onClick={() => open({ type: 'remove', term: b })} className="text-red-600 hover:underline font-medium">Remove</button>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {tab === 'history' && (
              <div className="space-y-2">
                {history === null && <p className="text-sm text-stone text-center py-6">Loading…</p>}
                {history !== null && history.length === 0 && <p className="text-sm text-stone text-center py-6">No corrections have been made to this student&apos;s fees.</p>}
                {(history || []).map(h => (
                  <div key={h.id} className="border border-stone/15 rounded-xl p-3 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-brand-dark text-sm">{ACTION_LABEL[h.action] || h.action}</span>
                      <span className="text-stone">{dateTimeOf(h.at)} · {h.by || 'system'}</span>
                    </div>
                    <div className="text-stone mt-1">{describeChange(h)}</div>
                    {h.new_values?.reason && <div className="text-stone mt-1 italic">Reason: {h.new_values.reason}</div>}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <button onClick={onClose} className="mt-6 w-full py-2.5 rounded-xl border border-stone/25 text-brand font-semibold hover:bg-stone/5 transition">Close</button>
      </div>

      {/* ── Correction dialogs ── */}
      {dialog && (
        <div className="fixed inset-0 z-[60] bg-brand-dark/50 flex items-center justify-center p-4" onClick={close}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            {dialog.type === 'pay' && (
              <>
                <h3 className="font-display text-lg text-brand-dark mb-4">Record payment</h3>
                <div className="space-y-3">
                  <div>
                    <label className={labelCls}>Term</label>
                    <select value={form.term_id} onChange={e => setForm({ ...form, term_id: e.target.value })} className={inputCls}>
                      {terms.map((b: any) => <option key={b.term.id} value={b.term.id}>{termLabel(b.term, `Balance: KES ${b.balance.toLocaleString()}`)}</option>)}
                    </select>
                  </div>
                  <div><label className={labelCls}>Amount received (KES)</label><input type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className={inputCls} /></div>
                  <div><label className={labelCls}>Notes (optional)</label><input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="e.g. Cash, receipt #1234" className={inputCls} /></div>
                </div>
              </>
            )}
            {dialog.type === 'edit' && (
              <>
                <h3 className="font-display text-lg text-brand-dark mb-4">Correct payment</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={labelCls}>Amount (KES)</label><input type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className={inputCls} /></div>
                    <div><label className={labelCls}>Date paid</label><input type="date" value={form.paid_at} onChange={e => setForm({ ...form, paid_at: e.target.value })} className={inputCls} /></div>
                  </div>
                  <div>
                    <label className={labelCls}>Term</label>
                    <select value={form.term_id} onChange={e => setForm({ ...form, term_id: e.target.value })} className={inputCls}>
                      {terms.map((b: any) => <option key={b.term.id} value={b.term.id}>{termLabel(b.term)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Fee type</label>
                    <select value={form.fee_type_id} onChange={e => setForm({ ...form, fee_type_id: e.target.value })} className={inputCls}>
                      <option value="">Unallocated</option>
                      {feeTypes.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </div>
                  <div><label className={labelCls}>Notes</label><input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={inputCls} /></div>
                  <div><label className={labelCls}>Reason for the correction *</label><input value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="e.g. Receipt shows 6,000, not 5,000" className={inputCls} /></div>
                </div>
              </>
            )}
            {dialog.type === 'void' && (
              <>
                <h3 className="font-display text-lg text-brand-dark mb-1">Void payment</h3>
                <p className="text-sm text-stone mb-4">{money(dialog.record.amount)} paid {dateOf(dialog.record.paid_at)}. It is removed from the student&apos;s fees and kept in the change history.</p>
                <label className={labelCls}>Reason *</label>
                <input value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="e.g. Recorded twice by mistake" className={inputCls} />
              </>
            )}
            {dialog.type === 'override' && (
              <>
                <h3 className="font-display text-lg text-brand-dark mb-1">Change this term&apos;s fee</h3>
                <p className="text-sm text-stone mb-4">{dialog.term.term.name}. This student&apos;s fee is fixed at the amount you enter, whatever the term fee is later changed to.</p>
                <div className="space-y-3">
                  <div><label className={labelCls}>Fee for this term (KES)</label><input type="number" min="0" step="0.01" value={form.total_fees} onChange={e => setForm({ ...form, total_fees: e.target.value })} className={inputCls} /></div>
                  <div><label className={labelCls}>Reason *</label><input value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="e.g. Bursary agreed" className={inputCls} /></div>
                </div>
              </>
            )}
            {dialog.type === 'reassign' && (
              <>
                <h3 className="font-display text-lg text-brand-dark mb-1">Move to the correct term</h3>
                <p className="text-sm text-stone mb-4">Currently <strong>{dialog.term.term.name}</strong>. Payments move with it and every figure after it is recalculated.</p>
                <div className="space-y-3">
                  <div>
                    <label className={labelCls}>Correct term</label>
                    <select value={form.to_term_id || ''} onChange={e => setForm({ ...form, to_term_id: e.target.value })} className={inputCls}>
                      <option value="">Select a term…</option>
                      {freeTerms.map(t => <option key={t.id} value={t.id}>{termLabel(t)}</option>)}
                    </select>
                    {freeTerms.length === 0 && <p className="text-xs text-stone mt-1">The student is already in every term.</p>}
                  </div>
                  <div><label className={labelCls}>Reason (optional)</label><input value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} className={inputCls} /></div>
                </div>
              </>
            )}
            {dialog.type === 'remove' && (
              <>
                <h3 className="font-display text-lg text-brand-dark mb-1">Remove {dialog.term.term.name}?</h3>
                <p className="text-sm text-stone mb-4">The student was assigned to this term by mistake and nothing was paid against it. The assignment and its fee are removed.</p>
                <label className={labelCls}>Reason (optional)</label>
                <input value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} className={inputCls} />
              </>
            )}
            <div className="mt-5 flex gap-3">
              <button onClick={submitDialog} disabled={saving} className={`flex-1 py-2.5 rounded-xl font-semibold transition disabled:opacity-50 ${dialog.type === 'void' || dialog.type === 'remove' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-brand text-cream hover:bg-brand-dark'}`}>
                {saving ? 'Saving…' : dialog.type === 'pay' ? 'Record payment' : dialog.type === 'void' ? 'Void payment' : dialog.type === 'remove' ? 'Remove term' : dialog.type === 'reassign' ? 'Move' : 'Save'}
              </button>
              <button onClick={close} disabled={saving} className="px-5 py-2.5 rounded-xl border border-stone/25 text-brand font-semibold hover:bg-stone/5 transition">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
