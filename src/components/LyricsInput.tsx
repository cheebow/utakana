interface Props {
  value: string;
  onChange: (value: string) => void;
}

export function LyricsInput({ value, onChange }: Props) {
  return (
    <section className="panel input-panel" aria-label="歌詞入力">
      <div className="panel-header">
        <h2>歌詞</h2>
        <div className="panel-actions">
          <span className="hint">
            ルビ: <code>|運命《さだめ》</code> / <code>運命（さだめ）</code>
          </span>
          <button type="button" className="ghost" onClick={() => onChange('')} disabled={!value}>
            クリア
          </button>
        </div>
      </div>
      <textarea
        className="lyrics-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={'ここに歌詞を貼り付け\n\n例:\n僕は東京へ行った\nこの|運命《さだめ》を'}
        spellCheck={false}
        lang="ja"
      />
    </section>
  );
}
