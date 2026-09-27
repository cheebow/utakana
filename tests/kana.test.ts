import { describe, expect, it } from 'vitest';
import { hiraToKata, isAllKana, isKanji, kataToHira, normalizeInput } from '../src/core/kana';

describe('kataToHira', () => {
  it('converts katakana to hiragana', () => {
    expect(kataToHira('トーキョー')).toBe('とーきょー');
    expect(kataToHira('ヴァイオリン')).toBe('ゔぁいおりん');
    expect(kataToHira('あいう')).toBe('あいう');
    expect(kataToHira('ABC')).toBe('ABC');
  });
  it('round trips with hiraToKata', () => {
    expect(hiraToKata(kataToHira('サクラ'))).toBe('サクラ');
  });
});

describe('isAllKana / isKanji', () => {
  it('detects kana strings', () => {
    expect(isAllKana('さだめ')).toBe(true);
    expect(isAllKana('サダメー')).toBe(true);
    expect(isAllKana('笑')).toBe(false);
    expect(isAllKana('')).toBe(false);
  });
  it('detects kanji', () => {
    expect(isKanji('運')).toBe(true);
    expect(isKanji('々')).toBe(true);
    expect(isKanji('あ')).toBe(false);
  });
});

describe('normalizeInput', () => {
  it('normalizes half-width katakana', () => {
    expect(normalizeInput('ﾎﾞｰｶﾙ')).toBe('ボーカル');
    expect(normalizeInput('ﾊﾟﾝ')).toBe('パン');
  });
  it('normalizes full-width alphanumerics', () => {
    expect(normalizeInput('ＡＢＣ１２３')).toBe('ABC123');
  });
  it('normalizes line endings', () => {
    expect(normalizeInput('a\r\nb\rc')).toBe('a\nb\nc');
  });
});
