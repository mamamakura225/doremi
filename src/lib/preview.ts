// 本棚のミニプレビュー（音を色の丸で並べる）の純ロジック。
// 色の決定に音部記号が要る——音名だけでは高さも solfa も引けない。
import { colorOf } from './colors'
import { parseNoteName } from './pages'
import { type Clef, pitchByNote } from './pitch'

export interface PreviewCell {
  /** 音高色。演奏範囲外（壊れたデータ）はグレー */
  color: string
  /** のばす音は横長に見せる */
  long: boolean
}

/** 演奏範囲外だったときのフォールバック色 */
export const PREVIEW_UNKNOWN = '#cbd5e1'

/** 保存済み曲の各ページを、色と長short のセルに変換する。 */
export function previewCells(pages: string[][], clef: Clef): PreviewCell[][] {
  return pages.map((notes) =>
    notes.map((n) => {
      const { note, long } = parseNoteName(n)
      const p = pitchByNote(note, clef)
      return { color: p ? colorOf(p) : PREVIEW_UNKNOWN, long }
    }),
  )
}
