# CLAUDE.md — どれみ 開発規約

耳で覚えた「ドレミ」を五線譜に音符として置いて視覚的に学ぶ、5歳児向けのスマホ／タブレット用Webアプリ（横向き）。Vite + TypeScript + React + Tailwind CSS v4 + Tone.js のスタンドアロンPWA。バックエンド・認証・外部APIを持たない**純クライアント**アプリ。
本ファイルは AIエージェントのコンテキスト汚染・無限デバッグループ・破壊的変更を抑止するための不変の指示書である。

## 応答ガイドライン
- **前置き・結びの禁止／結論ファースト**：挨拶やクッション言葉は省き、回答・コードから始める。
- **最小限の差分提示**：変更箇所のスニペット／Diffのみ。変更のないファイル全体を再掲しない。
- **過剰な確認の省略**：意図が明確なら確認を挟まず即実行する。

## 思考・コーディング規約（Karpathy規範 & 安全ガードレール）
- **Think Before Coding**：実装前に要件と変更対象を整理。曖昧な点は推測せず前提を明示して質問。
- **Simplicity First**：要求の最小構成のみ実装。不要な抽象化・過度なエラーハンドリング・先回り機能は厳禁。
- **Surgical Changes**：変更はターゲットに限定。無関係なリファクタ・整形・コメント改変をしない。
- **Goal-Driven Execution**：書き換え前に再現テスト／アサーションを作る・回す。
- **Loop & Context Control**：実行/デバッグが5回連続失敗、または自律ループのツール呼び出しが10回超で停止し、状況を整理して人間に指示を仰ぐ。
- **Privilege Boundaries**：`.git/`・`node_modules/` への直接書き込みは禁止。

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

### ① 設計合意（Antigravityレビュー済み）
- **D&D**：HTML5 DnD APIは使わず **Pointer Events 自前実装**。`pointerdown` で `pointerId` を記録し単一ポインタのみ追跡（マルチタッチ誤動作防止）、`setPointerCapture` で要素外れに追従、ドラッグ対象とコンテナに `touch-action:none`/`user-select:none`。
- **譜面描画**：**SVG自前**（VexFlow不使用）。線・間の座標を自分で保持し、音高↔Y座標のマッピング表で音部記号を切り替える。
- **音域**：1オクターブ+α（加線1本分・上下各2〜3音）。音部記号モード切替（**デフォルト=ト音**）。**ト音記号を先に完成 → ヘ音を薄く追加**（ヘ音デフォルト音域 F2〜G3・温かい音色）。
- **ド の位置**：下加線1本（真ん中のド）。下加線スナップ領域に**半透明の足場ガイド**を常時表示し、空白へ置く難しさを解消。
- **音符上限**：**8音1ページ・フレーズ完成**でMVP割り切り（曲全体のページ送りは拡張）。
- **ドレミ色相連動**：符頭を音高色で塗る（ド=赤/レ=黄/ミ=緑…）。MVPに含む。
- **お祝い演出**：8音再生完了時に符頭バウンス程度の最小演出（キャラ登場は拡張）。

### ② オーディオ（Tone.js）
- **iOS unlock**：AudioContextはユーザー操作で開始する必要があるため、**初回タップで `Tone.start()`** を必ず呼ぶ（呼ぶまで一切音が出ない）。
- **スクラブ発音**：ドラッグ中の上下移動は、**音域ゾーンを跨いだ瞬間のみ**再トリガする（同一音内では鳴らさない＝暴発防止）。
- **再生**：左から順にメロディ再生し、発音中の音符をハイライト（視覚同期は Tone.Draw 等を利用）。

### ③ 横向き前提
- ランドスケープは技術的に強制不可（iOS Safari等で `orientation.lock` 不可）。**縦向き検知で「回してね」オーバーレイ**を出すこと。PWA manifest は `orientation: landscape` を宣言（保証ではない）。

### ④ コミット規約（Vercelデプロイブロック防止）
- コミットは必ず GitHub no-reply を固定：
  ```bash
  git -c user.email="284483932+mamamakura225@users.noreply.github.com" -c user.name="mamamakura225" commit -m "..."
  ```
- メッセージ末尾に共同作成者情報：`Co-Authored-By: Claude Opus <現行版> <noreply@anthropic.com>`

### ⑤ Issue・PR連動
- バックログは GitHub Issues に一本化。PR本文に `Closes #N` を記述して Issue を連動クローズ（コミット件名の括弧表記は対象外）。1 issue = 1 PR。
