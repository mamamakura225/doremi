// ほんだなの本の表紙（#109）。曲の音符から自動で描く純ロジック（Vitest 対象）。
// 同じ曲（同じ音の並び・同じ音部記号）なら、いつでも同じ表紙になる。
import { previewCells } from './preview'
import { parseNoteName } from './pages'
import { type Clef, pitchByNote } from './pitch'

/**
 * 表紙の地の色（7色を使わない淡色・docs/art-direction.md）。黄色の地は入れない——
 * ミ（#facc15）の粒が輪郭だけでしか見分けられなくなる
 */
export const COVER_BG = ['#ffe4cc', '#dff3ea', '#ffc9dc', '#d9ecff', '#efe3c8'] as const

/** 表紙の大きさ（3:4 の縦長・この座標のまま描く＝線や粒がゆがまない） */
export const COVER_W = 75
export const COVER_H = 100
/** 粒の大きさ（ふつう・のばす）。音が多い曲では、隣と重ならない大きさまで小さくする */
const DOT_RX = 3.2
const DOT_RX_LONG = 5
const DOT_RY = 2.6

export interface Cover {
  /** 地の色 */
  bg: string
  /** 山並みの頂点（表紙の座標 COVER_W × COVER_H。上が高い音）と粒の半径 */
  peaks: { x: number; y: number; color: string; long: boolean; rx: number; ry: number }[]
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
  // step はト音で 1〜10・ヘ音で 0〜9（音部記号でわずかにずれるが、形は同じ）。上 22〜下 78 に収める
  return 22 + (Math.min(Math.max(p.step, 0), 10) / 10) * 56
}

/** 保存した曲の表紙を作る。ページはつなげて1本の山並みにする */
export function coverOf(pages: string[][], clef: Clef): Cover {
  const notes = pages.flat()
  const cells = previewCells(pages, clef).flat()
  const bg = COVER_BG[hash(`${clef}:${notes.join(',')}`) % COVER_BG.length]
  const n = notes.length
  const left = COVER_W * 0.16
  const span = COVER_W * 0.72
  const gap = n > 1 ? span / (n - 1) : span
  // 隣の粒と重ならない（粒の横幅 ≦ 間隔の 9 割）
  const shrink = Math.min(1, (gap * 0.45) / DOT_RX_LONG)
  const peaks = notes.map((note, i) => ({
    x: n === 1 ? COVER_W / 2 : left + i * gap,
    y: heightOf(note, clef),
    color: cells[i].color,
    long: cells[i].long,
    rx: (cells[i].long ? DOT_RX_LONG : DOT_RX) * shrink,
    ry: DOT_RY * shrink,
  }))
  return { bg, peaks }
}
