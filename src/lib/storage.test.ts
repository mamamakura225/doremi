import { describe, expect, it } from 'vitest'
import { SHELF_MAX, addSong, parseSongs, type SavedSong } from './storage'

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
      { id: 'a', createdAt: 1, pages: [['C4', 'G4'], ['E4']] },
    ])
  })

  it('v1形式(notes)は1ページの曲として読む（後方互換）', () => {
    const raw = JSON.stringify([{ id: 'old', createdAt: 1, notes: ['C4', 'G4'] }])
    expect(parseSongs(raw)).toEqual([
      { id: 'old', createdAt: 1, pages: [['C4', 'G4']] },
    ])
  })
})

describe('addSong', () => {
  it('新しい曲を先頭に積む', () => {
    const base: SavedSong[] = [{ id: 'old', createdAt: 1, pages: [['C4']] }]
    const out = addSong(base, [['G4']], 'new', 2)
    expect(out[0]).toEqual({ id: 'new', createdAt: 2, pages: [['G4']] })
    expect(out).toHaveLength(2)
  })

  it('上限を超えたら古いものから落ちる', () => {
    let songs: SavedSong[] = []
    for (let i = 0; i < SHELF_MAX + 3; i++) songs = addSong(songs, [['C4']], `s${i}`, i)
    expect(songs).toHaveLength(SHELF_MAX)
    expect(songs[0].id).toBe(`s${SHELF_MAX + 2}`) // 最新が先頭
    expect(songs.some((s) => s.id === 's0')).toBe(false) // 最古は落ちている
  })

  it('元配列を破壊しない', () => {
    const base: SavedSong[] = [{ id: 'a', createdAt: 1, pages: [['C4']] }]
    addSong(base, [['G4']], 'b', 2)
    expect(base).toHaveLength(1)
  })
})
