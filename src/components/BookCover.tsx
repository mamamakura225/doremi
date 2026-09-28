import { OUTLINE_COLOR, PAPER } from '../lib/colors'
import { COVER_H, COVER_W, coverOf } from '../lib/cover'
import type { Clef } from '../lib/pitch'

/**
 * 保存した曲の本の表紙（#109）。曲の音の高さを山並みの折れ線にし、頂点に音の色の粒を置く。
 * 同じ曲なら同じ表紙（coverOf が決める）。3:4 の座標のまま描くので、線や粒はゆがまない。
 */
export default function BookCover({
  pages,
  clef,
  width = '100%',
}: {
  pages: string[][]
  clef: Clef
  width?: number | string
}) {
  const { bg, peaks } = coverOf(pages, clef)
  const ridge = peaks.map((p) => `${p.x},${p.y}`)
  // 山並みの下を塗る（折れ線の端から表紙の下まで）
  const fill =
    peaks.length > 1
      ? `M${peaks[0].x},${COVER_H} L${ridge.join(' L')} L${peaks[peaks.length - 1].x},${COVER_H} Z`
      : ''
  return (
    <svg viewBox={`0 0 ${COVER_W} ${COVER_H}`} width={width} aria-hidden="true" focusable="false">
      <rect x={1.5} y={1.5} width={COVER_W - 3} height={COVER_H - 3} rx={5} fill={bg} stroke={OUTLINE_COLOR} strokeWidth={2.5} />
      {fill && <path d={fill} fill={PAPER} opacity={0.6} />}
      {peaks.length > 1 && (
        <polyline points={ridge.join(' ')} fill="none" stroke={OUTLINE_COLOR} strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" />
      )}
      {peaks.map((p, i) => (
        <ellipse key={i} cx={p.x} cy={p.y} rx={p.rx} ry={p.ry} fill={p.color} stroke={OUTLINE_COLOR} strokeWidth={1.1} />
      ))}
      {/* 背表紙の帯 */}
      <rect x={1.5} y={1.5} width={7} height={COVER_H - 3} rx={3.5} fill={OUTLINE_COLOR} opacity={0.18} />
    </svg>
  )
}
