'use client';
import { useEffect, useMemo, useState } from 'react';
import { assetsApi } from '@/lib/services';
import { Shell } from '@/components/AssetDialogs';
import { toast } from 'sonner';

// The list of asset items the college buys and tags (Computer monitor, Office chair...), like Inventory is for
// consumables: an item is added once, then picked on requisitions and used when registering assets.

const input = 'w-full px-3 py-2.5 rounded-xl border border-stone/25 bg-white text-sm focus:outline-none focus:border-brand';
const label = 'block text-xs font-semibold text-brand-dark mb-1';

export function AssetItemDialog({ item, prefill, options, onClose, onSaved }: { item?: any; prefill?: any; options: any; onClose: () => void; onSaved: () => void }) {
  const editing = Boolean(item?.id);
  const src = item || prefill || {};
  const [f, setF] = useState<any>({
    asset_class: src.asset_class || 'ICT',
    name: src.name || '',
    // setting up a register-only item fixes the series the register already uses for it
    tag_prefix: prefill ? (src.tag_series || '') : (src.tag_prefix || ''),
    depreciation_rate: src.depreciation_rate ?? '',
    description: src.description || '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: any) => setF((x: any) => ({ ...x, [k]: v }));

  const save = async () => {
    if (!f.name.trim()) { toast.warning('Give the asset item a name'); return; }
    setSaving(true);
    try {
      const body: any = { ...f, depreciation_rate: f.depreciation_rate === '' ? null : f.depreciation_rate };
      if (editing) { delete body.asset_class; await assetsApi.updateType(item.id, body); }
      else await assetsApi.createType(body);
      toast.success(editing ? 'Saved' : 'Added to the list');
      onSaved(); onClose();
    } catch (e: any) { toast.error(e?.response?.data?.error || 'Could not save'); }
    finally { setSaving(false); }
  };

  return (
    <Shell title={editing ? `Edit ${item.name}` : prefill ? `Set up ${prefill.name}` : 'Add an asset item'} onClose={onClose}
      subtitle={prefill ? `${prefill.count} already in the register. Setting it up lets requisitions pick it and gives it a tag series and rate.` : 'Add the item once. Requisitions pick it from the list, and the register uses it for tag numbers and depreciation.'}>
      <div className="grid sm:grid-cols-2 gap-4 mt-2">
        <div>
          <label className={label}>Type of asset *</label>
          <select value={f.asset_class} onChange={e => set('asset_class', e.target.value)} disabled={editing || Boolean(prefill)} className={input}>
            {(options?.classes || []).map((c: any) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>Item name *</label>
          <input value={f.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Computer monitor" className={input} />
        </div>
        <div>
          <label className={label}>Tag series <span className="font-normal text-stone">(optional)</span></label>
          <input value={f.tag_prefix} onChange={e => set('tag_prefix', e.target.value)} placeholder={item?.tag_series || 'e.g. NHTVC/ICT/CMT/'} className={`${input} font-mono`} />
          <p className="text-[11px] text-stone mt-1">The tag starts with this and then the next number. Empty keeps the series already in use, or makes a new one.</p>
        </div>
        <div>
          <label className={label}>Depreciation rate (% a year) <span className="font-normal text-stone">(optional)</span></label>
          <input type="number" min={0} max={100} value={f.depreciation_rate} onChange={e => set('depreciation_rate', e.target.value)} className={input} />
          <p className="text-[11px] text-stone mt-1">Used for new assets of this item that have no rate of their own.</p>
        </div>
        <div className="sm:col-span-2">
          <label className={label}>Description</label>
          <input value={f.description} onChange={e => set('description', e.target.value)} className={input} />
        </div>
      </div>
      <div className="flex gap-3 mt-5">
        <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-brand text-cream font-semibold hover:bg-brand-dark transition disabled:opacity-60">{saving ? 'Saving…' : editing ? 'Save' : prefill ? 'Add to the list' : 'Add asset item'}</button>
        <button onClick={onClose} className="px-5 py-2.5 rounded-xl border border-stone/25 text-brand font-semibold hover:bg-stone/5 transition">Cancel</button>
      </div>
    </Shell>
  );
}

export default function AssetItems({ options, onRegister, onChanged }: { options: any; onRegister: (item: any) => void; onChanged: () => void }) {
  const [data, setData] = useState<any>(null);
  const [cls, setCls] = useState('');
  const [search, setSearch] = useState('');
  const [dialog, setDialog] = useState<null | { item?: any; prefill?: any }>(null);

  const load = () => assetsApi.types().then(r => setData(r.data)).catch(() => { setData({ types: [], not_in_list: 0 }); toast.error('Could not load the asset items'); });
  useEffect(() => { load(); }, []);

  const rows: any[] = useMemo(() => (data?.types || []).filter((t: any) =>
    (!cls || t.asset_class === cls) && (!search || t.name.toLowerCase().includes(search.toLowerCase()))), [data, cls, search]);

  const remove = (t: any) => {
    toast(`Remove ${t.name} from the list?`, { action: { label: 'Remove', onClick: async () => {
      try { await assetsApi.deleteType(t.id); toast.success('Removed from the list'); load(); onChanged(); }
      catch (e: any) { toast.error(e?.response?.data?.error || 'Could not remove it'); }
    } }, cancel: { label: 'Cancel', onClick: () => { } } });
  };

  const changed = () => { load(); onChanged(); };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <p className="text-sm text-stone max-w-xl">The things the college buys and tags. Add an item once, then pick it on a requisition or when registering assets.</p>
        <button onClick={() => setDialog({})} className="px-4 py-2 rounded-xl bg-brand text-cream text-sm font-semibold hover:bg-brand-dark transition">+ Add asset item</button>
      </div>

      {data?.not_in_list > 0 && (
        <div className="mb-4 rounded-xl border border-gold/50 bg-gold/10 px-4 py-3 text-sm text-brand-dark">
          <strong>{data.not_in_list}</strong> item type{data.not_in_list === 1 ? ' is' : 's are'} in the register but not in this list yet (they came from the workbook). Use <strong>Set up</strong> to add them, with a tag series and depreciation rate.
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-3">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search asset items…" className={`${input} !w-64`} />
        <select value={cls} onChange={e => setCls(e.target.value)} className={`${input} !w-56`}>
          <option value="">All types of asset</option>
          {(options?.classes || []).map((c: any) => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
      </div>

      <div className="rounded-2xl border border-stone/10 overflow-x-auto bg-white">
        <table className="w-full text-sm min-w-[760px]">
          <thead className="bg-cream-deep text-stone text-xs uppercase tracking-wider">
            <tr><th className="text-left px-4 py-3">Item</th><th className="text-left px-4 py-3">Type</th><th className="text-left px-4 py-3">Tag series</th><th className="text-right px-4 py-3">Rate</th><th className="text-right px-4 py-3">In register</th><th className="px-4 py-3" /></tr>
          </thead>
          <tbody className="divide-y divide-stone/10">
            {!data ? <tr><td colSpan={6} className="px-4 py-10 text-center text-stone">Loading…</td></tr>
              : rows.length === 0 ? <tr><td colSpan={6} className="px-4 py-10 text-center text-stone">No asset items yet. Add the first one, or import the workbook.</td></tr>
              : rows.map(t => (
                <tr key={`${t.asset_class}|${t.name}`} className="hover:bg-cream-deep/50">
                  <td className="px-4 py-3"><span className="font-semibold text-brand-dark">{t.name}</span>{!t.in_list && <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">Not in the list</span>}{t.description && <div className="text-xs text-stone">{t.description}</div>}</td>
                  <td className="px-4 py-3 text-stone">{t.class_label}</td>
                  <td className="px-4 py-3"><span className="font-mono text-xs text-brand">{t.tag_series}</span><div className="text-[11px] text-stone">next {t.next_tag.slice(t.tag_series.length)}{!t.tag_series_set && ' · not fixed'}</div></td>
                  <td className="px-4 py-3 text-right">{t.depreciation_rate != null ? `${t.depreciation_rate}%` : <span className="text-stone">—</span>}</td>
                  <td className="px-4 py-3 text-right">{t.count}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button onClick={() => onRegister(t)} className="text-xs font-semibold text-brand hover:underline mr-3">Register</button>
                    {t.in_list
                      ? <><button onClick={() => setDialog({ item: t })} className="text-xs font-semibold text-brand hover:underline mr-3">Edit</button>
                        <button onClick={() => remove(t)} className="text-xs font-semibold text-red-600 hover:underline">Remove</button></>
                      : <button onClick={() => setDialog({ prefill: t })} className="text-xs font-semibold text-amber-700 hover:underline">Set up</button>}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {dialog && <AssetItemDialog item={dialog.item} prefill={dialog.prefill} options={options} onClose={() => setDialog(null)} onSaved={changed} />}
    </div>
  );
}
