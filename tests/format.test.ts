import { describe, expect, it } from 'vitest';
import { WORD_SEP, countMoraList, countMoras, formatOutput } from '../src/core/format';

const lines = [['ぼ', 'く', 'わ'], [], ['きゃ', 'っ', 'と']];

describe('formatOutput', () => {
  it('plain', () => {
    expect(formatOutput(lines, 'plain')).toBe('ぼくわ\n\nきゃっと');
  });
  it('space', () => {
    expect(formatOutput(lines, 'space')).toBe('ぼ く わ\n\nきゃ っ と');
  });
});

describe('countMoras', () => {
  it('counts per line and total', () => {
    expect(countMoras(lines)).toEqual({ perLine: [3, 0, 3], total: 6 });
  });
});

describe('word separator', () => {
  const english = [['I', WORD_SEP, 'love', WORD_SEP, 'you'], ['LOVE', 'そ', 'ん', 'ぐ']];
  it('plain keeps the separator, space format does not double it', () => {
    expect(formatOutput(english, 'plain')).toBe('I love you\nLOVEそんぐ');
    expect(formatOutput(english, 'space')).toBe('I love you\nLOVE そ ん ぐ');
  });
  it('is not counted as a mora', () => {
    expect(countMoraList(english[0])).toBe(3);
    expect(countMoras(english)).toEqual({ perLine: [3, 4], total: 7 });
  });
});
