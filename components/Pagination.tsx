'use client';

const PAGE_SIZES = [15, 25, 50, 100];

// 1 … 4 5 [6] 7 8 … 20
const pageWindow = (page: number, pages: number): (number | '…')[] => {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const out: (number | '…')[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(pages - 1, page + 1);
  if (start > 2) out.push('…');
  for (let p = start; p <= end; p++) out.push(p);
  if (end < pages - 1) out.push('…');
  out.push(pages);
  return out;
};

export default function Pagination({
  page, pageSize, total, onPage, onPageSize, sizes = PAGE_SIZES,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (p: number) => void;
  onPageSize?: (n: number) => void;
  sizes?: number[];
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const btn = 'min-w-[2rem] px-2.5 py-1 rounded-lg border text-sm transition disabled:opacity-40';

  return (
    <div className="px-4 py-3 border-t border-stone/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-stone">
      <div className="flex items-center gap-3">
        <span>{total === 0 ? 'No results' : <>Showing <strong className="text-brand-dark">{from}–{to}</strong> of <strong className="text-brand-dark">{total.toLocaleString()}</strong></>}</span>
        {onPageSize && (
          <label className="flex items-center gap-1.5">
            <span className="hidden sm:inline">Per page</span>
            <select
              value={pageSize}
              onChange={e => onPageSize(parseInt(e.target.value))}
              className="px-2 py-1 rounded-lg border border-stone/25 bg-white text-sm focus:outline-none focus:border-brand"
            >
              {sizes.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button disabled={page <= 1} onClick={() => onPage(page - 1)} className={`${btn} border-stone/25 hover:border-brand`}>← Prev</button>
        {pageWindow(page, pages).map((p, i) =>
          p === '…' ? (
            <span key={`gap${i}`} className="px-1.5">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p)}
              aria-current={p === page ? 'page' : undefined}
              className={`${btn} ${p === page ? 'bg-brand text-cream border-brand font-semibold' : 'border-stone/25 hover:border-brand'}`}
            >
              {p}
            </button>
          )
        )}
        <button disabled={page >= pages} onClick={() => onPage(page + 1)} className={`${btn} border-stone/25 hover:border-brand`}>Next →</button>
      </div>
    </div>
  );
}
