import { describe, expect, it } from 'vitest';
import { SETTINGS_VERSION, validateSettings } from '../src/state/settings';
import { DEFAULT_SETTINGS } from '../src/core/types';

describe('validateSettings', () => {
  it('returns null for non-objects', () => {
    expect(validateSettings(null)).toBeNull();
    expect(validateSettings('x')).toBeNull();
  });
  it('keeps valid values and falls back to defaults for invalid ones', () => {
    const s = validateSettings({
      version: SETTINGS_VERSION,
      usePronunciation: false,
      longVowelMark: 'hyphen',
      sokuon: 'bogus',
      keepSymbols: 'yes',
      unknownKey: true,
    });
    expect(s).toEqual({ ...DEFAULT_SETTINGS, usePronunciation: false, longVowelMark: 'hyphen' });
  });
  it('migrates woToO to the new default for pre-v2 saves', () => {
    expect(validateSettings({ woToO: false })?.woToO).toBe(true);
    expect(validateSettings({ version: SETTINGS_VERSION, woToO: false })?.woToO).toBe(false);
  });
});
