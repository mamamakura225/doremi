// 画面の向き・高さの判定（純ロジック・Vitest対象）。
/** 縦長（ポートレート）か */
export function isPortrait(width: number, height: number): boolean {
  return height > width
}

/**
 * ヘッダーのラベルを畳む高さのしきい値(px)。
 * 横向きスマホ（375〜430程度）は畳み、タブレット横（768〜）は畳まない。
 */
export const SHORT_SCREEN_H = 500

/** 縦が短い画面か（ヘッダーに文字を並べる余裕が無い） */
export function isShortScreen(height: number): boolean {
  return height < SHORT_SCREEN_H
}
