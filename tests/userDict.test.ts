import { describe, expect, it } from 'vitest';
import { applyUserDict, normalizeUserDict } from '../src/core/userDict';
import type { Segment } from '../src/core/types';

describe('applyUserDict', () => {
  it('extracts longest match', () => {
    const segs: Segment[] = [{ kind: 'text', text: '初音ミクと初音' }];
    const out = applyUserDict(segs, [
      { surface: '初音', reading: 'はつね' },
      { surface: '初音ミク', reading: 'はつねみく' },
    ]);
    expect(out).toEqual([
      { kind: 'fixed', surface: '初音ミク', reading: 'はつねみく', source: 'user' },
      { kind: 'text', text: 'と' },
      { kind: 'fixed', surface: '初音', reading: 'はつね', source: 'user' },
    ]);
  });
  it('does not touch fixed segments', () => {
    const segs: Segment[] = [
      { kind: 'fixed', surface: '運命', reading: 'さだめ', source: 'ruby' },
      { kind: 'text', text: 'の運命' },
    ];
    const out = applyUserDict(segs, [{ surface: '運命', reading: 'うんめい' }]);
    expect(out[0]).toEqual({ kind: 'fixed', surface: '運命', reading: 'さだめ', source: 'ruby' });
    expect(out[2]).toEqual({ kind: 'fixed', surface: '運命', reading: 'うんめい', source: 'user' });
  });
  it('returns input when dict is empty', () => {
    const segs: Segment[] = [{ kind: 'text', text: 'abc' }];
    expect(applyUserDict(segs, [])).toBe(segs);
  });
});

describe('applyUserDict (latin words)', () => {
  const love = [{ surface: 'love', reading: 'らぶ' }];
  it('matches whole words ignoring case and keeps the input spelling', () => {
    expect(applyUserDict([{ kind: 'text', text: 'Love you' }], love)).toEqual([
      { kind: 'fixed', surface: 'Love', reading: 'らぶ', source: 'user' },
      { kind: 'text', text: ' you' },
    ]);
    expect(applyUserDict([{ kind: 'text', text: 'LOVEソング' }], love)).toEqual([
      { kind: 'fixed', surface: 'LOVE', reading: 'らぶ', source: 'user' },
      { kind: 'text', text: 'ソング' },
    ]);
  });
  it('does not match inside a longer word', () => {
    const segs: Segment[] = [{ kind: 'text', text: "lovely love's" }];
    expect(applyUserDict(segs, love)).toEqual(segs);
  });
  it('matches words with apostrophes', () => {
    expect(applyUserDict([{ kind: 'text', text: "I don't" }], [{ surface: "don't", reading: 'どんと' }])).toEqual([
      { kind: 'text', text: 'I ' },
      { kind: 'fixed', surface: "don't", reading: 'どんと', source: 'user' },
    ]);
  });
  it('prefers a mixed entry over a latin word entry', () => {
    const out = applyUserDict([{ kind: 'text', text: 'LOVEソング' }], [
      ...love,
      { surface: 'LOVEソング', reading: 'らぶそんぐ' },
    ]);
    expect(out).toEqual([{ kind: 'fixed', surface: 'LOVEソング', reading: 'らぶそんぐ', source: 'user' }]);
  });
});

describe('normalizeUserDict', () => {
  it('dedupes with last-wins and drops empties', () => {
    expect(
      normalizeUserDict([
        { surface: 'a', reading: 'x' },
        { surface: 'a', reading: 'y' },
        { surface: '', reading: 'z' },
        { surface: 'b', reading: ' ' },
      ]),
    ).toEqual([{ surface: 'a', reading: 'y' }]);
  });
});

describe('normalizeUserDict (line safety)', () => {
  it('drops surfaces containing a newline', () => {
    expect(normalizeUserDict([{ surface: 'a\nb', reading: 'x' }, { surface: 'c', reading: 'y' }])).toEqual([
      { surface: 'c', reading: 'y' },
    ]);
  });
});
