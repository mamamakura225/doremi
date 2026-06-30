import { describe, expect, it } from 'vitest'
import { NOTE_MAX } from './layout'
import { canAddPage, toNoteNames } from './pages'
import type { PlacedNote } from './notes'

function page(notes: string[]): PlacedNote[] {
  return notes.map((note, i) => ({ id: `n${i}`, pitch: { note } as PlacedNote['pitch'] }))
}

describe('canAddPage', () => {
  it('末尾ページが満杯のときだけ true', () => {
    const full = page(Array.from({ length: NOTE_MAX }, () => 'C4'))
    expect(canAddPage([full], 0)).toBe(true)
    expect(canAddPage([page(['C4'])], 0)).toBe(false) // 満杯でない
  })

  it('末尾ページ以外では false（途中ページからは追加しない）', () => {
    const full = page(Array.from({ length: NOTE_MAX }, () => 'C4'))
    expect(canAddPage([full, page(['C4'])], 0)).toBe(false)
  })
})

describe('toNoteNames', () => {
  it('各ページを音名配列に変換し、空ページを除く', () => {
    expect(toNoteNames([page(['C4', 'G4']), [], page(['E4'])])).toEqual([
      ['C4', 'G4'],
      ['E4'],
    ])
  })

  it('全ページ空なら空配列', () => {
    expect(toNoteNames([[], []])).toEqual([])
  })
})
