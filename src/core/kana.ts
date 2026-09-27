/** カタカナ→ひらがな。ヷヸヹヺは対応する濁点付き仮名がないため「ゔ」系に寄せる */
export function kataToHira(s: string): string {
  let out = '';
  for (const ch of s) {
    const code = ch.codePointAt(0)!;
    if (code >= 0x30a1 && code <= 0x30f6) {
      out += String.fromCodePoint(code - 0x60);
    } else if (code === 0x30f7) out += 'ゔぁ';
    else if (code === 0x30f8) out += 'ゔぃ';
    else if (code === 0x30f9) out += 'ゔぇ';
    else if (code === 0x30fa) out += 'ゔぉ';
    else out += ch;
  }
  return out;
}

/** ひらがな→カタカナ */
export function hiraToKata(s: string): string {
  let out = '';
  for (const ch of s) {
    const code = ch.codePointAt(0)!;
    if (code >= 0x3041 && code <= 0x3096) out += String.fromCodePoint(code + 0x60);
    else out += ch;
  }
  return out;
}

export function isHiragana(ch: string): boolean {
  const c = ch.codePointAt(0)!;
  return c >= 0x3041 && c <= 0x3096;
}
export function isKatakana(ch: string): boolean {
  const c = ch.codePointAt(0)!;
  return c >= 0x30a1 && c <= 0x30fa;
}
/** 長音記号 */
export function isChoonpu(ch: string): boolean {
  return ch === 'ー' || ch === 'ー';
}
/** かな文字か（長音記号を含む） */
export function isKana(ch: string): boolean {
  return isHiragana(ch) || isKatakana(ch) || isChoonpu(ch);
}
/** 文字列全体がかな（長音記号含む）か。空文字は false */
export function isAllKana(s: string): boolean {
  if (s.length === 0) return false;
  for (const ch of s) if (!isKana(ch)) return false;
  return true;
}
export function isKanji(ch: string): boolean {
  const c = ch.codePointAt(0)!;
  return (
    (c >= 0x4e00 && c <= 0x9fff) ||
    (c >= 0x3400 && c <= 0x4dbf) ||
    (c >= 0x20000 && c <= 0x2ffff) ||
    (c >= 0xf900 && c <= 0xfaff) ||
    ch === '々' ||
    ch === '〆' ||
    ch === '〇'
  );
}

/** 小書き仮名（直前の仮名と結合して 1 モーラになるもの） */
export const SMALL_KANA = new Set(['ゃ', 'ゅ', 'ょ', 'ぁ', 'ぃ', 'ぅ', 'ぇ', 'ぉ', 'ゎ', 'ャ', 'ュ', 'ョ', 'ァ', 'ィ', 'ゥ', 'ェ', 'ォ', 'ヮ']);

/** 半角カナ→全角カナ（濁点・半濁点の結合を含む） */
const HALF_TO_FULL: Record<string, string> = {
  '｡': '。', '｢': '「', '｣': '」', '､': '、', '･': '・',
  'ｦ': 'ヲ', 'ｧ': 'ァ', 'ｨ': 'ィ', 'ｩ': 'ゥ', 'ｪ': 'ェ', 'ｫ': 'ォ', 'ｬ': 'ャ', 'ｭ': 'ュ', 'ｮ': 'ョ', 'ｯ': 'ッ',
  'ｰ': 'ー', 'ｱ': 'ア', 'ｲ': 'イ', 'ｳ': 'ウ', 'ｴ': 'エ', 'ｵ': 'オ', 'ｶ': 'カ', 'ｷ': 'キ', 'ｸ': 'ク', 'ｹ': 'ケ', 'ｺ': 'コ',
  'ｻ': 'サ', 'ｼ': 'シ', 'ｽ': 'ス', 'ｾ': 'セ', 'ｿ': 'ソ', 'ﾀ': 'タ', 'ﾁ': 'チ', 'ﾂ': 'ツ', 'ﾃ': 'テ', 'ﾄ': 'ト',
  'ﾅ': 'ナ', 'ﾆ': 'ニ', 'ﾇ': 'ヌ', 'ﾈ': 'ネ', 'ﾉ': 'ノ', 'ﾊ': 'ハ', 'ﾋ': 'ヒ', 'ﾌ': 'フ', 'ﾍ': 'ヘ', 'ﾎ': 'ホ',
  'ﾏ': 'マ', 'ﾐ': 'ミ', 'ﾑ': 'ム', 'ﾒ': 'メ', 'ﾓ': 'モ', 'ﾔ': 'ヤ', 'ﾕ': 'ユ', 'ﾖ': 'ヨ',
  'ﾗ': 'ラ', 'ﾘ': 'リ', 'ﾙ': 'ル', 'ﾚ': 'レ', 'ﾛ': 'ロ', 'ﾜ': 'ワ', 'ﾝ': 'ン',
};

/**
 * 入力の正規化。
 * - 半角カナ→全角カナ（結合濁点を処理）
 * - 全角英数→半角
 * - 全角スペース以外の括弧類を統一（（）→ () は行わず ruby.ts 側で両方扱う）
 * - 改行は \n に統一
 */
export function normalizeInput(text: string): string {
  let s = text.replace(/\r\n?/g, '\n');
  // 半角カナ
  s = s.replace(/[｡-ﾟ]/g, (ch) => HALF_TO_FULL[ch] ?? ch);
  // 結合濁点・半濁点（半角 ﾞ ﾟ は上で変換されない → 直接処理）
  s = s.replace(/([ァ-ヺ])ﾞ/g, (_m, k: string) => (k + '゙').normalize('NFC'));
  s = s.replace(/([ァ-ヺ])ﾟ/g, (_m, k: string) => (k + '゚').normalize('NFC'));
  s = s.replace(/[ﾞﾟ]/g, '');
  // 全角英数字→半角
  s = s.replace(/[０-９Ａ-Ｚａ-ｚ]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0xfee0),
  );
  // 結合文字の正規化（ か+゛ → が など）
  s = s.normalize('NFC');
  return s;
}
