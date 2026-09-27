import fs from 'node:fs';
import { createRequire } from 'node:module';
import { initSync } from 'lindera-wasm-web-ipadic';
import { createTokenizer, type TokenizeFn } from '../../src/core/tokenizer';

let cached: TokenizeFn | null = null;

/** 実 wasm を同期ロードして tokenize 関数を返す（テスト用） */
export function getTestTokenizer(): TokenizeFn {
  if (!cached) {
    const require = createRequire(import.meta.url);
    const wasmPath = require.resolve('lindera-wasm-web-ipadic/lindera_wasm_bg.wasm');
    initSync({ module: fs.readFileSync(wasmPath) });
    cached = createTokenizer();
  }
  return cached;
}
