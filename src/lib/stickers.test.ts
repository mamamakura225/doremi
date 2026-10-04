import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  STICKERS,
  award,
  hasAllColors,
  loadStickers,
  parseStickers,
  saveStickers,
} from './stickers'

describe('シール帳（#105）', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('シールは 8〜16 枚で、id が重ならない（よみとり #155 で 11→16）', () => {
    expect(STICKERS.length).toBeGreaterThanOrEqual(8)
    expect(STICKERS.length).toBeLessThanOrEqual(16)
    expect(new Set(STICKERS.map((s) => s.id)).size).toBe(STICKERS.length)
  })

  it('award は持っていなければ足し、持っていれば同じ一覧（参照）を返す', () => {
    const a = award([], 'first-note')
    expect(a).toEqual(['first-note'])
    expect(award(a, 'first-note')).toBe(a)
    expect(award(a, 'save')).toEqual(['first-note', 'save'])
  })

  it('壊れたデータ・知らない id・重複は捨てる', () => {
    expect(parseStickers(null)).toEqual([])
    expect(parseStickers('{')).toEqual([])
    expect(parseStickers('{"a":1}')).toEqual([])
    expect(parseStickers('["save", 3, "nope", "save", "bass"]')).toEqual(['save', 'bass'])
  })

  it('7色ぜんぶ入っていれば にじいろ', () => {
    expect(hasAllColors(['ド', 'レ', 'ミ', 'ファ', 'ソ', 'ラ', 'シ'])).toBe(true)
    expect(hasAllColors(['ド', 'レ', 'ミ', 'ファ', 'ソ', 'ラ', 'ド'])).toBe(false)
  })

  it('保存して読み直せる', () => {
    saveStickers(['first-note', 'save'])
    expect(loadStickers()).toEqual(['first-note', 'save'])
  })

  it('localStorage が使えなくても例外を出さない（#57 と同じ方針）', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError')
    })
    expect(loadStickers()).toEqual([])
    expect(() => saveStickers(['save'])).not.toThrow()
  })
})
