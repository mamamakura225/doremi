import { describe, expect, it } from 'vitest'
import {
  MIDDLE_C,
  TREBLE_PITCHES,
  pitchToY,
  snapYToPitch,
  stepToY,
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
      expect(snapYToPitch(pitchToY(p, layout), layout)).toEqual(p)
    }
  })

  it('わずかにずれたYでも最近傍の音に吸着する', () => {
    const y = pitchToY(MIDDLE_C, layout) - layout.staffSpace / 4
    expect(snapYToPitch(y, layout)).toEqual(MIDDLE_C)
  })

  it('範囲外（高すぎ/低すぎ）は端の音にクランプ', () => {
    expect(snapYToPitch(-9999, layout).note).toBe('E5')
    expect(snapYToPitch(9999, layout).note).toBe('C4')
  })
})
