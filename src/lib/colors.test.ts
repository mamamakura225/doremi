import { describe, expect, it } from 'vitest'
import { SOLFA_COLOR, colorOf } from './colors'
import { MIDDLE_C, TREBLE_PITCHES } from './pitch'

describe('colorOf', () => {
  it('ドは赤', () => {
    expect(colorOf(MIDDLE_C)).toBe('#e23b3b')
  })

  it('演奏可能な全音に色が定義されている', () => {
    for (const p of TREBLE_PITCHES) {
      expect(SOLFA_COLOR[p.solfa]).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })

  it('7音すべて異なる色', () => {
    const colors = Object.values(SOLFA_COLOR)
    expect(new Set(colors).size).toBe(colors.length)
  })
})
