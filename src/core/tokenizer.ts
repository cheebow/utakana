import init, { TokenizerBuilder, type Tokenizer } from 'lindera-wasm-web-ipadic';
import wasmUrl from 'lindera-wasm-web-ipadic/lindera_wasm_bg.wasm?url';

/** lindera が返す生トークン（必要なフィールドのみ） */
export interface RawToken {
  surface: string;
  partOfSpeech: string;
  partOfSpeechSubcategory1?: string;
  reading?: string;
  pronunciation?: string;
  baseForm?: string;
}

export type TokenizeFn = (text: string) => RawToken[];

/**
 * wasm 初期化済みの状態で Tokenizer を構築し、tokenize 関数を返す。
 * 空白・改行もトークンとして返す設定（行の対応付けに使う）。
 */
export function createTokenizer(): TokenizeFn {
  const builder = new TokenizerBuilder();
  builder.setDictionary('embedded://ipadic');
  builder.setKeepWhitespace(true);
  const tokenizer: Tokenizer = builder.build();
  return (text: string) => {
    if (text.length === 0) return [];
    return tokenizer.tokenize(text) as RawToken[];
  };
}

let loading: Promise<TokenizeFn> | null = null;

/**
 * ブラウザ用: wasm を非同期にロードして tokenize 関数を返す（シングルトン）。
 * 失敗した場合は次回呼び出しで再試行できるよう Promise を破棄する。
 */
export function loadTokenizer(): Promise<TokenizeFn> {
  if (!loading) {
    loading = (async () => {
      await init({ module_or_path: new URL(wasmUrl, document.baseURI) });
      return createTokenizer();
    })().catch((e) => {
      loading = null;
      throw e;
    });
  }
  return loading;
}
