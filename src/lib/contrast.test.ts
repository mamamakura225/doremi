import { describe, expect, it } from 'vitest'
import { contrastRatio, relativeLuminance } from './contrast'

describe('relativeLuminance', () => {
  it('黒は0・白は1', () => {
    expect(relativeLuminance('#000000')).toBe(0)
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 5)
  })

  it('暗い色（線形化の下側分岐）も算出できる', () => {
    // 各チャンネル 0x05/255 ≈ 0.0196 < 0.03928 → c/12.92 の枝
    expect(relativeLuminance('#050505')).toBeCloseTo(0.0196 / 12.92, 4)
  })

  it('大文字/小文字の16進を受け付ける', () => {
    expect(relativeLuminance('#FACC15')).toBeCloseTo(relativeLuminance('#facc15'), 10)
  })

  it('ミ黄の相対輝度は約0.636（issue #61 の実測）', () => {
    expect(relativeLuminance('#facc15')).toBeCloseTo(0.636, 2)
  })

  it('#rrggbb 以外は例外', () => {
    expect(() => relativeLuminance('facc15')).toThrow()
    expect(() => relativeLuminance('#fff')).toThrow()
  })
})

describe('contrastRatio', () => {
  it('白と黒は21:1', () => {
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 4)
  })

  it('同じ色どうしは1:1', () => {
    expect(contrastRatio('#38bdf8', '#38bdf8')).toBeCloseTo(1, 10)
  })

  it('引数の順序を問わない', () => {
    expect(contrastRatio('#5b524b', '#fdf6e3')).toBeCloseTo(
      contrastRatio('#fdf6e3', '#5b524b'),
      10,
    )
  })

  it('ミ黄はクリーム地に対して 3:1 未満（パレット単体では見えない・#61）', () => {
    expect(contrastRatio('#facc15', '#fdf6e3')).toBeLessThan(2)
  })
})
