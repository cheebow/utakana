import { useCallback, useMemo, useState } from 'react';
import { LyricsInput } from './components/LyricsInput';
import { OutputPanel } from './components/OutputPanel';
import { ResultView, type EditTarget } from './components/ResultView';
import { SettingsPanel } from './components/SettingsPanel';
import { UserDictDialog } from './components/UserDictDialog';
import { analyze, overrideKey, render, type ReadingOverrides } from './core/convert';
import type { Token } from './core/types';
import { useSettings } from './state/settings';
import { useDebounced } from './state/useDebounced';
import { useLocalStorage } from './state/useLocalStorage';
import { useTokenizer } from './state/useTokenizer';
import { useUserDict } from './state/userDictStore';

const DRAFT_KEY = 'utakana:draft';
const OVERRIDES_KEY = 'utakana:overrides';

/** 保存されていた手動修正を検証する（文字列→文字列の辞書だけを受け付ける） */
function validateOverrides(raw: unknown): ReadingOverrides | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
  const out: ReadingOverrides = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === 'string' && value !== '') out[key] = value;
  }
  return out;
}

export default function App() {
  const tokenizer = useTokenizer();
  const { settings, update: updateSettings, reset: resetSettings } = useSettings();
  const userDict = useUserDict();
  const [text, setText] = useLocalStorage<string>(DRAFT_KEY, '', (raw) => (typeof raw === 'string' ? raw : null));
  const debouncedText = useDebounced(text, 300);
  const [overrides, setOverrides] = useLocalStorage<ReadingOverrides>(OVERRIDES_KEY, {}, validateOverrides);
  const [editing, setEditing] = useState<EditTarget | null>(null);
  const [dictOpen, setDictOpen] = useState(false);

  const tokenize = tokenizer.status === 'ready' ? tokenizer.tokenize : null;
  const result = useMemo(() => {
    if (!tokenize) return null;
    const lines = analyze(debouncedText, tokenize, {
      settings,
      userDict: userDict.entries,
      overrides,
    });
    return render(lines, settings);
  }, [tokenize, debouncedText, settings, userDict.entries, overrides]);

  const upsertUserDict = userDict.upsert;
  const handleSubmitReading = useCallback(
    (target: EditTarget, token: Token, reading: string, addToDict: boolean) => {
      if (addToDict) {
        upsertUserDict(token.surface, reading);
        // 辞書に入れたら、このトークンの手動修正は不要になる
        setOverrides((prev) => {
          const next = { ...prev };
          delete next[overrideKey(target.lineIndex, target.tokenIndex, token.surface)];
          return next;
        });
      } else {
        setOverrides((prev) => ({
          ...prev,
          [overrideKey(target.lineIndex, target.tokenIndex, token.surface)]: reading,
        }));
      }
      setEditing(null);
    },
    [upsertUserDict],
  );

  const handleClearReading = useCallback((target: EditTarget, token: Token) => {
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[overrideKey(target.lineIndex, target.tokenIndex, token.surface)];
      return next;
    });
    setEditing(null);
  }, []);

  const handleTextChange = useCallback(
    (value: string) => {
      setText(value);
      setEditing(null);
      // 歌詞が空になったら（「クリア」や全削除）、古い歌詞向けの手動修正も捨てる
      if (value === '') setOverrides({});
    },
    [setText, setOverrides],
  );

  return (
    <div className="app">
      <header className="app-header">
        <h1>
          うたかな <small>歌詞 → ひらがな（SynthesizerV / VOCALOID 用）</small>
        </h1>
        <div className="header-actions">
          <button type="button" className="ghost" onClick={() => setDictOpen(true)}>
            ユーザー辞書
            {userDict.entries.length > 0 ? <span className="badge">{userDict.entries.length}</span> : null}
          </button>
        </div>
      </header>

      {tokenizer.status === 'loading' ? (
        <div className="status loading" role="status">
          <span className="spinner" aria-hidden="true" /> 辞書を読み込んでいます（初回は約 13MB のダウンロードが必要です）…
        </div>
      ) : null}
      {tokenizer.status === 'error' ? (
        <div className="status error" role="alert">
          辞書の読み込みに失敗しました: {tokenizer.message}
          <button type="button" className="ghost" onClick={tokenizer.retry}>
            再試行
          </button>
        </div>
      ) : null}

      <main className="panes">
        <div className="pane pane-left">
          <LyricsInput value={text} onChange={handleTextChange} />
          <SettingsPanel settings={settings} onChange={updateSettings} onReset={resetSettings} />
        </div>
        <div className="pane pane-right">
          <ResultView
            lines={result?.lines ?? []}
            editing={editing}
            onEdit={setEditing}
            onSubmitReading={handleSubmitReading}
            onClearReading={handleClearReading}
          />
          <OutputPanel
            output={result?.output ?? ''}
            moraCount={result?.moraCount ?? { perLine: [], total: 0 }}
            format={settings.outputFormat}
            onFormatChange={(outputFormat) => updateSettings({ outputFormat })}
          />
        </div>
      </main>

      <UserDictDialog
        open={dictOpen}
        entries={userDict.entries}
        onClose={() => setDictOpen(false)}
        onUpsert={userDict.upsert}
        onRemove={userDict.remove}
        onMerge={userDict.merge}
        onReplaceAll={userDict.replaceAll}
        toJson={userDict.toJson}
      />

      <footer className="app-footer">
        <p>
          形態素解析: <a href="https://github.com/lindera/lindera-wasm" target="_blank" rel="noreferrer">lindera-wasm</a> (IPADIC) ·{' '}
          <a href="./NOTICE.txt" target="_blank" rel="noreferrer">第三者ライセンス</a>。
          入力・設定・辞書・手動修正した読みはこのブラウザ内（localStorage）にだけ保存されます。
        </p>
        <p>
          &copy; 2026 CHEEBOW ·{' '}
          <a href="https://github.com/cheebow/utakana" target="_blank" rel="noreferrer">GitHub</a> · MIT License
        </p>
      </footer>
    </div>
  );
}
