import { useEffect, useRef, useState } from 'react';
import type { Token } from '../core/types';

interface Props {
  token: Token;
  currentReading: string;
  onSubmit: (reading: string, addToDict: boolean) => void;
  onClear: () => void;
  onCancel: () => void;
}

export function TokenEditor({ token, currentReading, onSubmit, onClear, onCancel }: Props) {
  const [value, setValue] = useState(currentReading);
  const [addToDict, setAddToDict] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) onCancel();
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [onCancel]);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed, addToDict);
  };

  return (
    <div className="token-editor" ref={rootRef} role="dialog" aria-label="読みの修正">
      <div className="token-editor-surface">
        「{token.surface}」の読み
      </div>
      <input
        ref={inputRef}
        className="token-editor-input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.nativeEvent.isComposing) return;
          if (e.key === 'Enter') {
            e.preventDefault();
            submit();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            onCancel();
          }
        }}
        lang="ja"
        autoComplete="off"
      />
      <label className="token-editor-check">
        <input type="checkbox" checked={addToDict} onChange={(e) => setAddToDict(e.target.checked)} />
        ユーザー辞書に登録（{token.surface} → {value.trim() || '…'}）
      </label>
      <div className="token-editor-actions">
        <button type="button" className="primary" onClick={submit} disabled={!value.trim()}>
          確定
        </button>
        {token.manualReading ? (
          <button type="button" className="ghost" onClick={onClear}>
            修正を解除
          </button>
        ) : null}
        <button type="button" className="ghost" onClick={onCancel}>
          取消
        </button>
      </div>
    </div>
  );
}
