import type { HatsuonMode, LongVowelMark, Settings, SokuonMode } from '../core/types';

interface Props {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  onReset: () => void;
}

export function SettingsPanel({ settings, onChange, onReset }: Props) {
  return (
    <details className="settings">
      <summary>変換設定</summary>
      <div className="settings-body">
        <label className="toggle">
          <input
            type="checkbox"
            checked={settings.usePronunciation}
            onChange={(e) => onChange({ usePronunciation: e.target.checked })}
          />
          <span>
            発音寄りに変換 <small>（は→わ、へ→え、東京→とおきょお）</small>
          </span>
        </label>
        <label className="select-label block">
          長音「ー」の扱い
          <select
            value={settings.longVowelMark}
            onChange={(e) => onChange({ longVowelMark: e.target.value as LongVowelMark })}
          >
            <option value="vowel">直前の母音にする（とーきょー → とおきょお）</option>
            <option value="hyphen">「-」にする（とーきょー → と-きょ-）</option>
            <option value="keep">そのまま（ー）</option>
            <option value="drop">削除する（音符を伸ばして歌わせる）</option>
          </select>
        </label>
        <label className="select-label block">
          促音「っ」の扱い
          <select value={settings.sokuon} onChange={(e) => onChange({ sokuon: e.target.value as SokuonMode })}>
            <option value="attach">直前のモーラに付ける（もっ・くっ。行末は削除）</option>
            <option value="separate">単独のモーラにする</option>
            <option value="drop">削除する</option>
          </select>
        </label>
        <label className="select-label block">
          撥音「ん」の扱い
          <select value={settings.hatsuon} onChange={(e) => onChange({ hatsuon: e.target.value as HatsuonMode })}>
            <option value="separate">単独のモーラにする</option>
            <option value="attach">直前のモーラに付ける（せん・ほん）</option>
          </select>
        </label>
        <label className="toggle">
          <input type="checkbox" checked={settings.woToO} onChange={(e) => onChange({ woToO: e.target.checked })} />
          <span>を → お</span>
        </label>
        <label className="toggle">
          <input type="checkbox" checked={settings.diDuToJiZu} onChange={(e) => onChange({ diDuToJiZu: e.target.checked })} />
          <span>ぢ → じ、づ → ず</span>
        </label>
        <label className="toggle">
          <input type="checkbox" checked={settings.keepSymbols} onChange={(e) => onChange({ keepSymbols: e.target.checked })} />
          <span>句読点・記号を残す</span>
        </label>
        <label className="toggle">
          <input type="checkbox" checked={settings.parenRuby} onChange={(e) => onChange({ parenRuby: e.target.checked })} />
          <span>
            括弧をルビとみなす <small>（運命（さだめ）→ さだめ）</small>
          </span>
        </label>
        <button type="button" className="ghost" onClick={onReset}>
          既定に戻す
        </button>
      </div>
    </details>
  );
}
