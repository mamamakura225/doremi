import { describe, expect, it } from 'vitest'
import { isPortrait } from './orientation'

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
