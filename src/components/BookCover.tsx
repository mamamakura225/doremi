import { OUTLINE_COLOR } from '../lib/colors'
import { coverOf } from '../lib/cover'
import type { Clef } from '../lib/pitch'

/**
 * 保存した曲の本の表紙（#109）。曲の音の高さを山並みの折れ線にし、頂点に音の色の粒を置く。
 * 同じ曲なら同じ表紙（coverOf が決める）。表紙は 100×100 の座標に、左に背表紙の帯。
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
  const ridge = peaks.map((p) => `${p.x},${p.y}`).join(' ')
  // 山並みの下を塗る（折れ線の端から表紙の下まで）
  const fill =
    peaks.length > 0
      ? `M${peaks[0].x},100 L${ridge.split(' ').join(' L')} L${peaks[peaks.length - 1].x},100 Z`
      : ''
  return (
    <svg viewBox="0 0 100 100" width={width} aria-hidden="true" focusable="false" style={{ aspectRatio: '3 / 4' }} preserveAspectRatio="none">
      <rect x={1.5} y={1.5} width={97} height={97} rx={6} fill={bg} stroke={OUTLINE_COLOR} strokeWidth={2.5} />
      {fill && <path d={fill} fill="#fffdf5" opacity={0.6} />}
      {peaks.length > 1 && (
        <polyline points={ridge} fill="none" stroke={OUTLINE_COLOR} strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />
      )}
      {peaks.map((p, i) => (
        <ellipse
          key={i}
          cx={p.x}
          cy={p.y}
          rx={p.long ? 6.5 : 4.2}
          ry={3.4}
          fill={p.color}
          stroke={OUTLINE_COLOR}
          strokeWidth={1.4}
        />
      ))}
      {/* 背表紙の帯 */}
      <rect x={1.5} y={1.5} width={9} height={97} rx={4} fill="#5b524b" opacity={0.18} />
    </svg>
  )
}
