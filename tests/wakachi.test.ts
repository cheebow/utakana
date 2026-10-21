import { describe, expect, it } from 'vitest';
import { segmentBreaks } from '../src/core/wakachi';
import type { Token } from '../src/core/types';

const tok = (surface: string, pos: string): Token => ({
  id: '',
  surface,
  reading: null,
  pronunciation: null,
  pos,
  source: 'dict',
});

describe('segmentBreaks', () => {
  it('handles empty input', () => {
    expect(segmentBreaks([])).toEqual([]);
  });
  it('attaches particles and auxiliary verbs to the previous word', () => {
    const tokens = [tok('僕', '名詞'), tok('は', '助詞'), tok('歌っ', '動詞'), tok('た', '助動詞')];
    expect(segmentBreaks(tokens)).toEqual([true, false, true, false]);
  });
  it('joins consecutive nouns into a compound word', () => {
    expect(segmentBreaks([tok('通院', '名詞'), tok('介助', '名詞')])).toEqual([true, false]);
    expect(segmentBreaks([tok('お', '接頭詞'), tok('水', '名詞')])).toEqual([true, false]);
  });
  it('breaks between a verb and a following noun', () => {
    expect(segmentBreaks([tok('歌う', '動詞'), tok('声', '名詞')])).toEqual([true, true]);
  });
  it('keeps numbers with decimal points and digit separators together', () => {
    // 実際の解析では半角数字は UNK、「．」は IPADIC 上なぜか名詞で返る
    expect(segmentBreaks([tok('0', 'UNK'), tok('．', '名詞'), tok('5', 'UNK')])).toEqual([true, false, false]);
    expect(segmentBreaks([tok('1', 'UNK'), tok(',', '記号'), tok('068', 'UNK')])).toEqual([true, false, false]);
  });
  it('joins a number with a following counter noun', () => {
    expect(segmentBreaks([tok('12', 'UNK'), tok('人', '名詞')])).toEqual([true, false]);
    expect(segmentBreaks([tok('第', '接頭詞'), tok('3', 'UNK'), tok('回', '名詞')])).toEqual([true, false, false]);
  });
  it('breaks between a noun and a following number', () => {
    // 家事援助０．５ のような「ことば＋数値」は数値の前で区切る
    expect(segmentBreaks([tok('援助', '名詞'), tok('0', 'UNK'), tok('．', '名詞'), tok('5', 'UNK')])).toEqual([
      true,
      true,
      false,
      false,
    ]);
  });
  it('breaks after punctuation but attaches the punctuation itself', () => {
    const tokens = [tok('さくら', '名詞'), tok('、', '記号'), tok('さくら', '名詞'), tok('。', '記号')];
    expect(segmentBreaks(tokens)).toEqual([true, false, true, false]);
  });
  it('keeps bracketed runs attached and breaks after the closing bracket', () => {
    const tokens = [tok('空', '名詞'), tok('（', '記号'), tok('そら', '名詞'), tok('）', '記号'), tok('と', '助詞'), tok('海', '名詞')];
    // 助詞は閉じ括弧の直後でも前のことばに付き、次の自立語で区切る
    expect(segmentBreaks(tokens)).toEqual([true, false, false, false, false, true]);
  });
  it('treats unknown tokens as independent words', () => {
    expect(segmentBreaks([tok('鵺鵼', 'UNK'), tok('夜', '名詞')])).toEqual([true, true]);
  });
});
