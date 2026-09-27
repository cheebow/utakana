import type { Token } from '../core/types';

interface Props {
  token: Token;
  reading: string;
  active: boolean;
  onClick: () => void;
}

function sourceClass(token: Token): string {
  if (token.manualReading) return 'manual';
  return token.source;
}

const SOURCE_LABEL: Record<string, string> = {
  dict: '辞書',
  ruby: 'ルビ',
  user: 'ユーザー辞書',
  manual: '手動修正',
  unknown: '未変換',
};

export function TokenChip({ token, reading, active, onClick }: Props) {
  const cls = sourceClass(token);
  const showSurface = token.surface !== reading;
  return (
    <button
      type="button"
      className={`chip chip-${cls}${active ? ' chip-active' : ''}`}
      onClick={onClick}
      title={`${SOURCE_LABEL[cls] ?? cls}: ${token.surface} → ${reading}（クリックで読みを修正）`}
    >
      <span className="chip-reading">{reading || ' '}</span>
      {showSurface ? <span className="chip-surface">{token.surface}</span> : null}
    </button>
  );
}
