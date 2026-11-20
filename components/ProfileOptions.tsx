'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '@/lib/api';
import { toast } from 'sonner';

// The interests and sports lists students choose from. The admin keeps them here; a student's own choices
// follow a rename, and an option students have chosen is switched off rather than deleted.

type Opt = { id: string; kind: string; name: string; is_active: boolean; students: number };

function List({ title, icon, kind, items, reload }: { title: string; icon: string; kind: 'SPORT' | 'INTEREST'; items: Opt[]; reload: () => void }) {
  const [name, setName] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const call = async (fn: () => Promise<any>, ok?: string) => {
    try { await fn(); if (ok) toast.success(ok); reload(); }
    catch (e: any) { toast.error(e?.response?.data?.error || 'That could not be saved'); }
  };
  return (
    <div className="bg-white rounded-2xl border border-stone/10 shadow-sm p-5">
      <h2 className="font-display text-lg text-brand-dark mb-3">{icon} {title}</h2>
      <form onSubmit={e => { e.preventDefault(); if (!name.trim()) return; call(() => api.post('/profile-options', { kind, name }), 'Added').then(() => setName('')); }} className="flex gap-2 mb-4">
        <input value={name} onChange={e => setName(e.target.value)} placeholder={`Add ${kind === 'SPORT' ? 'a sport' : 'an interest'}…`} className="flex-1 px-3 py-2 rounded-xl border border-stone/25 text-sm focus:outline-none focus:border-brand" />
        <button className="px-4 py-2 rounded-xl bg-brand text-cream text-sm font-semibold hover:bg-brand-dark transition">Add</button>
      </form>
      {items.length === 0 ? <p className="text-sm text-stone">None yet.</p> : (
        <ul className="divide-y divide-stone/10">
          {items.map(o => (
            <li key={o.id} className="py-2.5 flex items-center gap-3 text-sm">
              {editing === o.id ? (
                <form className="flex-1 flex gap-2" onSubmit={e => { e.preventDefault(); call(() => api.patch(`/profile-options/${o.id}`, { name: draft }), 'Renamed').then(() => setEditing(null)); }}>
                  <input autoFocus value={draft} onChange={e => setDraft(e.target.value)} className="flex-1 px-3 py-1.5 rounded-lg border border-stone/25 text-sm focus:outline-none focus:border-brand" />
                  <button className="text-xs font-semibold text-brand">Save</button>
                  <button type="button" onClick={() => setEditing(null)} className="text-xs text-stone">Cancel</button>
                </form>
              ) : (
                <>
                  <span className={`flex-1 ${o.is_active ? 'text-brand-dark' : 'text-stone line-through'}`}>{o.name}{!o.is_active && <span className="ml-2 text-[10px] no-underline px-1.5 py-0.5 rounded-full bg-stone/15 text-stone">Switched off</span>}</span>
                  <span className="text-xs text-stone tabular-nums">{o.students} student{o.students === 1 ? '' : 's'}</span>
                  <button onClick={() => { setEditing(o.id); setDraft(o.name); }} className="text-xs font-semibold text-brand hover:underline">Rename</button>
                  <button onClick={() => call(() => api.patch(`/profile-options/${o.id}`, { is_active: !o.is_active }))} className="text-xs font-semibold text-amber-700 hover:underline">{o.is_active ? 'Switch off' : 'Switch on'}</button>
                  <button onClick={() => toast(`Remove ${o.name}?`, { action: { label: 'Remove', onClick: () => call(() => api.delete(`/profile-options/${o.id}`), 'Removed') }, cancel: { label: 'Cancel', onClick: () => { } } })} className="text-xs font-semibold text-red-600 hover:underline">Remove</button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ProfileOptionsAdmin() {
  const [data, setData] = useState<{ interests: Opt[]; sports: Opt[] } | null>(null);
  const reload = () => api.get('/profile-options', { params: { all: 1 } }).then(r => setData(r.data)).catch(() => toast.error('Could not load the lists'));
  useEffect(() => { reload(); }, []);
  const empty = data && data.interests.length + data.sports.length === 0;
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <h1 className="font-display text-2xl text-brand-dark">Interests &amp; Sports</h1>
          <p className="text-sm text-stone">The lists students choose from on their profile. Renaming an item updates every student who chose it. An item students have chosen can be switched off (so nobody new picks it) but not removed.</p>
        </div>
        <button onClick={async () => { try { const r = await api.post('/profile-options/defaults'); toast.success(r.data.message); reload(); } catch { toast.error('Could not add them'); } }} className="px-4 py-2 rounded-xl border border-brand/40 text-brand text-sm font-semibold hover:bg-brand/5 transition">＋ Add the usual ones</button>
      </div>
      {empty && <div className="mb-5 rounded-xl border border-gold/50 bg-gold/10 px-4 py-3 text-sm text-brand-dark">Both lists are empty, so students have nothing to choose from yet. Use <strong>Add the usual ones</strong> to start with common sports and interests, then change them as you like.</div>}
      {data && (
        <div className="grid md:grid-cols-2 gap-5">
          <List title="Sports" icon="⚽" kind="SPORT" items={data.sports} reload={reload} />
          <List title="Interests" icon="⭐" kind="INTEREST" items={data.interests} reload={reload} />
        </div>
      )}
    </div>
  );
}

// One student's interests and sports, set by the admin or registrar
export function StudentChoicesModal({ student, onClose, onSaved }: { student: any; onClose: () => void; onSaved?: () => void }) {
  const [options, setOptions] = useState<{ interests: string[]; sports: string[] }>({ interests: [], sports: [] });
  const [interests, setInterests] = useState<string[]>(student.interests || []);
  const [sports, setSports] = useState<string[]>(student.sports || []);
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); api.get('/profile-options').then(r => setOptions(r.data)).catch(() => { }); }, []);
  const toggle = (list: string[], set: (v: string[]) => void, n: string) => set(list.includes(n) ? list.filter(x => x !== n) : [...list, n]);
  const save = async () => {
    setSaving(true);
    try { await api.patch(`/students/${student.id}/interests`, { interests, sports }); toast.success('Saved'); onSaved?.(); onClose(); }
    catch (e: any) { toast.error(e?.response?.data?.error || 'Could not save'); }
    finally { setSaving(false); }
  };
  if (!mounted) return null;
  const name = `${student.application?.surname || ''} ${student.application?.other_names || ''}`.trim();
  return createPortal(
    <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 py-8 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-xl shadow-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="font-display text-xl text-brand-dark">Interests &amp; sports</h2>
        <p className="text-sm text-stone mb-4">{student.admission_no} · {name}</p>
        {([['Sports', options.sports, sports, setSports], ['Interests', options.interests, interests, setInterests]] as const).map(([label, opts, chosen, setChosen]) => (
          <div key={label} className="mb-4">
            <div className="text-xs font-semibold text-brand-dark mb-2">{label}</div>
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set([...opts, ...chosen])).map(n => (
                <button key={n} type="button" onClick={() => toggle(chosen as string[], setChosen as any, n)} aria-pressed={chosen.includes(n)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${chosen.includes(n) ? 'bg-brand text-cream border-brand' : 'bg-white text-brand-dark border-stone/25 hover:border-brand'}`}>{n}</button>
              ))}
              {opts.length === 0 && chosen.length === 0 && <span className="text-xs text-stone">Nothing in this list yet. Add some under Interests &amp; Sports.</span>}
            </div>
          </div>
        ))}
        <div className="flex gap-3 mt-2">
          <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-brand text-cream font-semibold hover:bg-brand-dark transition disabled:opacity-60">{saving ? 'Saving…' : 'Save'}</button>
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl border border-stone/25 text-brand font-semibold hover:bg-stone/5 transition">Cancel</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
