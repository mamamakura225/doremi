// 複数ページ（フレーズ）の純ロジック（Vitest対象）。
import { NOTE_MAX } from './layout'
import type { PlacedNote } from './notes'

/** 末尾ページが満杯のとき、新しいページを追加できる（つぎのうた）。 */
export function canAddPage(pages: PlacedNote[][], current: number): boolean {
  return current === pages.length - 1 && pages[current].length >= NOTE_MAX
}

/** 保存・連結再生用に、各ページを科学的音名の並びへ変換し空ページを除く。 */
export function toNoteNames(pages: PlacedNote[][]): string[][] {
  return pages.map((pg) => pg.map((n) => n.pitch.note)).filter((pg) => pg.length > 0)
}
