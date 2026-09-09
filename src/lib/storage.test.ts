import { afterEach, describe, expect, it, vi } from 'vitest'
import { SHELF_MAX, addSong, loadSongs, parseSongs, saveSong, type SavedSong } from './storage'

function song(over: Partial<SavedSong> = {}): SavedSong {
  return { id: 'a', createdAt: 1, pages: [['C4']], clef: 'treble', ...over }
}

describe('parseSongs', () => {
  it('null/壊れた文字列は空配列', () => {
    expect(parseSongs(null)).toEqual([])
    expect(parseSongs('not json')).toEqual([])
    expect(parseSongs('{}')).toEqual([])
  })

  it('v2形式(pages)を通す（不正要素は除外）', () => {
    const raw = JSON.stringify([
      { id: 'a', createdAt: 1, pages: [['C4', 'G4'], ['E4']] },
      { id: 'b', createdAt: 2, pages: [[1, 2]] }, // pages の中身が数値→除外
      { id: 'c', pages: [['C4']] }, // createdAt 欠落→除外
    ])
    expect(parseSongs(raw)).toEqual([
      { id: 'a', createdAt: 1, pages: [['C4', 'G4'], ['E4']], clef: 'treble' },
    ])
  })

  it('v1形式(notes)は1ページの曲として読む（後方互換）', () => {
    const raw = JSON.stringify([{ id: 'old', createdAt: 1, notes: ['C4', 'G4'] }])
    expect(parseSongs(raw)).toEqual([
      { id: 'old', createdAt: 1, pages: [['C4', 'G4']], clef: 'treble' },
    ])
  })

  it('音部記号を持たない旧データは ト音 として読む', () => {
    const raw = JSON.stringify([{ id: 'a', createdAt: 1, pages: [['C4']] }])
    expect(parseSongs(raw)[0].clef).toBe('treble')
  })

  it('ヘ音で保存された曲は ヘ音 のまま読む', () => {
    const raw = JSON.stringify([
      { id: 'a', createdAt: 1, pages: [['C3']], clef: 'bass' },
      { id: 'b', createdAt: 2, pages: [['C4']], clef: 'nonsense' }, // 未知の値は ト音 に倒す
    ])
    expect(parseSongs(raw).map((s) => s.clef)).toEqual(['bass', 'treble'])
  })
})

describe('addSong', () => {
  it('新しい曲を先頭に積む', () => {
    const base: SavedSong[] = [song({ id: 'old' })]
    const out = addSong(base, [['G4']], 'new', 2, 'treble')
    expect(out[0]).toEqual({ id: 'new', createdAt: 2, pages: [['G4']], clef: 'treble' })
    expect(out).toHaveLength(2)
  })

  it('保存時の音部記号を記録する', () => {
    const out = addSong([], [['C3']], 'b', 2, 'bass')
    expect(out[0].clef).toBe('bass')
  })

  it('上限を超えたら古いものから落ちる', () => {
    let songs: SavedSong[] = []
    for (let i = 0; i < SHELF_MAX + 3; i++) songs = addSong(songs, [['C4']], `s${i}`, i, 'treble')
    expect(songs).toHaveLength(SHELF_MAX)
    expect(songs[0].id).toBe(`s${SHELF_MAX + 2}`) // 最新が先頭
    expect(songs.some((s) => s.id === 's0')).toBe(false) // 最古は落ちている
  })

  it('元配列を破壊しない', () => {
    const base: SavedSong[] = [song()]
    addSong(base, [['G4']], 'b', 2, 'treble')
    expect(base).toHaveLength(1)
  })
})

describe('loadSongs / saveSong の I/O', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('localStorage が例外を投げても loadSongs は空配列（白画面にしない）', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError')
    })
    expect(loadSongs()).toEqual([])
  })

  it('setItem が例外を投げても saveSong は投げず、更新後の一覧を返す', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError')
    })
    const out = saveSong([['C4']], 'treble')
    expect(out).toHaveLength(1)
    expect(out[0].pages).toEqual([['C4']])
  })

  it('saveSong → loadSongs の往復で clef と pages が保たれる', () => {
    saveSong([['C3', 'D3']], 'bass')
    const loaded = loadSongs()
    expect(loaded).toHaveLength(1)
    expect(loaded[0].clef).toBe('bass')
    expect(loaded[0].pages).toEqual([['C3', 'D3']])
  })

  it('既存データは "doremi.songs.v1" キーから読む（KEY 変更で全曲消える・#69）', () => {
    // 往復テストは KEY を書き読みとも同じ定数で使うため、キー名の変更を検知できない。
    // リテラルのキーに直接書いて、loadSongs がそこを見ていることを固定する。
    localStorage.setItem(
      'doremi.songs.v1',
      JSON.stringify([{ id: 'x', createdAt: 1, pages: [['C4']], clef: 'treble' }]),
    )
    expect(loadSongs().map((s) => s.id)).toEqual(['x'])
  })

  it('crypto.randomUUID が無くても id は非空の文字列になる', () => {
    vi.stubGlobal('crypto', {})
    try {
      expect(saveSong([['C4']], 'treble')[0].id).toMatch(/\S/)
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
