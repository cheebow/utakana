import type { ConvertedLine } from '../core/convert';
import type { Token } from '../core/types';
import { TokenChip } from './TokenChip';
import { TokenEditor } from './TokenEditor';

export interface EditTarget {
  lineIndex: number;
  tokenIndex: number;
}

interface Props {
  lines: ConvertedLine[];
  editing: EditTarget | null;
  onEdit: (target: EditTarget | null) => void;
  onSubmitReading: (target: EditTarget, token: Token, reading: string, addToDict: boolean) => void;
  onClearReading: (target: EditTarget, token: Token) => void;
}

export function ResultView({ lines, editing, onEdit, onSubmitReading, onClearReading }: Props) {
  const isEmpty = lines.every((l) => l.tokens.length === 0);
  return (
    <section className="panel result-panel" aria-label="変換結果">
      <div className="panel-header">
        <h2>読み</h2>
        <ul className="legend" aria-label="色の意味">
          <li className="legend-dict">辞書</li>
          <li className="legend-ruby">ルビ</li>
          <li className="legend-user">ユーザー辞書</li>
          <li className="legend-manual">手動修正</li>
          <li className="legend-unknown">未変換</li>
        </ul>
      </div>
      <div className="result-lines">
        {isEmpty ? (
          <p className="placeholder">左に歌詞を入力すると、ここに読みが表示されます。チップをクリックすると読みを修正できます。</p>
        ) : (
          lines.map((line) => (
            <div className="result-line" key={line.index}>
              <span className="line-no" aria-hidden="true">
                {line.index + 1}
              </span>
              <div className="line-tokens">
                {line.tokens.length === 0 ? <span className="line-empty">　</span> : null}
                {line.tokens.map((token, i) => {
                  const active = editing?.lineIndex === line.index && editing.tokenIndex === i;
                  const target = { lineIndex: line.index, tokenIndex: i };
                  return (
                    <span className="chip-wrap" key={token.id}>
                      <TokenChip
                        token={token}
                        reading={line.readings[i]}
                        active={active}
                        onClick={() => onEdit(active ? null : target)}
                      />
                      {active ? (
                        <TokenEditor
                          token={token}
                          currentReading={line.readings[i]}
                          onSubmit={(reading, addToDict) => onSubmitReading(target, token, reading, addToDict)}
                          onClear={() => onClearReading(target, token)}
                          onCancel={() => onEdit(null)}
                        />
                      ) : null}
                    </span>
                  );
                })}
              </div>
              <span className="line-count" title="この行のモーラ数">
                {line.moras.length}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
