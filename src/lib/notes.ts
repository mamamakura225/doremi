// 配置済み音符の状態を扱う純ロジック（Vitest対象）。
import { NOTE_MAX } from './layout'
import type { Pitch } from './pitch'

export interface PlacedNote {
  id: string
  pitch: Pitch
}

let seq = 0
function nextId(): string {
  seq += 1
  return `n${seq}`
}

/** 音符を末尾に追加。上限(NOTE_MAX)に達していれば変更しない。 */
export function addNote(notes: PlacedNote[], pitch: Pitch): PlacedNote[] {
  if (notes.length >= NOTE_MAX) return notes
  return [...notes, { id: nextId(), pitch }]
}

/** お道具箱が使えるか（満杯でない） */
export function canAddNote(notes: PlacedNote[]): boolean {
  return notes.length < NOTE_MAX
}

/** 最後に置いた音符を1つ取り消す。空なら変更しない。 */
export function removeLast(notes: PlacedNote[]): PlacedNote[] {
  if (notes.length === 0) return notes
  return notes.slice(0, -1)
}
