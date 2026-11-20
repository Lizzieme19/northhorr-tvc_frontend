'use client';
import { useEffect, useMemo, useState } from 'react';
import { auditApi } from '@/lib/services';
import { useDebounced } from '@/lib/hooks';
import Pagination from '@/components/Pagination';
import { FilterPanel, FilterSelect, FilterSearch, FilterDate } from '@/components/ListFilters';
import { toast } from 'sonner';

// What each signed-in person has done: sign-ins, every create / change / delete, downloads and exports.
// Admin only. Entries are only ever added, never edited or removed.

const EMPTY = { search: '', user_id: '', role: '', action: '', entity_type: '', outcome: '', from: '', to: '' };

const ACTION_STYLE: Record<string, string> = {
  LOGIN: 'bg-green-100 text-green-800', LOGOUT: 'bg-stone/15 text-stone', LOGIN_FAILED: 'bg-red-100 text-red-800',
  CREATE: 'bg-sky-100 text-sky-800', UPDATE: 'bg-amber-100 text-amber-800', DELETE: 'bg-red-100 text-red-800', DOWNLOAD: 'bg-purple-100 text-purple-800',
};
const nice = (s: string) => s.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase());
const when = (d: string) => new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
const prettyJson = (t?: string | null) => { if (!t) return null; try { return JSON.stringify(JSON.parse(t), null, 2); } catch { return t; } };

export default function ActivityLog() {
  const [filters, setFilters] = useState(EMPTY);
  const debounced = useDebounced(filters.search);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [data, setData] = useState<any>(null);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<any>(null);

  useEffect(() => { auditApi.filters().then(r => setMeta(r.data)).catch(() => { }); }, []);

  const params = useMemo(() => {
    const p: Record<string, string> = { page: String(page), limit: String(pageSize) };
    Object.entries({ ...filters, search: debounced }).forEach(([k, v]) => { if (v) p[k] = String(v); });
    return p;
  }, [filters, debounced, page, pageSize]);

  useEffect(() => {
    setLoading(true);
    auditApi.list(params).then(r => setData(r.data)).catch(() => toast.error('Could not load the activity log')).finally(() => setLoading(false));
  }, [params]);

  const set = (k: keyof typeof EMPTY, v: string) => { setFilters(f => ({ ...f, [k]: v })); setPage(1); };
  const active = Object.entries(filters).filter(([k, v]) => k !== 'search' && v).length + (filters.search ? 1 : 0);

  const exportXlsx = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('ntvc_access_token') : '';
      const { page: _p, limit: _l, ...rest } = params;
      const res = await fetch(auditApi.exportUrl(rest), { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `Activity_log_${new Date().toISOString().slice(0, 10)}.xlsx`; a.click(); URL.revokeObjectURL(a.href);
    } catch { toast.error('Could not export the activity log'); }
  };

  const entries: any[] = data?.entries || [];
  const failed = (e: any) => e.action === 'LOGIN_FAILED' || (e.status_code ?? 0) >= 400;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <h1 className="font-display text-2xl text-brand-dark">Activity log</h1>
          <p className="text-sm text-stone">Everything signed-in people do: sign-ins, every create, change and delete, and downloads. Only admins can see this, and entries cannot be changed or removed.</p>
        </div>
        <button onClick={exportXlsx} className="px-4 py-2 rounded-xl border border-brand/40 text-brand text-sm font-semibold hover:bg-brand/5 transition">⬇ Export to Excel</button>
      </div>

      {meta && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5">
          <div className="bg-white rounded-2xl border border-stone/10 p-4 shadow-sm"><div className="text-xs text-stone">Entries recorded</div><div className="text-2xl font-bold text-brand-dark">{meta.total.toLocaleString()}</div></div>
          <div className="bg-white rounded-2xl border border-stone/10 p-4 shadow-sm"><div className="text-xs text-stone">Refused or failed, last 24 hours</div><div className={`text-2xl font-bold ${meta.failed_last_24h ? 'text-red-600' : 'text-brand-dark'}`}>{meta.failed_last_24h}</div></div>
          <div className="bg-white rounded-2xl border border-stone/10 p-4 shadow-sm hidden sm:block"><div className="text-xs text-stone">People who have been active</div><div className="text-2xl font-bold text-brand-dark">{meta.users.length}</div></div>
        </div>
      )}

      <FilterPanel active={active} onClear={() => { setFilters(EMPTY); setPage(1); }}>
        <FilterSearch className="sm:col-span-2" value={filters.search} onChange={v => set('search', v)} placeholder="Person, what they did, address or IP…" />
        <FilterSelect label="Person" value={filters.user_id} onChange={v => set('user_id', v)}>
          <option value="">Everyone</option>
          {(meta?.users || []).map((u: any) => <option key={u.id} value={u.id}>{u.email} ({u.count})</option>)}
        </FilterSelect>
        <FilterSelect label="Role" value={filters.role} onChange={v => set('role', v)}>
          <option value="">All roles</option>
          {(meta?.roles || []).map((r: any) => <option key={r.value} value={r.value}>{nice(r.value)}</option>)}
        </FilterSelect>
        <FilterSelect label="Action" value={filters.action} onChange={v => set('action', v)}>
          <option value="">All actions</option>
          {(meta?.actions || []).map((a: any) => <option key={a.value} value={a.value}>{nice(a.value)} ({a.count})</option>)}
        </FilterSelect>
        <FilterSelect label="About" value={filters.entity_type} onChange={v => set('entity_type', v)}>
          <option value="">Everything</option>
          {(meta?.entity_types || []).map((a: any) => <option key={a.value} value={a.value}>{nice(a.value)} ({a.count})</option>)}
        </FilterSelect>
        <FilterSelect label="Result" value={filters.outcome} onChange={v => set('outcome', v)}>
          <option value="">Any</option>
          <option value="ok">Went through</option>
          <option value="failed">Refused or failed</option>
        </FilterSelect>
        <FilterDate label="From" value={filters.from} onChange={v => set('from', v)} />
        <FilterDate label="To" value={filters.to} onChange={v => set('to', v)} />
      </FilterPanel>

      <div className="bg-white rounded-2xl border border-stone/10 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[820px]">
            <thead className="bg-cream-deep text-stone text-xs uppercase tracking-wider">
              <tr><th className="text-left px-4 py-3">When</th><th className="text-left px-4 py-3">Who</th><th className="text-left px-4 py-3">What they did</th><th className="text-left px-4 py-3">About</th><th className="text-left px-4 py-3">IP address</th></tr>
            </thead>
            <tbody className="divide-y divide-stone/10">
              {loading && entries.length === 0 ? <tr><td colSpan={5} className="px-4 py-10 text-center text-stone">Loading…</td></tr>
                : entries.length === 0 ? <tr><td colSpan={5} className="px-4 py-10 text-center text-stone">{active ? 'Nothing matches these filters.' : 'Nothing has been recorded yet. Entries appear as people use the system.'}</td></tr>
                : entries.map(e => (
                  <tr key={e.id} onClick={() => setOpen(e)} className={`cursor-pointer hover:bg-cream-deep/50 ${failed(e) ? 'bg-red-50/40' : ''}`}>
                    <td className="px-4 py-2.5 whitespace-nowrap text-xs text-stone">{when(e.created_at)}</td>
                    <td className="px-4 py-2.5"><div className="text-brand-dark">{e.user?.email || e.actor || '—'}</div>{e.role && <div className="text-[11px] text-stone">{nice(e.role)}</div>}</td>
                    <td className="px-4 py-2.5"><span className={`mr-2 px-2 py-0.5 rounded-full text-[10px] font-semibold ${ACTION_STYLE[e.action] || 'bg-stone/15 text-stone'}`}>{nice(e.action)}</span><span className={failed(e) ? 'text-red-700' : 'text-brand-dark'}>{e.summary || nice(e.action)}</span></td>
                    <td className="px-4 py-2.5 text-stone">{nice(e.entity_type)}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-stone">{e.ip_address || '—'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <div className="p-3 border-t border-stone/10">
          <Pagination page={page} pageSize={pageSize} total={data?.pagination?.total || 0} onPage={setPage} onPageSize={n => { setPageSize(n); setPage(1); }} sizes={[25, 50, 100, 200]} />
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 py-8" onClick={() => setOpen(null)}>
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-2xl shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-1"><h2 className="font-display text-xl text-brand-dark">{open.summary || nice(open.action)}</h2><button onClick={() => setOpen(null)} className="text-stone hover:text-brand" aria-label="Close">✕</button></div>
            <p className="text-sm text-stone mb-4">{when(open.created_at)}</p>
            <dl className="text-sm divide-y divide-stone/10">
              {[
                ['Who', open.user?.email || open.actor], ['Role', open.role && nice(open.role)], ['Action', nice(open.action)], ['About', nice(open.entity_type)], ['Record', open.entity_id],
                ['Request', open.method && `${open.method} ${open.path}`], ['Result', open.status_code], ['Took', open.duration_ms != null ? `${open.duration_ms} ms` : null], ['IP address', open.ip_address], ['Browser', open.user_agent],
              ].filter(([, v]) => v !== null && v !== undefined && v !== '').map(([k, v]) => (
                <div key={String(k)} className="flex justify-between gap-4 py-2"><dt className="text-stone shrink-0">{k}</dt><dd className="text-brand-dark text-right break-all">{String(v)}</dd></div>
              ))}
            </dl>
            {open.new_values && (<><div className="text-xs font-semibold text-brand-dark uppercase tracking-wide mt-4 mb-1">What was sent</div><pre className="text-xs bg-cream-deep rounded-xl p-3 overflow-auto max-h-56 whitespace-pre-wrap">{prettyJson(open.new_values)}</pre><p className="text-[11px] text-stone mt-1">Passwords, tokens and secrets are never stored.</p></>)}
            {open.old_values && (<><div className="text-xs font-semibold text-brand-dark uppercase tracking-wide mt-4 mb-1">Before the change</div><pre className="text-xs bg-cream-deep rounded-xl p-3 overflow-auto max-h-40 whitespace-pre-wrap">{prettyJson(open.old_values)}</pre></>)}
            <button onClick={() => setOpen(null)} className="w-full mt-5 py-2.5 rounded-xl border border-stone/25 text-brand font-semibold hover:bg-stone/5 transition">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
