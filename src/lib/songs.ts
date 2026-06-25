// おてほんモードの曲データ（純データ・Vitest対象）。
// React/Tone.js/SVG に依存しない。
import { TREBLE_PITCHES, type Pitch } from './pitch'

export interface Song {
  id: string
  name: string
  pitches: Pitch[]
}

/** 科学的音名の並びを Pitch[] に解決（演奏範囲外は例外）。 */
function byNotes(notes: string[]): Pitch[] {
  return notes.map((n) => {
    const p = TREBLE_PITCHES.find((x) => x.note === n)
    if (!p) throw new Error(`song note out of range: ${n}`)
    return p
  })
}

// きらきら星 第1フレーズ（ド ド ソ ソ ラ ラ ソ＝7音）
export const TWINKLE: Song = {
  id: 'twinkle',
  name: 'きらきらぼし',
  pitches: byNotes(['C4', 'C4', 'G4', 'G4', 'A4', 'A4', 'G4']),
}

export const SONGS: Song[] = [TWINKLE]
