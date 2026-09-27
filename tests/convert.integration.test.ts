import { beforeAll, describe, expect, it } from 'vitest';
import { analyze, convert, overrideKey, render } from '../src/core/convert';
import { DEFAULT_SETTINGS, type Settings, type UserDictEntry } from '../src/core/types';
import { getTestTokenizer } from './helpers/tokenizer';
import type { TokenizeFn } from '../src/core/tokenizer';

let tokenize: TokenizeFn;
const opts = (settings: Partial<Settings> = {}, userDict: UserDictEntry[] = []) => ({
  settings: { ...DEFAULT_SETTINGS, ...settings },
  userDict,
});

beforeAll(() => {
  tokenize = getTestTokenizer();
});

describe('convert (real wasm)', () => {
  it('converts with default settings (pronunciation + vowel long mark)', () => {
    expect(convert('僕は東京へ行った', tokenize, opts()).output).toBe('ぼくわとおきょおえいった');
  });
  it('usePronunciation off keeps orthographic reading', () => {
    expect(convert('僕は東京へ行った', tokenize, opts({ usePronunciation: false })).output).toBe(
      'ぼくはとうきょうへいった',
    );
  });
  it('hyphen long vowel mark', () => {
    expect(convert('僕は東京へ行った', tokenize, opts({ longVowelMark: 'hyphen' })).output).toBe(
      'ぼくわと-きょ-えいった',
    );
  });
  it('marks unknown tokens and converts katakana unknowns', () => {
    const lines = analyze('Hello ボカロ', tokenize, opts());
    expect(lines).toHaveLength(1);
    const [hello, bokaro] = lines[0].tokens;
    expect(hello.surface).toBe('Hello');
    expect(hello.source).toBe('unknown');
    expect(bokaro.surface).toBe('ボカロ');
    expect(bokaro.source).toBe('dict');
    const result = render(lines, DEFAULT_SETTINGS);
    expect(result.output).toBe('Helloぼかろ');
    expect(result.moraCount.perLine).toEqual([4]);
  });
  it('preserves line structure', () => {
    const text = '夜に駆ける\n\n君の名は\n最後の行';
    const result = convert(text, tokenize, opts());
    expect(result.lines).toHaveLength(4);
    expect(result.output.split('\n')).toHaveLength(4);
    expect(result.output.split('\n')[1]).toBe('');
    expect(result.lines[3].tokens.map((t) => t.surface).join('')).toBe('最後の行');
  });
  it('drops symbols by default and keeps them when asked', () => {
    expect(convert('さくら、さくら。', tokenize, opts()).output).toBe('さくらさくら');
    expect(convert('さくら、さくら。', tokenize, opts({ keepSymbols: true })).output).toBe('さくら、さくら。');
  });
  it('applies ruby and user dictionary', () => {
    const text = 'この|運命《さだめ》と初音ミク';
    const result = convert(text, tokenize, opts({}, [{ surface: '初音ミク', reading: 'はつねみく' }]));
    expect(result.output).toBe('このさだめとはつねみく');
    const sources = result.lines[0].tokens.map((t) => t.source);
    expect(sources).toContain('ruby');
    expect(sources).toContain('user');
  });
  it('applies manual overrides by key', () => {
    const key = overrideKey(0, 0, '東京');
    const result = convert('東京', tokenize, { ...opts(), overrides: { [key]: 'とうけい' } });
    expect(result.output).toBe('とうけい');
    expect(result.lines[0].tokens[0].manualReading).toBe('とうけい');
  });
  it('outputs space format with mora counts', () => {
    const space = convert('きゃっと\nにゃー', tokenize, opts({ outputFormat: 'space' }));
    expect(space.output).toBe('きゃっ と\nにゃ あ');
    expect(space.moraCount).toEqual({ perLine: [2, 2], total: 4 });
    const separate = convert('きゃっと', tokenize, opts({ outputFormat: 'space', sokuon: 'separate' }));
    expect(separate.output).toBe('きゃ っ と');
  });
  it('keeps づ by default and unifies it only with diDuToJiZu', () => {
    expect(convert('徒然綴る', tokenize, opts()).output).toBe('つれづれつづる');
    expect(convert('徒然綴る', tokenize, opts({ diDuToJiZu: true })).output).toBe('つれずれつずる');
  });
  it('matches the SynthV round-trip conventions', () => {
    const o = (t: string, extra = {}) => convert(t, tokenize, opts({ outputFormat: 'space', ...extra })).output;
    expect(o('思ってます')).toBe('お もっ て ま す');
    expect(o('スキスキッ')).toBe('す き す き');
    expect(o('恋をした')).toBe('こ い お し た');
    expect(o('恋をした', { woToO: false })).toBe('こ い を し た');
    expect(o('脈アリポーズ', { longVowelMark: 'drop' })).toBe('みゃ く あ り ぽ ず');
    expect(o('ホントに無力', { hatsuon: 'attach' })).toBe('ほん と に む りょ く');
    expect(o('ホントに無力')).toBe('ほ ん と に む りょ く');
  });
  it('applies the options learned from ボカロ語変換', () => {
    const o = (t: string, extra = {}) => convert(t, tokenize, opts({ outputFormat: 'space', ...extra })).output;
    expect(o('先生に映画をそう言う')).toBe('せ ん せ え に え え が お そ お ゆ う');
    expect(o('あがって', { sokuon: 'vowel' })).toBe('あ が あ て');
    expect(o('東京の音', { mergeSameVowel: true })).toBe('と きょ の お と');
    expect(o('あがって', { sokuon: 'vowel', mergeSameVowel: true })).toBe('あ が て');
  });
  it('handles empty input', () => {
    const result = convert('', tokenize, opts());
    expect(result.output).toBe('');
    expect(result.moraCount.total).toBe(0);
  });
});

describe('dictionary gaps (real wasm)', () => {
  it('merges kanji runs containing unknown kanji into one unconverted token', () => {
    // 「魑魅魍魎」のような辞書外の熟語は 1 つの未変換チップにまとめる
    const lines = analyze('鵺鵼が鳴く', tokenize, opts());
    const [first] = lines[0].tokens;
    expect(first.surface).toBe('鵺鵼');
    expect(first.source).toBe('unknown');
    expect(lines[0].tokens.map((t) => t.surface)).toEqual(['鵺鵼', 'が', '鳴く']);
  });
  it('reads 既読 via the builtin dictionary', () => {
    const result = convert('既読の印ついた', tokenize, opts());
    expect(result.output).toBe('きどくのしるしついた');
    expect(result.lines[0].tokens[0].source).toBe('dict');
  });
  it('reads numeral + counter combinations', () => {
    expect(convert('二人きりで一歩ずつ', tokenize, opts()).output).toBe('ふたりきりでいっぽずつ');
    expect(convert('一人ぼっちの1回', tokenize, opts()).output).toBe('ひとりぼっちのいっかい');
    expect(convert('何度も何回も', tokenize, opts()).output).toBe('なんどもなんかいも');
    expect(convert('二十歳の夜', tokenize, opts()).output).toBe('はたちのよる');
  });
  it('does not split a longer number before a counter', () => {
    expect(convert('十二人の12人', tokenize, opts()).output).toBe('じゅうににんの12にん');
    expect(convert('三日月と一回り', tokenize, opts()).output).toBe('みかづきとひとまわり');
  });
  it('lets the user dictionary win over the builtin dictionary', () => {
    const result = convert('既読', tokenize, opts({}, [{ surface: '既読', reading: 'きどくだよ' }]));
    expect(result.output).toBe('きどくだよ');
    expect(result.lines[0].tokens[0].source).toBe('user');
  });
  it('lets ruby win over the builtin dictionary', () => {
    expect(convert('|既読《みた》', tokenize, opts()).output).toBe('みた');
  });
});
