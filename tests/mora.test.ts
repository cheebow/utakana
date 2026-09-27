import { describe, expect, it } from 'vitest';
import { applyMoraRules, mergeRepeatedVowels, splitMora, vowelOf } from '../src/core/mora';

describe('splitMora', () => {
  it('splits basic hiragana', () => {
    expect(splitMora('さくら')).toEqual(['さ', 'く', 'ら']);
  });
  it('treats small kana as part of the previous mora', () => {
    expect(splitMora('きゃっと')).toEqual(['きゃ', 'っ', 'と']);
    expect(splitMora('てぃでゅふぁゔぁ')).toEqual(['てぃ', 'でゅ', 'ふぁ', 'ゔぁ']);
  });
  it('treats ん / っ / - as standalone', () => {
    expect(splitMora('と-きょ-')).toEqual(['と', '-', 'きょ', '-']);
    expect(splitMora('こんにちは')).toEqual(['こ', 'ん', 'に', 'ち', 'は']);
    expect(splitMora('んー')).toEqual(['ん', 'ー']);
  });
  it('keeps non-kana runs as one chunk', () => {
    expect(splitMora('Hello')).toEqual(['Hello']);
    expect(splitMora('ぼかろ123')).toEqual(['ぼ', 'か', 'ろ', '123']);
  });
  it('does not attach a small kana to a leading position', () => {
    expect(splitMora('ゃあ')).toEqual(['ゃ', 'あ']);
  });
});

describe('vowelOf', () => {
  it('returns the vowel kana', () => {
    expect(vowelOf('き')).toBe('い');
    expect(vowelOf('ょ')).toBe('お');
    expect(vowelOf('ん')).toBeNull();
    expect(vowelOf(null)).toBeNull();
  });
});

describe('applyMoraRules', () => {
  const attach = { sokuon: 'attach', hatsuon: 'separate' } as const;
  it('attaches っ to the previous mora and drops a trailing っ', () => {
    expect(applyMoraRules(['お', 'も', 'っ', 'て'], attach)).toEqual(['お', 'もっ', 'て']);
    expect(applyMoraRules(['す', 'き', 'っ'], attach)).toEqual(['す', 'き']);
    expect(applyMoraRules(['っ', 'て'], attach)).toEqual(['っ', 'て']);
    expect(applyMoraRules(['Hello', 'っ', 'て'], attach)).toEqual(['Hello', 'っ', 'て']);
  });
  it('supports separate and drop for っ', () => {
    expect(applyMoraRules(['き', 'っ', 'と'], { sokuon: 'separate', hatsuon: 'separate' })).toEqual(['き', 'っ', 'と']);
    expect(applyMoraRules(['き', 'っ', 'と'], { sokuon: 'drop', hatsuon: 'separate' })).toEqual(['き', 'と']);
  });
  it('attaches ん when asked', () => {
    expect(applyMoraRules(['ほ', 'ん', 'と'], { sokuon: 'attach', hatsuon: 'attach' })).toEqual(['ほん', 'と']);
    expect(applyMoraRules(['ん', 'と'], { sokuon: 'attach', hatsuon: 'attach' })).toEqual(['ん', 'と']);
    expect(applyMoraRules(['ほ', 'ん', 'と'], attach)).toEqual(['ほ', 'ん', 'と']);
  });
});

describe('mergeRepeatedVowels', () => {
  it('merges a vowel that repeats the previous mora vowel', () => {
    expect(mergeRepeatedVowels(['と', 'お', 'きょ', 'お'])).toEqual(['と', 'きょ']);
    expect(mergeRepeatedVowels(['え', 'え', 'が'])).toEqual(['え', 'が']);
    expect(mergeRepeatedVowels(['お', 'お', 'お'])).toEqual(['お']);
  });
  it('keeps different vowels and ん', () => {
    expect(mergeRepeatedVowels(['あ', 'い'])).toEqual(['あ', 'い']);
    expect(mergeRepeatedVowels(['ん', 'ん'])).toEqual(['ん', 'ん']);
    expect(mergeRepeatedVowels(['か', 'い'])).toEqual(['か', 'い']);
  });
});
