import { describe, expect, it } from 'vitest';
import { countMoras, formatOutput } from '../src/core/format';

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
