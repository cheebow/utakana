import { useEffect, useState } from 'react';
import type { MoraCount } from '../core/format';
import type { OutputFormat } from '../core/types';

interface Props {
  output: string;
  moraCount: MoraCount;
  format: OutputFormat;
  onFormatChange: (format: OutputFormat) => void;
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // フォールバック（クリップボード API が使えない環境）
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

export function OutputPanel({ output, moraCount, format, onFormatChange }: Props) {
  const [copied, setCopied] = useState<'idle' | 'ok' | 'fail'>('idle');
  useEffect(() => {
    if (copied === 'idle') return;
    const id = setTimeout(() => setCopied('idle'), 1500);
    return () => clearTimeout(id);
  }, [copied]);

  const lineCount = moraCount.perLine.filter((n) => n > 0).length;

  return (
    <section className="panel output-panel" aria-label="出力">
      <div className="panel-header">
        <h2>出力</h2>
        <div className="panel-actions">
          <label className="select-label">
            形式
            <select value={format} onChange={(e) => onFormatChange(e.target.value as OutputFormat)}>
              <option value="plain">連続（行ごと）</option>
              <option value="space">スペース区切り</option>
            </select>
          </label>
          <span className="mora-total" title="モーラ数の合計（英字などの未変換片は 1 かたまりで 1 と数えます）">
            {moraCount.total} モーラ / {lineCount} 行
          </span>
          <button type="button" className="primary" onClick={async () => setCopied((await copyText(output)) ? 'ok' : 'fail')} disabled={!output}>
            {copied === 'ok' ? 'コピーしました' : copied === 'fail' ? 'コピー失敗' : 'コピー'}
          </button>
        </div>
      </div>
      <textarea className="output-text" value={output} readOnly spellCheck={false} lang="ja" placeholder="変換結果がここに表示されます" />
    </section>
  );
}
