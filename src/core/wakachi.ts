import type { Token } from './types';

/** この記号で終わるトークンの直後ではことばを区切る（句読点・中点・閉じ括弧類） */
const BREAK_AFTER = new Set([...'。、！？!?・…‥）)」』】］〕｝}〉》']);

/** 前のことばに続ける付属語の品詞 */
const ATTACH_POS = new Set(['助詞', '助動詞']);

/** 記号の判定。IPADIC は「．」等を名詞として返すことがあるため、表記でも判定する */
const PUNCT_RE = /^[\p{P}\p{S}]+$/u;
function isSymbol(t: Token): boolean {
  return t.pos === '記号' || PUNCT_RE.test(t.surface);
}

/** 数字列。半角数字は未知語（UNK）になるため品詞ではなく表記で判定する */
function isNumeric(t: Token): boolean {
  return /^[0-9]+$/.test(t.surface);
}

/** 複合名詞の前半になれるトークンか */
function isNounish(t: Token): boolean {
  return t.pos === '名詞' || t.pos === '接頭詞' || isNumeric(t);
}

/**
 * 分かち書き（文節寄り）の区切り判定。各トークンが新しい「ことば」を始めるとき true。
 * - 記号は前のことばに付ける（開き括弧・小数点なども含めて区切らない）
 * - 助詞・助動詞は前のことばに続ける
 * - 句読点・閉じ括弧の直後は区切る
 * - 名詞が名詞・接頭詞・数字に続くときはつなげる（複合名詞・「12人」のような助数詞）
 * - 数字は数字・接頭詞の後ろだけつなげる（「家事援助０．５」は援助と 0 の間で区切る）
 * 点字のマス開けを意識したヒューリスティックで、厳密な文節分割ではない。
 */
export function segmentBreaks(tokens: Token[]): boolean[] {
  return tokens.map((t, i) => {
    if (i === 0) return true;
    if (isSymbol(t)) return false;
    if (ATTACH_POS.has(t.pos)) return false;
    const prev = tokens[i - 1];
    if (isSymbol(prev)) return BREAK_AFTER.has([...prev.surface].at(-1)!);
    if (isNumeric(t)) return !(isNumeric(prev) || prev.pos === '接頭詞');
    return !(t.pos === '名詞' && isNounish(prev));
  });
}
