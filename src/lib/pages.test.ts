import { describe, expect, it } from 'vitest'
import { NOTE_MAX } from './layout'
import { canAddPage, parseNoteName, toNoteNames } from './pages'
import type { PlacedNote } from './notes'

function page(notes: string[]): PlacedNote[] {
  return notes.map((note, i) => ({ id: `n${i}`, pitch: { note } as PlacedNote['pitch'] }))
}

function longPage(count: number): PlacedNote[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `L${i}`,
    pitch: { note: 'C4' } as PlacedNote['pitch'],
    long: true,
  }))
}

describe('canAddPage', () => {
  it('末尾ページが満杯のときだけ true', () => {
    const full = page(Array.from({ length: NOTE_MAX }, () => 'C4'))
    expect(canAddPage([full], 0)).toBe(true)
    expect(canAddPage([page(['C4'])], 0)).toBe(false) // 満杯でない
  })

  it('のばす音は2列ぶん数えるので、音符の個数が少なくても満杯になる', () => {
    const full = longPage(NOTE_MAX / 2)
    expect(full).toHaveLength(NOTE_MAX / 2)
    expect(canAddPage([full], 0)).toBe(true)
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

  it('のばす音は接尾辞つきで保存する', () => {
    const mixed: PlacedNote[] = [...page(['C4']), ...longPage(1)]
    expect(toNoteNames([mixed])).toEqual([['C4', 'C4~']])
  })

  it('全ページ空なら空配列', () => {
    expect(toNoteNames([[], []])).toEqual([])
  })
})

describe('parseNoteName', () => {
  it('接尾辞つきは のばす音として読む', () => {
    expect(parseNoteName('C4~')).toEqual({ note: 'C4', long: true })
  })

  it('旧形式（接尾辞なし）は ふつうの音として読む', () => {
    expect(parseNoteName('C4')).toEqual({ note: 'C4', long: false })
  })

  it('保存→復元で長さが往復する', () => {
    const saved = toNoteNames([[...page(['C4']), ...longPage(1)]])[0]
    expect(saved.map(parseNoteName)).toEqual([
      { note: 'C4', long: false },
      { note: 'C4', long: true },
    ])
  })
})
