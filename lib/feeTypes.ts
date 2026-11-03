// How a fee type is billed. Older fee types have no setting and follow their earlier term-based tick boxes.
export type FeeBilling = 'NOT_BILLED' | 'ONCE' | 'EVERY_TERM';

export const feeBilling = (ft: any): FeeBilling =>
  ft.billing || (ft.term_based ? (ft.added_to_term_fee ? 'EVERY_TERM' : 'NOT_BILLED') : 'ONCE');

export const BILLING_LABEL: Record<FeeBilling, string> = {
  NOT_BILLED: 'Not billed (payment category only)',
  ONCE: 'Billed once (first term)',
  EVERY_TERM: 'Billed every term, on top of the term fee',
};

export const BILLING_SHORT: Record<FeeBilling, string> = {
  NOT_BILLED: 'Not billed',
  ONCE: 'Billed once',
  EVERY_TERM: 'Billed every term',
};
