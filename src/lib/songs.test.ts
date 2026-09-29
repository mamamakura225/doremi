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

  it.each(CLEFS)('きらきらぼしは2ページ（ドドソソララソ／ファファミミレレド・#128）（%s）', (clef) => {
    expect(songOf('twinkle', clef).pages.map((pg) => pg.map((n) => n.pitch.solfa))).toEqual([
      ['ド', 'ド', 'ソ', 'ソ', 'ラ', 'ラ', 'ソ'],
      ['ファ', 'ファ', 'ミ', 'ミ', 'レ', 'レ', 'ド'],
    ])
  })

  it.each(CLEFS)('ドレミの並びは音部記号によらず同じ・ヘ音は1オクターブ下（%s）', (clef) => {
    for (const { id } of SONGS) {
      const treble = songOf(id, 'treble').pages.flat()
      const here = songOf(id, clef).pages.flat()
      expect(here.map((n) => n.pitch.solfa)).toEqual(treble.map((n) => n.pitch.solfa))
      expect(here.map((n) => n.long)).toEqual(treble.map((n) => n.long))
      if (clef === 'bass') {
        // 全音が1オクターブ下（音名は同じ・オクターブ番号が1小さい）
        here.forEach((n, i) => {
          const t = treble[i].pitch.note
          expect(n.pitch.note).toBe(t.slice(0, -1) + String(Number(t.slice(-1)) - 1))
        })
      }
    }
  })

  it.each(CLEFS)('全曲の全音がその音部記号の演奏範囲内・どのページも1ページに収まる（%s）', (clef) => {
    const range = new Set(pitchesOf(clef).map((p) => p.note))
    for (const { id } of SONGS) {
      const { pages } = songOf(id, clef)
      for (const n of pages.flat()) expect(range.has(n.pitch.note)).toBe(true)
      for (const pg of pages) expect(fitsOnePage(pg)).toBe(true)
    }
  })

  it('のばす音は2列ぶん（ぶんぶんぶんはちょうど10列）', () => {
    expect(songOf('bee', 'treble').pages.map(songColumns)).toEqual([10])
    expect(songOf('frog', 'treble').pages.map(songColumns)).toEqual([8, 8])
    expect(songOf('twinkle', 'treble').pages.map(songColumns)).toEqual([8, 8]) // フレーズの最後は二分音符
  })
})
