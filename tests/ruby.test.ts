import { describe, expect, it } from 'vitest';
import { parseRuby } from '../src/core/ruby';

describe('parseRuby', () => {
  it('parses aozora-style ruby', () => {
    expect(parseRuby('この|運命《さだめ》を')).toEqual([
      { kind: 'text', text: 'この' },
      { kind: 'fixed', surface: '運命', reading: 'さだめ', source: 'ruby' },
      { kind: 'text', text: 'を' },
    ]);
    expect(parseRuby('｜蒼い空《そら》')).toEqual([
      { kind: 'fixed', surface: '蒼い空', reading: 'そら', source: 'ruby' },
    ]);
  });
  it('parses kanji-run ruby without a bar', () => {
    expect(parseRuby('運命《さだめ》は')).toEqual([
      { kind: 'fixed', surface: '運命', reading: 'さだめ', source: 'ruby' },
      { kind: 'text', text: 'は' },
    ]);
    expect(parseRuby('この運命《さだめ》')).toEqual([
      { kind: 'text', text: 'この' },
      { kind: 'fixed', surface: '運命', reading: 'さだめ', source: 'ruby' },
    ]);
  });
  it('parses paren ruby when the content is all kana', () => {
    expect(parseRuby('運命（さだめ）')).toEqual([
      { kind: 'fixed', surface: '運命', reading: 'さだめ', source: 'ruby' },
    ]);
    expect(parseRuby('運命(サダメ)')).toEqual([
      { kind: 'fixed', surface: '運命', reading: 'サダメ', source: 'ruby' },
    ]);
  });
  it('does not treat non-kana parens as ruby', () => {
    expect(parseRuby('笑う（笑）')).toEqual([{ kind: 'text', text: '笑う（笑）' }]);
    expect(parseRuby('東京（Tokyo）')).toEqual([{ kind: 'text', text: '東京（Tokyo）' }]);
  });
  it('can disable paren ruby', () => {
    expect(parseRuby('運命（さだめ）', { parenRuby: false })).toEqual([
      { kind: 'text', text: '運命（さだめ）' },
    ]);
  });
  it('keeps text without ruby as is', () => {
    expect(parseRuby('僕は東京へ\n行った')).toEqual([{ kind: 'text', text: '僕は東京へ\n行った' }]);
  });
  it('handles multiple rubies and newlines', () => {
    expect(parseRuby('|夜《よる》の\n|街《まち》')).toEqual([
      { kind: 'fixed', surface: '夜', reading: 'よる', source: 'ruby' },
      { kind: 'text', text: 'の\n' },
      { kind: 'fixed', surface: '街', reading: 'まち', source: 'ruby' },
    ]);
  });
  it('leaves invalid ruby text untouched', () => {
    expect(parseRuby('|運命《Fate》')).toEqual([{ kind: 'text', text: '|運命《Fate》' }]);
  });
});
