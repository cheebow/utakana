import type { FixedSource, Segment, UserDictEntry } from './types';

const NUMERAL_HEAD = /^[0-9一二三四五六七八九十百千何]/;
const NUMERAL_CHAR = /^[0-9一二三四五六七八九十百千万億兆]$/;

/** 見出し語の重複を除き（後勝ち）、空の見出し語を捨てる */
export function normalizeUserDict(entries: UserDictEntry[]): UserDictEntry[] {
  const map = new Map<string, string>();
  for (const e of entries) {
    const surface = e.surface.trim();
    const reading = e.reading.trim();
    if (!surface || !reading) continue;
    map.set(surface, reading);
  }
  return [...map].map(([surface, reading]) => ({ surface, reading }));
}

/**
 * テキストセグメント内でユーザー辞書の見出し語を最長一致で探し、
 * 読み固定セグメント（source: 'user'）に切り出す。
 */
export function applyUserDict(
  segments: Segment[],
  entries: UserDictEntry[],
  source: FixedSource = 'user',
): Segment[] {
  const dict = normalizeUserDict(entries);
  if (dict.length === 0) return segments;
  // 先頭文字で索引し、長い順に並べる
  const byFirst = new Map<string, UserDictEntry[]>();
  for (const e of dict) {
    const first = [...e.surface][0];
    const list = byFirst.get(first) ?? [];
    list.push(e);
    byFirst.set(first, list);
  }
  for (const list of byFirst.values()) list.sort((a, b) => b.surface.length - a.surface.length);

  const out: Segment[] = [];
  const pushText = (s: string) => {
    if (!s) return;
    const prev = out[out.length - 1];
    if (prev && prev.kind === 'text') prev.text += s;
    else out.push({ kind: 'text', text: s });
  };

  for (const seg of segments) {
    if (seg.kind !== 'text') {
      out.push(seg);
      continue;
    }
    const text = seg.text;
    let i = 0;
    let start = 0;
    while (i < text.length) {
      const cp = text.codePointAt(i)!;
      const ch = String.fromCodePoint(cp);
      const candidates = byFirst.get(ch);
      let matched: UserDictEntry | null = null;
      if (candidates) {
        const prevChar = i > 0 ? text[i - 1] : '';
        for (const c of candidates) {
          if (!text.startsWith(c.surface, i)) continue;
          // 数詞で始まる見出し語は、直前も数詞なら別の数（十二人 → 十 + 二人）なので採用しない
          if (NUMERAL_HEAD.test(c.surface) && NUMERAL_CHAR.test(prevChar)) continue;
          matched = c;
          break;
        }
      }
      if (matched) {
        pushText(text.slice(start, i));
        out.push({ kind: 'fixed', surface: matched.surface, reading: matched.reading, source });
        i += matched.surface.length;
        start = i;
      } else {
        i += ch.length;
      }
    }
    pushText(text.slice(start));
  }
  return out;
}
