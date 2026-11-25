'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '@/lib/api';
import { toast } from 'sonner';

// Kinds of student (Direct, KUCCPS, ...): who has which, the term fee each kind pays, which fee types apply to
// which kind, and moving students between kinds. Every change to a fee is previewed first: nothing is saved
// until the person has seen who is affected and by how much.

type StType = { id: string; name: string; description?: string | null; is_default: boolean; is_active: boolean; students: number };
type Impact = { students_changed: number; rows_changed: number; fees_before?: number; fees_after?: number; fees_change?: number; outstanding_change?: number; items: any[] };

const kes = (n: number) => `KES ${Math.round(n || 0).toLocaleString()}`;
const signed = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${kes(Math.abs(n))}`;
const errOf = (e: any, fallback: string) => e?.response?.data?.error || fallback;

// The result of a preview, and the button that makes it real
function ImpactDialog({ title, intro, impact, extra, working, onApply, onClose }: { title: string; intro: string; impact: Impact; extra?: string; working: boolean; onApply: () => void; onClose: () => void }) {
  if (typeof document === 'undefined') return null;
  const none = impact.students_changed === 0;
  return createPortal(
    <div className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-6 pt-5 pb-3 border-b border-stone/10">
          <h3 className="font-display text-lg text-brand-dark">{title}</h3>
          <p className="text-sm text-stone mt-1">{intro}</p>
        </div>
        <div className="px-6 py-4 overflow-y-auto space-y-4">
          <div className="rounded-xl bg-cream-deep px-4 py-3 text-sm">
            {none ? <strong className="text-brand-dark">No student&apos;s fees change.</strong> : (
              <ul className="space-y-1 text-brand-dark">
                <li><strong>{impact.students_changed}</strong> student{impact.students_changed === 1 ? '' : 's'} affected ({impact.rows_changed} term bill{impact.rows_changed === 1 ? '' : 's'})</li>
                {impact.fees_change !== undefined && <li>Fees billed: {kes(impact.fees_before || 0)} → {kes(impact.fees_after || 0)} (<strong>{signed(impact.fees_change)}</strong>)</li>}
                {impact.outstanding_change !== undefined && <li>Amount still owed changes by <strong>{signed(impact.outstanding_change)}</strong></li>}
              </ul>
            )}
            {extra && <p className="mt-2 text-xs text-stone">{extra}</p>}
          </div>
          {impact.items.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-stone uppercase tracking-wider mb-1">Examples{impact.students_changed > impact.items.length ? ` (first ${impact.items.length})` : ''}</p>
              <ul className="divide-y divide-stone/10 text-sm border border-stone/10 rounded-xl">
                {impact.items.slice(0, 8).map((it: any) => (
                  <li key={it.student_id} className="px-3 py-2">
                    <span className="font-semibold text-brand-dark">{it.admission_no}</span>
                    {it.rows.slice(0, 3).map((r: any, i: number) => (
                      <span key={i} className="block text-xs text-stone">{r.term} {r.academic_year}: {kes(r.before.total_fees)} → {kes(r.after.total_fees)}</span>
                    ))}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-stone/10 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-stone/25 text-sm text-stone hover:bg-cream-deep">Cancel</button>
          <button disabled={working} onClick={onApply} className="px-5 py-2 rounded-xl bg-brand text-cream text-sm font-semibold hover:bg-brand-dark disabled:opacity-50">{working ? 'Saving…' : none ? 'Save' : 'Save and update fees'}</button>
        </div>
      </div>
    </div>, document.body);
}

type Pending = { title: string; intro: string; impact: Impact; extra?: string; apply: () => Promise<any> };

// Move the students ticked in a list to a student type, from a term onward, with the effect shown first.
export function BulkTypeModal({ studentIds, onClose, onDone }: { studentIds: string[]; onClose: () => void; onDone?: () => void }) {
  const [types, setTypes] = useState<StType[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [typeId, setTypeId] = useState('');
  const [termId, setTermId] = useState('');
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<{ impact: Impact; extra?: string; target: string } | null>(null);
  useEffect(() => {
    api.get('/student-types').then(r => setTypes((r.data.types || []).filter((t: StType) => t.is_active))).catch(() => toast.error('Could not load the student types'));
    api.get('/terms').then(r => { const l = r.data.terms || r.data; setTerms(Array.isArray(l) ? l : []); }).catch(() => { });
  }, []);
  const call = (apply: boolean) => api.post('/student-types/assign', { student_ids: studentIds, student_type_id: typeId, from_term_id: termId || undefined, apply });
  const showPreview = async () => {
    setBusy(true);
    try {
      const r = await call(false);
      setPending({ impact: r.data.impact, target: types.find(t => t.id === typeId)?.name || '', extra: r.data.from_term ? `Applies from ${r.data.from_term.name} ${r.data.from_term.academic_year} onward. Earlier terms stay as they were billed.` : undefined });
    } catch (e: any) { toast.error(errOf(e, 'Could not work out the effect')); }
    finally { setBusy(false); }
  };
  const apply = async () => {
    setBusy(true);
    try { await call(true); toast.success(`${studentIds.length} student${studentIds.length === 1 ? '' : 's'} moved to ${pending?.target}`); onDone?.(); onClose(); }
    catch (e: any) { toast.error(errOf(e, 'That could not be saved')); }
    finally { setBusy(false); }
  };
  if (typeof document === 'undefined') return null;
  if (pending) return <ImpactDialog title={`Move ${studentIds.length} student${studentIds.length === 1 ? '' : 's'} to ${pending.target}`} intro="This is what will change. Nothing is saved until you confirm." impact={pending.impact} extra={pending.extra} working={busy} onApply={apply} onClose={() => setPending(null)} />;
  return createPortal(
    <div className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="px-6 pt-5 pb-3 border-b border-stone/10"><h3 className="font-display text-lg text-brand-dark">Change student type</h3><p className="text-sm text-stone mt-1">For the {studentIds.length} student{studentIds.length === 1 ? '' : 's'} you ticked.</p></div>
        <div className="px-6 py-4 space-y-3 text-sm">
          <label className="block"><span className="text-xs text-stone">Move to type</span>
            <select value={typeId} onChange={e => setTypeId(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl border border-stone/25"><option value="">Choose…</option>{types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
          <label className="block"><span className="text-xs text-stone">Starting from term</span>
            <select value={termId} onChange={e => setTermId(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl border border-stone/25"><option value="">The current term</option>{terms.map((t: any) => <option key={t.id} value={t.id}>{t.name} {t.academic_year}</option>)}</select></label>
          <p className="text-xs text-stone">Terms before that stay billed as they were.</p>
        </div>
        <div className="px-6 py-4 border-t border-stone/10 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-stone/25 text-sm text-stone hover:bg-cream-deep">Cancel</button>
          <button disabled={!typeId || busy} onClick={showPreview} className="px-5 py-2 rounded-xl bg-brand text-cream text-sm font-semibold hover:bg-brand-dark disabled:opacity-50">{busy ? 'Working…' : 'Preview'}</button>
        </div>
      </div>
    </div>, document.body);
}

export default function StudentTypes({ canSetFees = true }: { canSetFees?: boolean }) {
  const [types, setTypes] = useState<StType[] | null>(null);
  const [total, setTotal] = useState(0);
  const [grid, setGrid] = useState<any>(null);
  const [name, setName] = useState('');
  const [setup, setSetup] = useState<any>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [working, setWorking] = useState(false);
  const [courses, setCourses] = useState<any[]>([]);
  const [edit, setEdit] = useState<{ term: string; type: string; value: string } | null>(null);
  const [ruleEdit, setRuleEdit] = useState<{ id: string; all: boolean; picks: Record<string, string | null> } | null>(null);
  const [asg, setAsg] = useState({ type: '', term: '', course_id: '', level: '', from_type: '', search: '' });

  const load = async () => {
    try {
      const r = await api.get('/student-types');
      setTypes(r.data.types); setTotal(r.data.students_total);
      if (canSetFees && r.data.types.length) api.get('/student-types/fees').then(g => setGrid(g.data)).catch(() => { });
    } catch { toast.error('Could not load the student types'); }
  };
  useEffect(() => { load(); api.get('/courses').then(r => { const c = r.data?.courses || r.data; setCourses(Array.isArray(c) ? c : []); }).catch(() => { }); /* eslint-disable-next-line */ }, []);

  const run = async (fn: () => Promise<any>, ok?: string) => {
    try { const r = await fn(); if (ok) toast.success(r?.data?.message || ok); await load(); return true; }
    catch (e: any) { toast.error(errOf(e, 'That could not be saved')); return false; }
  };

  // Ask the server what a change would do (nothing is saved), then show it
  const preview = async (call: (apply: boolean) => Promise<any>, title: string, intro: string, after?: () => void) => {
    try {
      const r = await call(false);
      setPending({
        title, intro, impact: r.data.impact, extra: r.data.from_term ? `Applies from ${r.data.from_term.name} ${r.data.from_term.academic_year} onward. Earlier terms stay as they were billed.` : undefined,
        apply: async () => { const d = await call(true); after?.(); return d; },
      });
    } catch (e: any) { toast.error(errOf(e, 'Could not work out the effect')); }
  };
  const confirm = async () => {
    if (!pending) return;
    setWorking(true);
    try { const r = await pending.apply(); toast.success(r?.data?.message || 'Saved'); setPending(null); await load(); }
    catch (e: any) { toast.error(errOf(e, 'That could not be saved')); }
    finally { setWorking(false); }
  };

  const doSetup = async (apply: boolean) => {
    try {
      const r = await api.post('/student-types/setup', { apply });
      if (!apply) setSetup(r.data); else { setSetup(null); toast.success(r.data.message); load(); }
    } catch (e: any) { toast.error(errOf(e, 'Could not set up')); }
  };

  const nonDefault = (types || []).filter(t => t.is_active && !t.is_default);
  const activeTypes = (types || []).filter(t => t.is_active);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl text-brand-dark">Student types</h1>
        <p className="text-sm text-stone">Different kinds of student (for example Direct and KUCCPS) can pay different fees in the same term. The <strong>default</strong> type pays the term&apos;s own fee; other types can have their own term fee, and a fee type can be limited to certain types. Fee types still decide <em>once</em> or <em>every term</em>. Nothing changes until you set a fee, and every change is previewed first.</p>
      </div>

      {types && types.length === 0 && (
        <div className="rounded-2xl border border-gold/50 bg-gold/10 p-5">
          <p className="text-sm text-brand-dark mb-3">No student types yet, so every student pays the same term fee as before. You can start with <strong>Direct</strong> (the default) and <strong>KUCCPS</strong>, giving each of your {total} student{total === 1 ? '' : 's'} the one that matches how they applied. This changes no fee.</p>
          {setup ? (
            <div className="text-sm text-brand-dark">
              <p className="mb-2">This will make {setup.create.join(' and ') || 'no new types'}, set <strong>{setup.will_kuccps ?? setup.will_be_kuccps}</strong> student(s) as KUCCPS and <strong>{setup.will_be_direct}</strong> as Direct.</p>
              <button onClick={() => doSetup(true)} className="px-4 py-2 rounded-xl bg-brand text-cream text-sm font-semibold hover:bg-brand-dark mr-2">Do it</button>
              <button onClick={() => setSetup(null)} className="px-4 py-2 rounded-xl border border-stone/25 text-sm text-stone">Cancel</button>
            </div>
          ) : <button onClick={() => doSetup(false)} className="px-4 py-2 rounded-xl bg-brand text-cream text-sm font-semibold hover:bg-brand-dark">Start with Direct and KUCCPS…</button>}
        </div>
      )}

      {/* The types */}
      <section className="bg-white rounded-2xl border border-stone/10 shadow-sm p-5">
        <h2 className="font-display text-lg text-brand-dark mb-3">Types</h2>
        {canSetFees && (
          <form onSubmit={e => { e.preventDefault(); if (!name.trim()) return; run(() => api.post('/student-types', { name }), 'Added').then(ok => ok && setName('')); }} className="flex gap-2 mb-4">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Add a type (e.g. Sponsored, Bursary, Evening)…" className="flex-1 px-3 py-2 rounded-xl border border-stone/25 text-sm focus:outline-none focus:border-brand" />
            <button className="px-4 py-2 rounded-xl bg-brand text-cream text-sm font-semibold hover:bg-brand-dark transition">Add</button>
          </form>
        )}
        {!types ? <p className="text-sm text-stone">Loading…</p> : types.length === 0 ? <p className="text-sm text-stone">None yet.</p> : (
          <ul className="divide-y divide-stone/10">
            {types.map(t => (
              <li key={t.id} className="py-2.5 flex flex-wrap items-center gap-3 text-sm">
                <span className={`font-semibold ${t.is_active ? 'text-brand-dark' : 'text-stone line-through'}`}>{t.name}</span>
                {t.is_default && <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand/10 text-brand font-semibold">Default</span>}
                {!t.is_active && <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone/15 text-stone">Switched off</span>}
                <span className="flex-1 text-xs text-stone">{t.description}</span>
                <span className="text-xs text-stone tabular-nums">{t.students} student{t.students === 1 ? '' : 's'}</span>
                {canSetFees && <>
                  <button onClick={() => { const n = window.prompt('Rename', t.name); if (n && n.trim() && n !== t.name) run(() => api.patch(`/student-types/${t.id}`, { name: n }), 'Renamed'); }} className="text-xs font-semibold text-brand hover:underline">Rename</button>
                  {!t.is_default && t.is_active && <button onClick={() => run(() => api.post(`/student-types/${t.id}/default`), 'Done')} className="text-xs font-semibold text-brand hover:underline">Make default</button>}
                  {!t.is_default && <button onClick={() => run(() => api.patch(`/student-types/${t.id}`, { is_active: !t.is_active }))} className="text-xs font-semibold text-amber-700 hover:underline">{t.is_active ? 'Switch off' : 'Switch on'}</button>}
                  {!t.is_default && <button onClick={() => toast(`Remove ${t.name}?`, { action: { label: 'Remove', onClick: () => run(() => api.delete(`/student-types/${t.id}`), 'Removed') }, cancel: { label: 'Cancel', onClick: () => { } } })} className="text-xs font-semibold text-red-600 hover:underline">Remove</button>}
                </>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Term fee per type */}
      {canSetFees && grid && nonDefault.length > 0 && (
        <section>
          <h2 className="font-display text-lg text-brand-dark mb-1">Term fee for each type</h2>
          <p className="text-sm text-stone mb-3">The default type pays the term&apos;s own fee (change that under Terms). For another type, set its fee for a term; leave it empty and that type pays the term&apos;s fee. You see who is affected before anything is saved.</p>
          <div className="bg-white rounded-2xl border border-stone/10 shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream-deep text-stone text-xs uppercase tracking-wider">
                <tr><th className="px-4 py-3 text-left">Term</th><th className="px-4 py-3 text-right">{activeTypes.find(t => t.is_default)?.name || 'Default'} (term fee)</th>{nonDefault.map(t => <th key={t.id} className="px-4 py-3 text-right">{t.name}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-stone/10">
                {grid.terms.map((term: any) => (
                  <tr key={term.id}>
                    <td className="px-4 py-2.5"><span className="font-semibold text-brand-dark">{term.name}</span> <span className="text-xs text-stone">{term.academic_year}</span></td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{kes(term.standard_fee)}</td>
                    {nonDefault.map(t => {
                      const v = term.fees[t.id];
                      const editing = edit && edit.term === term.id && edit.type === t.id;
                      return (
                        <td key={t.id} className="px-4 py-2 text-right">
                          {editing ? (
                            <form className="inline-flex gap-1 items-center" onSubmit={e => {
                              e.preventDefault();
                              const amount = edit!.value.trim() === '' ? null : Number(edit!.value);
                              const call = (apply: boolean) => api.put('/student-types/term-fees', { term_id: term.id, student_type_id: t.id, amount, apply });
                              preview(call, `${t.name}: ${term.name} ${term.academic_year}`, amount === null ? `${t.name} students will pay the term's own fee (${kes(term.standard_fee)}).` : `${t.name} students will pay ${kes(amount)} for this term.`, () => setEdit(null));
                            }}>
                              <input autoFocus inputMode="decimal" value={edit!.value} onChange={e => setEdit({ ...edit!, value: e.target.value })} placeholder="same as term" className="w-28 px-2 py-1 rounded-lg border border-stone/25 text-sm text-right focus:outline-none focus:border-brand" />
                              <button className="text-xs font-semibold text-brand px-1">Preview</button>
                              <button type="button" onClick={() => setEdit(null)} className="text-xs text-stone px-1">✕</button>
                            </form>
                          ) : (
                            <button onClick={() => setEdit({ term: term.id, type: t.id, value: v != null ? String(v) : '' })} className="tabular-nums hover:underline">
                              {v != null ? <strong className="text-brand-dark">{kes(v)}</strong> : <span className="text-stone">same as term</span>}
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Fee types per type */}
      {canSetFees && grid && grid.types.length > 0 && (
        <section>
          <h2 className="font-display text-lg text-brand-dark mb-1">Fee types and who pays them</h2>
          <p className="text-sm text-stone mb-3">By default a fee type applies to every student. Limit it to certain types (for example a KUCCPS fee only for KUCCPS students), and give a type a different amount if it differs. Whether a fee is charged once or every term stays on the fee type.</p>
          <div className="bg-white rounded-2xl border border-stone/10 shadow-sm divide-y divide-stone/10">
            {grid.fee_types.map((f: any) => {
              const editing = ruleEdit && ruleEdit.id === f.id;
              const label = f.billing === 'EVERY_TERM' ? 'Every term' : f.billing === 'ONCE' ? 'Once' : f.billing === 'PER_STUDENT' ? 'Set per student' : 'Not billed';
              return (
                <div key={f.id} className="px-5 py-3 text-sm">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-semibold text-brand-dark">{f.name}</span>
                    <span className="text-xs text-stone">{kes(f.amount)} · {label}</span>
                    <span className="flex-1 text-xs text-stone">
                      {f.rules ? `Only: ${Object.entries(f.rules).map(([tid, amt]: any) => `${grid.types.find((t: any) => t.id === tid)?.name || '?'}${amt != null ? ` (${kes(amt)})` : ''}`).join(', ')}` : 'All students'}
                    </span>
                    {!editing && <button onClick={() => setRuleEdit({ id: f.id, all: !f.rules, picks: f.rules ? { ...f.rules } : {} })} className="text-xs font-semibold text-brand hover:underline">Change</button>}
                  </div>
                  {editing && (
                    <div className="mt-3 rounded-xl bg-cream-deep p-4 space-y-2">
                      <label className="flex items-center gap-2"><input type="radio" checked={ruleEdit!.all} onChange={() => setRuleEdit({ ...ruleEdit!, all: true })} /> All students</label>
                      <label className="flex items-center gap-2"><input type="radio" checked={!ruleEdit!.all} onChange={() => setRuleEdit({ ...ruleEdit!, all: false })} /> Only these types</label>
                      {!ruleEdit!.all && (
                        <div className="pl-6 space-y-1.5">
                          {grid.types.filter((t: any) => t.is_active).map((t: any) => {
                            const on = t.id in ruleEdit!.picks;
                            return (
                              <div key={t.id} className="flex items-center gap-3">
                                <label className="flex items-center gap-2 w-40"><input type="checkbox" checked={on} onChange={e => { const p = { ...ruleEdit!.picks }; if (e.target.checked) p[t.id] = null; else delete p[t.id]; setRuleEdit({ ...ruleEdit!, picks: p }); }} />{t.name}</label>
                                {on && <input inputMode="decimal" placeholder={`same (${kes(f.amount)})`} value={ruleEdit!.picks[t.id] ?? ''} onChange={e => setRuleEdit({ ...ruleEdit!, picks: { ...ruleEdit!.picks, [t.id]: e.target.value === '' ? null : e.target.value } })} className="w-36 px-2 py-1 rounded-lg border border-stone/25 text-sm focus:outline-none focus:border-brand" />}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <div className="pt-2 flex gap-2">
                        <button onClick={() => {
                          const rules = ruleEdit!.all ? null : Object.entries(ruleEdit!.picks).map(([student_type_id, amount]) => ({ student_type_id, amount }));
                          if (rules && rules.length === 0) { toast.error('Choose at least one type, or pick All students'); return; }
                          const call = (apply: boolean) => api.put('/student-types/fee-type-rules', { fee_type_id: f.id, rules, apply });
                          preview(call, f.name, ruleEdit!.all ? 'This fee type will apply to all students.' : 'This fee type will apply only to the types you chose.', () => setRuleEdit(null));
                        }} className="px-4 py-1.5 rounded-xl bg-brand text-cream text-xs font-semibold hover:bg-brand-dark">Preview</button>
                        <button onClick={() => setRuleEdit(null)} className="px-4 py-1.5 rounded-xl border border-stone/25 text-xs text-stone">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {grid.fee_types.length === 0 && <p className="px-5 py-4 text-sm text-stone">No fee types yet.</p>}
          </div>
        </section>
      )}

      {/* Move students between types */}
      {types && types.length > 0 && (
        <section className="bg-white rounded-2xl border border-stone/10 shadow-sm p-5">
          <h2 className="font-display text-lg text-brand-dark mb-1">Move students to a type</h2>
          <p className="text-sm text-stone mb-4">Choose the students, the type, and the term it starts from. Terms before that stay as they were billed. You see the effect before it is saved.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
            <label className="block"><span className="text-xs text-stone">Move to type</span>
              <select value={asg.type} onChange={e => setAsg({ ...asg, type: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-xl border border-stone/25"><option value="">Choose…</option>{activeTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
            <label className="block"><span className="text-xs text-stone">Starting from term</span>
              <select value={asg.term} onChange={e => setAsg({ ...asg, term: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-xl border border-stone/25"><option value="">The current term</option>{(grid?.terms || []).map((t: any) => <option key={t.id} value={t.id}>{t.name} {t.academic_year}</option>)}</select></label>
            <label className="block"><span className="text-xs text-stone">Currently of type</span>
              <select value={asg.from_type} onChange={e => setAsg({ ...asg, from_type: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-xl border border-stone/25"><option value="">Any</option>{types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
            <label className="block"><span className="text-xs text-stone">Course</span>
              <select value={asg.course_id} onChange={e => setAsg({ ...asg, course_id: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-xl border border-stone/25"><option value="">Any</option>{courses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
            <label className="block"><span className="text-xs text-stone">Level</span>
              <input value={asg.level} onChange={e => setAsg({ ...asg, level: e.target.value })} placeholder="e.g. Level 5 (exact, or empty for any)" className="mt-1 w-full px-3 py-2 rounded-xl border border-stone/25" /></label>
            <label className="block"><span className="text-xs text-stone">Admission no. or name</span>
              <input value={asg.search} onChange={e => setAsg({ ...asg, search: e.target.value })} placeholder="to move one student" className="mt-1 w-full px-3 py-2 rounded-xl border border-stone/25" /></label>
          </div>
          <button disabled={!asg.type} onClick={() => {
            const filters: any = {};
            if (asg.course_id) filters.course_id = asg.course_id;
            if (asg.level.trim()) filters.level = asg.level.trim();
            if (asg.from_type) filters.student_type_id = asg.from_type;
            if (asg.search.trim()) filters.search = asg.search.trim();
            if (!Object.keys(filters).length && !window.confirm('No filter chosen: this moves EVERY student. Continue to the preview?')) return;
            const target = types.find(t => t.id === asg.type)?.name;
            const call = (apply: boolean) => api.post('/student-types/assign', { filters, student_type_id: asg.type, from_term_id: asg.term || undefined, apply });
            preview(call, `Move students to ${target}`, 'The students matching your choices will become this type.');
          }} className="mt-4 px-5 py-2 rounded-xl bg-brand text-cream text-sm font-semibold hover:bg-brand-dark disabled:opacity-50">Preview the move</button>
        </section>
      )}

      {pending && <ImpactDialog title={pending.title} intro={pending.intro} impact={pending.impact} extra={pending.extra} working={working} onApply={confirm} onClose={() => setPending(null)} />}
    </div>
  );
}
