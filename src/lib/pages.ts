// 複数ページ（フレーズ）の純ロジック（Vitest対象）。
import { NOTE_MAX } from './layout'
import { usedColumns, type PlacedNote } from './notes'
import type { GuideNote } from './songs'

/** のばす音を表す接尾辞（保存形式）。例 'C4~' */
const LONG_SUFFIX = '~'

/** 末尾ページに列が残っていないとき、新しいページを追加できる（つぎのうた）。 */
export function canAddPage(pages: PlacedNote[][], current: number): boolean {
  return current === pages.length - 1 && usedColumns(pages[current]) >= NOTE_MAX
}

type GuidePages = readonly (readonly GuideNote[])[]

/** ページ p までに置いた音の数 */
function placedThrough(pages: PlacedNote[][], p: number): number {
  return pages.slice(0, p + 1).reduce((n, pg) => n + pg.length, 0)
}

/** お手本のページ p（フレーズ）の終わりが、つないだ並びの何音めか。お手本より後ろのページは曲の終わり */
function guideEnd(guide: GuidePages, p: number): number {
  return guide.slice(0, p + 1).reduce((n, g) => n + g.length, 0)
}

/**
 * そのページに出すお手本（#128）。全ページをつないだお手本の「前のページまでに置いた音の続き」から、
 * そのページのフレーズの終わりまで。完成判定（つないだ並び）と同じ数え方にして、
 * のばす音で押し出された音も次のページで案内する
 */
export function guideTargetsFor(pages: PlacedNote[][], current: number, guide: GuidePages): GuideNote[] {
  return guide.flat().slice(placedThrough(pages, current - 1), guideEnd(guide, current))
}

/**
 * おてほん中は、末尾ページでそのフレーズの終わりまで音を置けたら次のページを作れる（#128）。
 * 10列に満たないフレーズで止まらないように。数えるのは列でなく音の数——のばす音をふつうに置いても、
 * ふつうの音をのばしても進める（長さは採点しない）。音が違っても進める（×にしない）
 */
export function canAddGuidePage(pages: PlacedNote[][], current: number, guide: GuidePages): boolean {
  return (
    current === pages.length - 1 &&
    current < guide.length - 1 &&
    placedThrough(pages, current) >= guideEnd(guide, current)
  )
}

/** 保存・連結再生用に、各ページを音名の並びへ変換し空ページを除く（のばす音は 'C4~'）。 */
export function toNoteNames(pages: PlacedNote[][]): string[][] {
  return pages
    .map((pg) => pg.map((n) => (n.long ? n.pitch.note + LONG_SUFFIX : n.pitch.note)))
    .filter((pg) => pg.length > 0)
}

/**
 * 末尾以外の空ページを取り除き、`currentPage` を新しい配列に合わせて返す（#60-6）。
 * 全消しで空になったページを残すと、ページドット・`aria-label` が実際の再生内容
 * （`toNoteNames` は空ページを除外する）とズレる。末尾ページは常に残す。
 */
export function collapseEmptyPages(
  pages: PlacedNote[][],
  currentPage: number,
): { pages: PlacedNote[][]; currentPage: number } {
  const lastIdx = pages.length - 1
  const keep = pages.map((p, i) => p.length > 0 || i === lastIdx)
  if (keep.every(Boolean)) return { pages, currentPage }
  const kept = pages.filter((_, i) => keep[i])
  // currentPage より前で落ちたページ数だけ左へずらす。currentPage 自身が落ちた
  // ページなら、詰めた後に直後へ来ていたページの位置に落ち着く。
  // currentPage より前で落ちたページ数だけ左へずらす。前が全部空だった場合は
  // 0 にクランプされる＝残った内容ページに着地する（「まえ」でも進むように見えるが、
  // 前に内容が無い以上ほかに行き先が無い）。
  const shift = keep.slice(0, currentPage).filter((k) => !k).length
  const mapped = Math.min(Math.max(0, currentPage - shift), kept.length - 1)
  return { pages: kept, currentPage: mapped }
}

/** 保存された音名を音名と長さに分解する（旧形式の 'C4' は ふつうの音）。 */
export function parseNoteName(name: string): { note: string; long: boolean } {
  return name.endsWith(LONG_SUFFIX)
    ? { note: name.slice(0, -LONG_SUFFIX.length), long: true }
    : { note: name, long: false }
}
