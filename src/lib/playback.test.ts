import { describe, expect, it } from 'vitest'
import { playbackSchedule } from './playback'

describe('playbackSchedule', () => {
  it('音符数ぶんのtickを等間隔で生成する', () => {
    const { ticks, endAt } = playbackSchedule(3, 500)
    expect(ticks).toEqual([
      { index: 0, at: 0 },
      { index: 1, at: 500 },
      { index: 2, at: 1000 },
    ])
    expect(endAt).toBe(1500)
  })

  it('0音なら空・終了即時', () => {
    const { ticks, endAt } = playbackSchedule(0, 500)
    expect(ticks).toHaveLength(0)
    expect(endAt).toBe(0)
  })
})
