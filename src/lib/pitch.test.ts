import { describe, expect, it } from 'vitest'
import {
  BASS_PITCHES,
  MIDDLE_C,
  TREBLE_PITCHES,
  hasSharpAbove,
  pitchByNote,
  pitchToY,
  pitchesOf,
  snapYToPitch,
  stepToY,
  tonicOf,
  type StaffLayout,
} from './pitch'

const layout: StaffLayout = { topLineY: 100, staffSpace: 40 }

describe('TREBLE_PITCHES', () => {
  it('ド〜高いミの1オクターブ+α（10音）を低→高で持つ', () => {
    expect(TREBLE_PITCHES).toHaveLength(10)
    expect(TREBLE_PITCHES[0].note).toBe('C4')
    expect(TREBLE_PITCHES[0].solfa).toBe('ド')
    expect(TREBLE_PITCHES.at(-1)!.note).toBe('E5')
  })

  it('step は低い音ほど大きい（下に位置する）', () => {
    const steps = TREBLE_PITCHES.map((p) => p.step)
    for (let i = 1; i < steps.length; i++) {
      expect(steps[i]).toBeLessThan(steps[i - 1])
    }
  })
})

describe('座標変換', () => {
  it('stepToY: 半スペース単位で下方向に増える', () => {
    expect(stepToY(0, layout)).toBe(100) // 最上線
    expect(stepToY(2, layout)).toBe(140) // 1スペース下の線
    expect(stepToY(1, layout)).toBe(120) // 線と線の間
  })

  it('ド(C4)は下加線（最上線から半スペース10個下）に来る', () => {
    expect(MIDDLE_C.step).toBe(10)
    expect(pitchToY(MIDDLE_C, layout)).toBe(100 + (10 * 40) / 2)
  })
})

describe('snapYToPitch', () => {
  it('音の真上のYはその音に吸着する', () => {
    for (const p of TREBLE_PITCHES) {
      expect(snapYToPitch(pitchToY(p, layout), layout, 'treble')).toEqual(p)
    }
  })

  it('わずかにずれたYでも最近傍の音に吸着する', () => {
    const y = pitchToY(MIDDLE_C, layout) - layout.staffSpace / 4
    expect(snapYToPitch(y, layout, 'treble')).toEqual(MIDDLE_C)
  })

  it('範囲外（高すぎ/低すぎ）は端の音にクランプ', () => {
    expect(snapYToPitch(-9999, layout, 'treble').note).toBe('E5')
    expect(snapYToPitch(9999, layout, 'treble').note).toBe('C4')
  })
})

describe('BASS_PITCHES', () => {
  it('ファ(F2)〜ラ(A3)の10音を低→高で持つ', () => {
    expect(BASS_PITCHES).toHaveLength(10)
    expect(BASS_PITCHES[0]).toMatchObject({ note: 'F2', solfa: 'ファ' })
    expect(BASS_PITCHES.at(-1)).toMatchObject({ note: 'A3', solfa: 'ラ' })
  })

  it('最上線(step 0)はラ(A3)・最下線(step 8)はソ(G2)', () => {
    expect(pitchByNote('A3', 'bass')!.step).toBe(0)
    expect(pitchByNote('G2', 'bass')!.step).toBe(8)
  })

  it('ド(C3)は五線の中（加線が要らない）', () => {
    const doo = tonicOf('bass')
    expect(doo.note).toBe('C3')
    // 五線は step 0〜8。その内側にある。
    expect(doo.step).toBeGreaterThan(0)
    expect(doo.step).toBeLessThan(8)
  })

  it('オクターブがCを跨ぐところで繰り上がる', () => {
    expect(BASS_PITCHES.map((p) => p.note)).toEqual([
      'F2', 'G2', 'A2', 'B2', 'C3', 'D3', 'E3', 'F3', 'G3', 'A3',
    ])
  })
})

describe('hasSharpAbove（鍵盤の黒鍵位置）', () => {
  it('ミ→ファ と シ→ド の間にだけ黒鍵が無い', () => {
    const marks = TREBLE_PITCHES.map((p) => [p.note, hasSharpAbove(p)] as const)
    expect(marks).toEqual([
      ['C4', true],
      ['D4', true],
      ['E4', false],
      ['F4', true],
      ['G4', true],
      ['A4', true],
      ['B4', false],
      ['C5', true],
      ['D5', true],
      ['E5', false],
    ])
  })

  it('ヘ音でも同じ規則（音名で決まる）', () => {
    expect(hasSharpAbove(pitchByNote('E3', 'bass')!)).toBe(false)
    expect(hasSharpAbove(pitchByNote('B2', 'bass')!)).toBe(false)
    expect(hasSharpAbove(pitchByNote('F2', 'bass')!)).toBe(true)
  })
})

describe('音部記号ごとの解決', () => {
  it('同じYでも音部記号で違う音になる', () => {
    const y = stepToY(2, layout)
    expect(snapYToPitch(y, layout, 'treble').note).toBe('D5')
    expect(snapYToPitch(y, layout, 'bass').note).toBe('F3')
  })

  it('範囲外は各音部記号の端にクランプする', () => {
    expect(snapYToPitch(-9999, layout, 'bass').note).toBe('A3')
    expect(snapYToPitch(9999, layout, 'bass').note).toBe('F2')
  })

  it('音名は自分の音部記号でしか引けない', () => {
    expect(pitchByNote('C4', 'treble')).toBeDefined()
    expect(pitchByNote('C4', 'bass')).toBeUndefined()
    expect(pitchByNote('C3', 'bass')).toBeDefined()
    expect(pitchByNote('C3', 'treble')).toBeUndefined()
  })

  it('pitchesOf は音部記号ごとの表を返す', () => {
    expect(pitchesOf('treble')).toBe(TREBLE_PITCHES)
    expect(pitchesOf('bass')).toBe(BASS_PITCHES)
  })

  it('Pitch は自分がどの音部記号で解決されたかを持つ（#56）', () => {
    expect(TREBLE_PITCHES.every((p) => p.clef === 'treble')).toBe(true)
    expect(BASS_PITCHES.every((p) => p.clef === 'bass')).toBe(true)
    expect(snapYToPitch(stepToY(2, layout), layout, 'bass').clef).toBe('bass')
    expect(pitchByNote('C3', 'bass')!.clef).toBe('bass')
  })
})
