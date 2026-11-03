'use client';
import { useEffect, useMemo, useState } from 'react';
import { assetsApi } from '@/lib/services';
import { useDebounced } from '@/lib/hooks';
import Pagination from '@/components/Pagination';
import { FilterPanel, FilterSearch, FilterSelect } from '@/components/ListFilters';
import { AssetFormDialog, AssetDetailDialog, AssetImportDialog, LocationsDialog, ToTagDialog, CONDITION_LABEL, money } from '@/components/AssetDialogs';
import { toast } from 'sonner';

const EMPTY = { search: '', category: '', location_id: '', condition: '', status: 'ACTIVE', needs_valuation: false, attention: false };

const CONDITION_STYLE: Record<string, string> = {
  GOOD: 'bg-green-100 text-green-800',
  FAIR: 'bg-yellow-100 text-yellow-800',
  POOR: 'bg-orange-100 text-orange-800',
  UNSERVICEABLE: 'bg-red-100 text-red-800',
};

// A quick-filter tile: a number that is also a shortcut to the list behind it
function Tile({ label, value, hint, active, onClick, tone = 'text-brand-dark' }: { label: string; value: number | string; hint?: string; active?: boolean; onClick?: () => void; tone?: string }) {
  const body = (
    <>
      <div className="text-sm text-stone">{label}</div>
      <div className={`font-display text-2xl font-semibold mt-1 ${tone}`}>{typeof value === 'number' ? value.toLocaleString() : value}</div>
      {hint && <div className="text-xs text-stone mt-1">{hint}</div>}
    </>
  );
  return onClick ? (
    <button onClick={onClick} aria-pressed={active} className={`text-left bg-white rounded-2xl border p-5 shadow-sm transition hover:border-brand ${active ? 'border-brand ring-2 ring-brand/20' : 'border-stone/10'}`}>{body}</button>
  ) : (
    <div className="bg-white rounded-2xl border border-stone/10 p-5 shadow-sm">{body}</div>
  );
}

export default function AssetRegister() {
  const [summary, setSummary] = useState<any>(null);
  const [options, setOptions] = useState<any>(null);
  const [assetClass, setAssetClass] = useState('');
  const [filters, setFilters] = useState(EMPTY);
  const debounced = useDebounced(filters.search);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<null | { type: 'form'; asset?: any } | { type: 'detail'; id: string } | { type: 'import' } | { type: 'locations' } | { type: 'totag' }>(null);

  const loadMeta = () => {
    assetsApi.summary().then(r => setSummary(r.data)).catch(() => { });
    assetsApi.options().then(r => setOptions(r.data)).catch(() => { });
  };
  useEffect(loadMeta, []);

  const params = useMemo(() => {
    const p: any = { page, limit: pageSize };
    if (assetClass) p.asset_class = assetClass;
    const f: any = { ...filters, search: debounced };
    Object.entries(f).forEach(([k, v]) => { if (v !== '' && v !== false) p[k] = String(v); });
    return p;
  }, [page, pageSize, assetClass, filters, debounced]);

  const load = () => {
    setLoading(true);
    assetsApi.getAll(params).then(r => setData(r.data)).catch(() => toast.error('Could not load the assets')).finally(() => setLoading(false));
  };
  useEffect(load, [params]);
  const refresh = () => { load(); loadMeta(); };

  const setFilter = (k: keyof typeof EMPTY, v: any) => { setFilters(f => ({ ...f, [k]: v })); setPage(1); };
  const pickClass = (c: string) => { setAssetClass(c); setFilters(f => ({ ...f, category: '' })); setPage(1); };
  const activeCount = [filters.search, filters.category, filters.location_id, filters.condition, filters.needs_valuation, filters.attention].filter(Boolean).length + (filters.status !== 'ACTIVE' ? 1 : 0);
  const categories = (options?.categories || []).filter((c: any) => !assetClass || c.asset_class === assetClass);
  const empty = summary && summary.total_active === 0 && (data?.pagination?.total ?? 0) === 0;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="font-display text-xl text-brand-dark">Asset register</h2>
          <p className="text-sm text-stone">Everything the college owns that is tagged and tracked. Consumables are in Inventory.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setDialog({ type: 'locations' })} className="px-4 py-2 rounded-xl border border-stone/25 text-brand text-sm font-semibold hover:bg-stone/5 transition">📍 Locations</button>
          <button onClick={() => setDialog({ type: 'import' })} className="px-4 py-2 rounded-xl border border-brand/40 text-brand text-sm font-semibold hover:bg-brand/5 transition">⬆ Import workbook</button>
          <button onClick={() => setDialog({ type: 'form' })} className="px-4 py-2 rounded-xl bg-brand text-cream text-sm font-semibold hover:bg-brand-dark transition">+ Register asset</button>
        </div>
      </div>

      {summary?.to_tag > 0 && (
        <button onClick={() => setDialog({ type: 'totag' })} className="w-full text-left mb-5 flex items-center justify-between gap-3 rounded-2xl border border-gold/50 bg-gold/10 px-5 py-4 hover:bg-gold/15 transition">
          <span><span className="font-semibold text-brand-dark">{summary.to_tag} item{summary.to_tag === 1 ? '' : 's'} received and ready to tag</span><span className="block text-xs text-stone">Bought through procurement and verified on a GRN. Give them tag numbers, serial numbers and a location.</span></span>
          <span className="text-sm font-semibold text-brand whitespace-nowrap">Tag them →</span>
        </button>
      )}

      {empty ? (
        <div className="bg-white rounded-2xl border border-stone/10 shadow-sm p-10 text-center">
          <div className="text-4xl mb-2">🏷️</div>
          <h3 className="font-display text-lg text-brand-dark">The register is empty</h3>
          <p className="text-sm text-stone mt-1 mb-5 max-w-md mx-auto">Import the asset registers workbook to load everything already recorded in it, or register items one at a time.</p>
          <button onClick={() => setDialog({ type: 'import' })} className="px-5 py-2.5 rounded-xl bg-brand text-cream font-semibold hover:bg-brand-dark transition">Import the workbook</button>
        </div>
      ) : (
        <>
          {/* ── The register at a glance; the amber tiles are shortcuts to what needs work ── */}
          {summary && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-5">
              <Tile label="Assets in use" value={summary.total_active} hint={`${summary.by_status.filter((s: any) => s.status !== 'ACTIVE').reduce((a: number, s: any) => a + s.count, 0)} disposed or written off`} />
              <Tile label="Need valuation" value={summary.needs_valuation} tone={summary.needs_valuation ? 'text-amber-700' : 'text-brand-dark'} hint="No cost entered yet" active={filters.needs_valuation} onClick={() => setFilter('needs_valuation', !filters.needs_valuation)} />
              <Tile label="Need attention" value={summary.needs_attention} tone={summary.needs_attention ? 'text-amber-700' : 'text-brand-dark'} hint="e.g. a duplicated tag to relabel" active={filters.attention} onClick={() => setFilter('attention', !filters.attention)} />
              <Tile label="No location" value={summary.without_location} tone={summary.without_location ? 'text-amber-700' : 'text-brand-dark'} hint="Not placed anywhere yet" active={filters.location_id === 'none'} onClick={() => setFilter('location_id', filters.location_id === 'none' ? '' : 'none')} />
            </div>
          )}

          {/* ── Type tabs ── */}
          <div className="flex gap-1 overflow-x-auto border-b border-stone/15 mb-4" role="tablist">
            {[{ key: '', label: 'All', count: summary?.total_active }, ...(summary?.by_class || [])].map((c: any) => (
              <button key={c.key} role="tab" aria-selected={assetClass === c.key} onClick={() => pickClass(c.key)}
                className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition ${assetClass === c.key ? 'border-brand text-brand' : 'border-transparent text-stone hover:text-brand-dark'}`}>
                {c.label} {c.count != null && <span className="text-stone font-normal">({c.count.toLocaleString()})</span>}
              </button>
            ))}
          </div>

          <FilterPanel active={activeCount} onClear={() => { setFilters(EMPTY); setPage(1); }}>
            <FilterSearch className="sm:col-span-2" value={filters.search} onChange={v => setFilter('search', v)} placeholder="Tag number, description, make, serial, officer…" />
            <FilterSelect label="Item type" value={filters.category} onChange={v => setFilter('category', v)}>
              <option value="">All item types</option>
              {categories.map((c: any) => <option key={c.asset_class + c.name} value={c.name}>{c.name} ({c.count})</option>)}
            </FilterSelect>
            <FilterSelect label="Location" value={filters.location_id} onChange={v => setFilter('location_id', v)}>
              <option value="">All locations</option>
              <option value="none">No location yet</option>
              {(options?.locations || []).map((l: any) => <option key={l.id} value={l.id}>{l.name} ({l.count})</option>)}
            </FilterSelect>
            <FilterSelect label="Condition" value={filters.condition} onChange={v => setFilter('condition', v)}>
              <option value="">Any</option>
              {(options?.conditions || []).map((c: string) => <option key={c} value={c}>{CONDITION_LABEL[c] || c}</option>)}
              <option value="none">Not recorded</option>
            </FilterSelect>
            <FilterSelect label="Status" value={filters.status} onChange={v => setFilter('status', v)}>
              <option value="ACTIVE">In use</option>
              <option value="DISPOSED">Disposed</option>
              <option value="WRITTEN_OFF">Written off</option>
              <option value="">All</option>
            </FilterSelect>
          </FilterPanel>

          <div className={`bg-white rounded-2xl border border-stone/10 shadow-sm overflow-hidden transition-opacity ${loading && data ? 'opacity-60' : ''}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-cream-deep text-stone text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 text-left">Tag</th>
                    <th className="px-4 py-3 text-left">Item</th>
                    <th className="px-4 py-3 text-left">Location</th>
                    <th className="px-4 py-3 text-left">Condition</th>
                    <th className="px-4 py-3 text-right">Value</th>
                    <th className="px-4 py-3 text-right"> </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone/10">
                  {(data?.assets || []).map((a: any) => {
                    const v = a.valuation;
                    return (
                      <tr key={a.id} className="hover:bg-cream-deep/50 transition cursor-pointer" onClick={() => setDialog({ type: 'detail', id: a.id })}>
                        <td className="px-4 py-3 font-mono text-xs text-brand whitespace-nowrap">
                          {a.attention && <span className="mr-1" title="Needs attention" aria-label="Needs attention">⚠️</span>}{a.asset_code}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-brand-dark">{a.name}</div>
                          <div className="text-xs text-stone">{[a.make_model, a.serial_number && `S/N ${a.serial_number}`].filter(Boolean).join(' · ') || (a.status !== 'ACTIVE' ? (a.status === 'DISPOSED' ? 'Disposed' : 'Written off') : '')}</div>
                        </td>
                        <td className="px-4 py-3 text-stone">{a.current_location?.name || <span className="text-amber-700 text-xs">No location</span>}</td>
                        <td className="px-4 py-3">{a.condition ? <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CONDITION_STYLE[a.condition]}`}>{CONDITION_LABEL[a.condition]}</span> : <span className="text-stone text-xs">—</span>}</td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {v.state === 'VALUED' ? <span title={`Cost ${money(v.cost)}`} className="tabular-nums">{money(v.net_book_value)}</span>
                            : v.state === 'NEEDS_COST' ? <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Needs valuation</span>
                              : <span className="text-xs text-amber-700" title="Cost is known, but not the date or depreciation rate">Cost {money(v.cost)}</span>}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <button onClick={e => { e.stopPropagation(); setDialog({ type: 'form', asset: a }); }} className="text-xs text-brand hover:underline font-medium">Edit</button>
                        </td>
                      </tr>
                    );
                  })}
                  {data && data.assets.length === 0 && <tr><td colSpan={6} className="px-4 py-12 text-center text-stone">No assets match these filters.</td></tr>}
                  {!data && <tr><td colSpan={6} className="px-4 py-12 text-center text-stone">Loading…</td></tr>}
                </tbody>
              </table>
            </div>
            <Pagination page={page} pageSize={pageSize} total={data?.pagination?.total || 0} onPage={setPage} onPageSize={n => { setPageSize(n); setPage(1); }} sizes={[25, 50, 100]} />
          </div>

          {summary?.valued_assets > 0 && (
            <p className="text-xs text-stone mt-3">
              {summary.valued_assets} valued asset{summary.valued_assets === 1 ? '' : 's'}: cost {money(summary.total_cost)}, net book value {money(summary.total_net_book_value)}. Depreciation is worked out from cost, date and rate, so it is always up to date.
            </p>
          )}
        </>
      )}

      {dialog?.type === 'form' && <AssetFormDialog asset={dialog.asset} options={options} defaultClass={assetClass || undefined} onClose={() => setDialog(null)} onSaved={refresh} />}
      {dialog?.type === 'detail' && <AssetDetailDialog assetId={dialog.id} onClose={() => setDialog(null)} onEdit={a => setDialog({ type: 'form', asset: a })} onChanged={refresh} />}
      {dialog?.type === 'import' && <AssetImportDialog onClose={() => setDialog(null)} onDone={refresh} />}
      {dialog?.type === 'totag' && <ToTagDialog options={options} onClose={() => setDialog(null)} onChanged={refresh} />}
      {dialog?.type === 'locations' && <LocationsDialog onClose={() => setDialog(null)} onChanged={refresh} />}
    </div>
  );
}
