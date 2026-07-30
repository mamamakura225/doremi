import { STAFF_LAYOUT } from '../lib/layout'

interface Props {
  /** 記号の左端X（渦の始点） */
  x: number
  /** 五線の最上線Y */
  topLineY?: number
  /** 1スペースの高さ */
  staffSpace?: number
}

/**
 * ヘ音記号を描く（SVG内の <g>）。
 * ト音記号のような外部パスは使わず、円と1本のカーブで組む
 * （形の要点は「F線から始まる渦」と「F線を挟む2つの点」の2つだけ）。
 */
export default function BassClef({
  x,
  topLineY = STAFF_LAYOUT.topLineY,
  staffSpace = STAFF_LAYOUT.staffSpace,
}: Props) {
  const s = staffSpace
  // ヘ音記号の基準はF線＝上から2本目（step 2）
  const fY = topLineY + s
  const color = '#5b524b'
  return (
    <g transform={`translate(${x} ${fY})`} aria-hidden="true">
      <circle cx={0} cy={0} r={0.26 * s} fill={color} />
      <path
        d={`M 0 ${-0.12 * s}
            C ${0.35 * s} ${-0.6 * s}, ${1.0 * s} ${-0.35 * s}, ${0.95 * s} ${0.15 * s}
            C ${0.9 * s} ${0.75 * s}, ${0.35 * s} ${1.3 * s}, ${-0.45 * s} ${1.85 * s}`}
        fill="none"
        stroke={color}
        strokeWidth={0.19 * s}
        strokeLinecap="round"
      />
      {/* F線を上下から挟む2点 */}
      <circle cx={1.25 * s} cy={-0.5 * s} r={0.1 * s} fill={color} />
      <circle cx={1.25 * s} cy={0.5 * s} r={0.1 * s} fill={color} />
    </g>
  )
}
