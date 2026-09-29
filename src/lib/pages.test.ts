import { describe, expect, it } from 'vitest'
import { NOTE_MAX } from './layout'
import {
  canAddGuidePage,
  canAddPage,
  collapseEmptyPages,
  guideTargetsFor,
  parseNoteName,
  toNoteNames,
} from './pages'
import { songOf } from './songs'
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

describe('collapseEmptyPages（#60-6）', () => {
  it('空ページが無ければそのまま返す', () => {
    const pgs = [page(['C4']), page(['E4'])]
    expect(collapseEmptyPages(pgs, 1)).toEqual({ pages: pgs, currentPage: 1 })
  })

  it('末尾は空でも残す', () => {
    const pgs = [page(['C4']), []]
    expect(collapseEmptyPages(pgs, 0)).toEqual({ pages: pgs, currentPage: 0 })
  })

  it('先頭の空ページを畳み、currentPage を詰める', () => {
    // [空, [x]] で1ページ目にいる（全消し直後）→ [[x]]・0ページ目へ
    const r = collapseEmptyPages([[], page(['C4'])], 0)
    expect(r.pages.map((p) => p.length)).toEqual([1])
    expect(r.currentPage).toBe(0)
  })

  it('中間の空ページを畳む', () => {
    const r = collapseEmptyPages([page(['C4']), [], page(['E4'])], 2)
    expect(r.pages.map((p) => p.length)).toEqual([1, 1])
    expect(r.currentPage).toBe(1)
  })

  it('消えたページを指していたら詰めた先に落ち着く', () => {
    // [[x], 空, 空] で1ページ目（空）にいる → [[x], 空(末尾)]・末尾へ
    const r = collapseEmptyPages([page(['C4']), [], []], 1)
    expect(r.pages.map((p) => p.length)).toEqual([1, 0])
    expect(r.currentPage).toBe(1)
  })
})

describe('canAddGuidePage（おてほんのページ送り・#128）', () => {
  const twinkle = songOf('twinkle', 'treble').pages // 7音（8列）＋7音（8列）
  const n = (count: number, note = 'E4') => page(Array.from({ length: count }, () => note))

  it('フレーズの音の数ぶん置けたら、10列に満たなくても次のページを作れる', () => {
    expect(canAddGuidePage([n(6)], 0, twinkle)).toBe(false)
    expect(canAddGuidePage([[...n(6), ...longPage(1)]], 0, twinkle)).toBe(true) // お手本どおり8列
  })

  it('数えるのは列でなく音の数（のばす音をふつうに置いても進める・のばしすぎても途中では出ない）', () => {
    expect(canAddGuidePage([n(7)], 0, twinkle)).toBe(true) // 7列でも7音
    expect(canAddGuidePage([longPage(4)], 0, twinkle)).toBe(false) // 8列でも4音
  })

  it('違う音でも数が届けば進める（×にしない）', () => {
    expect(canAddGuidePage([n(7, 'C4')], 0, twinkle)).toBe(true)
  })

  it('お手本の最後のページ・末尾でないページ・1ページの曲では作らない', () => {
    expect(canAddGuidePage([n(7), n(7)], 1, twinkle)).toBe(false) // お手本はもう無い
    expect(canAddGuidePage([n(7), []], 0, twinkle)).toBe(false) // 次のページはもうある
    expect(canAddGuidePage([n(8)], 0, songOf('bee', 'treble').pages)).toBe(false)
  })
})

describe('guideTargetsFor（ページに出すお手本・#128）', () => {
  const twinkle = songOf('twinkle', 'treble').pages
  const solfa = (g: { pitch: { solfa: string } }[]) => g.map((x) => x.pitch.solfa)
  const n = (count: number) => page(Array.from({ length: count }, () => 'E4'))

  it('ふつうはページ＝フレーズ', () => {
    expect(solfa(guideTargetsFor([[]], 0, twinkle))).toEqual(solfa(twinkle[0]))
    expect(solfa(guideTargetsFor([n(7), []], 1, twinkle))).toEqual(solfa(twinkle[1]))
  })

  it('前のページに多く置いたら、その続きから（押し出された音の案内）', () => {
    // 1ページめに9音 → 2ページめは2フレーズめの3音めから
    expect(solfa(guideTargetsFor([n(9), []], 1, twinkle))).toEqual(solfa(twinkle[1].slice(2)))
    // 1ページの曲（ぶんぶんぶん 8音）で、7音で満杯になったら次のページに残りの ド
    const bee = songOf('bee', 'treble').pages
    expect(solfa(guideTargetsFor([n(7), []], 1, bee))).toEqual(['ド'])
  })

  it('1ページめでは2フレーズめを案内しない', () => {
    expect(guideTargetsFor([n(7)], 0, twinkle)).toHaveLength(7)
  })
})
