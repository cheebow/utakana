import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * localStorage に永続化する useState。
 * 読み取り失敗・パース失敗時は初期値を使う。書き込み失敗（容量超過・プライベートモード）は無視する。
 */
export function useLocalStorage<T>(
  key: string,
  initial: T,
  validate?: (raw: unknown) => T | null,
): [T, (next: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return initial;
      const parsed: unknown = JSON.parse(raw);
      if (validate) return validate(parsed) ?? initial;
      return parsed as T;
    } catch {
      return initial;
    }
  });
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  }, [key, value]);
  const set = useCallback((next: T | ((prev: T) => T)) => setValue(next), []);
  return [value, set];
}
