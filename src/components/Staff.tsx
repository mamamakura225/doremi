import {
  PLACE_LEFT,
  PLACE_RIGHT,
  STAFF_LAYOUT,
  STAFF_LEFT,
  STAFF_RIGHT,
} from '../lib/layout'
import { MIDDLE_C, pitchToY } from '../lib/pitch'
import TrebleClef from './TrebleClef'

/** 五線・ト音記号・ド足場ガイドを描く（SVG内の <g>） */
export default function Staff() {
  const lineYs = [0, 1, 2, 3, 4].map(
    (i) => STAFF_LAYOUT.topLineY + i * STAFF_LAYOUT.staffSpace,
  )
  const cY = pitchToY(MIDDLE_C, STAFF_LAYOUT) // ド（下加線）のY

  return (
    <g>
      {/* 五線 */}
      {lineYs.map((y) => (
        <line
          key={y}
          x1={STAFF_LEFT}
          y1={y}
          x2={STAFF_RIGHT}
          y2={y}
          stroke="#5b524b"
          strokeWidth={3}
          strokeLinecap="round"
        />
      ))}

      {/* ト音記号（正確なSVGパス・渦巻き中心をG4線に整列） */}
      <TrebleClef x={STAFF_LEFT + 8} />

      {/* ド足場ガイド: 下加線位置に半透明の足場（ここに置けるよ） */}
      <g aria-hidden="true">
        <line
          x1={PLACE_LEFT}
          y1={cY}
          x2={PLACE_RIGHT}
          y2={cY}
          stroke="#e23b3b"
          strokeWidth={2}
          strokeDasharray="6 10"
          opacity={0.45}
        />
        <ellipse
          cx={PLACE_LEFT + 24}
          cy={cY}
          rx={26}
          ry={18}
          fill="#e23b3b"
          opacity={0.18}
        />
      </g>
    </g>
  )
}
