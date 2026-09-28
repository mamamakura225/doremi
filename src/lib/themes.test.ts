import { afterEach, describe, expect, it, vi } from 'vitest'
import { SOLFA_COLOR } from './colors'
import { THEMES, isUnlocked, loadTheme, saveTheme, themeOf } from './themes'

describe('背景の着せ替え（#111）', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('はらっぱは最初から、ほかはシールの枚数で解放（11枚のうちに全部）', () => {
    expect(THEMES[0].id).toBe('meadow')
    expect(THEMES[0].need).toBe(0)
    const needs = THEMES.map((t) => t.need)
    expect([...needs].sort((a, b) => a - b)).toEqual(needs) // 並びは解放の順
    expect(Math.max(...needs)).toBeLessThanOrEqual(11)
    expect(isUnlocked(themeOf('sakura'), 2)).toBe(false)
    expect(isUnlocked(themeOf('sakura'), 3)).toBe(true)
  })

  it('テーマの色に7色（音の高さの色）は使わない', () => {
    const seven = new Set(Object.values(SOLFA_COLOR))
    for (const t of THEMES) for (const c of [...t.sky, ...t.hills]) expect(seven.has(c)).toBe(false)
  })

  it('選んだテーマを覚える。まだ解放されていない・知らない・読めないなら はらっぱ', () => {
    saveTheme('snow')
    expect(loadTheme(6)).toBe('snow')
    expect(loadTheme(5)).toBe('meadow') // シールが足りない（保存データの書き換えなど）
    localStorage.setItem('doremi.theme.v1', 'lava')
    expect(loadTheme(99)).toBe('meadow')
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })
    expect(loadTheme(99)).toBe('meadow')
  })
})
