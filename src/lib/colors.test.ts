import { describe, expect, it } from 'vitest'
import {
  BOARD_BG,
  OUTLINE_COLOR,
  SOLFA_COLOR,
  WHITE_KEY_BG,
  colorOf,
} from './colors'
import { contrastRatio } from './contrast'
import { MIDDLE_C, pitchesOf, tonicOf, type Clef } from './pitch'

const CLEFS: Clef[] = ['treble', 'bass']

describe('colorOf', () => {
  it('ドは赤', () => {
    expect(colorOf(MIDDLE_C)).toBe('#e23b3b')
  })

  it.each(CLEFS)('ドはどの音部記号でも赤（%s）', (clef) => {
    expect(colorOf(tonicOf(clef))).toBe('#e23b3b')
  })

  it.each(CLEFS)('演奏可能な全音に色が定義されている（%s）', (clef) => {
    for (const p of pitchesOf(clef)) {
      expect(SOLFA_COLOR[p.solfa]).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })

  it('7音すべて異なる色', () => {
    const colors = Object.values(SOLFA_COLOR)
    expect(new Set(colors).size).toBe(colors.length)
  })
})

describe('輪郭で視認性を確保する（#61）', () => {
  // 符頭・ラベルの形は輪郭で見せる。輪郭が地から 3:1 浮いていれば、
  // 塗り色が何であれ（ミ黄が対背景 1.42:1 でも）シルエットが読める。
  it('輪郭色は盤面（クリーム地）に対して 3:1 以上', () => {
    expect(contrastRatio(OUTLINE_COLOR, BOARD_BG)).toBeGreaterThanOrEqual(3)
  })

  it('輪郭色は白鍵の地に対して 3:1 以上', () => {
    expect(contrastRatio(OUTLINE_COLOR, WHITE_KEY_BG)).toBeGreaterThanOrEqual(3)
  })

  it('パレット単体では半数以上が盤面に対して 3:1 未満（輪郭が要る理由）', () => {
    const failing = Object.values(SOLFA_COLOR).filter(
      (c) => contrastRatio(c, BOARD_BG) < 3,
    )
    expect(failing.length).toBeGreaterThanOrEqual(4)
  })
})
