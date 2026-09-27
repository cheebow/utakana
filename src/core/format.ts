import type { OutputFormat } from './types';

/**
 * 行ごとのモーラ配列を出力文字列に整形する。
 * - plain: 行内は連結、改行維持
 * - space: モーラをスペース区切り
 */
export function formatOutput(moraLines: string[][], format: OutputFormat): string {
  switch (format) {
    case 'plain':
      return moraLines.map((m) => m.join('')).join('\n');
    case 'space':
      return moraLines.map((m) => m.join(' ')).join('\n');
  }
}

export interface MoraCount {
  perLine: number[];
  total: number;
}

export function countMoras(moraLines: string[][]): MoraCount {
  const perLine = moraLines.map((m) => m.length);
  return { perLine, total: perLine.reduce((a, b) => a + b, 0) };
}
