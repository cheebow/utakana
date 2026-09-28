import { kataToHira } from './kana';
import { vowelOf } from './mora';
import type { Settings, Token } from './types';

/**
 * トークンの読み（ひらがな）を決定する。
 * 優先順位: manualReading > ルビ/ユーザー辞書の固定読み > 発音形（設定 ON）> 表記読み > surface
 */
export function resolveReading(token: Token, settings: Settings): string {
  if (token.manualReading !== undefined && token.manualReading !== '') {
    return kataToHira(token.manualReading);
  }
  if (token.source === 'ruby' || token.source === 'user') {
    return kataToHira(token.reading ?? token.surface);
  }
  if (token.source === 'unknown' || token.source === 'latin') return token.surface;
  const base = settings.usePronunciation
    ? mergePronunciation(token.reading, token.pronunciation)
    : token.reading;
  // えい→ええ などの発音推定は解析結果の読みにだけ掛ける（明示された読みは書いたとおりに使う）
  return applyTokenRules(kataToHira(base ?? token.surface), settings);
}

/**
 * IPADIC の発音形は ヂ→ジ、ヅ→ズ に潰されている（徒然: ツレヅレ → ツレズレ）。
 * 四つ仮名の統一は diDuToJiZu 設定で別途行うので、ここでは表記読みの ヂ/ヅ を保つ。
 * 文字数が同じときだけ位置対応で復元する（ヴァ→バ のように長さが変わる場合はそのまま）。
 */
function mergePronunciation(reading: string | null, pronunciation: string | null): string | null {
  if (pronunciation === null) return reading;
  if (reading === null || reading.length !== pronunciation.length) return pronunciation;
  let out = '';
  for (let i = 0; i < pronunciation.length; i++) {
    const r = reading[i];
    const p = pronunciation[i];
    if ((r === 'ヂ' && p === 'ジ') || (r === 'ヅ' && p === 'ズ')) out += r;
    else out += p;
  }
  return out;
}

const E_ROW = new Set('えけせてねへめれげぜでべぺぇ');

/** トークン内で完結する読みの置き換え（えい→ええ、いう→ゆう）。辞書由来の読みにのみ適用する */
export function applyTokenRules(reading: string, settings: Settings): string {
  let r = reading;
  if (settings.iuToYuu && r === 'いう') r = 'ゆう';
  if (settings.eiToEe) {
    const chars = [...r];
    for (let i = 1; i < chars.length; i++) {
      if (chars[i] === 'い' && E_ROW.has(chars[i - 1])) chars[i] = 'え';
    }
    r = chars.join('');
  }
  return r;
}

/**
 * 行単位の後処理ルール。トークンごとの読み配列を受け取り、同じ形で返す。
 * 長音・促音の母音化は前のトークンにまたがって直前のかなを参照する。
 */
export function applyLineRules(readings: string[], settings: Settings): string[] {
  let prev: string | null = null;
  return readings.map((reading) => {
    let out = '';
    for (const ch of reading) {
      let c = ch;
      if (c === 'っ' && settings.sokuon === 'vowel') {
        const v = vowelOf(prev);
        if (v === null) continue;
        c = v;
      }
      if (c === 'ー') {
        if (settings.longVowelMark === 'drop') continue;
        if (settings.longVowelMark === 'hyphen') {
          c = '-';
        } else if (settings.longVowelMark === 'vowel') {
          if (prev === 'ん') c = 'ん';
          else {
            const v = vowelOf(prev);
            if (v === null) {
              // 直前に母音が無い（行頭・っ・非かな）→ 削除
              continue;
            }
            c = v;
          }
        }
      }
      if (settings.woToO && c === 'を') c = 'お';
      if (settings.diDuToJiZu) {
        if (c === 'ぢ') c = 'じ';
        else if (c === 'づ') c = 'ず';
      }
      out += c;
      prev = c;
    }
    return out;
  });
}
