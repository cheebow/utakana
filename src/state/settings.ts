import { useCallback } from 'react';
import { DEFAULT_SETTINGS, type Settings } from '../core/types';
import { useLocalStorage } from './useLocalStorage';

export const SETTINGS_KEY = 'utakana:settings';
/** 保存形式のバージョン。既定値を変えたときに上げ、古い保存分には新しい既定を適用する */
export const SETTINGS_VERSION = 2;

/** 列挙型の設定キーと、その取りうる値 */
const ENUM_OPTIONS = {
  longVowelMark: ['vowel', 'hyphen', 'keep', 'drop'],
  sokuon: ['attach', 'separate', 'vowel', 'drop'],
  hatsuon: ['separate', 'attach'],
  outputFormat: ['plain', 'space'],
} as const satisfies { [K in keyof Settings as Settings[K] extends string ? K : never]: readonly Settings[K][] };

/**
 * 保存されていた設定を検証し、不正な項目は既定値に戻す。
 * キーは DEFAULT_SETTINGS から辿るので、設定を追加してもここを触る必要はない。
 */
export function validateSettings(raw: unknown): Settings | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const s: Record<string, unknown> = { ...DEFAULT_SETTINGS };
  const current = r.version === SETTINGS_VERSION;
  for (const key of Object.keys(DEFAULT_SETTINGS)) {
    // v1 以前の保存では woToO の既定が OFF だったため、旧保存分は新しい既定（ON）に移行する
    if (key === 'woToO' && !current) continue;
    const value = r[key];
    if (key in ENUM_OPTIONS) {
      const options: readonly string[] = ENUM_OPTIONS[key as keyof typeof ENUM_OPTIONS];
      if (typeof value === 'string' && options.includes(value)) s[key] = value;
    } else if (typeof value === 'boolean') {
      s[key] = value;
    }
  }
  return s as unknown as Settings;
}

export function useSettings() {
  const [settings, setSettings] = useLocalStorage<Settings & { version?: number }>(
    SETTINGS_KEY,
    { ...DEFAULT_SETTINGS, version: SETTINGS_VERSION },
    (raw) => {
      const v = validateSettings(raw);
      return v ? { ...v, version: SETTINGS_VERSION } : null;
    },
  );
  const update = useCallback(
    (patch: Partial<Settings>) => setSettings((prev) => ({ ...prev, ...patch, version: SETTINGS_VERSION })),
    [setSettings],
  );
  const reset = useCallback(() => setSettings({ ...DEFAULT_SETTINGS, version: SETTINGS_VERSION }), [setSettings]);
  return { settings, update, reset };
}
