import { describe, expect, it } from 'vitest'
import { TWINKLE } from './songs'
import { pitchesOf, type Clef } from './pitch'

const CLEFS: Clef[] = ['treble', 'bass']

describe('songs', () => {
  it.each(CLEFS)('きらきら星は7音（%s）', (clef) => {
    expect(TWINKLE[clef].pitches).toHaveLength(7)
  })

  it.each(CLEFS)('ソルファ並びは音部記号によらず ド ド ソ ソ ラ ラ ソ（%s）', (clef) => {
    expect(TWINKLE[clef].pitches.map((p) => p.solfa)).toEqual([
      'ド',
      'ド',
      'ソ',
      'ソ',
      'ラ',
      'ラ',
      'ソ',
    ])
  })

  it.each(CLEFS)('全音がその音部記号の演奏範囲内（%s）', (clef) => {
    const range = new Set(pitchesOf(clef).map((p) => p.note))
    for (const p of TWINKLE[clef].pitches) {
      expect(range.has(p.note)).toBe(true)
    }
  })
})
