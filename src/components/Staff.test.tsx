import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { STAFF_LAYOUT } from '../lib/layout'
import { type Clef } from '../lib/pitch'
import Staff from './Staff'

/** 色文字（輪郭つき）のラベルだけを拾う。下敷きの紙色の縁は除く */
function labels(clef: Clef) {
  const { container } = render(
    <svg>
      <Staff clef={clef} />
    </svg>,
  )
  return [...container.querySelectorAll('text[stroke="#5b524b"]')].map((t) => ({
    x: Number(t.getAttribute('x')),
    y: Number(t.getAttribute('y')),
    size: Number(t.getAttribute('font-size')),
  }))
}

describe('ドレミラベル（#140）', () => {
  it.each<Clef>(['treble', 'bass'])('%s: 同じ列の隣とは1間ぶん離れ、文字が接しない', (clef) => {
    const ls = labels(clef)
    expect(ls).toHaveLength(10)
    const xs = [...new Set(ls.map((l) => l.x))]
    expect(xs).toHaveLength(2)
    for (const col of xs.map((x) => ls.filter((l) => l.x === x))) {
      const ys = col.map((l) => l.y).sort((a, b) => a - b)
      for (let i = 1; i < ys.length; i++) {
        expect(ys[i] - ys[i - 1]).toBe(STAFF_LAYOUT.staffSpace)
      }
      // 文字の高さが列の間隔を超えない
      expect(Math.max(...col.map((l) => l.size))).toBeLessThan(STAFF_LAYOUT.staffSpace)
    }
  })
})
