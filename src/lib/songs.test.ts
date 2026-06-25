import { describe, expect, it } from 'vitest'
import { SONGS, TWINKLE } from './songs'
import { TREBLE_PITCHES } from './pitch'

describe('songs', () => {
  it('きらきら星は7音', () => {
    expect(TWINKLE.pitches).toHaveLength(7)
  })

  it('きらきら星のソルファ並びは ド ド ソ ソ ラ ラ ソ', () => {
    expect(TWINKLE.pitches.map((p) => p.solfa)).toEqual([
      'ド',
      'ド',
      'ソ',
      'ソ',
      'ラ',
      'ラ',
      'ソ',
    ])
  })

  it('全曲の全音が演奏範囲内', () => {
    const range = new Set(TREBLE_PITCHES.map((p) => p.note))
    for (const song of SONGS) {
      for (const p of song.pitches) {
        expect(range.has(p.note)).toBe(true)
      }
    }
  })
})
