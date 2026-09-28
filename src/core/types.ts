/** トークンの読みの出どころ */
export type TokenSource = 'dict' | 'ruby' | 'user' | 'latin' | 'unknown';

export interface Token {
  /** 行内で一意な ID（"行番号:連番"） */
  id: string;
  /** 元表記 */
  surface: string;
  /** 表記寄りの読み（カタカナ）。未知語は null */
  reading: string | null;
  /** 発音形（カタカナ）。未知語や固定読みでは null */
  pronunciation: string | null;
  /** 品詞（IPADIC 大分類。UNK / ruby / user 等も入る） */
  pos: string;
  source: TokenSource;
  /** ユーザーが手で修正した読み（ひらがな） */
  manualReading?: string;
  /** 入力で直前に空白があった（英単語間の区切りの復元に使う） */
  spaceBefore?: boolean;
}

export interface Line {
  index: number;
  tokens: Token[];
}

/** ルビ・ユーザー辞書の前処理で得られるセグメント */
export type Segment =
  | { kind: 'text'; text: string }
  | { kind: 'fixed'; surface: string; reading: string; source: FixedSource };

/** 読み固定セグメントの出どころ。builtin は内蔵補助辞書（表示上は dict 扱い） */
export type FixedSource = 'ruby' | 'user' | 'builtin';

export type LongVowelMark = 'vowel' | 'hyphen' | 'keep' | 'drop';
/** 促音「っ」の扱い: 直前のモーラに付ける / 単独モーラ / 直前の母音にする / 削除 */
export type SokuonMode = 'attach' | 'separate' | 'vowel' | 'drop';
/** 撥音「ん」の扱い: 単独モーラ / 直前のモーラに付ける */
export type HatsuonMode = 'separate' | 'attach';
export type OutputFormat = 'plain' | 'space';

export interface Settings {
  /** 発音形（は→わ、東京→とーきょー）を優先する */
  usePronunciation: boolean;
  /** 長音「ー」の扱い */
  longVowelMark: LongVowelMark;
  /** 促音「っ」の扱い */
  sokuon: SokuonMode;
  /** 撥音「ん」の扱い */
  hatsuon: HatsuonMode;
  /** トークン内の えい → ええ（先生→せんせえ） */
  eiToEe: boolean;
  /** 「言う」「いう」→ ゆう */
  iuToYuu: boolean;
  /** トークン内で同じ母音が続くとき 1 つにまとめる（とおきょお→ときょ） */
  mergeSameVowel: boolean;
  /** を→お */
  woToO: boolean;
  /** ぢ→じ、づ→ず */
  diDuToJiZu: boolean;
  /** 句読点・記号を残す */
  keepSymbols: boolean;
  /** 括弧をルビとみなすヒューリスティックを有効にする */
  parenRuby: boolean;
  /** 出力形式 */
  outputFormat: OutputFormat;
}

export const DEFAULT_SETTINGS: Settings = {
  usePronunciation: true,
  longVowelMark: 'vowel',
  sokuon: 'attach',
  hatsuon: 'separate',
  eiToEe: true,
  iuToYuu: true,
  mergeSameVowel: false,
  woToO: true,
  diDuToJiZu: false,
  keepSymbols: false,
  parenRuby: true,
  outputFormat: 'plain',
};

export interface UserDictEntry {
  surface: string;
  reading: string;
}
