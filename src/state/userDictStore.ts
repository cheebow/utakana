import { useCallback } from 'react';
import type { UserDictEntry } from '../core/types';
import { normalizeUserDict } from '../core/userDict';
import { useLocalStorage } from './useLocalStorage';

export const USER_DICT_KEY = 'utakana:userDict';

export function parseUserDictJson(json: string): UserDictEntry[] {
  const raw: unknown = JSON.parse(json);
  const list = Array.isArray(raw) ? raw : (raw as { entries?: unknown })?.entries;
  if (!Array.isArray(list)) throw new Error('配列ではありません');
  const entries: UserDictEntry[] = [];
  for (const item of list) {
    if (typeof item !== 'object' || item === null) continue;
    const { surface, reading } = item as Record<string, unknown>;
    if (typeof surface === 'string' && typeof reading === 'string') entries.push({ surface, reading });
  }
  return normalizeUserDict(entries);
}

function validate(raw: unknown): UserDictEntry[] | null {
  try {
    return parseUserDictJson(JSON.stringify(raw));
  } catch {
    return null;
  }
}

export function useUserDict() {
  const [entries, setEntries] = useLocalStorage<UserDictEntry[]>(USER_DICT_KEY, [], validate);

  const upsert = useCallback(
    (surface: string, reading: string) =>
      setEntries((prev) => normalizeUserDict([...prev, { surface, reading }])),
    [setEntries],
  );
  const remove = useCallback(
    (surface: string) => setEntries((prev) => prev.filter((e) => e.surface !== surface)),
    [setEntries],
  );
  const replaceAll = useCallback(
    (next: UserDictEntry[]) => setEntries(normalizeUserDict(next)),
    [setEntries],
  );
  /** 既存に追記（同じ見出し語はインポート側で上書き） */
  const merge = useCallback(
    (next: UserDictEntry[]) => setEntries((prev) => normalizeUserDict([...prev, ...next])),
    [setEntries],
  );
  const toJson = useCallback(() => JSON.stringify(entries, null, 2), [entries]);

  return { entries, upsert, remove, replaceAll, merge, toJson };
}
