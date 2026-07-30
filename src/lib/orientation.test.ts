import { describe, expect, it } from 'vitest'
import { SHORT_SCREEN_H, isPortrait, isShortScreen } from './orientation'

describe('isPortrait', () => {
  it('縦長で true', () => {
    expect(isPortrait(400, 800)).toBe(true)
  })
  it('横長で false', () => {
    expect(isPortrait(800, 400)).toBe(false)
  })
  it('正方形は横扱い（false）', () => {
    expect(isPortrait(500, 500)).toBe(false)
  })
})

describe('isShortScreen', () => {
  it('横向きスマホ（375〜430）は短い扱い', () => {
    expect(isShortScreen(375)).toBe(true) // iPhone 横
    expect(isShortScreen(430)).toBe(true)
  })

  it('タブレット横（768）は短くない', () => {
    expect(isShortScreen(768)).toBe(false)
  })

  it('しきい値ちょうどは短くない', () => {
    expect(isShortScreen(SHORT_SCREEN_H)).toBe(false)
    expect(isShortScreen(SHORT_SCREEN_H - 1)).toBe(true)
  })
})
