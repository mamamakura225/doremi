// 複数ページ（フレーズ）の純ロジック（Vitest対象）。
import { NOTE_MAX } from './layout'
import { usedColumns, type PlacedNote } from './notes'

/** のばす音を表す接尾辞（保存形式）。例 'C4~' */
const LONG_SUFFIX = '~'

/** 末尾ページに列が残っていないとき、新しいページを追加できる（つぎのうた）。 */
export function canAddPage(pages: PlacedNote[][], current: number): boolean {
  return current === pages.length - 1 && usedColumns(pages[current]) >= NOTE_MAX
}

/** 保存・連結再生用に、各ページを音名の並びへ変換し空ページを除く（のばす音は 'C4~'）。 */
export function toNoteNames(pages: PlacedNote[][]): string[][] {
  return pages
    .map((pg) => pg.map((n) => (n.long ? n.pitch.note + LONG_SUFFIX : n.pitch.note)))
    .filter((pg) => pg.length > 0)
}

/** 保存された音名を音名と長さに分解する（旧形式の 'C4' は ふつうの音）。 */
export function parseNoteName(name: string): { note: string; long: boolean } {
  return name.endsWith(LONG_SUFFIX)
    ? { note: name.slice(0, -LONG_SUFFIX.length), long: true }
    : { note: name, long: false }
}
