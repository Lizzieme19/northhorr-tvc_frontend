'use client';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { assetsApi } from '@/lib/services';
import { toast } from 'sonner';

export const CONDITION_LABEL: Record<string, string> = { GOOD: 'Good', FAIR: 'Fair', POOR: 'Poor', UNSERVICEABLE: 'Unserviceable' };
export const money = (n: number | null | undefined) => (n == null ? '—' : `KES ${Math.round(n).toLocaleString()}`);
const dateOf = (d?: string | null) => (d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
const dateInput = (d?: string | null) => (d ? new Date(d).toISOString().slice(0, 10) : '');

const input = 'w-full px-3 py-2.5 rounded-xl border border-stone/25 bg-white text-sm focus:outline-none focus:border-brand';
const label = 'block text-xs font-semibold text-brand-dark mb-1';

// Dialogs sit on the page itself, centred, whatever the scroll position
export function Shell({ title, subtitle, onClose, children, wide = false }: { title: string; subtitle?: ReactNode; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm z-50 flex items-start sm:items-center justify-center p-4 py-6 overflow-y-auto" onClick={onClose}>
      <div className={`bg-white rounded-3xl p-6 sm:p-8 w-full ${wide ? 'max-w-4xl' : 'max-w-2xl'} shadow-2xl my-auto`} onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-1">
          <h2 className="font-display text-xl text-brand-dark">{title}</h2>
          <button onClick={onClose} className="text-stone hover:text-brand transition" aria-label="Close">✕</button>
        </div>
        {subtitle && <div className="text-sm text-stone mb-4">{subtitle}</div>}
        {children}
      </div>
    </div>
  );
}

// ── Register a new asset, or edit one ─────────────────────────────────────────
export function AssetFormDialog({ asset, prefill, options, defaultClass, onClose, onSaved }: { asset?: any; prefill?: any; options: any; defaultClass?: string; onClose: () => void; onSaved: () => void }) {
  const editing = Boolean(asset);
  const [f, setF] = useState<any>(() => ({
    asset_class: asset?.asset_class || prefill?.asset_class || defaultClass || 'ICT',
    name: asset?.name || prefill?.name || '',
    category: asset?.category || prefill?.name || '',
    asset_code: asset?.asset_code || '',
    tag_prefix: '',
    quantity: '1',
    serial_number: asset?.serial_number || '',
    make_model: asset?.make_model || '',
    condition: asset?.condition || '',
    location_id: asset?.location_id || '',
    original_location_id: asset?.original_location_id || '',
    responsible_officer: asset?.responsible_officer || '',
    source_of_funds: asset?.source_of_funds || '',
    pv_number: asset?.pv_number || '',
    delivery_date: dateInput(asset?.delivery_date),
    purchase_cost: asset?.purchase_cost ?? '',
    depreciation_rate: asset?.depreciation_rate ?? '',
    notes: asset?.notes || '',
  }));
  const [tagOpts, setTagOpts] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: any) => setF((x: any) => ({ ...x, [k]: v }));

  // Which numbering this item type uses, and the next tag
  useEffect(() => {
    if (editing) return;
    const category = (f.category || f.name).trim();
    if (!category) { setTagOpts([]); return; }
    const t = setTimeout(() => {
      assetsApi.tagOptions({ asset_class: f.asset_class, category }).then(r => {
        setTagOpts(r.data.options || []);
        set('tag_prefix', r.data.options?.[0]?.prefix || '');
      }).catch(() => setTagOpts([]));
    }, 350);
    return () => clearTimeout(t);
  }, [f.asset_class, f.category, f.name, editing]);

  const categories = (options?.categories || []).filter((c: any) => c.asset_class === f.asset_class);
  const itemRate = categories.find((c: any) => c.name.toLowerCase() === (f.category || f.name).trim().toLowerCase())?.depreciation_rate;
  const chosenTag = tagOpts.find(o => o.prefix === f.tag_prefix) || tagOpts[0];
  const qty = Math.max(1, parseInt(f.quantity) || 1);

  const save = async () => {
    if (!f.name.trim()) { toast.warning('Say what the item is'); return; }
    setSaving(true);
    try {
      const body: any = { ...f };
      if (editing) {
        delete body.tag_prefix; delete body.quantity;
        if (body.asset_code === asset.asset_code) delete body.asset_code;
      } else {
        delete body.asset_code;
        if (!body.tag_prefix) delete body.tag_prefix;
        body.quantity = qty;
      }
      // empty boxes mean "not known yet"
      for (const k of ['purchase_cost', 'depreciation_rate', 'delivery_date']) if (body[k] === '') body[k] = null;
      const r = editing ? await assetsApi.update(asset.id, body) : await assetsApi.create(body);
      toast.success(editing ? 'Saved' : r.data.message);
      onSaved();
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Shell title={editing ? `Edit ${asset.asset_code}` : 'Register an asset'} onClose={onClose}>
      <div className="grid sm:grid-cols-2 gap-4 mt-2">
        <div>
          <label className={label}>Type of asset *</label>
          <select value={f.asset_class} onChange={e => set('asset_class', e.target.value)} disabled={editing} className={input}>
            {(options?.classes || []).map((c: any) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>Description *</label>
          <input value={f.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Computer monitor" className={input} />
        </div>
        <div>
          <label className={label}>Item type (group)</label>
          <input list="asset-categories" value={f.category} onChange={e => set('category', e.target.value)} placeholder="Same as the description if left empty" className={input} />
          <datalist id="asset-categories">{categories.map((c: any) => <option key={c.name} value={c.name}>{c.count} in the register</option>)}</datalist>
        </div>

        {editing ? (
          <div>
            <label className={label}>Tag number</label>
            <input value={f.asset_code} onChange={e => set('asset_code', e.target.value)} className={`${input} font-mono`} />
            <p className="text-[11px] text-stone mt-1">Change it only to correct a mistake. The item&apos;s label should match.</p>
          </div>
        ) : (
          <div>
            <label className={label}>Quantity</label>
            <input type="number" min={1} max={200} value={f.quantity} onChange={e => set('quantity', e.target.value)} className={input} />
          </div>
        )}

        {!editing && (
          <div className="sm:col-span-2 bg-cream-deep rounded-xl px-4 py-3 text-sm">
            {chosenTag ? (
              <>
                <div className="text-xs text-stone mb-0.5">{qty > 1 ? 'Tags that will be given' : 'Tag that will be given'}</div>
                <div className="font-mono text-brand-dark">
                  {chosenTag.next_tag}{qty > 1 && <> … {chosenTag.next_tag.replace(/\d+$/, (m: string) => String(parseInt(m, 10) + qty - 1).padStart(m.length, '0'))}</>}
                </div>
                <div className="text-xs text-stone mt-0.5">{chosenTag.count > 0 ? `Continues the ${chosenTag.count} already in the register.` : 'A new item type: numbering starts at 001.'}</div>
                {tagOpts.length > 1 && (
                  <label className="block mt-2 text-xs text-stone">Numbering series
                    <select value={f.tag_prefix} onChange={e => set('tag_prefix', e.target.value)} className={`${input} mt-1 font-mono text-xs`}>
                      {tagOpts.map(o => <option key={o.prefix} value={o.prefix}>{o.prefix} ({o.count} so far, next {o.next_tag.split('/').pop()})</option>)}
                    </select>
                  </label>
                )}
              </>
            ) : <span className="text-stone text-xs">Enter a description to see the tag number.</span>}
          </div>
        )}

        <div><label className={label}>Serial number (maker&apos;s)</label><input value={f.serial_number} onChange={e => set('serial_number', e.target.value)} className={input} /></div>
        <div><label className={label}>Make &amp; model</label><input value={f.make_model} onChange={e => set('make_model', e.target.value)} className={input} /></div>
        <div>
          <label className={label}>Condition</label>
          <select value={f.condition} onChange={e => set('condition', e.target.value)} className={input}>
            <option value="">Not recorded</option>
            {(options?.conditions || []).map((c: string) => <option key={c} value={c}>{CONDITION_LABEL[c] || c}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>Where it is now</label>
          <select value={f.location_id} onChange={e => set('location_id', e.target.value)} className={input}>
            <option value="">No location yet</option>
            {(options?.locations || []).map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
        {editing && (
          <div>
            <label className={label}>Where it was first placed</label>
            <select value={f.original_location_id} onChange={e => set('original_location_id', e.target.value)} className={input}>
              <option value="">Not recorded</option>
              {(options?.locations || []).map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
        )}
        <div><label className={label}>Responsible officer</label><input value={f.responsible_officer} onChange={e => set('responsible_officer', e.target.value)} className={input} /></div>
        <div>
          <label className={label}>Source of funds</label>
          <input list="asset-sources" value={f.source_of_funds} onChange={e => set('source_of_funds', e.target.value)} placeholder="e.g. MOE" className={input} />
          <datalist id="asset-sources">{(options?.sources_of_funds || []).map((s: string) => <option key={s} value={s} />)}</datalist>
        </div>
        <div><label className={label}>PV number</label><input value={f.pv_number} onChange={e => set('pv_number', e.target.value)} className={input} /></div>
        <div><label className={label}>Date delivered / installed</label><input type="date" value={f.delivery_date} onChange={e => set('delivery_date', e.target.value)} className={input} /></div>
        <div><label className={label}>Cost (KES)</label><input type="number" min={0} step="0.01" value={f.purchase_cost} onChange={e => set('purchase_cost', e.target.value)} placeholder="Leave empty until known" className={input} /></div>
        <div><label className={label}>Depreciation rate (% a year)</label><input type="number" min={0} step="0.1" value={f.depreciation_rate} onChange={e => set('depreciation_rate', e.target.value)} placeholder={!editing && itemRate != null ? `${itemRate} (from the asset item)` : ''} className={input} /></div>
        <div className="sm:col-span-2"><label className={label}>Notes</label><textarea rows={2} value={f.notes} onChange={e => set('notes', e.target.value)} className={input} /></div>
      </div>
      <p className="text-xs text-stone mt-3">Depreciation and net book value are worked out from the cost, date and rate. You don&apos;t type them.</p>
      <div className="mt-5 flex gap-3">
        <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-brand text-cream font-semibold hover:bg-brand-dark transition disabled:opacity-50">
          {saving ? 'Saving…' : editing ? 'Save changes' : qty > 1 ? `Register ${qty} items` : 'Register asset'}
        </button>
        <button onClick={onClose} className="px-6 py-2.5 rounded-xl border border-stone/25 text-brand font-semibold hover:bg-stone/5 transition">Cancel</button>
      </div>
    </Shell>
  );
}

// ── One asset in full ─────────────────────────────────────────────────────────
export function AssetDetailDialog({ assetId, onClose, onEdit, onChanged }: { assetId: string; onClose: () => void; onEdit: (a: any) => void; onChanged: () => void }) {
  const [a, setA] = useState<any>(null);
  const [disposing, setDisposing] = useState(false);
  const [reason, setReason] = useState('');
  const [kind, setKind] = useState('DISPOSED');

  const load = () => assetsApi.getById(assetId).then(r => setA(r.data)).catch(() => { toast.error('Could not load the asset'); onClose(); });
  useEffect(() => { load(); }, [assetId]);

  if (!a) return <Shell title="Asset" onClose={onClose}><p className="py-10 text-center text-sm text-stone">Loading…</p></Shell>;
  const v = a.valuation;
  const row = (k: string, val: ReactNode) => (
    <div className="flex justify-between gap-4 py-2 border-b border-stone/10 text-sm"><dt className="text-stone">{k}</dt><dd className="text-brand-dark text-right">{val || '—'}</dd></div>
  );

  const resolve = async () => { await assetsApi.update(a.id, { resolve_attention: true }); toast.success('Marked as sorted out'); load(); onChanged(); };
  const dispose = async () => {
    if (reason.trim().length < 3) { toast.warning('Please give the reason'); return; }
    try { await assetsApi.dispose(a.id, { status: kind, disposal_reason: reason }); toast.success('Recorded'); setDisposing(false); load(); onChanged(); }
    catch (e: any) { toast.error(e?.response?.data?.error || 'Could not save'); }
  };

  return (
    <Shell
      title={a.name}
      subtitle={<span className="font-mono text-brand">{a.asset_code}</span>}
      onClose={onClose}
    >
      {a.attention && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 text-sm text-amber-900">
          <strong>Needs a look:</strong> {a.attention === 'DUPLICATE_TAG' ? 'The registers gave this item the same tag as another.' : a.attention === 'NO_TAG' ? 'It had no tag number.' : a.attention}
          {a.notes && <div className="text-xs mt-1">{a.notes}</div>}
          <button onClick={resolve} className="mt-2 text-xs font-semibold text-amber-800 underline">Mark as sorted out (e.g. relabelled)</button>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-x-8">
        <dl>
          {row('Type', a.asset_class?.replace('_', ' ').toLowerCase().replace(/^\w/, (c: string) => c.toUpperCase()))}
          {row('Item type', a.category)}
          {row('Serial number', a.serial_number)}
          {row('Make & model', a.make_model)}
          {row('Condition', a.condition ? CONDITION_LABEL[a.condition] : null)}
          {row('Status', a.status === 'ACTIVE' ? 'In use' : a.status === 'DISPOSED' ? `Disposed ${dateOf(a.disposal_date)}` : `Written off ${dateOf(a.disposal_date)}`)}
          {a.disposal_reason && row('Reason', a.disposal_reason)}
        </dl>
        <dl>
          {row('Location now', a.current_location?.name)}
          {row('First placed', a.original_location?.name)}
          {row('Responsible officer', a.responsible_officer)}
          {row('Source of funds', a.source_of_funds)}
          {row('PV number', a.pv_number)}
          {row('Delivered / installed', dateOf(a.delivery_date))}
          {a.grn_no && row('Bought on', `${a.lpo_no || 'LPO'}${a.supplier_name ? `, ${a.supplier_name}` : ''}`)}
          {a.grn_no && row('Received on', a.grn_no)}
          {a.imported_from && row('Imported from', a.imported_from)}
        </dl>
      </div>

      <div className="mt-4 rounded-2xl border border-stone/15 p-4">
        <div className="text-xs font-semibold text-brand-dark uppercase tracking-wide mb-2">Value</div>
        {v.state === 'NEEDS_COST' ? (
          <p className="text-sm text-stone">Not valued yet. Enter the cost (and the date and depreciation rate) to see its worth.</p>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div><div className="text-lg font-semibold text-brand-dark">{money(v.cost)}</div><div className="text-xs text-stone">Cost</div></div>
              <div><div className="text-lg font-semibold text-brand-dark">{money(v.accumulated_depreciation)}</div><div className="text-xs text-stone">Depreciated so far</div></div>
              <div><div className="text-lg font-semibold text-brand-dark">{money(v.net_book_value)}</div><div className="text-xs text-stone">Net book value</div></div>
            </div>
            {v.state === 'NEEDS_RATE' && <p className="text-xs text-amber-700 mt-2">Add a depreciation rate to work out its current value.</p>}
            {v.state === 'NEEDS_DATE' && <p className="text-xs text-amber-700 mt-2">Add the delivery or purchase date to work out its current value.</p>}
            {v.state === 'VALUED' && <p className="text-xs text-stone mt-2">{money(v.annual_depreciation)} a year ({a.depreciation_rate}%), straight line from {dateOf(a.purchase_date || a.delivery_date)}.</p>}
          </>
        )}
      </div>

      {a.notes && !a.attention && <p className="text-sm text-stone mt-3"><strong className="text-brand-dark">Notes:</strong> {a.notes}</p>}

      {a.maintenance_records?.length > 0 && (
        <div className="mt-4">
          <div className="text-xs font-semibold text-brand-dark uppercase tracking-wide mb-1">Maintenance</div>
          {a.maintenance_records.map((m: any) => <div key={m.id} className="text-sm text-stone py-1">{dateOf(m.performed_date)} · {m.maintenance_type.toLowerCase()} · {m.description}</div>)}
        </div>
      )}

      {disposing ? (
        <div className="mt-5 border border-stone/15 rounded-2xl p-4 space-y-3">
          <select value={kind} onChange={e => setKind(e.target.value)} className={input}>
            <option value="DISPOSED">Disposed of (sold, handed over, scrapped)</option>
            <option value="WRITTEN_OFF">Written off (lost, stolen, destroyed)</option>
          </select>
          <input value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason *" className={input} />
          <div className="flex gap-3">
            <button onClick={dispose} className="flex-1 py-2 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition text-sm">Record</button>
            <button onClick={() => setDisposing(false)} className="px-5 py-2 rounded-xl border border-stone/25 text-brand text-sm font-semibold">Cancel</button>
          </div>
        </div>
      ) : (
        <div className="mt-5 flex flex-wrap gap-3">
          <button onClick={() => onEdit(a)} className="px-5 py-2.5 rounded-xl bg-brand text-cream font-semibold hover:bg-brand-dark transition">Edit</button>
          {a.status === 'ACTIVE' && <button onClick={() => setDisposing(true)} className="px-5 py-2.5 rounded-xl border border-stone/25 text-red-700 font-semibold hover:bg-red-50 transition">Dispose / write off</button>}
          <button onClick={onClose} className="ml-auto px-5 py-2.5 rounded-xl border border-stone/25 text-brand font-semibold hover:bg-stone/5 transition">Close</button>
        </div>
      )}
    </Shell>
  );
}

// ── Import the asset registers workbook ───────────────────────────────────────
export function AssetImportDialog({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any>(null);
  const [checking, setChecking] = useState(false);
  const [importing, setImporting] = useState(false);
  const [includeStock, setIncludeStock] = useState(true);
  const [result, setResult] = useState<any>(null);
  const picker = useRef<HTMLInputElement>(null);

  const choose = async (f: File | null) => {
    if (!f) return;
    if (!/\.xlsx$/i.test(f.name)) { toast.error('Choose the asset registers workbook (.xlsx)'); return; }
    setFile(f); setPreview(null); setChecking(true);
    try { setPreview((await assetsApi.importPreview(f)).data); }
    catch (e: any) { toast.error(e?.response?.data?.error || 'Could not read that workbook'); setFile(null); }
    finally { setChecking(false); }
  };

  const run = async () => {
    if (!file) return;
    setImporting(true);
    try { const r = await assetsApi.importWorkbook(file, includeStock); setResult(r.data); toast.success(r.data.message); onDone(); }
    catch (e: any) { toast.error(e?.response?.data?.error || 'Import failed'); }
    finally { setImporting(false); }
  };

  const s = preview?.summary;
  const tile = (n: number, text: string, tone = 'bg-cream-deep text-brand-dark') => (
    <div className={`rounded-xl p-3 text-center ${tone}`}><div className="text-xl font-bold">{n.toLocaleString()}</div><div className="text-xs text-stone">{text}</div></div>
  );

  return (
    <Shell title="Import the asset registers workbook" onClose={onClose} wide subtitle="Reads the ICT, furniture, plant & machinery, office equipment and portable items sheets, and the stock sheet. It is checked first; nothing is added until you confirm.">
      {result ? (
        <div>
          <div className="grid grid-cols-3 gap-3 my-5">{tile(result.assets_created, 'assets added', 'bg-green-50')}{tile(result.locations_created, 'locations added')}{tile(result.stock_created, 'stock items added to Inventory')}</div>
          {result.errors?.length > 0 && <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl p-3 mb-3">{result.errors.map((e: any, i: number) => <div key={i}>{e.rows}: {e.error}</div>)}</div>}
          <p className="text-sm text-stone mb-4">Open <strong>Needs valuation</strong> and <strong>Needs attention</strong> in the register to work through what is left.</p>
          <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-brand text-cream font-semibold hover:bg-brand-dark transition">Done</button>
        </div>
      ) : (
        <>
          {!file && (
            <label onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); choose(e.dataTransfer.files?.[0] || null); }}
              className="block w-full border-2 border-dashed border-brand/30 rounded-2xl p-10 text-center cursor-pointer hover:border-brand hover:bg-brand/5 transition mt-3">
              <input ref={picker} type="file" accept=".xlsx" className="hidden" onChange={e => choose(e.target.files?.[0] || null)} />
              <div className="text-4xl mb-2">📊</div>
              <div className="text-sm font-medium text-brand-dark">Click to choose the workbook, or drop it here</div>
              <div className="text-xs text-stone mt-1">.xlsx</div>
            </label>
          )}
          {file && (
            <div className="flex items-center justify-between gap-3 border border-stone/15 rounded-xl px-4 py-3 my-3 text-sm">
              <div className="truncate">📄 <span className="font-medium text-brand-dark">{file.name}</span></div>
              <button onClick={() => { setFile(null); setPreview(null); if (picker.current) picker.current.value = ''; }} className="text-xs text-brand hover:underline font-medium shrink-0">Choose another</button>
            </div>
          )}
          {checking && <p className="py-10 text-center text-sm text-stone">Checking the workbook…</p>}

          {s && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
                {tile(s.assets.ready, 'assets to add', 'bg-green-50')}
                {tile(s.assets.already_in_register, 'already in the register')}
                {tile(s.assets.needs_valuation, 'have no cost yet', 'bg-amber-50')}
                {tile(s.assets.without_location, 'have no location', 'bg-amber-50')}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="border border-stone/15 rounded-2xl p-4">
                  <div className="text-xs font-semibold text-brand-dark uppercase tracking-wide mb-2">By type</div>
                  {Object.entries(s.assets.by_class).map(([k, c]: any) => <div key={k} className="flex justify-between text-sm py-0.5"><span className="text-stone">{c.label}</span><span className="text-brand-dark font-medium">{c.ready}{c.exists ? <span className="text-stone font-normal"> (+{c.exists} already there)</span> : ''}</span></div>)}
                  <div className="border-t border-stone/10 mt-2 pt-2 text-sm flex justify-between"><span className="text-stone">Stock lines for Inventory</span><span className="text-brand-dark font-medium">{s.stock.ready}</span></div>
                </div>
                <div className="border border-stone/15 rounded-2xl p-4">
                  <div className="text-xs font-semibold text-brand-dark uppercase tracking-wide mb-2">What will be tidied</div>
                  <ul className="text-sm text-stone space-y-1.5 list-disc pl-4">
                    <li>Tag numbers typed in the &ldquo;Serial number&rdquo; column become the tag number.</li>
                    {s.assets.duplicate_tags_fixed > 0 && <li><strong className="text-brand-dark">{s.assets.duplicate_tags_fixed}</strong> items share a tag with another item. They get the next free number and are flagged to be relabelled.</li>}
                    {s.assets.moved_to_other_register > 0 && <li><strong className="text-brand-dark">{s.assets.moved_to_other_register}</strong> items tagged as office equipment but listed under furniture move to Office equipment.</li>}
                    <li>Spelling and case variants of locations are merged ({s.locations.filter((l: any) => l.merged_from.length).length} merged).</li>
                  </ul>
                </div>
              </div>

              <details className="mt-4 border border-stone/15 rounded-2xl">
                <summary className="px-4 py-3 text-sm font-medium text-brand-dark cursor-pointer">Locations that will be used ({s.locations.length})</summary>
                <div className="px-4 pb-3 grid sm:grid-cols-2 gap-x-6 text-sm">
                  {s.locations.map((l: any) => (
                    <div key={l.name} className="py-1 flex justify-between gap-3 border-b border-stone/10">
                      <span className="text-brand-dark">{l.name}{l.will_create && <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-brand/10 text-brand">new</span>}{l.merged_from.length > 0 && <span className="block text-[11px] text-stone">merged: {l.merged_from.join(', ')}</span>}</span>
                      <span className="text-stone tabular-nums">{l.count}</span>
                    </div>
                  ))}
                </div>
              </details>

              {preview.flagged_total > 0 && (
                <details className="mt-3 border border-stone/15 rounded-2xl">
                  <summary className="px-4 py-3 text-sm font-medium text-brand-dark cursor-pointer">Rows to look at ({preview.flagged_total})</summary>
                  <div className="max-h-64 overflow-auto px-4 pb-3 text-xs">
                    {preview.flagged.filter((r: any) => r.attention || r.reclassified).map((r: any) => (
                      <div key={`${r.sheet}${r.row}`} className="py-1.5 border-b border-stone/10">
                        <span className="font-mono text-brand">{r.tag}</span> · {r.name} <span className="text-stone">({r.sheet.trim()} row {r.row})</span>
                        {r.warnings.concat(r.reclassified ? [r.reclassified] : []).map((m: string, i: number) => <div key={i} className="text-stone">{m}</div>)}
                      </div>
                    ))}
                    <p className="text-stone pt-2">Rows with only a missing location are not listed here.</p>
                  </div>
                </details>
              )}

              {s.stock.ready > 0 && (
                <label className="flex items-start gap-3 text-sm text-stone mt-4">
                  <input type="checkbox" checked={includeStock} onChange={e => setIncludeStock(e.target.checked)} className="h-4 w-4 mt-0.5 accent-brand" />
                  <span>Also add the <strong className="text-brand-dark">{s.stock.ready}</strong> stock &amp; consumables lines to Inventory, with an opening balance.</span>
                </label>
              )}

              <div className="mt-5 flex gap-3">
                <button onClick={run} disabled={importing || (s.assets.ready === 0 && !(includeStock && s.stock.ready > 0))}
                  className="flex-1 py-2.5 rounded-xl bg-brand text-cream font-semibold hover:bg-brand-dark transition disabled:opacity-50">
                  {importing ? 'Importing…' : s.assets.ready === 0 && s.stock.ready === 0 ? 'Everything is already in the system' : `Import ${s.assets.ready} assets`}
                </button>
                <button onClick={onClose} disabled={importing} className="px-6 py-2.5 rounded-xl border border-stone/25 text-brand font-semibold hover:bg-stone/5 transition">Cancel</button>
              </div>
              <p className="text-xs text-stone mt-2 text-center">Running the same workbook again is safe: items already imported are skipped.</p>
            </>
          )}
        </>
      )}
    </Shell>
  );
}

// ── Locations: rename, merge spellings, add ───────────────────────────────────
export function LocationsDialog({ onClose, onChanged }: { onClose: () => void; onChanged: () => void }) {
  const [locations, setLocations] = useState<any[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [merging, setMerging] = useState<string | null>(null);
  const [mergeInto, setMergeInto] = useState('');
  const [adding, setAdding] = useState('');

  const load = () => assetsApi.locations().then(r => setLocations(r.data.locations)).catch(() => toast.error('Could not load the locations'));
  useEffect(() => { load(); }, []);
  const done = (msg: string) => { toast.success(msg); setEditing(null); setMerging(null); load(); onChanged(); };
  const fail = (e: any) => toast.error(e?.response?.data?.error || 'That did not work');

  return (
    <Shell title="Locations" onClose={onClose} subtitle="Where assets are kept. If the same place is spelled two ways, merge them: everything moves across.">
      <div className="flex gap-2 mb-4">
        <input value={adding} onChange={e => setAdding(e.target.value)} placeholder="Add a location…" className={input} />
        <button onClick={() => adding.trim() && assetsApi.createLocation(adding).then(() => { setAdding(''); done('Added'); }).catch(fail)} className="px-4 rounded-xl bg-brand text-cream text-sm font-semibold hover:bg-brand-dark transition shrink-0">Add</button>
      </div>
      <div className="divide-y divide-stone/10 border border-stone/15 rounded-2xl max-h-[55vh] overflow-y-auto">
        {locations.map(l => (
          <div key={l.id} className="px-4 py-2.5 text-sm">
            {editing === l.id ? (
              <div className="flex gap-2">
                <input value={name} onChange={e => setName(e.target.value)} autoFocus className={input} />
                <button onClick={() => assetsApi.renameLocation(l.id, name).then(() => done('Renamed')).catch(fail)} className="px-3 rounded-xl bg-brand text-cream text-xs font-semibold">Save</button>
                <button onClick={() => setEditing(null)} className="px-3 rounded-xl border border-stone/25 text-xs">Cancel</button>
              </div>
            ) : merging === l.id ? (
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-stone">Move everything in <strong className="text-brand-dark">{l.name}</strong> to</span>
                <select value={mergeInto} onChange={e => setMergeInto(e.target.value)} className={`${input} !w-auto`}>
                  <option value="">Choose…</option>
                  {locations.filter(x => x.id !== l.id).map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
                </select>
                <button disabled={!mergeInto} onClick={() => assetsApi.mergeLocation(l.id, mergeInto).then(r => done(r.data.message)).catch(fail)} className="px-3 py-2 rounded-xl bg-brand text-cream text-xs font-semibold disabled:opacity-50">Merge</button>
                <button onClick={() => setMerging(null)} className="px-3 py-2 rounded-xl border border-stone/25 text-xs">Cancel</button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <span className="text-brand-dark">{l.name} <span className="text-stone text-xs">· {l.count} asset{l.count === 1 ? '' : 's'}</span></span>
                <span className="flex gap-3 text-xs shrink-0">
                  <button onClick={() => { setEditing(l.id); setName(l.name); }} className="text-brand hover:underline">Rename</button>
                  <button onClick={() => { setMerging(l.id); setMergeInto(''); }} className="text-brand hover:underline">Merge</button>
                  {l.count === 0 && <button onClick={() => assetsApi.deleteLocation(l.id).then(() => done('Removed')).catch(fail)} className="text-red-600 hover:underline">Remove</button>}
                </span>
              </div>
            )}
          </div>
        ))}
        {locations.length === 0 && <div className="px-4 py-8 text-center text-sm text-stone">No locations yet.</div>}
      </div>
      <button onClick={onClose} className="mt-4 w-full py-2.5 rounded-xl border border-stone/25 text-brand font-semibold hover:bg-stone/5 transition">Close</button>
    </Shell>
  );
}


// ── Items received on a verified GRN, waiting to be tagged ────────────────────
// Tag numbers are permanent, so a person confirms the quantity and adds serial numbers and locations first.
export function ToTagDialog({ options, onClose, onChanged }: { options: any; onClose: () => void; onChanged: () => void }) {
  const [lines, setLines] = useState<any[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [count, setCount] = useState(1);
  const [serials, setSerials] = useState<string[]>([]);
  const [shared, setShared] = useState<any>({});
  const [saving, setSaving] = useState(false);

  const load = () => assetsApi.toTag().then(r => setLines(r.data.lines)).catch(() => { toast.error('Could not load the items waiting to be tagged'); onClose(); });
  useEffect(() => { load(); }, []);

  const start = (l: any) => {
    setOpen(l.id); setCount(l.remaining); setSerials([]); setShared({ tag_prefix: l.tag_options?.[0]?.prefix || '' });
  };
  const setSerial = (i: number, v: string) => setSerials(s => { const n = [...s]; n[i] = v; return n; });

  const submit = async (l: any) => {
    setSaving(true);
    try {
      const body: any = {
        units: Array.from({ length: count }, (_, i) => ({ serial_number: serials[i] || '' })),
        shared: Object.fromEntries(Object.entries(shared).filter(([, v]) => v !== '' && v != null)),
      };
      const r = await assetsApi.registerReceived(l.id, body);
      toast.success(r.data.message);
      setOpen(null); onChanged(); await load();
    } catch (e: any) { toast.error(e?.response?.data?.error || 'Could not tag the items'); }
    finally { setSaving(false); }
  };

  return (
    <Shell title="Ready to tag" onClose={onClose} wide subtitle="Received on verified GRNs. Confirm how many to tag and add serial numbers; each item gets the next tag number, and its cost, date, supplier and LPO are filled in from the purchase.">
      {!lines ? <p className="py-10 text-center text-sm text-stone">Loading…</p> : lines.length === 0 ? (
        <p className="py-10 text-center text-sm text-stone">Nothing is waiting. Assets bought through procurement appear here once their GRN is verified.</p>
      ) : (
        <div className="space-y-3 mt-3">
          {lines.map(l => {
            const prefixes = l.tag_options || [];
            const pick = prefixes.find((p: any) => p.prefix === shared.tag_prefix) || prefixes[0];
            return (
              <div key={l.id} className="rounded-xl border border-stone/15 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-brand-dark">{l.item_name} <span className="text-stone font-normal text-sm">· {l.remaining} to tag{l.tagged > 0 ? ` (${l.tagged} of ${l.accepted} done)` : ''}</span></div>
                    <div className="text-xs text-stone mt-0.5">{l.grn_no} · {l.lpo_no}{l.supplier ? ` · ${l.supplier}` : ''} · {money(l.unit_price)} each · next tag <span className="font-mono">{prefixes[0]?.next_tag}</span></div>
                  </div>
                  {open !== l.id && <button onClick={() => start(l)} className="px-4 py-2 rounded-xl bg-brand text-cream text-sm font-semibold hover:bg-brand-dark transition">Tag these</button>}
                </div>

                {open === l.id && (
                  <div className="mt-4 border-t border-stone/10 pt-4">
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div>
                        <label className={label}>How many to tag now</label>
                        <input type="number" min={1} max={l.remaining} value={count} onChange={e => setCount(Math.max(1, Math.min(l.remaining, parseInt(e.target.value) || 1)))} className={input} />
                      </div>
                      <div>
                        <label className={label}>Where they are</label>
                        <select value={shared.location_id || ''} onChange={e => setShared({ ...shared, location_id: e.target.value, original_location_id: e.target.value })} className={input}>
                          <option value="">Not placed yet</option>
                          {(options?.locations || []).map((x: any) => <option key={x.id} value={x.id}>{x.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={label}>Condition</label>
                        <select value={shared.condition || ''} onChange={e => setShared({ ...shared, condition: e.target.value })} className={input}>
                          <option value="">Not recorded</option>
                          {(options?.conditions || []).map((c: string) => <option key={c} value={c}>{CONDITION_LABEL[c] || c}</option>)}
                        </select>
                      </div>
                      <div><label className={label}>Make &amp; model</label><input value={shared.make_model || ''} onChange={e => setShared({ ...shared, make_model: e.target.value })} className={input} /></div>
                      <div><label className={label}>Source of funds</label><input value={shared.source_of_funds || ''} onChange={e => setShared({ ...shared, source_of_funds: e.target.value })} placeholder="e.g. MOE" className={input} /></div>
                      <div><label className={label}>Depreciation rate (% a year)</label><input type="number" min={0} value={shared.depreciation_rate || ''} onChange={e => setShared({ ...shared, depreciation_rate: e.target.value })} className={input} /></div>
                      <div><label className={label}>Responsible officer</label><input value={shared.responsible_officer || ''} onChange={e => setShared({ ...shared, responsible_officer: e.target.value })} className={input} /></div>
                      <div><label className={label}>PV number</label><input value={shared.pv_number || ''} onChange={e => setShared({ ...shared, pv_number: e.target.value })} className={input} /></div>
                      {prefixes.length > 1 && (
                        <div>
                          <label className={label}>Tag series</label>
                          <select value={shared.tag_prefix || ''} onChange={e => setShared({ ...shared, tag_prefix: e.target.value })} className={input}>
                            {prefixes.map((p: any) => <option key={p.prefix} value={p.prefix}>{p.prefix} (next {p.next_tag.slice(p.prefix.length)})</option>)}
                          </select>
                        </div>
                      )}
                    </div>

                    <div className="mt-4">
                      <label className={label}>Serial numbers <span className="font-normal text-stone">(optional, one per item)</span></label>
                      <div className="grid sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                        {Array.from({ length: Math.min(count, 60) }, (_, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="font-mono text-[11px] text-brand w-40 shrink-0 truncate">{pick ? `${pick.prefix}${String(parseInt(pick.next_tag.slice(pick.prefix.length)) + i).padStart(3, '0')}` : `#${i + 1}`}</span>
                            <input value={serials[i] || ''} onChange={e => setSerial(i, e.target.value)} placeholder="Serial number" className={`${input} !py-1.5`} />
                          </div>
                        ))}
                      </div>
                      {count > 60 && <p className="text-xs text-stone mt-1">Serial numbers can be added later in each asset for the rest.</p>}
                    </div>

                    <div className="flex gap-3 mt-5">
                      <button disabled={saving} onClick={() => submit(l)} className="flex-1 py-2.5 rounded-xl bg-brand text-cream font-semibold hover:bg-brand-dark transition disabled:opacity-60">{saving ? 'Tagging…' : `Tag ${count} ${count === 1 ? 'item' : 'items'}`}</button>
                      <button onClick={() => setOpen(null)} className="px-5 py-2.5 rounded-xl border border-stone/25 text-brand font-semibold hover:bg-stone/5 transition">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <button onClick={onClose} className="w-full mt-5 py-2.5 rounded-xl border border-stone/25 text-brand font-semibold hover:bg-stone/5 transition">Close</button>
    </Shell>
  );
}
