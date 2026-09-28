import { describe, expect, it } from 'vitest'
import { COVER_BG, coverOf } from './cover'
import { PREVIEW_UNKNOWN } from './preview'

describe('ほんだなの表紙（#109）', () => {
  it('同じ曲なら同じ表紙（何度作っても）', () => {
    const a = coverOf([['C4', 'G4~'], ['E4']], 'treble')
    const b = coverOf([['C4', 'G4~'], ['E4']], 'treble')
    expect(b).toEqual(a)
  })

  it('地の色は淡色の中から選ばれ、曲が違えば変わりうる', () => {
    const bgs = new Set(
      [['C4'], ['D4'], ['E4'], ['F4'], ['G4'], ['A4'], ['B4'], ['C5']].map(
        (p) => coverOf([p], 'treble').bg,
      ),
    )
    for (const bg of bgs) expect(COVER_BG).toContain(bg)
    expect(bgs.size).toBeGreaterThan(1)
  })

  it('山並みは音の高さの折れ線（高い音ほど上）・色とのばす音を持つ', () => {
    const { peaks } = coverOf([['C4', 'G4', 'E5~']], 'treble')
    expect(peaks.map((p) => p.x)).toEqual([12, 39, 66]) // 表紙（幅75）の 16%〜88%
    expect(peaks[0].y).toBeGreaterThan(peaks[1].y) // ド は ソ より下
    expect(peaks[1].y).toBeGreaterThan(peaks[2].y) // ソ は 高いミ より下
    expect(peaks[0].color).toBe('#e23b3b')
    expect(peaks[2].long).toBe(true)
  })

  it('音域外（壊れた保存データ）でも落ちずに灰色で真ん中の高さ', () => {
    const { peaks } = coverOf([['Z9']], 'treble')
    expect(peaks).toMatchObject([{ x: 37.5, y: 50, color: PREVIEW_UNKNOWN, long: false }])
  })

  it('ヘ音の曲もヘ音の高さで描く', () => {
    const { peaks } = coverOf([['C3', 'A3']], 'bass')
    expect(peaks[0].y).toBeGreaterThan(peaks[1].y)
  })

  it('音が多い曲でも、粒どうしが重ならない（何ページもの長い曲）', () => {
    const many = Array.from({ length: 5 }, () => ['C4', 'D4~', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5'])
    const { peaks } = coverOf(many, 'treble')
    expect(peaks).toHaveLength(50)
    for (let i = 1; i < peaks.length; i++) {
      const gap = peaks[i].x - peaks[i - 1].x
      expect(peaks[i - 1].rx + peaks[i].rx).toBeLessThanOrEqual(gap)
    }
  })

  it('地の色に黄色は使わない（ミの粒が見えにくくなる）', () => {
    expect(COVER_BG).not.toContain('#fff3b0')
  })
})
