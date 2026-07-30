import { describe, expect, it } from 'vitest'
import { noteDuration, playbackSchedule } from './playback'

describe('playbackSchedule', () => {
  it('1ページの音符を等間隔で生成する', () => {
    const { ticks, endAt } = playbackSchedule([[1, 1, 1]], 500)
    expect(ticks).toEqual([
      { page: 0, index: 0, at: 0, steps: 1 },
      { page: 0, index: 1, at: 500, steps: 1 },
      { page: 0, index: 2, at: 1000, steps: 1 },
    ])
    expect(endAt).toBe(1500)
  })

  it('のばす音は2ステップ分の場所を取り、次の音がその分だけ遅れる', () => {
    const { ticks, endAt } = playbackSchedule([[2, 1]], 500)
    expect(ticks).toEqual([
      { page: 0, index: 0, at: 0, steps: 2 },
      { page: 0, index: 1, at: 1000, steps: 1 },
    ])
    expect(endAt).toBe(1500)
  })

  it('ページ境界に1ステップ分の小休符を挟む', () => {
    const { ticks, endAt } = playbackSchedule([[1, 1], [1, 1]], 500)
    expect(ticks).toEqual([
      { page: 0, index: 0, at: 0, steps: 1 },
      { page: 0, index: 1, at: 500, steps: 1 },
      // slot2 は休符（1500ではなく2000から次ページ）
      { page: 1, index: 0, at: 1500, steps: 1 },
      { page: 1, index: 1, at: 2000, steps: 1 },
    ])
    expect(endAt).toBe(2500)
  })

  it('空ページは飛ばし、余分な休符も作らない', () => {
    const { ticks, endAt } = playbackSchedule([[], [1, 1]], 500)
    expect(ticks).toEqual([
      { page: 1, index: 0, at: 0, steps: 1 },
      { page: 1, index: 1, at: 500, steps: 1 },
    ])
    expect(endAt).toBe(1000)
  })

  it('全ページ空なら空・終了即時', () => {
    const { ticks, endAt } = playbackSchedule([[], []], 500)
    expect(ticks).toHaveLength(0)
    expect(endAt).toBe(0)
  })
})

describe('noteDuration', () => {
  it('ふつうの音は従来どおり短い減衰音', () => {
    expect(noteDuration(1, 500)).toBe('8n')
  })

  it('のばす音は次の音の手前まで実際に伸びる', () => {
    // 2ステップ=1000ms から間(100ms)を引いた 0.9 秒
    expect(noteDuration(2, 500)).toBeCloseTo(0.9)
  })
})
