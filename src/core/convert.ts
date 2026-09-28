import { WORD_SEP, countMoraList, countMoras, formatOutput, type MoraCount } from './format';
import { BUILTIN_DICT } from './builtinDict';
import { isAllKana, isKanji, normalizeInput } from './kana';
import { isWordSepNeighbor, splitLatinWords } from './latin';
import { applyMoraRules, mergeRepeatedVowels, splitMora } from './mora';
import { parseRuby } from './ruby';
import { applyLineRules, resolveReading } from './rules';
import type { RawToken, TokenizeFn } from './tokenizer';
import type { Line, Segment, Settings, Token, UserDictEntry } from './types';
import { applyUserDict } from './userDict';

/** 手動修正の読み。キーは overrideKey() で生成 */
export type ReadingOverrides = Record<string, string>;

export function overrideKey(lineIndex: number, tokenIndex: number, surface: string): string {
  return `${lineIndex}:${tokenIndex}:${surface}`;
}

export interface ConvertOptions {
  settings: Settings;
  userDict: UserDictEntry[];
  overrides?: ReadingOverrides;
}

export interface ConvertedLine extends Line {
  /** トークンごとの最終的な読み（ルール適用後、ひらがな） */
  readings: string[];
  /** 行のモーラ列（英単語間の区切り WORD_SEP を含む） */
  moras: string[];
  /** 行の音数（区切りを除く） */
  moraCount: number;
}

export interface ConvertResult {
  lines: ConvertedLine[];
  output: string;
  moraCount: MoraCount;
}

/** ID 付与前のトークン（行に配置するときに id を振る） */
type TokenDraft = Omit<Token, 'id'>;

const SYMBOL_POS = new Set(['記号']);
/** IPADIC が記号と認識しない半角記号など（, ! ' ♪ …）。記号設定に従わせるため品詞を記号に寄せる */
const PUNCT_RE = /^[\p{P}\p{S}]+$/u;

function isWhitespace(s: string): boolean {
  return /^\s+$/.test(s);
}

/** 形態素解析の生トークンを共通 Token に正規化する */
function normalizeRawToken(raw: RawToken): TokenDraft {
  const surface = raw.surface;
  if (raw.partOfSpeech === 'UNK') {
    if (PUNCT_RE.test(surface)) {
      return { surface, reading: surface, pronunciation: null, pos: '記号', source: 'dict' };
    }
    if (isAllKana(surface)) {
      return { surface, reading: surface, pronunciation: null, pos: 'UNK', source: 'dict' };
    }
    return { surface, reading: null, pronunciation: null, pos: 'UNK', source: 'unknown' };
  }
  const reading = raw.reading && raw.reading !== '*' ? raw.reading : null;
  const pronunciation = raw.pronunciation && raw.pronunciation !== '*' ? raw.pronunciation : null;
  if (reading === null && !isAllKana(surface)) {
    return { surface, reading: null, pronunciation: null, pos: raw.partOfSpeech, source: 'unknown' };
  }
  return {
    surface,
    reading: reading ?? surface,
    pronunciation,
    pos: raw.partOfSpeech,
    source: 'dict',
  };
}

function isAllKanji(s: string): boolean {
  if (s.length === 0) return false;
  for (const ch of s) if (!isKanji(ch)) return false;
  return true;
}

/**
 * 辞書に無い漢字を含む漢字連続は、分割位置も読みも信用できない
 * （例: 既読 → 既[スンデ] + 読[UNK]）。連続する漢字のみのトークンのうち
 * 未知語を含む並びは 1 つの「未変換」トークンにまとめ、誤読を出さずにユーザーへ委ねる。
 */
function mergeUnknownKanji(tokens: TokenDraft[]): TokenDraft[] {
  const out: TokenDraft[] = [];
  let i = 0;
  while (i < tokens.length) {
    if (!isAllKanji(tokens[i].surface)) {
      out.push(tokens[i]);
      i++;
      continue;
    }
    let j = i;
    let hasUnknown = false;
    while (j < tokens.length && isAllKanji(tokens[j].surface)) {
      if (tokens[j].source === 'unknown') hasUnknown = true;
      j++;
    }
    if (hasUnknown && j - i > 1) {
      const surface = tokens.slice(i, j).map((t) => t.surface).join('');
      out.push({
        surface,
        reading: null,
        pronunciation: null,
        pos: 'UNK',
        source: 'unknown',
        spaceBefore: tokens[i].spaceBefore,
      });
    } else {
      out.push(...tokens.slice(i, j));
    }
    i = j;
  }
  return out;
}

/**
 * セグメント列 → 行ごとのトークン列。
 * 改行はテキストセグメント内にのみ現れる（ルビ・辞書見出しは改行を含まない）。
 * 英字語は形態素解析に通さず 1 語 1 トークン（source: 'latin'）として切り出す。
 * 空白は捨てるが、直後のトークンに spaceBefore を立てて英単語間の区切りを復元できるようにする。
 */
function segmentsToLines(segments: Segment[], tokenize: TokenizeFn, settings: Settings): Line[] {
  const lines: Line[] = [{ index: 0, tokens: [] }];
  const current = () => lines[lines.length - 1];
  // 直前に空白があった（記号を落としても持ち越し、次に push するトークンに付ける）
  let pendingSpace = false;
  const newLine = () => {
    lines.push({ index: lines.length, tokens: [] });
    pendingSpace = false;
  };
  const push = (t: TokenDraft) => {
    const line = current();
    line.tokens.push({ ...t, id: `${line.index}:${line.tokens.length}` });
  };
  const takeSpace = (): boolean => {
    const s = pendingSpace;
    pendingSpace = false;
    return s;
  };

  for (const seg of segments) {
    if (seg.kind === 'fixed') {
      push({
        surface: seg.surface,
        reading: seg.reading,
        pronunciation: null,
        pos: seg.source,
        source: seg.source === 'builtin' ? 'dict' : seg.source,
        spaceBefore: takeSpace(),
      });
      continue;
    }
    // 改行で分割してから解析し、行対応を確実にする
    const parts = seg.text.split('\n');
    parts.forEach((part, i) => {
      if (i > 0) newLine();
      if (part.length === 0) return;
      const toks: TokenDraft[] = [];
      for (const chunk of splitLatinWords(part)) {
        if (chunk.kind === 'latin') {
          toks.push({
            surface: chunk.text,
            reading: null,
            pronunciation: null,
            pos: 'latin',
            source: 'latin',
            spaceBefore: takeSpace(),
          });
          continue;
        }
        for (const raw of tokenize(chunk.text)) {
          if (isWhitespace(raw.surface)) {
            pendingSpace = true;
            continue;
          }
          const tok = normalizeRawToken(raw);
          if (!settings.keepSymbols && SYMBOL_POS.has(tok.pos)) continue;
          tok.spaceBefore = takeSpace();
          toks.push(tok);
        }
      }
      for (const tok of mergeUnknownKanji(toks)) push(tok);
    });
  }
  return lines;
}

/** 入力テキスト → 行構造（トークン列）。UI がチップ表示に使う */
export function analyze(text: string, tokenize: TokenizeFn, options: ConvertOptions): Line[] {
  const normalized = normalizeInput(text);
  let segments = parseRuby(normalized, { parenRuby: options.settings.parenRuby });
  segments = applyUserDict(segments, options.userDict, 'user');
  segments = applyUserDict(segments, BUILTIN_DICT, 'builtin');
  const lines = segmentsToLines(segments, tokenize, options.settings);
  const overrides = options.overrides;
  if (overrides) {
    for (const line of lines) {
      line.tokens.forEach((t, i) => {
        const manual = overrides[overrideKey(line.index, i, t.surface)];
        if (manual !== undefined) t.manualReading = manual;
      });
    }
  }
  return lines;
}

/** 行構造 → 読み・モーラ・出力文字列 */
export function render(lines: Line[], settings: Settings): ConvertResult {
  const converted: ConvertedLine[] = lines.map((line) => {
    const base = line.tokens.map((t) => resolveReading(t, settings));
    const readings = applyLineRules(base, settings);
    const perToken = readings.map((r) => {
      const m = splitMora(r);
      return settings.mergeSameVowel ? mergeRepeatedVowels(m) : m;
    });
    // トークン境界で英単語間の区切りを復元する（両隣が ASCII / ラテン文字のときだけ）
    const joined: string[] = [];
    let prevLast: string | null = null;
    line.tokens.forEach((t, i) => {
      const m = perToken[i];
      if (m.length === 0) return;
      const first = [...m[0]][0];
      if (t.spaceBefore && prevLast !== null && isWordSepNeighbor(prevLast) && isWordSepNeighbor(first)) {
        joined.push(WORD_SEP);
      }
      joined.push(...m);
      prevLast = [...m[m.length - 1]].at(-1) ?? null;
    });
    const moras = applyMoraRules(joined, { sokuon: settings.sokuon, hatsuon: settings.hatsuon });
    return { ...line, readings, moras, moraCount: countMoraList(moras) };
  });
  const moraLines = converted.map((l) => l.moras);
  return {
    lines: converted,
    output: formatOutput(moraLines, settings.outputFormat),
    moraCount: countMoras(moraLines),
  };
}

/** 入力テキストから一気に変換する */
export function convert(text: string, tokenize: TokenizeFn, options: ConvertOptions): ConvertResult {
  return render(analyze(text, tokenize, options), options.settings);
}
