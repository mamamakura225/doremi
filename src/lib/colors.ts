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
