// 配置済み音符の状態を扱う純ロジック（Vitest対象）。
import { NOTE_MAX } from './layout'
import type { Pitch } from './pitch'

export interface PlacedNote {
  id: string
  pitch: Pitch
  /** のばす音。譜面では2列ぶんを占め、再生でも2ステップ鳴る（未指定＝ふつうの音） */
  long?: boolean
}

/** その音符が占める列数（ふつう=1・のばす=2） */
export function noteWidth(note: Pick<PlacedNote, 'long'>): number {
  return note.long ? 2 : 1
}

/** 使用済みの列数（＝置ける残り列を測る基準。音符の個数ではない） */
export function usedColumns(notes: PlacedNote[]): number {
  return notes.reduce((sum, n) => sum + noteWidth(n), 0)
}

/** 各音符の開始列インデックス（長音がある分だけ後続がずれる） */
export function columnStarts(notes: PlacedNote[]): number[] {
  const starts: number[] = []
  let col = 0
  for (const n of notes) {
    starts.push(col)
    col += noteWidth(n)
  }
  return starts
}

let seq = 0
function nextId(): string {
  seq += 1
  return `n${seq}`
}

/** 音符を末尾に追加。残り列が足りなければ変更しない。 */
export function addNote(notes: PlacedNote[], pitch: Pitch, long = false): PlacedNote[] {
  if (!canAddNote(notes, long)) return notes
  return [...notes, long ? { id: nextId(), pitch, long } : { id: nextId(), pitch }]
}

/** お道具箱が使えるか（その長さの音を置くだけの列が残っているか） */
export function canAddNote(notes: PlacedNote[], long = false): boolean {
  return usedColumns(notes) + noteWidth({ long }) <= NOTE_MAX
}

/** 最後に置いた音符を1つ取り消す。空なら変更しない。 */
export function removeLast(notes: PlacedNote[]): PlacedNote[] {
  if (notes.length === 0) return notes
  return notes.slice(0, -1)
}

/** 指定IDの音符を削除。該当が無ければ変更しない。 */
export function removeById(notes: PlacedNote[], id: string): PlacedNote[] {
  const next = notes.filter((n) => n.id !== id)
  return next.length === notes.length ? notes : next
}
