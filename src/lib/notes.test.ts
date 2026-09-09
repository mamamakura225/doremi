import { describe, expect, it } from 'vitest'
import {
  KEYBOARD_H,
  KEYBOARD_TOP,
  KEY_LEFT,
  KEY_RIGHT,
  MIN_COLUMN_PITCH,
  NOTE_MAX,
  VIEW_H,
  VIEW_H_KEYS,
  canPlace,
  columnX,
  isOverPlacement,
  isOverTrash,
  PLACE_LEFT,
  PLACE_RIGHT,
  TRASH_CX,
  TRASH_CY,
  TRASH_TOP,
  whiteKeyW,
  whiteKeyX,
} from './layout'
import {
  addNote,
  canAddNote,
  columnStarts,
  removeById,
  removeLast,
  usedColumns,
  type PlacedNote,
} from './notes'
import { MIDDLE_C } from './pitch'

describe('addNote', () => {
  it('音符を末尾に追加する', () => {
    const a = addNote([], MIDDLE_C)
    expect(a).toHaveLength(1)
    expect(a[0].pitch).toEqual(MIDDLE_C)
    expect(a[0].id).toBeTruthy()
  })

  it('上限(NOTE_MAX音)に達したら追加しない', () => {
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

describe('removeById', () => {
  it('指定IDの音符だけ消し、順序を保つ', () => {
    const notes = addNote(addNote(addNote([], MIDDLE_C), MIDDLE_C), MIDDLE_C)
    const out = removeById(notes, notes[1].id)
    expect(out).toHaveLength(2)
    expect(out.map((n) => n.id)).toEqual([notes[0].id, notes[2].id])
  })

  it('該当IDが無ければ同一参照を返す', () => {
    const notes = addNote([], MIDDLE_C)
    expect(removeById(notes, 'missing')).toBe(notes)
  })

  it('元配列を破壊しない', () => {
    const notes = addNote(addNote([], MIDDLE_C), MIDDLE_C)
    removeById(notes, notes[0].id)
    expect(notes).toHaveLength(2)
  })
})

describe('canAddNote', () => {
  it('満杯で false', () => {
    let notes: PlacedNote[] = []
    for (let i = 0; i < NOTE_MAX; i++) notes = addNote(notes, MIDDLE_C)
    expect(canAddNote(notes)).toBe(false)
    expect(canAddNote([])).toBe(true)
  })

  it('残り1列では のばす音だけ置けない', () => {
    let notes: PlacedNote[] = []
    for (let i = 0; i < NOTE_MAX - 1; i++) notes = addNote(notes, MIDDLE_C)
    expect(canAddNote(notes, false)).toBe(true)
    expect(canAddNote(notes, true)).toBe(false)
    // 置けない長さを指定した addNote は何もしない
    expect(addNote(notes, MIDDLE_C, true)).toBe(notes)
  })
})

describe('のばす音の列', () => {
  it('のばす音は2列ぶん使う', () => {
    const notes = addNote(addNote([], MIDDLE_C, true), MIDDLE_C)
    expect(usedColumns(notes)).toBe(3)
  })

  it('のばす音のうしろは1列ぶんずれて始まる', () => {
    const notes = addNote(addNote(addNote([], MIDDLE_C), MIDDLE_C, true), MIDDLE_C)
    expect(columnStarts(notes)).toEqual([0, 1, 3])
  })

  it('のばす音は列の上限も2列ぶんで数える', () => {
    let notes: PlacedNote[] = []
    for (let i = 0; i < NOTE_MAX; i++) notes = addNote(notes, MIDDLE_C, true)
    expect(usedColumns(notes)).toBe(NOTE_MAX)
    expect(notes).toHaveLength(NOTE_MAX / 2)
  })
})

describe('columnX', () => {
  it('NOTE_MAX列が左→右へ単調増加し配置領域内に収まる', () => {
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

  it('列間隔が下限を下回らない（幼児が隣の音符を誤って掴まない幅）', () => {
    expect(columnX(1) - columnX(0)).toBeGreaterThanOrEqual(MIN_COLUMN_PITCH)
  })
})

describe('isOverPlacement', () => {
  it('五線譜領域の内外を判定する', () => {
    expect(isOverPlacement(columnX(0))).toBe(true)
    expect(isOverPlacement(0)).toBe(false)
    expect(isOverPlacement(9999)).toBe(false)
  })
})

describe('canPlace（#56 音部一致ガード）', () => {
  it('配置エリア内でも、掴んだ音部と盤面の音部が違えば置かない', () => {
    expect(canPlace('treble', 'treble', columnX(0))).toBe(true)
    expect(canPlace('treble', 'bass', columnX(0))).toBe(false)
    expect(canPlace('bass', 'treble', columnX(0))).toBe(false)
  })

  it('音部が一致していても配置エリア外なら置かない', () => {
    expect(canPlace('treble', 'treble', 9999)).toBe(false)
  })
})

describe('isOverTrash', () => {
  it('下部の帯（お道具箱の外）でのみ true', () => {
    expect(isOverTrash(TRASH_CX, TRASH_CY)).toBe(true)
    expect(isOverTrash(TRASH_CX, TRASH_TOP - 1)).toBe(false) // 帯より上
    expect(isOverTrash(0, TRASH_CY)).toBe(false) // 五線譜の左外
    expect(isOverTrash(9999, TRASH_CY)).toBe(false) // お道具箱側
  })

  it('鍵盤の上（VIEW_H より下）では捨てない', () => {
    expect(isOverTrash(TRASH_CX, VIEW_H)).toBe(false)
    expect(isOverTrash(TRASH_CX, KEYBOARD_TOP + KEYBOARD_H / 2)).toBe(false)
    expect(isOverTrash(TRASH_CX, VIEW_H - 1)).toBe(true) // 帯の下端はそのまま
  })
})

describe('鍵盤の列', () => {
  it('白鍵は左→右へ隙間なく並び、五線の幅に収まる', () => {
    const count = 10
    const w = whiteKeyW(count)
    const xs = Array.from({ length: count }, (_, i) => whiteKeyX(i, count))
    expect(xs[0]).toBe(KEY_LEFT)
    for (let i = 1; i < count; i++) expect(xs[i] - xs[i - 1]).toBeCloseTo(w)
    expect(xs.at(-1)! + w).toBeCloseTo(KEY_RIGHT)
  })

  it('鍵盤ぶんの viewBox は五線譜のぶんより高い', () => {
    expect(VIEW_H_KEYS).toBe(VIEW_H + KEYBOARD_H)
    expect(KEYBOARD_TOP).toBe(VIEW_H)
  })
})
