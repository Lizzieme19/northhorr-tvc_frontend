// One way to describe a term everywhere it can be picked: name, year, intake, dates, fee and state.

export type TermLike = {
  id?: string;
  name: string;
  academic_year?: string | null;
  intake?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  term_cost?: number | null;
  is_active?: boolean | null;
};

const cap = (s?: string | null) => (s ? s.charAt(0) + s.slice(1).toLowerCase() : '');

const day = (d: Date, withYear: boolean) =>
  d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' } : {}) });

// "5 Jan – 30 Apr 2026", or "5 Sep 2025 – 30 Apr 2026" when it spans two years
export const termDates = (t: TermLike): string => {
  if (!t.start_date || !t.end_date) return '';
  const s = new Date(t.start_date);
  const e = new Date(t.end_date);
  return `${day(s, s.getFullYear() !== e.getFullYear())} – ${day(e, true)}`;
};

export type TermState = 'In session' | 'Upcoming' | 'Ended';

export const termState = (t: TermLike, now = new Date()): TermState | null => {
  if (!t.start_date || !t.end_date) return null;
  if (now < new Date(t.start_date)) return 'Upcoming';
  if (now > new Date(t.end_date)) return 'Ended';
  return 'In session';
};

export const termFee = (t: TermLike): string => (t.term_cost ? `KES ${t.term_cost.toLocaleString()}` : '');

// Single line for <option>: "Term 2 · 2025/2026 · January intake · 5 Jan – 30 Apr 2026 · KES 35,000 · In session"
export const termLabel = (t: TermLike, extra?: string): string => {
  const parts = [
    t.name,
    t.academic_year,
    t.intake ? `${cap(t.intake)} intake` : '',
    termDates(t),
    termFee(t),
    termState(t) || '',
    t.is_active === false ? 'Inactive' : '',
    extra || '',
  ].filter(Boolean);
  return parts.join(' · ');
};
