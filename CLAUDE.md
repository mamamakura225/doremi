# CLAUDE.md — どれみ 開発規約

耳で覚えた「ドレミ」を五線譜に音符として置いて視覚的に学ぶ、5歳児向けのスマホ／タブレット用Webアプリ（横向き）。Vite + TypeScript + React + Tailwind CSS v4 + Tone.js のスタンドアロンPWA。バックエンド・認証・外部APIを持たない**純クライアント**アプリ。
本ファイルは AIエージェントのコンテキスト汚染・無限デバッグループ・破壊的変更を抑止するための不変の指示書である。
エージェント共通の応答ガイドライン・思考/コーディング規約（Karpathy規範）は端末のグローバル規約（`~/.claude/CLAUDE.md`）に一本化しており、本書は**プロジェクト固有規約のみ**を定める。

## ドキュメント
- [docs/requirements.md](./docs/requirements.md) — 何を作るか（MVPスコープ・スコープ外・制約）
- [docs/architecture.md](./docs/architecture.md) — なぜその設計か（不採用にした案とその理由を含む）

**機能を足す・変える・消すときは同じPRで該当 doc を更新する。** 本書には守る鉄則（結論）だけを置き、理由は docs 側に書く。

## プロジェクト構成
- **他プロジェクトとの混同禁止**：dtask / piano-pet / pashari / nuibon 等の規約（`gen-sw`・`apps/*` 構造・Next.js前提など）は一切持ち込まない。完全に独立した Vite + React スタンドアロン構成。
- 主要ディレクトリ：`src/lib`（純ロジック：音高マッピング・スナップ計算・シーケンス）/ `src/audio`（Tone.jsラッパー）/ `src/components`（UI・SVG五線譜）/ `src/`（App・エントリ）。
- 純ロジック（音高↔座標マッピング、スナップ、音符配列）は React/Tone.js から切り離し、Vitest でユニットテスト可能に保つ。

## 主要実行コマンド
```bash
npm run dev       # 開発サーバー（Vite）
npm test          # Vitest（src/lib の純ロジック中心）
npm run lint      # oxlint
npm run build     # tsc -b ＋ 本番ビルド（vite build）
```

## プロジェクト固有の鉄則

### ① 設計合意（Antigravityレビュー済み・理由は [docs/architecture.md](./docs/architecture.md)）
- **D&D**：HTML5 DnD APIは使わず **Pointer Events 自前実装**。単一 `pointerId` のみ追跡・`setPointerCapture`・`touch-action:none`/`user-select:none` は必須。
- **譜面描画**：**SVG自前**（VexFlow不使用）。音部記号の切り替えは音高↔Y座標のマッピング表の差し替えで行う。
- **音域**：ト音（デフォルト・現状唯一）で C4〜E5。ヘ音は後追い追加（F2〜G3・温かい音色）。
- **ド の位置**：下加線1本。スナップ領域に**半透明の足場ガイド**を常時表示する。
- **音符上限**：**1ページ8音**。満杯後は「つぎのうた」で空ページ追加、`pages: PlacedNote[][]` を連結再生（境界に1ステップ小休符）。**リズムは持たない**。
- **ドレミ色相連動**：符頭を音高色で塗る（`src/lib/colors.ts` が正）。
- **お祝い演出**：符頭バウンス程度の最小演出に留める。

### ② オーディオ（Tone.js / Web Speech）
- **iOS unlock**：**初回タップで `Tone.start()`**。Web Speech の `primeSpeech()` は**タップと同一tickで同期的に**呼ぶ（await を挟むと以後ずっと無言になる）。
- **スクラブ発音**：**音域ゾーンを跨いだ瞬間のみ**再トリガする（同一音内では鳴らさない）。
- **制作中の音は通常音で固定**。音色切替は再生時だけに効かせる。うたモードは楽器音に**重ねて**読み上げる（読み上げ単体にしない）。

### ③ 横向き前提
- ランドスケープは技術的に強制不可。**縦向き検知で「回してね」オーバーレイ**を出す。PWA manifest は `orientation: landscape` を宣言（保証ではない）。

### ④ コミット規約（Vercelデプロイブロック防止）
- コミットは必ず GitHub no-reply を固定：
  ```bash
  git -c user.email="284483932+mamamakura225@users.noreply.github.com" -c user.name="mamamakura225" commit -m "..."
  ```
- メッセージ末尾に共同作成者情報（`<現行モデル名>` は現在稼働中のモデル名。例: `Claude Fable 5`）：`Co-Authored-By: Claude <現行モデル名> <noreply@anthropic.com>`

### ⑤ Issue・PR連動
- バックログは GitHub Issues に一本化。PR本文に `Closes #N` を記述して Issue を連動クローズ（コミット件名の括弧表記は対象外）。1 issue = 1 PR。
