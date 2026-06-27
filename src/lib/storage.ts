// つくった曲の保存（端末内 localStorage のみ・外部送信なし）。
// 純ロジック（parse/add）と薄い I/O を分け、純ロジックを Vitest 対象にする。

export interface SavedSong {
  id: string
  /** 保存時刻(ms) */
  createdAt: number
  /** 科学的音名の並び（例 ['C4','G4',...]） */
  notes: string[]
}

const KEY = 'doremi.songs.v1'
/** 本棚の上限。超えたら古いものから落とす（純クライアントの軽量保存） */
export const SHELF_MAX = 12

/** localStorage の生文字列を SavedSong[] に復元（壊れていれば空配列）。 */
export function parseSongs(raw: string | null): SavedSong[] {
  if (!raw) return []
  try {
    const data = JSON.parse(raw)
    if (!Array.isArray(data)) return []
    return data.filter(
      (s): s is SavedSong =>
        s &&
        typeof s.id === 'string' &&
        typeof s.createdAt === 'number' &&
        Array.isArray(s.notes) &&
        s.notes.every((n: unknown) => typeof n === 'string'),
    )
  } catch {
    return []
  }
}

/** 新しい曲を先頭に追加し、上限超過分を末尾から落とす（純ロジック）。 */
export function addSong(
  songs: SavedSong[],
  notes: string[],
  id: string,
  now: number,
): SavedSong[] {
  const entry: SavedSong = { id, createdAt: now, notes }
  return [entry, ...songs].slice(0, SHELF_MAX)
}

function newId(): string {
  return crypto.randomUUID?.() ?? `s${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/** 保存済みの曲を読み込む。 */
export function loadSongs(): SavedSong[] {
  return parseSongs(localStorage.getItem(KEY))
}

/** 1曲保存して、更新後の一覧を返す。 */
export function saveSong(notes: string[]): SavedSong[] {
  const next = addSong(loadSongs(), notes, newId(), Date.now())
  localStorage.setItem(KEY, JSON.stringify(next))
  return next
}
