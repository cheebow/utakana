import type { OutputFormat } from './types';

/** 英単語間の区切り。モーラ列に混ざるが音には数えない */
export const WORD_SEP = ' ';

/**
 * 行ごとのモーラ配列を出力文字列に整形する。
 * - plain: 行内は連結、改行維持（英単語間の区切りはそのまま残る）
 * - space: モーラをスペース区切り（区切りモーラは除いて二重スペースを避ける）
 */
export function formatOutput(moraLines: string[][], format: OutputFormat): string {
  switch (format) {
    case 'plain':
      return moraLines.map((m) => m.join('')).join('\n');
    case 'space':
      return moraLines.map((m) => m.filter((x) => x !== WORD_SEP).join(' ')).join('\n');
  }
}

export interface MoraCount {
  perLine: number[];
  total: number;
}

/** 区切りモーラを除いた音数 */
export function countMoraList(moras: string[]): number {
  let n = 0;
  for (const m of moras) if (m !== WORD_SEP) n++;
  return n;
}

export function countMoras(moraLines: string[][]): MoraCount {
  const perLine = moraLines.map(countMoraList);
  return { perLine, total: perLine.reduce((a, b) => a + b, 0) };
}
