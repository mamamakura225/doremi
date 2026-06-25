// 画面の向き判定（純ロジック・Vitest対象）。
/** 縦長（ポートレート）か */
export function isPortrait(width: number, height: number): boolean {
  return height > width
}
