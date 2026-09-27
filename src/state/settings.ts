import { useCallback } from 'react';
import { DEFAULT_SETTINGS, type Settings } from '../core/types';
import { useLocalStorage } from './useLocalStorage';

export const SETTINGS_KEY = 'utakana:settings';
/** 保存形式のバージョン。既定値を変えたときに上げ、古い保存分には新しい既定を適用する */
export const SETTINGS_VERSION = 2;

function validateSettings(raw: unknown): Settings | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const s: Settings = { ...DEFAULT_SETTINGS };
  const current = r.version === SETTINGS_VERSION;
  for (const key of ['usePronunciation', 'woToO', 'diDuToJiZu', 'keepSymbols', 'parenRuby', 'eiToEe', 'iuToYuu', 'mergeSameVowel'] as const) {
    // v1 以前の保存では woToO の既定が OFF だったため、旧保存分は新しい既定（ON）に移行する
    if (key === 'woToO' && !current) continue;
    if (typeof r[key] === 'boolean') s[key] = r[key];
  }
  if (r.longVowelMark === 'vowel' || r.longVowelMark === 'hyphen' || r.longVowelMark === 'keep' || r.longVowelMark === 'drop') {
    s.longVowelMark = r.longVowelMark;
  }
  if (r.sokuon === 'attach' || r.sokuon === 'separate' || r.sokuon === 'vowel' || r.sokuon === 'drop') s.sokuon = r.sokuon;
  if (r.hatsuon === 'separate' || r.hatsuon === 'attach') s.hatsuon = r.hatsuon;
  if (r.outputFormat === 'plain' || r.outputFormat === 'space') {
    s.outputFormat = r.outputFormat;
  }
  return s;
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
