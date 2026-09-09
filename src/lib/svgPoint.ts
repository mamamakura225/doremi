// クライアント座標 → SVG ユーザー座標の変換（自前D&Dのポインタ位置に使う）。
// 行列演算を純関数に切り出してあるのは、jsdom が SVGSVGElement.createSVGPoint /
// getScreenCTM を持たず、Board のポインタ経路テストがこの変換を検査できないため（#70）。

/** 2D アフィン変換行列（DOMMatrix の a..f と同じ並び）。 */
export interface Matrix2D {
  a: number
  b: number
  c: number
  d: number
  e: number
  f: number
}

/** 点 (x, y) に行列 m を適用する。`SVGPoint.matrixTransform` と同じ式。 */
export function applyMatrix(m: Matrix2D, x: number, y: number): { x: number; y: number } {
  return { x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f }
}

/**
 * クライアント座標を SVG のユーザー座標へ変換する。
 * CTM がまだ無い（レイアウト前）なら null。
 */
export function clientToSvgPoint(
  svg: Pick<SVGSVGElement, 'getScreenCTM'>,
  clientX: number,
  clientY: number,
): { x: number; y: number } | null {
  const ctm = svg.getScreenCTM()
  if (!ctm) return null
  return applyMatrix(ctm.inverse(), clientX, clientY)
}
