import { describe, expect, it } from 'vitest';
import { applyUserDict } from '../src/core/userDict';
import { BUILTIN_DICT } from '../src/core/builtinDict';

describe('builtin dict + numeral guard', () => {
  it('does not match a counter entry right after another numeral', () => {
    const out = applyUserDict([{ kind: 'text', text: '十二人と二人' }], BUILTIN_DICT, 'builtin');
    expect(out).toEqual([
      { kind: 'text', text: '十二人と' },
      { kind: 'fixed', surface: '二人', reading: 'ふたり', source: 'builtin' },
    ]);
  });
  it('has no single-character surfaces except safe ones', () => {
    const singles = BUILTIN_DICT.filter((e) => [...e.surface].length === 1).map((e) => e.surface);
    expect(singles.sort()).toEqual(['靄', '雹', '霙', '霰'].sort());
  });
});
