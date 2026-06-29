# どれみ 🎹🎵

耳で覚えた「ドレミ」を五線譜に音符として置いて視覚的に学ぶ、5歳児向けのスマホ／タブレット用Webアプリ（横向き）。バックエンド・認証・外部APIを持たない**純クライアント**のスタンドアロンPWA。

**本番**: https://doremi.vercel.app

## 技術スタック

- **Vite + React + TypeScript + Tailwind CSS v4** — 純クライアントPWA
- **オーディオ**: Tone.js（初回タップで `Tone.start()`、iOS の AudioContext unlock）
- **譜面描画**: SVG 自前実装（VexFlow 不使用）
- **ドラッグ＆ドロップ**: Pointer Events 自前実装（HTML5 DnD API 不使用）

## 主な仕様

- 8音1ページでフレーズを完成させる（デフォルト=ト音記号、真ん中のドは下加線1本＋足場ガイド）
- 符頭をドレミの色相で塗り分け（ド=赤／レ=黄／ミ=緑…）
- 横向き前提。縦向き時は「回してね」オーバーレイを表示
- つくった曲は localStorage の「本棚」に保存

## 開発

```bash
npm run dev       # 開発サーバー（Vite）
npm test          # Vitest（src/lib の純ロジック中心）
npm run lint      # oxlint
npm run build     # tsc -b ＋ 本番ビルド（vite build）
npm run preview   # 本番ビルドのプレビュー
```

## ドキュメント

設計合意・プロジェクト固有の鉄則は [CLAUDE.md](./CLAUDE.md) を参照。
