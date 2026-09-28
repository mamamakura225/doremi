// ほんだなの本の表紙（#109）。曲の音符から自動で描く純ロジック（Vitest 対象）。
// 同じ曲（同じ音の並び・同じ音部記号）なら、いつでも同じ表紙になる。
import { previewCells } from './preview'
import { parseNoteName } from './pages'
import { type Clef, pitchByNote } from './pitch'

/** 表紙の地の色（7色を使わない淡色・docs/art-direction.md） */
export const COVER_BG = ['#ffe4cc', '#dff3ea', '#ffc9dc', '#d9ecff', '#fff3b0', '#efe3c8'] as const

export interface Cover {
  /** 地の色 */
  bg: string
  /** 山並みの頂点（表紙の座標 0〜100 × 0〜100。上が高い音） */
  peaks: { x: number; y: number; color: string; long: boolean }[]
}

/** 文字列から決まった数を作る（同じ入力→同じ出力。乱数は使わない） */
function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

/** 音の段（低い音ほど大きい step）を表紙の高さに写す。音域の外（壊れたデータ）は真ん中 */
function heightOf(note: string, clef: Clef): number {
  const p = pitchByNote(parseNoteName(note).note, clef)
  if (!p) return 50
  // step はどちらの音部記号でも 0（高い）〜10（低い）程度。上 22〜下 78 に収める
  return 22 + (Math.min(Math.max(p.step, 0), 10) / 10) * 56
}

/** 保存した曲の表紙を作る。ページはつなげて1本の山並みにする */
export function coverOf(pages: string[][], clef: Clef): Cover {
  const notes = pages.flat()
  const cells = previewCells(pages, clef).flat()
  const bg = COVER_BG[hash(`${clef}:${notes.join(',')}`) % COVER_BG.length]
  const n = notes.length
  const peaks = notes.map((note, i) => ({
    x: n === 1 ? 50 : 12 + (i / (n - 1)) * 76,
    y: heightOf(note, clef),
    color: cells[i].color,
    long: cells[i].long,
  }))
  return { bg, peaks }
}
