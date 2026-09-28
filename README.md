# うたかな (Utakana)

日本語の歌詞（漢字かな混じり）を、SynthesizerV / VOCALOID の歌詞欄にそのまま流し込める **ひらがな** に変換する Web アプリです。
ブラウザだけで動作し（Mac / Windows 共通）、インストール不要。形態素解析はブラウザ内の WebAssembly（[lindera-wasm](https://github.com/lindera/lindera-wasm) + IPADIC）で行うため、歌詞がサーバーに送られることはありません。

## 機能

- 漢字かな混じりの歌詞 → ひらがな（行構造を維持）
- **発音寄り変換**（既定 ON）: は→わ、へ→え、を→お、東京→とおきょお、えい→ええ、言う→ゆう など。長音「ー」は直前の母音 / `-` / そのまま / 削除 を選択可
- **音符単位の整形**: 促音「っ」は直前の音に付け（もっ・くっ）、行末の「っ」は落とす（既定）。直前の母音に置き換える（あがあて）ことも可。撥音「ん」は単独（既定）か直前に付けるかを選択可。同じ母音の連続を 1 つにまとめるオプション（とおきょお→ときょ）もある。SynthV に流し込んで戻した歌詞の形に合わせている
- **読みの手動修正**: 結果のチップをクリックして読みを直接入力（Enter 確定 / Esc 取消）。ルビ・ユーザー辞書・手動修正で明示した読みは書いたとおりに使い、えい→ええ などの発音推定は掛けない（長音・促音・を→お などの出力整形は掛かる）
- **ユーザー辞書**: 修正時に「ユーザー辞書に登録」で以降の変換に自動適用。一覧・追加・削除・JSON 入出力
- **内蔵補助辞書**: IPADIC に無い語（既読 など）や数詞＋助数詞（一人→ひとり、一歩→いっぽ）を補正。辞書に無い漢字の連続は誤読を出さず「未変換」チップにまとめてユーザーに委ねる
- **ルビ記法の入力対応**: `|運命《さだめ》` / `運命《さだめ》` / `運命（さだめ）` / `Love《らぶ》`
- **英語はそのまま**: 半角英字の単語（`don't` のようなアポストロフィ入りも 1 語）はかなに変換せず原文のまま出力し、英単語同士のスペースは保つ（`I love you`）。1 語 1 音。SynthV / VOCALOID の英語ノートにそのまま貼れる。かなで歌わせたい語はチップの手動修正・ユーザー辞書（英単語は大文字小文字を区別せず単語単位で一致）・ルビで。`,` `!` などの半角記号は句読点と同じく記号の設定に従う
- **出力形式**: 連続 / 1 音ずつスペース区切り。行ごとの音数（音符の目安）と合計を表示、ワンクリックでコピー
- 入力の下書き・設定・辞書・手動修正した読みはブラウザの localStorage にだけ保存

## プライバシー

すべての処理はブラウザ内で完結し、歌詞・設定・辞書・手動修正した読みが外部に送られることはありません。アクセス解析やトラッキングも入れていません。2026-09-27 時点のコードとビルド成果物について、次の方法で確認しています。

- **静的検査**: ビルド後の JS に含まれる `fetch` は、同一オリジンの wasm ファイルを読み込む処理と、Vite の modulepreload ポリフィル（対象の `<link rel="modulepreload">` が無いため何もしない）の 2 箇所のみ。XMLHttpRequest / WebSocket / sendBeacon / Service Worker / 外部スクリプト / 外部フォント / 外部 CSS は使っていない。IPADIC 辞書は wasm に同梱（`embedded://ipadic`）で、CDN 等からの取得は無い。wasm が JS から受け取る関数は wasm-bindgen の型変換・配列操作だけで、通信や DOM に触れるものは無い。保存先は localStorage のみで、Cookie / IndexedDB は使っていない
- **実機検査**: ビルド済み `dist/` をローカル配信し、ヘッドレス Chrome を DevTools Protocol で操作して、ページ読み込み → 歌詞入力 → 変換 → 画面上の全ボタン（コピー・ユーザー辞書・クリア・チップ編集など）のクリックまで行い、ページが発したリクエストを全記録。結果は同一オリジンの 5 件（HTML / JS / CSS / wasm / favicon）だけで、外部オリジンへのリクエストは 0 件
- **例外**: 公開ページの取得元が GitHub Pages なので、アクセス時の IP アドレスやユーザーエージェントは GitHub のサーバーログに残り得ます（どの静的ホスティングでも同じで、入力内容は含まれません）。フッターの GitHub / lindera-wasm へのリンクはクリックしたときだけ遷移し、`rel="noreferrer"` を付けています

## 開発

```sh
npm install
npm run dev        # http://localhost:5173
npm test           # vitest（実 wasm を使った統合テストを含む）
npm run build      # dist/ を生成
npm run preview    # 本番ビルドの確認
```

## 静的ホスティングへの配置

`npm run build` で生成される `dist/` をそのまま置くだけで動きます（`base: './'` なのでサブディレクトリ配下でも可）。

- **GitHub Pages**: `main` への push で `.github/workflows/pages.yml` がテスト・ビルド・デプロイを行う（公開 URL: https://cheebow.github.io/utakana/）
- **Netlify / Cloudflare Pages / Vercel**: ビルドコマンド `npm run build`、公開ディレクトリ `dist`
- 任意の Web サーバー: `dist/` を配置。wasm（約 13MB）は `application/wasm` で配信され、`Cache-Control` を長めにするとリピート時の読み込みが速くなります

## 構成

```
src/
  core/        UI 非依存の純粋ロジック（kana / ruby / userDict / tokenizer / convert / rules / mora / format）
  state/       設定・ユーザー辞書・下書きの永続化 hook、wasm ローダー
  components/  React コンポーネント
tests/         vitest（core の単体テスト + 実 wasm の統合テスト）
```

## ライセンス

- アプリ本体: MIT（[LICENSE](LICENSE)）。© 2026 CHEEBOW
- lindera-wasm: MIT。同梱の mecab-ipadic 辞書は NAIST / ICOT の条件（無保証条項の添付が必要）に従います。両方の全文は [public/NOTICE.txt](public/NOTICE.txt)（公開ページでは `NOTICE.txt`）に収録
