import { describe, expect, it } from 'vitest';
import { isLatinWord, isWordSepNeighbor, latinWordSpans, splitLatinWords } from '../src/core/latin';

describe('splitLatinWords', () => {
  it('splits latin words from japanese text', () => {
    expect(splitLatinWords('君と love you')).toEqual([
      { kind: 'text', text: '君と ' },
      { kind: 'latin', text: 'love' },
      { kind: 'text', text: ' ' },
      { kind: 'latin', text: 'you' },
    ]);
  });
  it('keeps apostrophes inside a word', () => {
    expect(splitLatinWords("don't")).toEqual([{ kind: 'latin', text: "don't" }]);
    expect(splitLatinWords('don’t')).toEqual([{ kind: 'latin', text: 'don’t' }]);
    expect(splitLatinWords("rock'n'roll")).toEqual([{ kind: 'latin', text: "rock'n'roll" }]);
  });
  it('treats accented letters as part of the word', () => {
    expect(splitLatinWords('café')).toEqual([{ kind: 'latin', text: 'café' }]);
  });
  it('does not include digits or a trailing apostrophe', () => {
    expect(splitLatinWords('24h')).toEqual([
      { kind: 'text', text: '24' },
      { kind: 'latin', text: 'h' },
    ]);
    expect(splitLatinWords("lovin'")).toEqual([
      { kind: 'latin', text: 'lovin' },
      { kind: 'text', text: "'" },
    ]);
  });
  it('returns a single text chunk when there is no latin word', () => {
    expect(splitLatinWords('さくら')).toEqual([{ kind: 'text', text: 'さくら' }]);
    expect(splitLatinWords('')).toEqual([]);
  });
});

describe('isLatinWord / latinWordSpans / isWordSepNeighbor', () => {
  it('isLatinWord', () => {
    expect(isLatinWord('love')).toBe(true);
    expect(isLatinWord("don't")).toBe(true);
    expect(isLatinWord('LOVEソング')).toBe(false);
    expect(isLatinWord('love you')).toBe(false);
    expect(isLatinWord('')).toBe(false);
  });
  it('latinWordSpans', () => {
    expect([...latinWordSpans('I love you')]).toEqual([
      [0, 'I'],
      [2, 'love'],
      [7, 'you'],
    ]);
  });
  it('isWordSepNeighbor', () => {
    expect(isWordSepNeighbor('e')).toBe(true);
    expect(isWordSepNeighbor(',')).toBe(true);
    expect(isWordSepNeighbor('é')).toBe(true);
    expect(isWordSepNeighbor('と')).toBe(false);
    expect(isWordSepNeighbor(' ')).toBe(false);
  });
});
