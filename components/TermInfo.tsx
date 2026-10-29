import { TermLike, termDates, termFee, termState } from '@/lib/terms';

const STATE_STYLE: Record<string, string> = {
  'In session': 'bg-green-100 text-green-800',
  Upcoming: 'bg-blue-100 text-blue-800',
  Ended: 'bg-stone/15 text-stone',
};

// Details of the selected term, shown under a term <select>
export default function TermInfo({ term, className = '' }: { term?: TermLike | null; className?: string }) {
  if (!term) return null;
  const state = termState(term);
  const intake = term.intake ? term.intake.charAt(0) + term.intake.slice(1).toLowerCase() : null;
  return (
    <div className={`mt-2 rounded-xl border border-stone/15 bg-cream-deep/60 px-4 py-3 text-xs ${className}`}>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="font-semibold text-brand-dark text-sm">{term.name}</span>
        {state && <span className={`px-2 py-0.5 rounded-full font-medium ${STATE_STYLE[state]}`}>{state}</span>}
        {term.is_active === false && <span className="px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700">Inactive</span>}
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-stone">
        {term.academic_year && <div><dt className="inline">Academic year: </dt><dd className="inline font-medium text-brand-dark">{term.academic_year}</dd></div>}
        {intake && <div><dt className="inline">Intake: </dt><dd className="inline font-medium text-brand-dark">{intake}</dd></div>}
        {termDates(term) && <div className="col-span-2"><dt className="inline">Dates: </dt><dd className="inline font-medium text-brand-dark">{termDates(term)}</dd></div>}
        {termFee(term) && <div><dt className="inline">Term fee: </dt><dd className="inline font-medium text-brand-dark">{termFee(term)}</dd></div>}
      </dl>
    </div>
  );
}
