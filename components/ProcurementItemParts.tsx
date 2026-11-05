'use client';
import { useEffect, useState } from 'react';
import { grnsApi } from '@/lib/services';
import { Shell } from '@/components/AssetDialogs';
import { toast } from 'sonner';

// What a procurement line is buying: a consumable (goes into Inventory, counted in a unit of measure) or an
// asset (tagged one by one in the asset register). Chosen on the requisition and carried through to the GRN.

const input = 'w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm';
const small = 'w-full px-3 py-2 rounded-lg border border-stone/25 bg-white text-sm focus:outline-none focus:border-brand';
const label = 'block text-sm font-semibold text-brand-dark mb-1.5';

export const withUnit = (qty: number | null | undefined, unit?: string | null) => `${qty ?? 0}${unit ? ` ${unit}` : ''}`;

export function KindBadge({ type }: { type?: string | null }) {
  if (type === 'ASSET') return <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-800">Asset</span>;
  if (type === 'CONSUMABLE') return <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-sky-100 text-sky-800">Stock</span>;
  return <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">Not classified</span>;
}

export function UnitInput({ value, onChange, units, className = input, id = 'units' }: { value: string; onChange: (v: string) => void; units: string[]; className?: string; id?: string }) {
  return (
    <>
      <input list={id} value={value} onChange={e => onChange(e.target.value)} placeholder="e.g. ream, box, litre" className={className} />
      <datalist id={id}>{units.map(u => <option key={u} value={u} />)}</datalist>
    </>
  );
}

// ── The "what are you buying?" part of the requisition form ───────────────────
export function ItemKindFields({ form, set, inventory, units, assetOptions }: {
  form: any; set: (patch: any) => void; inventory: any[]; units: string[]; assetOptions: any;
}) {
  const type: string | undefined = form.item_type;
  const classes: any[] = assetOptions?.classes || [];
  const cats: any[] = assetOptions?.categories || [];
  const assetKey = form.asset_new ? 'NEW' : (form.asset_class && form.item_name && cats.some((c: any) => c.asset_class === form.asset_class && c.name === form.item_name) ? `${form.asset_class}|${form.item_name}` : '');
  const pickAsset = (v: string) => {
    if (v === 'NEW') { set({ asset_new: true, asset_class: '', item_name: '' }); return; }
    if (!v) { set({ asset_new: false, asset_class: '', item_name: '' }); return; }
    const [cls, ...rest] = v.split('|');
    set({ asset_new: false, asset_class: cls, item_name: rest.join('|') });
  };
  const picked = form.inventory_item_id && form.inventory_item_id !== 'NEW' ? inventory.find(i => i.id === form.inventory_item_id) : null;

  const choose = (t: 'CONSUMABLE' | 'ASSET') =>
    set({ item_type: t, inventory_item_id: '', item_name: '', unit_of_measure: '', asset_class: '', asset_category: '', asset_new: false });

  const pickStock = (id: string) => {
    if (id === 'NEW') { set({ inventory_item_id: 'NEW', item_name: '', unit_of_measure: '' }); return; }
    const it = inventory.find(i => i.id === id);
    set({ inventory_item_id: id, item_name: it?.name || '', unit_of_measure: it?.unit_of_measure || '', unit_price: form.unit_price || (it?.unit_cost ?? '') });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className={label}>What are you buying? *</label>
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => choose('CONSUMABLE')} aria-pressed={type === 'CONSUMABLE'}
            className={`text-left rounded-xl border p-3 transition ${type === 'CONSUMABLE' ? 'border-brand ring-2 ring-brand/20 bg-brand/5' : 'border-stone/25 hover:border-brand'}`}>
            <div className="font-semibold text-brand-dark text-sm">📦 Consumable</div>
            <div className="text-xs text-stone">Counted in stock and issued out (paper, detergent…)</div>
          </button>
          <button type="button" onClick={() => choose('ASSET')} aria-pressed={type === 'ASSET'}
            className={`text-left rounded-xl border p-3 transition ${type === 'ASSET' ? 'border-brand ring-2 ring-brand/20 bg-brand/5' : 'border-stone/25 hover:border-brand'}`}>
            <div className="font-semibold text-brand-dark text-sm">🏷️ Asset</div>
            <div className="text-xs text-stone">Tagged one by one in the asset register (computers, furniture…)</div>
          </button>
        </div>
      </div>

      {type === 'CONSUMABLE' && (
        <>
          <div>
            <label className={label}>Stock item *</label>
            <select required value={form.inventory_item_id || ''} onChange={e => pickStock(e.target.value)} className={input}>
              <option value="">Select a stock item</option>
              {inventory.map(i => <option key={i.id} value={i.id}>{i.name}{i.unit_of_measure ? ` (${i.unit_of_measure})` : ''}</option>)}
              <option value="NEW">＋ A new item not in Inventory yet</option>
            </select>
          </div>
          {form.inventory_item_id === 'NEW' && (
            <div>
              <label className={label}>New item name *</label>
              <input required value={form.item_name || ''} onChange={e => set({ item_name: e.target.value })} className={input} placeholder="e.g. Whiteboard markers" />
              <p className="text-xs text-stone mt-1">It is added to Inventory when the goods are received.</p>
            </div>
          )}
          {(picked || form.inventory_item_id === 'NEW') && (
            <div>
              <label className={label}>Unit of measure <span className="font-normal text-stone">(optional)</span></label>
              <UnitInput value={form.unit_of_measure || ''} onChange={v => set({ unit_of_measure: v })} units={units} />
              {picked && <p className="text-xs text-stone mt-1">In stock: {withUnit(picked.current_stock, picked.unit_of_measure)}</p>}
            </div>
          )}
        </>
      )}

      {type === 'ASSET' && (
        <>
          <div>
            <label className={label}>Asset item *</label>
            <select required value={assetKey} onChange={e => pickAsset(e.target.value)} className={input}>
              <option value="">Select an asset item</option>
              {classes.map((c: any) => {
                const list = cats.filter((x: any) => x.asset_class === c.key);
                return list.length > 0 ? (
                  <optgroup key={c.key} label={c.label}>
                    {list.map((x: any) => <option key={`${c.key}|${x.name}`} value={`${c.key}|${x.name}`}>{x.name}{x.count > 0 ? ` (${x.count} in the register)` : ''}</option>)}
                  </optgroup>
                ) : null;
              })}
              <option value="NEW">＋ A new type of asset</option>
            </select>
            <p className="text-xs text-stone mt-1">Choosing an existing item keeps its tag numbers in the same series.</p>
          </div>
          {form.asset_new && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={label}>Type of asset *</label>
                <select required value={form.asset_class || ''} onChange={e => set({ asset_class: e.target.value })} className={input}>
                  <option value="">Select…</option>
                  {classes.map((c: any) => <option key={c.key} value={c.key}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className={label}>New item name *</label>
                <input required value={form.item_name || ''} onChange={e => set({ item_name: e.target.value })} className={input} placeholder="e.g. Document shredder" />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Review what was received on a GRN: say what each line is, correct quantities, see where it went ──
export function GrnLinesDialog({ grnId, units, assetOptions, onClose, onChanged }: { grnId: string; units: string[]; assetOptions: any; onClose: () => void; onChanged: () => void }) {
  const [grn, setGrn] = useState<any>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const classes: any[] = assetOptions?.classes || [];

  const load = () => grnsApi.getById(grnId).then(r => setGrn(r.data)).catch(() => { toast.error('Could not load the GRN'); onClose(); });
  useEffect(() => { load(); }, [grnId]);

  const local = (line: any, patch: any) => setGrn((g: any) => ({ ...g, items: g.items.map((i: any) => (i.id === line.id ? { ...i, ...patch } : i)) }));

  const save = async (line: any, patch: any) => {
    setBusy(line.id);
    try {
      const r = await grnsApi.updateItem(grnId, line.id, patch);
      setGrn((g: any) => ({ ...g, items: g.items.map((i: any) => (i.id === line.id ? { ...i, ...r.data } : i)) }));
      onChanged();
    } catch (e: any) { toast.error(e?.response?.data?.error || 'Could not save that line'); }
    finally { setBusy(null); }
  };

  if (!grn) return <Shell title="Goods received" onClose={onClose}><p className="py-10 text-center text-sm text-stone">Loading…</p></Shell>;
  const pending = grn.status === 'PENDING';
  const unclassified = grn.items.filter((i: any) => !i.item_type && i.quantity_accepted > 0).length;

  return (
    <Shell title={`${grn.grn_no} — lines`} onClose={onClose} wide
      subtitle={pending
        ? 'Say what each line is before verifying. Consumables go into Inventory in their unit; assets wait to be tagged in the asset register.'
        : grn.status === 'VERIFIED' ? 'This GRN is verified.' : 'This GRN was rejected.'}>
      {pending && unclassified > 0 && <div className="text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-3 py-2 mb-3">{unclassified} line{unclassified > 1 ? 's are' : ' is'} not classified yet. Verifying is blocked until {unclassified > 1 ? 'they are' : 'it is'}.</div>}
      <div className="space-y-3 mt-3">
        {grn.items.map((l: any) => (
          <div key={l.id} className={`rounded-xl border p-3 ${busy === l.id ? 'opacity-60' : ''} ${!l.item_type && pending ? 'border-amber-300 bg-amber-50/40' : 'border-stone/15'}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0"><span className="font-semibold text-brand-dark text-sm">{l.item_name}</span> <KindBadge type={l.item_type} /></div>
              <div className="text-xs text-stone whitespace-nowrap">Ordered {withUnit(l.quantity_ordered, l.unit_of_measure)}</div>
            </div>

            {pending ? (
              <div className="grid sm:grid-cols-4 gap-3 mt-3 items-end">
                <div>
                  <span className="block text-xs text-stone mb-1">Is it</span>
                  <select value={l.item_type || ''} onChange={e => {
                    const v = e.target.value;
                    if (v === 'CONSUMABLE') save(l, { item_type: 'CONSUMABLE' });
                    else if (v === 'ASSET') { if (l.asset_class) save(l, { item_type: 'ASSET', asset_class: l.asset_class }); else local(l, { item_type: 'ASSET' }); }
                  }} className={small}>
                    <option value="">Choose…</option><option value="CONSUMABLE">Consumable (stock)</option><option value="ASSET">Asset (tag it)</option>
                  </select>
                </div>
                {l.item_type === 'CONSUMABLE' && (
                  <div>
                    <span className="block text-xs text-stone mb-1">Unit of measure (optional)</span>
                    <UnitInput id={`u-${l.id}`} value={l.unit_of_measure || ''} units={units} className={small}
                      onChange={v => setGrn((g: any) => ({ ...g, items: g.items.map((i: any) => (i.id === l.id ? { ...i, unit_of_measure: v } : i)) }))} />
                    <button type="button" onClick={() => save(l, { unit_of_measure: l.unit_of_measure || '' })} className="text-xs text-brand font-semibold mt-1 hover:underline">Save unit</button>
                  </div>
                )}
                {l.item_type === 'ASSET' && (
                  <div>
                    <span className="block text-xs text-stone mb-1">Type of asset</span>
                    <select value={l.asset_class || ''} onChange={e => e.target.value && save(l, { item_type: 'ASSET', asset_class: e.target.value, asset_category: l.asset_category || l.item_name })} className={small}>
                      <option value="">Select…</option>{classes.map((c: any) => <option key={c.key} value={c.key}>{c.label}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <span className="block text-xs text-stone mb-1">Received</span>
                  <input type="number" min={0} defaultValue={l.quantity_received} onBlur={e => +e.target.value !== l.quantity_received && save(l, { quantity_received: e.target.value })} className={small} />
                </div>
                <div>
                  <span className="block text-xs text-stone mb-1">Accepted</span>
                  <input type="number" min={0} defaultValue={l.quantity_accepted} onBlur={e => +e.target.value !== l.quantity_accepted && save(l, { quantity_accepted: e.target.value })} className={small} />
                </div>
              </div>
            ) : (
              <div className="text-sm text-stone mt-2">
                Received {withUnit(l.quantity_received, l.unit_of_measure)}, accepted {withUnit(l.quantity_accepted, l.unit_of_measure)}
                {grn.status === 'VERIFIED' && l.item_type === 'CONSUMABLE' && <span className="text-sky-800"> · added to Inventory</span>}
                {grn.status === 'VERIFIED' && l.item_type === 'ASSET' && <span className="text-purple-800"> · {l.tagged_count || 0} of {l.quantity_accepted} tagged{l.quantity_accepted - (l.tagged_count || 0) > 0 ? ' — the rest are waiting in Assets → Ready to tag' : ''}</span>}
              </div>
            )}
          </div>
        ))}
      </div>
      <button onClick={onClose} className="w-full mt-5 py-2.5 rounded-xl border border-stone/25 text-brand font-semibold hover:bg-stone/5 transition">Close</button>
    </Shell>
  );
}


// ── Who is asking: an academic department, or a non-academic unit (Administration, Store...) ──
// value: '' | 'd:<department id>' | 'u:<unit name>' | 'NEW' (then the unit is typed)
export const requesterOf = (r: { department_id?: string | null; unit_name?: string | null; department?: any }, unitNames: string[]) =>
  r.department_id ? `d:${r.department_id}` : r.unit_name ? (unitNames.some(u => u.toLowerCase() === r.unit_name!.toLowerCase()) ? `u:${r.unit_name}` : 'NEW') : '';

export function RequesterField({ form, set, departments, unitNames }: { form: any; set: (patch: any) => void; departments: any[]; unitNames: string[] }) {
  return (
    <div>
      <label className={label}>Department or unit *</label>
      <select required value={form.requester || ''} onChange={e => set({ requester: e.target.value, ...(e.target.value === 'NEW' ? {} : { new_unit: '' }) })} className={input}>
        <option value="">Select who needs the items</option>
        <optgroup label="Academic departments">
          {departments.map(d => <option key={d.id} value={`d:${d.id}`}>{d.name}</option>)}
        </optgroup>
        <optgroup label="Other units (not academic)">
          {unitNames.map(u => <option key={u} value={`u:${u}`}>{u}</option>)}
          <option value="NEW">＋ Another unit, type its name…</option>
        </optgroup>
      </select>
      {form.requester === 'NEW' && (
        <input required autoFocus value={form.new_unit || ''} onChange={e => set({ new_unit: e.target.value })} className={`${input} mt-2`} placeholder="e.g. Administration, Store, Library" />
      )}
    </div>
  );
}

// What to send for the requester field
export const requesterPayload = (form: any) => {
  const r: string = form.requester || '';
  if (r.startsWith('d:')) return { department_id: r.slice(2), unit_name: null };
  if (r.startsWith('u:')) return { department_id: null, unit_name: r.slice(2) };
  if (r === 'NEW') return { department_id: null, unit_name: String(form.new_unit || '').trim() };
  return { department_id: null, unit_name: null };
};

// ── The items on a requisition: any number, each a consumable or an asset ──
export const blankLine = () => ({ key: Math.random().toString(36).slice(2), item_type: '', inventory_item_id: '', item_name: '', unit_of_measure: '', asset_class: '', asset_new: false, description: '', quantity: '', unit_price: '', specifications: '' });

export function RequisitionLines({ lines, setLines, inventory, units, assetOptions }: { lines: any[]; setLines: (l: any[]) => void; inventory: any[]; units: string[]; assetOptions: any }) {
  const update = (i: number, patch: any) => setLines(lines.map((l, x) => (x === i ? { ...l, ...patch } : l)));
  const total = lines.reduce((n, l) => n + (parseFloat(l.quantity) || 0) * (parseFloat(l.unit_price) || 0), 0);
  return (
    <div className="space-y-4">
      {lines.map((l, i) => (
        <div key={l.key} className="rounded-2xl border border-stone/20 bg-cream-deep/40 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-brand-dark">Item {i + 1}{l.item_name ? ` · ${l.item_name}` : ''}</span>
            {lines.length > 1 && <button type="button" onClick={() => setLines(lines.filter((_, x) => x !== i))} className="text-xs text-red-600 font-semibold hover:underline">Remove</button>}
          </div>
          <ItemKindFields form={l} set={patch => update(i, patch)} inventory={inventory} units={units} assetOptions={assetOptions} />
          <div className="grid sm:grid-cols-3 gap-4 mt-4">
            <div>
              <label className={label}>Quantity{l.item_type === 'CONSUMABLE' && l.unit_of_measure ? ` (${l.unit_of_measure})` : ''} *</label>
              <input type="number" required min={1} value={l.quantity} onChange={e => update(i, { quantity: e.target.value })} className={input} />
            </div>
            <div>
              <label className={label}>Unit price (KES) *</label>
              <input type="number" required min={0} step="0.01" value={l.unit_price} onChange={e => update(i, { unit_price: e.target.value })} className={input} />
            </div>
            <div>
              <label className={label}>Line total</label>
              <div className="px-4 py-3 rounded-xl bg-white border border-stone/15 text-sm text-brand-dark font-semibold">KES {((parseFloat(l.quantity) || 0) * (parseFloat(l.unit_price) || 0)).toLocaleString()}</div>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            <div><label className={label}>Description</label><input value={l.description} onChange={e => update(i, { description: e.target.value })} className={input} /></div>
            <div><label className={label}>Specifications</label><input value={l.specifications} onChange={e => update(i, { specifications: e.target.value })} className={input} /></div>
          </div>
        </div>
      ))}
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={() => setLines([...lines, blankLine()])} className="px-4 py-2.5 rounded-xl border border-brand/40 text-brand text-sm font-semibold hover:bg-brand/5 transition">＋ Add another item</button>
        <div className="text-sm text-stone">{lines.length} item{lines.length === 1 ? '' : 's'} · Total <span className="font-semibold text-brand-dark">KES {total.toLocaleString()}</span></div>
      </div>
    </div>
  );
}
