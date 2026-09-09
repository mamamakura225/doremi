import { describe, expect, it } from 'vitest'
import {
  KEYBOARD_H,
  KEYBOARD_TOP,
  KEY_LEFT,
  KEY_RIGHT,
  MIN_COLUMN_PITCH,
  NOTE_HEAD_RX,
  NOTE_HEAD_RY_ROTATED,
  NOTE_HEAD_W,
  NOTE_HIT_H,
  NOTE_HIT_W,
  NOTE_MAX,
  STAFF_LAYOUT,
  STAFF_RIGHT,
  TOOLBOX_CY,
  TOOLBOX_LONG_CY,
  TOOLBOX_NORMAL_CY,
  TOOLBOX_X,
  VIEW_H,
  VIEW_H_KEYS,
  canPlace,
  columnX,
  fitsKeyboard,
  isOverPlacement,
  isOverTrash,
  PLACE_LEFT,
  PLACE_RIGHT,
  TRASH_CX,
  TRASH_CY,
  TRASH_GAP,
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
import { MIDDLE_C, pitchToY, pitchesOf } from './pitch'

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
    // 下限は符頭幅(34)の 1.8 倍以上＝隣との間に符頭 0.8 個ぶんの余白が残る。
    // 実装定数の写しでなくリテラル基準にする（MIN_COLUMN_PITCH 65→40 で落ちる・#69）
    expect(MIN_COLUMN_PITCH).toBeGreaterThanOrEqual(NOTE_HEAD_W * 1.8)
    expect(MIN_COLUMN_PITCH).toBeGreaterThanOrEqual(60)
  })
})

describe('お道具箱の2つの掴み的（#69）', () => {
  it('「ふつう」と「のばす」は箱の中心から符頭直径ぶん以上ずれて上下に分かれる', () => {
    // どちらか一方の 85→5 変異でも「中心に寄って的が重なる」→ ここで落ちる
    expect(Math.abs(TOOLBOX_NORMAL_CY - TOOLBOX_CY)).toBeGreaterThanOrEqual(
      NOTE_HEAD_RX * 2,
    )
    expect(Math.abs(TOOLBOX_LONG_CY - TOOLBOX_CY)).toBeGreaterThanOrEqual(
      NOTE_HEAD_RX * 2,
    )
    // 一方が上・他方が下（同じ側に寄らない）
    expect(Math.sign(TOOLBOX_NORMAL_CY - TOOLBOX_CY)).not.toBe(
      Math.sign(TOOLBOX_LONG_CY - TOOLBOX_CY),
    )
  })
})

describe('fitsKeyboard（鍵盤を出せる画面か・#69）', () => {
  it('iPhone 横（844×390）では出さない', () => {
    expect(fitsKeyboard(844, 390)).toBe(false)
  })

  it('iPad 横（1180×820）では出す', () => {
    expect(fitsKeyboard(1180, 820)).toBe(true)
  })

  it('幅0（未計測）では出さない', () => {
    expect(fitsKeyboard(0, 500)).toBe(false)
  })
})

describe('配置済み音符のヒット領域（#62）', () => {
  it('符頭（21.5 CSS px）よりはっきり大きい', () => {
    // 符頭の横幅 34 に対し、指の接触幅ぶん（≈指1本）は広い
    expect(NOTE_HIT_W).toBeGreaterThan(NOTE_HEAD_W + 20)
    expect(NOTE_HIT_H).toBeGreaterThan(NOTE_HEAD_RY_ROTATED * 2)
  })

  it('隣の列のヒット領域と重ならない（列は固定グリッド）', () => {
    const rightEdge0 = columnX(0) + NOTE_HIT_W / 2
    const leftEdge1 = columnX(1) - NOTE_HIT_W / 2
    expect(leftEdge1).toBeGreaterThanOrEqual(rightEdge0)
  })

  it('最低音のヒット領域の下端がゴミ箱帯に届かない', () => {
    const lowestY = pitchToY(pitchesOf('treble')[0], STAFF_LAYOUT)
    expect(lowestY + NOTE_HIT_H / 2).toBeLessThan(TRASH_TOP)
  })

  it('上下方向はスナップ間隔（staffSpace）を超えない', () => {
    expect(NOTE_HIT_H).toBeLessThanOrEqual(STAFF_LAYOUT.staffSpace)
  })
})

describe('isOverPlacement', () => {
  it('五線譜領域の内側でのみ true（X）', () => {
    expect(isOverPlacement(columnX(0), 300)).toBe(true)
    expect(isOverPlacement(0, 300)).toBe(false)
    expect(isOverPlacement(STAFF_RIGHT + 1, 300)).toBe(false)
    expect(isOverPlacement(TOOLBOX_X, 300)).toBe(false) // お道具箱側
  })

  it('Y も見る（#59）——ヘッダーの上・ゴミ箱帯の上・鍵盤の上では false', () => {
    expect(isOverPlacement(columnX(0), -10)).toBe(false) // ヘッダー域
    expect(isOverPlacement(columnX(0), TRASH_TOP)).toBe(false) // ゴミ箱帯
    expect(isOverPlacement(columnX(0), VIEW_H + 60)).toBe(false) // 鍵盤域
    expect(isOverPlacement(columnX(0), TRASH_TOP - 1)).toBe(true) // 帯の直前まではOK
  })
})

describe('canPlace（音部一致ガード #56 ＋ 領域ガード #59）', () => {
  it('配置エリア内でも、掴んだ音部と盤面の音部が違えば置かない', () => {
    expect(canPlace('treble', 'treble', columnX(0), 300)).toBe(true)
    expect(canPlace('treble', 'bass', columnX(0), 300)).toBe(false)
    expect(canPlace('bass', 'treble', columnX(0), 300)).toBe(false)
  })

  it('音部が一致していても配置エリア外なら置かない', () => {
    expect(canPlace('treble', 'treble', 9999, 300)).toBe(false)
    expect(canPlace('treble', 'treble', columnX(0), VIEW_H + 60)).toBe(false)
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

  it('帯の上端と最も低い音の符頭の下端の間に TRASH_GAP 以上の余裕がある（#59）', () => {
    for (const clef of ['treble', 'bass'] as const) {
      const headBottom =
        pitchToY(pitchesOf(clef)[0], STAFF_LAYOUT) + NOTE_HEAD_RY_ROTATED
      // バグ値 TRASH_TOP=410 だと隙間 6.5 < TRASH_GAP(13.5) で落ちる
      expect(TRASH_TOP - headBottom).toBeGreaterThanOrEqual(TRASH_GAP)
    }
    expect(TRASH_TOP).toBe(430) // リテラルでも釘付け（自己参照をやめる）
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

  it('鍵盤ぶんの viewBox は五線譜のぶん＋120 高い', () => {
    // 定義（VIEW_H_KEYS = VIEW_H + KEYBOARD_H）の写しでなくリテラルで釘付け。
    // KEYBOARD_H→0 の変異で落ちる（#69）
    expect(VIEW_H_KEYS - VIEW_H).toBe(120)
    expect(KEYBOARD_H).toBe(120)
    expect(KEYBOARD_TOP).toBe(VIEW_H)
  })
})
