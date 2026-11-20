'use client';

// The day a payment was received. Defaults to today; an earlier day can be chosen (backdating has no limit),
// a later one cannot. When the day is well in the past the field says so, so a typo does not slip through.

export const todayStr = () => {
  const d = new Date(Date.now() + 3 * 3600 * 1000); // East Africa Time, where the college is
  return d.toISOString().slice(0, 10);
};

const daysBetween = (from: string, to: string) => Math.round((new Date(`${to}T00:00:00Z`).getTime() - new Date(`${from}T00:00:00Z`).getTime()) / 86400000);
const nice = (s: string) => new Date(`${s}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

export default function PaymentDate({ value, onChange, label = 'Date received', className = '', inputClass = 'w-full px-3 py-2.5 rounded-xl border border-stone/25 bg-white text-sm focus:outline-none focus:border-brand', labelClass = 'block text-xs font-semibold text-brand-dark mb-1' }: {
  value: string; onChange: (v: string) => void; label?: string; className?: string; inputClass?: string; labelClass?: string;
}) {
  const today = todayStr();
  const ago = value ? daysBetween(value, today) : 0;
  return (
    <div className={className}>
      <label className={labelClass}>{label}</label>
      <input type="date" value={value} max={today} min="2000-01-01" onChange={e => onChange(e.target.value)} className={inputClass} />
      {value && ago > 0 && (
        <p className={`text-[11px] mt-1 ${ago > 30 ? 'text-amber-700 font-medium' : 'text-stone'}`}>
          Backdated: {nice(value)} ({ago} day{ago === 1 ? '' : 's'} ago){ago > 30 ? '. Check that this date is right.' : ''}
        </p>
      )}
    </div>
  );
}
