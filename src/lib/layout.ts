// 五線譜ボードのジオメトリ（SVGビューボックス座標・横向き）。
// 純データ。SVG/Reactに依存しない（Vitest対象）。
import type { StaffLayout } from './pitch'

// 横向き画面に近い 2.2:1 に固定し、`meet` の左右余白を最小化（余白は背景色で吸収）。
export const VIEW_W = 1100
export const VIEW_H = 500

export const STAFF_LAYOUT: StaffLayout = { topLineY: 140, staffSpace: 50 }

export const STAFF_LEFT = 60

// お道具箱（右端）
export const TOOLBOX_W = 120
export const TOOLBOX_X = VIEW_W - 40 - TOOLBOX_W // 940
export const TOOLBOX_CX = TOOLBOX_X + TOOLBOX_W / 2
export const TOOLBOX_CY = VIEW_H / 2

// 五線はお道具箱の手前まで伸ばす
export const STAFF_RIGHT = TOOLBOX_X - 30 // 910

// 音符を置く領域（ト音記号の右〜五線右端の手前）
export const PLACE_LEFT = 210
export const PLACE_RIGHT = STAFF_RIGHT - 30 // 880
export const NOTE_MAX = 8

/** i番目（0始まり）の音符の中心X座標 */
export function columnX(index: number): number {
  const span = PLACE_RIGHT - PLACE_LEFT
  return PLACE_LEFT + ((index + 0.5) * span) / NOTE_MAX
}

/** 配置領域（五線譜側）にX座標が入っているか */
export function isOverPlacement(x: number): boolean {
  return x >= STAFF_LEFT && x <= STAFF_RIGHT
}
