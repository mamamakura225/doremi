import { describe, expect, it } from 'vitest'
import { SOLFA_COLOR } from './colors'
import { PREVIEW_UNKNOWN, previewCells } from './preview'

describe('previewCells', () => {
  it('ヘ音で保存した曲のプレビューは灰色にならない（clef を渡している）', () => {
    const cells = previewCells([['F2', 'A3']], 'bass')
    expect(cells[0].map((c) => c.color)).toEqual([SOLFA_COLOR['ファ'], SOLFA_COLOR['ラ']])
    expect(cells[0].some((c) => c.color === PREVIEW_UNKNOWN)).toBe(false)
  })

  it('ト音の音は音高色で塗る', () => {
    expect(previewCells([['C4']], 'treble')[0][0].color).toBe(SOLFA_COLOR['ド'])
  })

  it('のばす音は long:true（横長で見せる）', () => {
    expect(previewCells([['C4~']], 'treble')[0][0].long).toBe(true)
  })

  it('演奏範囲外（壊れたデータ）はフォールバック色', () => {
    expect(previewCells([['C4']], 'bass')[0][0].color).toBe(PREVIEW_UNKNOWN)
  })

  it('ページ構造を保つ', () => {
    const cells = previewCells([['C4', 'D4'], ['E4']], 'treble')
    expect(cells.map((p) => p.length)).toEqual([2, 1])
  })
})
