import { describe, expect, it } from 'vitest'
import { CELEBRATION_MS, celebrationLevel, isGuideComplete } from './celebration'

describe('celebrationLevel（#103）', () => {
  it('1ページは小、複数ページは大、おてほん完成は特別', () => {
    expect(celebrationLevel({ pages: 1, guideComplete: false })).toBe('small')
    expect(celebrationLevel({ pages: 2, guideComplete: false })).toBe('big')
    expect(celebrationLevel({ pages: 1, guideComplete: true })).toBe('special')
    expect(celebrationLevel({ pages: 3, guideComplete: true })).toBe('special')
  })

  it('どの段階も 2 秒以内・強いほど長い', () => {
    expect(Math.max(...Object.values(CELEBRATION_MS))).toBeLessThanOrEqual(2000)
    expect(CELEBRATION_MS.small).toBeLessThan(CELEBRATION_MS.big)
    expect(CELEBRATION_MS.big).toBeLessThanOrEqual(CELEBRATION_MS.special)
  })
})

describe('isGuideComplete（#103）', () => {
  const twinkle = ['C4', 'C4', 'G4', 'G4', 'A4', 'A4', 'G4']
  it('お手本どおり全部置けたら完成', () => {
    expect(isGuideComplete([...twinkle], twinkle)).toBe(true)
  })
  it('足りない・違う・余分がある・お手本が空なら完成ではない', () => {
    expect(isGuideComplete(twinkle.slice(0, 6), twinkle)).toBe(false)
    expect(isGuideComplete([...twinkle.slice(0, 6), 'A4'], twinkle)).toBe(false)
    expect(isGuideComplete([...twinkle, 'C4'], twinkle)).toBe(false)
    expect(isGuideComplete([], [])).toBe(false)
  })
})
