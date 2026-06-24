// 五線譜ボードのジオメトリ（SVGビューボックス座標・横向き）。
// 純データ。SVG/Reactに依存しない（Vitest対象）。
import type { StaffLayout } from './pitch'

export const VIEW_W = 1000
export const VIEW_H = 500

export const STAFF_LAYOUT: StaffLayout = { topLineY: 140, staffSpace: 50 }

export const STAFF_LEFT = 60
export const STAFF_RIGHT = 830

// 音符を置く領域（左→右に等間隔）
export const PLACE_LEFT = 190
export const PLACE_RIGHT = 810
export const NOTE_MAX = 8

// お道具箱（右側）
export const TOOLBOX_X = 860
export const TOOLBOX_W = 120
export const TOOLBOX_CX = TOOLBOX_X + TOOLBOX_W / 2
export const TOOLBOX_CY = VIEW_H / 2

/** i番目（0始まり）の音符の中心X座標 */
export function columnX(index: number): number {
  const span = PLACE_RIGHT - PLACE_LEFT
  return PLACE_LEFT + ((index + 0.5) * span) / NOTE_MAX
}

/** 配置領域（五線譜側）にX座標が入っているか */
export function isOverPlacement(x: number): boolean {
  return x >= STAFF_LEFT && x <= STAFF_RIGHT
}
