import { describe, expect, it } from 'vitest'
import { playbackSchedule } from './playback'

describe('playbackSchedule', () => {
  it('1ページの音符を等間隔で生成する', () => {
    const { ticks, endAt } = playbackSchedule([3], 500)
    expect(ticks).toEqual([
      { page: 0, index: 0, at: 0 },
      { page: 0, index: 1, at: 500 },
      { page: 0, index: 2, at: 1000 },
    ])
    expect(endAt).toBe(1500)
  })

  it('ページ境界に1ステップ分の小休符を挟む', () => {
    const { ticks, endAt } = playbackSchedule([2, 2], 500)
    expect(ticks).toEqual([
      { page: 0, index: 0, at: 0 },
      { page: 0, index: 1, at: 500 },
      // slot2 は休符（1500ではなく2000から次ページ）
      { page: 1, index: 0, at: 1500 },
      { page: 1, index: 1, at: 2000 },
    ])
    expect(endAt).toBe(2500)
  })

  it('空ページは飛ばし、余分な休符も作らない', () => {
    const { ticks, endAt } = playbackSchedule([0, 2], 500)
    expect(ticks).toEqual([
      { page: 1, index: 0, at: 0 },
      { page: 1, index: 1, at: 500 },
    ])
    expect(endAt).toBe(1000)
  })

  it('全ページ空なら空・終了即時', () => {
    const { ticks, endAt } = playbackSchedule([0, 0], 500)
    expect(ticks).toHaveLength(0)
    expect(endAt).toBe(0)
  })
})
