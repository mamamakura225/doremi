// おてほんモードの曲データ（純データ・Vitest対象）。
// React/Tone.js/SVG に依存しない。
import { pitchesOf, type Clef, type Pitch } from './pitch'

export interface Song {
  id: string
  name: string
  pitches: Pitch[]
}

/** 科学的音名の並びを Pitch[] に解決（演奏範囲外は例外）。 */
function byNotes(clef: Clef, notes: string[]): Pitch[] {
  return notes.map((n) => {
    const p = pitchesOf(clef).find((x) => x.note === n)
    if (!p) throw new Error(`song note out of range: ${n} (${clef})`)
    return p
  })
}

// きらきら星 第1フレーズ（ド ド ソ ソ ラ ラ ソ＝7音）。
// 音部記号ごとに、同じ「ドレミ」になる高さへ移す（ヘ音では1オクターブ下）。
export const TWINKLE: Record<Clef, Song> = {
  treble: {
    id: 'twinkle',
    name: 'きらきらぼし',
    pitches: byNotes('treble', ['C4', 'C4', 'G4', 'G4', 'A4', 'A4', 'G4']),
  },
  bass: {
    id: 'twinkle',
    name: 'きらきらぼし',
    pitches: byNotes('bass', ['C3', 'C3', 'G3', 'G3', 'A3', 'A3', 'G3']),
  },
}
