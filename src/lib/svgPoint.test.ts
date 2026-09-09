import { describe, expect, it } from 'vitest'
import { applyMatrix, clientToSvgPoint } from './svgPoint'

describe('applyMatrix', () => {
  const I = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }

  it('恒等行列は座標を変えない', () => {
    expect(applyMatrix(I, 12, 34)).toEqual({ x: 12, y: 34 })
  })

  it('拡大＋平行移動（preserveAspectRatio meet 相当）', () => {
    // 0.5倍して (100, 40) 平行移動
    const m = { a: 0.5, b: 0, c: 0, d: 0.5, e: 100, f: 40 }
    expect(applyMatrix(m, 20, 20)).toEqual({ x: 110, y: 50 })
  })

  it('剪断成分（b, c）も式に入る——matrixTransform と同じ', () => {
    const m = { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6 }
    expect(applyMatrix(m, 10, 100)).toEqual({
      x: 1 * 10 + 3 * 100 + 5,
      y: 2 * 10 + 4 * 100 + 6,
    })
  })
})

describe('clientToSvgPoint', () => {
  it('CTM がまだ無ければ null（レイアウト前）', () => {
    expect(clientToSvgPoint({ getScreenCTM: () => null }, 5, 5)).toBeNull()
  })

  it('CTM の逆行列を client 座標に適用する', () => {
    const svg = {
      getScreenCTM: () => ({
        inverse: () => ({ a: 2, b: 0, c: 0, d: 2, e: 0, f: 0 }),
      }),
    } as unknown as Parameters<typeof clientToSvgPoint>[0]
    expect(clientToSvgPoint(svg, 3, 4)).toEqual({ x: 6, y: 8 })
  })
})
