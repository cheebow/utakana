/**
 * 英字語（半角ラテン文字の単語）の扱い。
 * 英単語はかなに変換せず原文のまま出力する方針で、ここではその切り出しと判定だけを行う。
 * - ラテン文字の連続。語中のアポストロフィ（don't / don’t / rock'n'roll）は語に含める
 * - 語末のアポストロフィ（lovin'）は含めない（記号として扱われる）
 * - 数字は含めない（24h → 24 + h）
 */
export const LATIN_WORD_SRC = "\\p{Script=Latin}+(?:['’]\\p{Script=Latin}+)*";

const LATIN_WORD_FULL_RE = new RegExp(`^${LATIN_WORD_SRC}$`, 'u');
const LATIN_WORD_RE = new RegExp(LATIN_WORD_SRC, 'gu');

/** 文字列全体が 1 つの英字語か */
export function isLatinWord(s: string): boolean {
  return LATIN_WORD_FULL_RE.test(s);
}

export type LatinChunk = { kind: 'latin' | 'text'; text: string };

/** テキストを英字語とそれ以外に分ける。空のチャンクは出さない */
export function splitLatinWords(text: string): LatinChunk[] {
  const out: LatinChunk[] = [];
  let last = 0;
  for (const m of text.matchAll(LATIN_WORD_RE)) {
    const start = m.index;
    if (start > last) out.push({ kind: 'text', text: text.slice(last, start) });
    out.push({ kind: 'latin', text: m[0] });
    last = start + m[0].length;
  }
  if (last < text.length) out.push({ kind: 'text', text: text.slice(last) });
  return out;
}

/** 英字語の開始位置 → 単語 */
export function latinWordSpans(text: string): Map<number, string> {
  const spans = new Map<number, string>();
  for (const m of text.matchAll(LATIN_WORD_RE)) spans.set(m.index, m[0]);
  return spans;
}

const WORD_SEP_NEIGHBOR_RE = /^(?:[\x21-\x7e]|\p{Script=Latin})$/u;

/** 英単語間の区切り（スペース）を保つ対象となる文字か（ASCII の印字文字またはラテン文字） */
export function isWordSepNeighbor(ch: string): boolean {
  return WORD_SEP_NEIGHBOR_RE.test(ch);
}
