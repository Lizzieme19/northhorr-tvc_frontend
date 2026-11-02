import { useEffect, useState } from 'react';

// Waits until the value stops changing, so typing in a search box doesn't fire a request per key
export function useDebounced<T>(value: T, ms = 350): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}
