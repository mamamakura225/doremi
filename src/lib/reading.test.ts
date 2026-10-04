import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  HINT_AFTER_MISSES,
  READ_PER_STAGE,
  STAGE_STICKERS,
  afterRead,
  counts,
  loadReading,
  missed,
  nextReading,
  parseReading,
  readFirstTry,
  readingPitches,
  saveReading,
} from './reading'
import { pitchByNote } from './pitch'
import { STICKERS } from './stickers'

const P = (n: string) => pitchByNote(n, 'treble')!

describe('よみとりあそび（#155）', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('段階は ド・レ・ミ → ド〜ソ → ド〜高いド → ド〜高いミ（ト音の10音）', () => {
    const solfas = (s: number) => readingPitches(s).map((p) => p.note)
    expect(solfas(0)).toEqual(['C4', 'D4', 'E4'])
    expect(solfas(1)).toEqual(['C4', 'D4', 'E4', 'F4', 'G4'])
    expect(solfas(2)).toEqual(['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'])
    expect(solfas(3)).toEqual(['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5'])
    // 範囲外は丸める（壊れた保存値・おとなメニューの誤入力でも落ちない）
    expect(solfas(-1)).toEqual(solfas(0))
    expect(solfas(9)).toEqual(solfas(3))
  })

  it('直前と同じ音は続けて出さない', () => {
    for (const r of [0, 0.3, 0.5, 0.7, 0.999]) {
      expect(nextReading(0, P('D4'), {}, () => r).note).not.toBe('D4')
    }
    expect(nextReading(0, null, {}, () => 0).note).toBe('C4')
    expect(nextReading(0, null, {}, () => 0.999).note).toBe('E4')
  })

  it('まちがえた音は出やすくなり、1回でよめると戻る', () => {
    // 重みなし: ド・レ・ミ を 1:1:1。0.5 は真ん中の レ
    expect(nextReading(0, null, {}, () => 0.5).note).toBe('D4')
    // ド を2回まちがえた: 3:1:1。0.5 は ド の範囲（0〜0.6）に入る
    const weak = missed(missed({}, 'C4'), 'C4')
    expect(weak.C4).toBe(2)
    expect(nextReading(0, null, weak, () => 0.5).note).toBe('C4')
    // 上限は3、戻すのは0まで
    expect(missed(missed(weak, 'C4'), 'C4').C4).toBe(3)
    expect(readFirstTry(readFirstTry(readFirstTry(weak, 'C4'), 'C4'), 'C4').C4).toBe(0)
  })

  it('5回よめたら次の段階へ・クリアした段階を返す・最後の段階は数え直す', () => {
    let p = { stage: 0, count: 0 }
    for (let i = 0; i < READ_PER_STAGE - 1; i++) {
      const r = afterRead(p)
      expect(r.cleared).toBeNull()
      p = { stage: r.stage, count: r.count }
    }
    expect(p).toEqual({ stage: 0, count: 4 })
    expect(afterRead(p)).toEqual({ stage: 1, count: 0, cleared: 0 })
    expect(afterRead({ stage: 3, count: 4 })).toEqual({ stage: 3, count: 0, cleared: 3 })
  })

  it('正しい鍵が光ったあとの正解は、よめた数に入れない', () => {
    expect(counts(0)).toBe(true)
    expect(counts(HINT_AFTER_MISSES - 1)).toBe(true)
    expect(counts(HINT_AFTER_MISSES)).toBe(false)
    expect(HINT_AFTER_MISSES).toBe(2)
  })

  it('段階のシールは4枚で、どれもシール帳にある', () => {
    expect(STAGE_STICKERS).toHaveLength(4)
    const ids = new Set(STICKERS.map((s) => s.id))
    for (const id of [...STAGE_STICKERS, 'read-found']) expect(ids.has(id as never)).toBe(true)
  })

  it('段階を保存して読み戻す・壊れた値は最初の段階', () => {
    saveReading(2)
    expect(loadReading()).toBe(2)
    expect(parseReading(null)).toBe(0)
    expect(parseReading('{')).toBe(0)
    expect(parseReading('{"stage":"2"}')).toBe(0)
    expect(parseReading('{"stage":1.5}')).toBe(0)
    expect(parseReading('{"stage":7}')).toBe(3)
    expect(parseReading('null')).toBe(0)
  })

  it('localStorage が使えなくても例外を出さない', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(loadReading()).toBe(0)
    expect(() => saveReading(1)).not.toThrow()
  })
})
