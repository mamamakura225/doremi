// ドレミ色相連動: 音高ごとの符頭色（純データ・Vitest対象）。
import type { Pitch, Solfa } from './pitch'

export const SOLFA_COLOR: Record<Solfa, string> = {
  ド: '#e23b3b', // 赤
  レ: '#f59e0b', // 橙
  ミ: '#facc15', // 黄
  ファ: '#22c55e', // 緑
  ソ: '#38bdf8', // 水色
  ラ: '#a78bfa', // 紫
  シ: '#f472b6', // 桃
}

/** 音 → 符頭色 */
export function colorOf(pitch: Pitch): string {
  return SOLFA_COLOR[pitch.solfa]
}

/**
 * 符頭・ドレミラベル・プレビュー丸の輪郭色（五線と同色）。
 * SOLFA_COLOR は単体では WCAG 非テキスト 3:1 を満たさない色がある（ミ黄は対 BOARD_BG で 1.42:1）。
 * 視認性はこの輪郭で確保し、色は識別の手がかりに徹する（#61・contrast.test.ts が数値で固定）。
 */
export const OUTLINE_COLOR = '#5b524b'

/** 盤面（クリーム地）。符頭・ラベルはこの上に乗る。 */
export const BOARD_BG = '#fdf6e3'

/** 白鍵の地の色。 */
export const WHITE_KEY_BG = '#fffdf7'
