import { useEffect, useRef, useState } from 'react';
import type { UserDictEntry } from '../core/types';
import { parseUserDictJson } from '../state/userDictStore';

interface Props {
  open: boolean;
  entries: UserDictEntry[];
  onClose: () => void;
  onUpsert: (surface: string, reading: string) => void;
  onRemove: (surface: string) => void;
  onMerge: (entries: UserDictEntry[]) => void;
  onReplaceAll: (entries: UserDictEntry[]) => void;
  toJson: () => string;
}

export function UserDictDialog({ open, entries, onClose, onUpsert, onRemove, onMerge, onReplaceAll, toJson }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [surface, setSurface] = useState('');
  const [reading, setReading] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (open && !dlg.open) dlg.showModal();
    else if (!open && dlg.open) dlg.close();
  }, [open]);

  const add = () => {
    const s = surface.trim();
    const r = reading.trim();
    if (!s || !r) return;
    onUpsert(s, r);
    setSurface('');
    setReading('');
    setMessage(`「${s} → ${r}」を登録しました`);
  };

  const exportJson = () => {
    const blob = new Blob([toJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'utakana-userdict.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importFile = async (file: File, mode: 'merge' | 'replace') => {
    try {
      const parsed = parseUserDictJson(await file.text());
      if (mode === 'replace') onReplaceAll(parsed);
      else onMerge(parsed);
      setMessage(`${parsed.length} 件を${mode === 'replace' ? '置き換え' : '追加'}しました`);
    } catch (e) {
      setMessage(`読み込みに失敗しました: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  return (
    <dialog ref={ref} className="dict-dialog" onClose={onClose} onCancel={onClose}>
      <div className="dialog-header">
        <h2>ユーザー辞書</h2>
        <button type="button" className="ghost" onClick={onClose} aria-label="閉じる">
          ✕
        </button>
      </div>
      <p className="hint">見出し語は最長一致で読みを固定します。形態素解析より優先されます。</p>
      <form
        className="dict-add"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <input value={surface} onChange={(e) => setSurface(e.target.value)} placeholder="見出し語（例: 初音ミク）" lang="ja" />
        <span aria-hidden="true">→</span>
        <input value={reading} onChange={(e) => setReading(e.target.value)} placeholder="読み（例: はつねみく）" lang="ja" />
        <button type="submit" className="primary" disabled={!surface.trim() || !reading.trim()}>
          追加
        </button>
      </form>
      {message ? <p className="dict-message">{message}</p> : null}
      <div className="dict-list-wrap">
        {entries.length === 0 ? (
          <p className="placeholder">まだ登録がありません。結果のチップをクリックして「ユーザー辞書に登録」からも追加できます。</p>
        ) : (
          <table className="dict-list">
            <thead>
              <tr>
                <th>見出し語</th>
                <th>読み</th>
                <th aria-label="操作"></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.surface}>
                  <td>{e.surface}</td>
                  <td>{e.reading}</td>
                  <td>
                    <button type="button" className="ghost danger" onClick={() => onRemove(e.surface)}>
                      削除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="dialog-actions">
        <button type="button" className="ghost" onClick={exportJson} disabled={entries.length === 0}>
          JSON エクスポート
        </button>
        <button type="button" className="ghost" onClick={() => fileRef.current?.click()}>
          JSON インポート（追加）
        </button>
        <button
          type="button"
          className="ghost danger"
          onClick={() => {
            if (entries.length === 0 || confirm('登録済みの辞書をすべて削除します。よろしいですか？')) onReplaceAll([]);
          }}
          disabled={entries.length === 0}
        >
          すべて削除
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void importFile(f, 'merge');
            e.target.value = '';
          }}
        />
      </div>
    </dialog>
  );
}
