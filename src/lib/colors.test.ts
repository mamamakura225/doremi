import { describe, expect, it } from 'vitest'
import { SOLFA_COLOR, colorOf } from './colors'
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
