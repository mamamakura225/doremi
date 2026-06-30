// つくった曲の保存（端末内 localStorage のみ・外部送信なし）。
// 純ロジック（parse/add）と薄い I/O を分け、純ロジックを Vitest 対象にする。

export interface SavedSong {
  id: string
  /** 保存時刻(ms) */
  createdAt: number
  /** ページごとの科学的音名の並び（例 [['C4','G4'],['E4']]） */
  pages: string[][]
}

const KEY = 'doremi.songs.v1'
/** 本棚の上限。超えたら古いものから落とす（純クライアントの軽量保存） */
export const SHELF_MAX = 12

function isStrings(a: unknown): a is string[] {
  return Array.isArray(a) && a.every((n) => typeof n === 'string')
}

/** 1件を SavedSong に正規化。旧形式(notes:string[])は1ページの曲として読む。壊れていれば null。 */
function normalize(s: { id?: unknown; createdAt?: unknown; pages?: unknown; notes?: unknown }): SavedSong | null {
  if (!s || typeof s.id !== 'string' || typeof s.createdAt !== 'number') return null
  if (Array.isArray(s.pages) && s.pages.every(isStrings)) {
    return { id: s.id, createdAt: s.createdAt, pages: s.pages as string[][] }
  }
  if (isStrings(s.notes)) {
    // v1 後方互換: 旧 notes:string[] を [notes]（1ページ曲）として読む。
    return { id: s.id, createdAt: s.createdAt, pages: [s.notes] }
  }
  return null
}

/** localStorage の生文字列を SavedSong[] に復元（壊れていれば空配列）。 */
export function parseSongs(raw: string | null): SavedSong[] {
  if (!raw) return []
  try {
    const data = JSON.parse(raw)
    if (!Array.isArray(data)) return []
    return data.map(normalize).filter((s): s is SavedSong => s !== null)
  } catch {
    return []
  }
}

/** 新しい曲を先頭に追加し、上限超過分を末尾から落とす（純ロジック）。 */
export function addSong(
  songs: SavedSong[],
  pages: string[][],
  id: string,
  now: number,
): SavedSong[] {
  const entry: SavedSong = { id, createdAt: now, pages }
  return [entry, ...songs].slice(0, SHELF_MAX)
}

function newId(): string {
  return crypto.randomUUID?.() ?? `s${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/** 保存済みの曲を読み込む。 */
export function loadSongs(): SavedSong[] {
  return parseSongs(localStorage.getItem(KEY))
}

/** 1曲（複数ページ）を保存して、更新後の一覧を返す。 */
export function saveSong(pages: string[][]): SavedSong[] {
  const next = addSong(loadSongs(), pages, newId(), Date.now())
  localStorage.setItem(KEY, JSON.stringify(next))
  return next
}
