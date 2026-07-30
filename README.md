# どれみ 🎹🎵

耳で覚えた「ドレミ」を五線譜に音符として置いて視覚的に学ぶ、5歳児向けのスマホ／タブレット用Webアプリ（横向き）。バックエンド・認証・外部APIを持たない**純クライアント**のスタンドアロンPWA。

**本番**: https://doremi.vercel.app

## 技術スタック

- **Vite + React + TypeScript + Tailwind CSS v4** — 純クライアントPWA
- **オーディオ**: Tone.js（初回タップで `Tone.start()`、iOS の AudioContext unlock）
- **譜面描画**: SVG 自前実装（VexFlow 不使用）
- **ドラッグ＆ドロップ**: Pointer Events 自前実装（HTML5 DnD API 不使用）

## 主な仕様

- 10列1ページでフレーズを完成させる（デフォルト=ト音記号、真ん中のドは下加線1本＋足場ガイド）
- 音部記号を切り替えられる（🐤 ことり=ト音 C4〜E5 ／ 🐻 くま=ヘ音 F2〜A3・低くて温かい音）
- お道具箱には「ふつうの音」と「のばす音」の2つ。のばす音は2列ぶんを占め、2倍の長さで鳴る
- 符頭をドレミの色相で塗り分け（ド=赤／レ=黄／ミ=緑…）
- 横向き前提。縦向き時は「回してね」オーバーレイを表示
- つくった曲は localStorage の「本棚」に保存
- 再生の音を選べる（🎹ぴあの／🔔べる／🎵ぴこぴこ／🎤うた）。「うた」は楽器音に重ねて音名を読み上げる（Web Speech API・非対応端末では楽器音のみ）

## 開発

```bash
npm run dev       # 開発サーバー（Vite）
npm test          # Vitest（src/lib の純ロジック中心）
npm run lint      # oxlint
npm run build     # tsc -b ＋ 本番ビルド（vite build）
npm run preview   # 本番ビルドのプレビュー
```

## ドキュメント

- [docs/requirements.md](./docs/requirements.md) — 要件定義（MVPスコープ・スコープ外・制約）
- [docs/architecture.md](./docs/architecture.md) — 設計判断と不採用にした案
- [CLAUDE.md](./CLAUDE.md) — 開発規約・プロジェクト固有の鉄則
