// おてほんモードの曲データ（純データ・Vitest対象）。
// React/Tone.js/SVG に依存しない。
// 旋律はパブリックドメインのものだけ（出どころは docs/requirements.md）。
// 歌詞は使わない（曲名だけ）——日本語詞には保護期間中のものがあるため。
import { NOTE_MAX } from './layout'
import { pitchesOf, type Clef, type Pitch } from './pitch'

export type SongId = 'twinkle' | 'frog' | 'lamb' | 'bee'

/** お手本の1音。のばす音は2列ぶん */
export interface GuideNote {
  pitch: Pitch
  long: boolean
}

export interface Song {
  id: SongId
  name: string
  notes: GuideNote[]
}

/**
 * ト音での並び（'~' はのばす音）。ヘ音では1オクターブ下の同じドレミにする。
 * どの曲も ド〜ラ の中に収める——ヘ音の音域（F2〜A3）で ド(C3) より上は ラ(A3) までしか無いため。
 * どの曲も1ページ（10列）に収める——ページをまたぐお手本は別 issue（docs/architecture.md）。
 */
const DEFS: { id: SongId; name: string; notes: string }[] = [
  // きらきらぼし（フランス民謡）第1フレーズ。最後の ソ は二分音符
  { id: 'twinkle', name: 'きらきらぼし', notes: 'C4 C4 G4 G4 A4 A4 G4~' },
  // かえるのうた（ドイツ民謡とされる）第1フレーズ
  { id: 'frog', name: 'かえるのうた', notes: 'C4 D4 E4 F4 E4 D4 C4~' },
  // メリーさんのひつじ（19世紀アメリカの童謡）第1フレーズ
  { id: 'lamb', name: 'メリーさんのひつじ', notes: 'E4 D4 C4 D4 E4 E4 E4~' },
  // ぶんぶんぶん（ボヘミア民謡）第1フレーズ
  { id: 'bee', name: 'ぶんぶんぶん', notes: 'G4 F4 E4~ D4 E4 F4 D4 C4~' },
]

/** 曲の一覧（曲えらびの並び） */
export const SONGS: { id: SongId; name: string }[] = DEFS.map(({ id, name }) => ({ id, name }))

/** ト音の音名をその音部記号の Pitch に解決（ヘ音は1オクターブ下・演奏範囲外は例外） */
function resolve(note: string, clef: Clef): Pitch {
  const name = clef === 'bass' ? note.replace(/\d$/, (o) => String(Number(o) - 1)) : note
  const p = pitchesOf(clef).find((x) => x.note === name)
  if (!p) throw new Error(`song note out of range: ${name} (${clef})`)
  return p
}

/** 曲をその音部記号で返す */
export function songOf(id: SongId, clef: Clef): Song {
  const def = DEFS.find((d) => d.id === id) ?? DEFS[0]
  return {
    id: def.id,
    name: def.name,
    notes: def.notes.split(' ').map((token) => ({
      pitch: resolve(token.replace('~', ''), clef),
      long: token.endsWith('~'),
    })),
  }
}

/** お手本が何列ぶんか（のばす音は2列） */
export function songColumns(notes: readonly GuideNote[]): number {
  return notes.reduce((sum, n) => sum + (n.long ? 2 : 1), 0)
}

/** お手本が1ページに収まるか */
export function fitsOnePage(notes: readonly GuideNote[]): boolean {
  return songColumns(notes) <= NOTE_MAX
}
