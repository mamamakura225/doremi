// 色のコントラスト比（WCAG 相対輝度）。純ロジック・Vitest対象。
// 符頭・ラベルの輪郭色が背景から十分に浮くことを数値で固定するために使う（#61）。

/** '#rrggbb' → [r, g, b]（各 0..255） */
function parseHex(hex: string): [number, number, number] {
  const m = /^#([0-9a-fA-F]{6})$/.exec(hex)
  if (!m) throw new Error(`#rrggbb 形式の色が必要: ${hex}`)
  const n = Number.parseInt(m[1], 16)
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]
}

/** sRGB 1チャンネル（0..1）を線形化 */
function linearize(c: number): number {
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

/** WCAG 相対輝度（0=黒, 1=白） */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = parseHex(hex).map((v) => linearize(v / 255))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** 2色のコントラスト比（1..21）。引数の順序は問わない。 */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  const hi = Math.max(la, lb)
  const lo = Math.min(la, lb)
  return (hi + 0.05) / (lo + 0.05)
}
