import {
  PLACE_LEFT,
  PLACE_RIGHT,
  STAFF_LAYOUT,
  STAFF_LEFT,
  STAFF_RIGHT,
} from '../lib/layout'
import { MIDDLE_C, TREBLE_PITCHES, pitchToY } from '../lib/pitch'
import { colorOf } from '../lib/colors'
import TrebleClef from './TrebleClef'

// ドレミラベルの縦列X（ト音記号 右端≈189 と 第1音符 左端≈219.8 の隙間）
const LABEL_X = 200
const steps = TREBLE_PITCHES.map((p) => p.step)
const MIN_STEP = Math.min(...steps)
const MAX_STEP = Math.max(...steps)
// 低い音(step大)ほど大きく、高い音(step小)ほど小さく＝オクターブ混乱を緩和
function labelSize(step: number): number {
  return 18 + (6 * (step - MIN_STEP)) / (MAX_STEP - MIN_STEP)
}

/** 五線・ト音記号・ド足場ガイド・ドレミラベルを描く（SVG内の <g>） */
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

      {/* 常時ドレミラベル: 各音の高さに音名を薄く色付きで（置く前の手がかり） */}
      <g aria-hidden="true">
        {TREBLE_PITCHES.map((p) => (
          <text
            key={p.note}
            x={LABEL_X}
            y={pitchToY(p, STAFF_LAYOUT)}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={labelSize(p.step)}
            fontWeight="bold"
            fill={colorOf(p)}
            opacity={0.5}
          >
            {p.solfa}
          </text>
        ))}
      </g>

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
