import { describe, expect, it } from 'vitest';
import { applyLineRules, resolveReading } from '../src/core/rules';
import { DEFAULT_SETTINGS, type Token } from '../src/core/types';

const tok = (partial: Partial<Token>): Token => ({
  id: '0:0',
  surface: '',
  reading: null,
  pronunciation: null,
  pos: '名詞',
  source: 'dict',
  ...partial,
});

describe('resolveReading', () => {
  it('prefers manual reading', () => {
    expect(
      resolveReading(tok({ surface: '東京', reading: 'トウキョウ', pronunciation: 'トーキョー', manualReading: 'とうけい' }), DEFAULT_SETTINGS),
    ).toBe('とうけい');
  });
  it('uses pronunciation when enabled and reading otherwise', () => {
    const t = tok({ surface: 'は', reading: 'ハ', pronunciation: 'ワ', pos: '助詞' });
    expect(resolveReading(t, DEFAULT_SETTINGS)).toBe('わ');
    expect(resolveReading(t, { ...DEFAULT_SETTINGS, usePronunciation: false })).toBe('は');
  });
  it('keeps ぢ/づ from the reading even when pronunciation flattens them', () => {
    const t = tok({ surface: '徒然', reading: 'ツレヅレ', pronunciation: 'ツレズレ' });
    expect(resolveReading(t, DEFAULT_SETTINGS)).toBe('つれづれ');
    // 長さが違うときは発音形をそのまま使う
    const v = tok({ surface: 'ヴァイオリン', reading: 'ヴァイオリン', pronunciation: 'バイオリン' });
    expect(resolveReading(v, DEFAULT_SETTINGS)).toBe('ばいおりん');
  });
  it('uses fixed reading for ruby/user tokens', () => {
    expect(resolveReading(tok({ surface: '運命', reading: 'サダメ', source: 'ruby' }), DEFAULT_SETTINGS)).toBe('さだめ');
  });
  it('returns surface for unknown tokens', () => {
    expect(resolveReading(tok({ surface: 'Hello', source: 'unknown', pos: 'UNK' }), DEFAULT_SETTINGS)).toBe('Hello');
  });
});

describe('applyLineRules', () => {
  it('replaces long vowel mark with vowel by default', () => {
    expect(applyLineRules(['とーきょー'], DEFAULT_SETTINGS)).toEqual(['とおきょお']);
    expect(applyLineRules(['ぼく', 'わ', 'とーきょー', 'え'], DEFAULT_SETTINGS)).toEqual(['ぼく', 'わ', 'とおきょお', 'え']);
  });
  it('looks back across tokens for the vowel', () => {
    expect(applyLineRules(['ら', 'ー'], DEFAULT_SETTINGS)).toEqual(['ら', 'あ']);
    expect(applyLineRules(['ら', 'ーー'], DEFAULT_SETTINGS)).toEqual(['ら', 'ああ']);
  });
  it('drops a long vowel mark with nothing before it', () => {
    expect(applyLineRules(['ーあ'], DEFAULT_SETTINGS)).toEqual(['あ']);
    expect(applyLineRules(['ん', 'ー'], DEFAULT_SETTINGS)).toEqual(['ん', 'ん']);
  });
  it('supports hyphen and keep modes', () => {
    expect(applyLineRules(['とーきょー'], { ...DEFAULT_SETTINGS, longVowelMark: 'hyphen' })).toEqual(['と-きょ-']);
    expect(applyLineRules(['とーきょー'], { ...DEFAULT_SETTINGS, longVowelMark: 'keep' })).toEqual(['とーきょー']);
    expect(applyLineRules(['とーきょー'], { ...DEFAULT_SETTINGS, longVowelMark: 'drop' })).toEqual(['ときょ']);
  });
  it('applies wo→o and di/du→ji/zu', () => {
    expect(applyLineRules(['ほんをよむ'], DEFAULT_SETTINGS)).toEqual(['ほんおよむ']);
    expect(applyLineRules(['ほんをよむ'], { ...DEFAULT_SETTINGS, woToO: false })).toEqual(['ほんをよむ']);
    expect(applyLineRules(['ちぢむつづく'], { ...DEFAULT_SETTINGS, diDuToJiZu: true })).toEqual(['ちじむつずく']);
    expect(applyLineRules(['ちぢむ'], DEFAULT_SETTINGS)).toEqual(['ちぢむ']);
  });
});
