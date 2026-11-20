// Kenyan mobile numbers. Mirrors the server rule: accepts what people type (spaces, 07.., 01.., 7.., 254.., +254..)
// and gives back 07XXXXXXXX or 01XXXXXXXX. Anything else is not a Kenyan mobile number.
export const normalizeKenyaPhone = (raw: string | number | null | undefined): string | null => {
  if (raw === undefined || raw === null) return null;
  let s = String(raw).replace(/[\s\-().]/g, '');
  if (!s) return null;
  if (s.startsWith('+254')) s = `0${s.slice(4)}`;
  else if (s.startsWith('00254')) s = `0${s.slice(5)}`;
  else if (s.startsWith('254') && s.length === 12) s = `0${s.slice(3)}`;
  else if (/^[17]\d{8}$/.test(s)) s = `0${s}`;
  return /^0[17]\d{8}$/.test(s) ? s : null;
};

export const PHONE_HELP = 'Use a Kenyan mobile number, for example 0712 345 678, 0112 345 678 or +254 712 345 678';

// '' when fine (or empty and not required), otherwise the message to show
export const phoneProblem = (value: string, required = false): string => {
  if (!value.trim()) return required ? 'Phone number is required' : '';
  return normalizeKenyaPhone(value) ? '' : PHONE_HELP;
};
