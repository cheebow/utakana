import { useCallback, useEffect, useMemo, useState } from 'react';
import { loadTokenizer, type TokenizeFn } from '../core/tokenizer';

export type TokenizerState =
  | { status: 'loading' }
  | { status: 'ready'; tokenize: TokenizeFn }
  | { status: 'error'; message: string };

export function useTokenizer(): TokenizerState & { retry: () => void } {
  const [state, setState] = useState<TokenizerState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    loadTokenizer().then(
      (tokenize) => {
        if (!cancelled) setState({ status: 'ready', tokenize });
      },
      (e: unknown) => {
        if (!cancelled) setState({ status: 'error', message: e instanceof Error ? e.message : String(e) });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  // 返り値を安定させ、利用側の useMemo / useCallback の依存に使えるようにする
  return useMemo(() => ({ ...state, retry }), [state, retry]);
}
