import { describe, expect, it } from 'vitest'
import { NOTE_MAX, columnX, isOverPlacement, PLACE_LEFT, PLACE_RIGHT } from './layout'
import { addNote, canAddNote, removeLast, type PlacedNote } from './notes'
import { MIDDLE_C } from './pitch'

describe('addNote', () => {
  it('音符を末尾に追加する', () => {
    const a = addNote([], MIDDLE_C)
    expect(a).toHaveLength(1)
    expect(a[0].pitch).toEqual(MIDDLE_C)
    expect(a[0].id).toBeTruthy()
  })

  it('上限(8音)に達したら追加しない', () => {
    let notes: PlacedNote[] = []
    for (let i = 0; i < NOTE_MAX + 3; i++) notes = addNote(notes, MIDDLE_C)
    expect(notes).toHaveLength(NOTE_MAX)
  })

  it('既存配列を破壊しない', () => {
    const base: PlacedNote[] = []
    addNote(base, MIDDLE_C)
    expect(base).toHaveLength(0)
  })
})

describe('removeLast', () => {
  it('最後の音符を取り消す', () => {
    const two = addNote(addNote([], MIDDLE_C), MIDDLE_C)
    expect(removeLast(two)).toHaveLength(1)
  })

  it('空配列はそのまま', () => {
    expect(removeLast([])).toHaveLength(0)
  })

  it('元配列を破壊しない', () => {
    const two = addNote(addNote([], MIDDLE_C), MIDDLE_C)
    removeLast(two)
    expect(two).toHaveLength(2)
  })
})

describe('canAddNote', () => {
  it('満杯で false', () => {
    let notes: PlacedNote[] = []
    for (let i = 0; i < NOTE_MAX; i++) notes = addNote(notes, MIDDLE_C)
    expect(canAddNote(notes)).toBe(false)
    expect(canAddNote([])).toBe(true)
  })
})

describe('columnX', () => {
  it('8列が左→右へ単調増加し配置領域内に収まる', () => {
    const xs = Array.from({ length: NOTE_MAX }, (_, i) => columnX(i))
    for (let i = 1; i < xs.length; i++) expect(xs[i]).toBeGreaterThan(xs[i - 1])
    expect(xs[0]).toBeGreaterThanOrEqual(PLACE_LEFT)
    expect(xs.at(-1)!).toBeLessThanOrEqual(PLACE_RIGHT)
  })

  it('等間隔である', () => {
    const d0 = columnX(1) - columnX(0)
    const d1 = columnX(2) - columnX(1)
    expect(d1).toBeCloseTo(d0)
  })
})

describe('isOverPlacement', () => {
  it('五線譜領域の内外を判定する', () => {
    expect(isOverPlacement(columnX(0))).toBe(true)
    expect(isOverPlacement(0)).toBe(false)
    expect(isOverPlacement(9999)).toBe(false)
  })
})
