'use client';
import { useEffect, useRef, useState } from 'react';
import { studentsApi } from '@/lib/services';
import { useDebounced } from '@/lib/hooks';

const name = (s: any) => `${s.application?.surname || ''} ${s.application?.other_names || ''}`.trim();

// Search-as-you-type student chooser. Queries the server for the matches, so it works with any number
// of students instead of loading the whole list into a dropdown.
export default function StudentPicker({
  value, onChange, placeholder = 'Search by admission no or name…', required = false,
}: {
  value: any | null;
  onChange: (student: any | null) => void;
  placeholder?: string;
  required?: boolean;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const debounced = useDebounced(query);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debounced.trim().length < 2) { setResults([]); return; }
    let cancelled = false;
    setSearching(true);
    studentsApi.getAll({ search: debounced.trim(), limit: 10 })
      .then(r => { if (!cancelled) setResults(r.data.students || []); })
      .catch(() => { if (!cancelled) setResults([]); })
      .finally(() => { if (!cancelled) setSearching(false); });
    return () => { cancelled = true; };
  }, [debounced]);

  useEffect(() => {
    const close = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  if (value) {
    return (
      <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-brand/40 bg-brand/5 text-sm">
        <div className="min-w-0">
          <div className="font-mono text-xs text-brand">{value.admission_no}</div>
          <div className="font-medium text-brand-dark truncate">{name(value)} <span className="text-stone font-normal">· {value.level}{value.course?.name ? ` · ${value.course.name}` : ''}</span></div>
        </div>
        <button type="button" onClick={() => { onChange(null); setQuery(''); }} className="shrink-0 text-xs text-brand hover:underline font-medium">Change</button>
      </div>
    );
  }

  return (
    <div ref={box} className="relative">
      <input
        type="text"
        value={query}
        required={required}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm"
      />
      {open && query.trim().length >= 2 && (
        <div className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto rounded-xl border border-stone/15 bg-white shadow-lg">
          {searching && <div className="px-4 py-3 text-xs text-stone">Searching…</div>}
          {!searching && results.length === 0 && <div className="px-4 py-3 text-xs text-stone">No matching students</div>}
          {results.map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => { onChange(s); setOpen(false); setQuery(''); }}
              className="w-full text-left px-4 py-2.5 hover:bg-brand/5 border-b border-stone/10 last:border-0"
            >
              <div className="font-mono text-xs text-brand">{s.admission_no}</div>
              <div className="text-sm text-brand-dark">{name(s)} <span className="text-stone text-xs">· {s.level}{s.course?.name ? ` · ${s.course.name}` : ''}</span></div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
