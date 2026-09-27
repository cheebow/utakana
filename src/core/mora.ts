import { SMALL_KANA, isKana } from './kana';
import type { HatsuonMode, SokuonMode } from './types';

/** かな 1 文字の母音（あいうえお）。母音を持たないもの（ん・っ・ー）は null */
const VOWEL_ROWS: Record<string, string> = {
  a: 'あかさたなはまやらわがざだばぱぁゃゎゕ',
  i: 'いきしちにひみりぎじぢびぴぃ',
  u: 'うくすつぬふむゆるぐずづぶぷぅゅゔ',
  e: 'えけせてねへめれげぜでべぺぇゖ',
  o: 'おこそとのほもよろごぞどぼぽぉょを',
};
const VOWEL_KANA: Record<string, string> = { a: 'あ', i: 'い', u: 'う', e: 'え', o: 'お' };
const VOWEL_OF = new Map<string, string>();
for (const [row, chars] of Object.entries(VOWEL_ROWS)) {
  for (const ch of chars) VOWEL_OF.set(ch, VOWEL_KANA[row]);
}

/** 直前のかな文字から、長音を置き換える母音（ひらがな）を返す。決められなければ null */
export function vowelOf(ch: string | null | undefined): string | null {
  if (!ch) return null;
  return VOWEL_OF.get(ch) ?? null;
}

/**
 * ひらがな文字列をモーラに分割する。
 * - 基本かな + 任意の小書きかな（ゃゅょぁぃぅぇぉゎ）で 1 モーラ
 * - ん・っ・ー・- は単独モーラ
 * - かな以外（英字・数字・記号など）の連続は 1 かたまりで 1 モーラ扱い
 */
export function splitMora(text: string): string[] {
  const moras: string[] = [];
  let other = '';
  const flushOther = () => {
    if (other) {
      moras.push(other);
      other = '';
    }
  };
  for (const ch of text) {
    if (ch === '-') {
      flushOther();
      moras.push('-');
      continue;
    }
    if (!isKana(ch)) {
      if (/\s/.test(ch)) {
        flushOther();
        continue;
      }
      other += ch;
      continue;
    }
    flushOther();
    if (SMALL_KANA.has(ch) && moras.length > 0) {
      const prev = moras[moras.length - 1];
      const prevLast = [...prev].at(-1)!;
      // 直前が結合可能な通常かな（小書き・ん・っ・ー でない）なら結合
      if (isKana(prevLast) && !SMALL_KANA.has(prevLast) && !'んっー-'.includes(prevLast)) {
        moras[moras.length - 1] = prev + ch;
        continue;
      }
    }
    moras.push(ch);
  }
  flushOther();
  return moras;
}

export function countMora(text: string): number {
  return splitMora(text).length;
}

const VOWELS = new Set(['あ', 'い', 'う', 'え', 'お']);

/**
 * 同じ母音の連続を 1 つにまとめる（とおきょお → ときょ、ええ → え）。
 * 1 トークン内で使う想定（「この音」のようにトークンをまたぐ連続はまとめない）。
 */
export function mergeRepeatedVowels(moras: string[]): string[] {
  const out: string[] = [];
  for (const m of moras) {
    const prev = out[out.length - 1];
    if (prev !== undefined && VOWELS.has(m) && vowelOf([...prev].at(-1)) === m) continue;
    out.push(m);
  }
  return out;
}

export interface MoraRuleOptions {
  sokuon: SokuonMode;
  hatsuon: HatsuonMode;
}

function endsWithKana(mora: string): boolean {
  const last = [...mora].at(-1);
  return last !== undefined && isKana(last) && last !== '-';
}

/**
 * 行単位のモーラ列に促音・撥音の扱いを適用する。
 * - 促音 attach: 「っ」を直前のモーラに付ける（もっ・くっ）。行末の「っ」は音符にならないので削除
 * - 促音 drop: 「っ」をすべて削除
 * - 撥音 attach: 「ん」を直前のモーラに付ける（せん・ほん）
 * 直前がかなでない（行頭・英字など）場合は単独のまま残す。
 */
export function applyMoraRules(moras: string[], options: MoraRuleOptions): string[] {
  const out: string[] = [];
  moras.forEach((m, idx) => {
    if (m === 'っ') {
      if (options.sokuon === 'drop') return;
      if (options.sokuon === 'attach') {
        const isLast = idx === moras.length - 1;
        if (isLast) return;
        const prev = out[out.length - 1];
        if (prev !== undefined && endsWithKana(prev) && prev !== 'っ') {
          out[out.length - 1] = prev + m;
          return;
        }
      }
    } else if (m === 'ん' && options.hatsuon === 'attach') {
      const prev = out[out.length - 1];
      if (prev !== undefined && endsWithKana(prev)) {
        out[out.length - 1] = prev + m;
        return;
      }
    }
    out.push(m);
  });
  return out;
}
