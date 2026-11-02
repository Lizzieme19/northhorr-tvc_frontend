'use client';
import { ReactNode } from 'react';

const base = 'px-3 py-2 rounded-xl border border-stone/25 bg-white text-sm focus:outline-none focus:border-brand';

export function FilterSelect({ label, value, onChange, children, className = '' }: { label: string; value: string; onChange: (v: string) => void; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-[11px] font-semibold text-stone uppercase tracking-wide mb-1">{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)} className={`${base} w-full ${value ? 'border-brand' : ''}`}>
        {children}
      </select>
    </label>
  );
}

export function FilterSearch({ value, onChange, placeholder, className = '' }: { value: string; onChange: (v: string) => void; placeholder: string; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-[11px] font-semibold text-stone uppercase tracking-wide mb-1">Search</span>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={`${base} w-full`} />
    </label>
  );
}

export function FilterDate({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold text-stone uppercase tracking-wide mb-1">{label}</span>
      <input type="date" value={value} onChange={e => onChange(e.target.value)} className={`${base} w-full`} />
    </label>
  );
}

// Wrapper with a "Clear all" control and the number of filters in use
export function FilterPanel({ children, active, onClear }: { children: ReactNode; active: number; onClear: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-stone/10 shadow-sm p-4 mb-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
      {active > 0 && (
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-stone">{active} filter{active === 1 ? '' : 's'} applied</span>
          <button onClick={onClear} className="text-brand hover:underline font-medium">Clear all</button>
        </div>
      )}
    </div>
  );
}
