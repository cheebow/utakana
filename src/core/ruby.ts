import { isAllKana } from './kana';
import type { Segment } from './types';

const KANJI = '[\\p{Script=Han}々〆〇]';
// 1: |親《ルビ》  2: 漢字《ルビ》  3: 漢字（ルビ）
const RUBY_RE = new RegExp(
  `[|｜]([^|｜《》\\n]+)《([^《》\\n]*)》` +
    `|(${KANJI}+)《([^《》\\n]*)》` +
    `|(${KANJI}+)[（(]([^（）()\\n]*)[）)]`,
  'gu',
);

export interface RubyOptions {
  /** 括弧をルビとみなすヒューリスティックを有効にする */
  parenRuby: boolean;
}

/**
 * ルビ記法を抽出し、テキストをセグメント列に分割する。
 * - `|運命《さだめ》` / `｜運命《さだめ》`
 * - `運命《さだめ》`（《 直前の漢字の連続を親文字とする）
 * - `運命（さだめ）` / `運命(さだめ)`（括弧内がすべてかなのとき。parenRuby=false で無効）
 * ルビ部分がかなでなければルビとみなさず、そのままテキストとして残す。
 */
export function parseRuby(text: string, options: RubyOptions = { parenRuby: true }): Segment[] {
  const segments: Segment[] = [];
  let last = 0;
  const pushText = (s: string) => {
    if (!s) return;
    const prev = segments[segments.length - 1];
    if (prev && prev.kind === 'text') prev.text += s;
    else segments.push({ kind: 'text', text: s });
  };

  RUBY_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = RUBY_RE.exec(text)) !== null) {
    let surface: string | undefined;
    let reading: string | undefined;
    let isParen = false;
    if (m[1] !== undefined) {
      surface = m[1];
      reading = m[2];
    } else if (m[3] !== undefined) {
      surface = m[3];
      reading = m[4];
    } else {
      surface = m[5];
      reading = m[6];
      isParen = true;
    }
    const valid = surface.length > 0 && isAllKana(reading) && (!isParen || options.parenRuby);
    if (!valid) {
      // 親文字までを通常テキストとして進め、記号以降は次回スキャンに任せる
      const skipTo = m.index + surface.length + (m[1] !== undefined ? 1 : 0);
      pushText(text.slice(last, skipTo));
      last = skipTo;
      RUBY_RE.lastIndex = skipTo;
      continue;
    }
    pushText(text.slice(last, m.index));
    segments.push({ kind: 'fixed', surface, reading, source: 'ruby' });
    last = m.index + m[0].length;
  }
  pushText(text.slice(last));
  return segments;
}
