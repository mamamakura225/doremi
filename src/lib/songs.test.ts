import { describe, expect, it } from 'vitest'
import { SONGS, fitsOnePage, songColumns, songOf } from './songs'
import { pitchesOf, type Clef } from './pitch'

const CLEFS: Clef[] = ['treble', 'bass']

describe('songs（#106）', () => {
  it('おてほんの曲は4曲（きらきらぼし・かえるのうた・メリーさんのひつじ・ぶんぶんぶん）', () => {
    expect(SONGS.map((s) => s.name)).toEqual([
      'きらきらぼし',
      'かえるのうた',
      'メリーさんのひつじ',
      'ぶんぶんぶん',
    ])
  })

  it.each(CLEFS)('きらきらぼしは ド ド ソ ソ ラ ラ ソ（%s）', (clef) => {
    expect(songOf('twinkle', clef).notes.map((n) => n.pitch.solfa)).toEqual([
      'ド', 'ド', 'ソ', 'ソ', 'ラ', 'ラ', 'ソ',
    ])
  })

  it.each(CLEFS)('ドレミの並びは音部記号によらず同じ・ヘ音は1オクターブ下（%s）', (clef) => {
    for (const { id } of SONGS) {
      const treble = songOf(id, 'treble').notes
      const here = songOf(id, clef).notes
      expect(here.map((n) => n.pitch.solfa)).toEqual(treble.map((n) => n.pitch.solfa))
      expect(here.map((n) => n.long)).toEqual(treble.map((n) => n.long))
      if (clef === 'bass') expect(here[0].pitch.note.endsWith(String(Number(treble[0].pitch.note.slice(-1)) - 1))).toBe(true)
    }
  })

  it.each(CLEFS)('全曲の全音がその音部記号の演奏範囲内・1ページに収まる（%s）', (clef) => {
    const range = new Set(pitchesOf(clef).map((p) => p.note))
    for (const { id } of SONGS) {
      const notes = songOf(id, clef).notes
      for (const n of notes) expect(range.has(n.pitch.note)).toBe(true)
      expect(fitsOnePage(notes)).toBe(true)
    }
  })

  it('のばす音は2列ぶん（ぶんぶんぶんはちょうど10列）', () => {
    expect(songColumns(songOf('bee', 'treble').notes)).toBe(10)
    expect(songColumns(songOf('frog', 'treble').notes)).toBe(8)
  })
})
