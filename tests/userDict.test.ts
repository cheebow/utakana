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
