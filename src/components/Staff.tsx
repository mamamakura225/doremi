import {
  PLACE_LEFT,
  PLACE_RIGHT,
  STAFF_LAYOUT,
  STAFF_LEFT,
  STAFF_RIGHT,
} from '../lib/layout'
import { pitchToY, pitchesOf, tonicOf, type Clef } from '../lib/pitch'
import { colorOf } from '../lib/colors'
import BassClef from './BassClef'
import TrebleClef from './TrebleClef'

// ドレミラベルの縦列X（音部記号 右端≈189 と 第1音符 左端≈219.8 の隙間）
const LABEL_X = 200

// 低い音(step大)ほど大きく、高い音(step小)ほど小さく＝オクターブ混乱を緩和
function labelSize(step: number, minStep: number, maxStep: number): number {
  return 18 + (6 * (step - minStep)) / (maxStep - minStep)
}

interface Props {
  clef: Clef
}

/** 五線・音部記号・ド足場ガイド・ドレミラベルを描く（SVG内の <g>） */
export default function Staff({ clef }: Props) {
  const lineYs = [0, 1, 2, 3, 4].map(
    (i) => STAFF_LAYOUT.topLineY + i * STAFF_LAYOUT.staffSpace,
  )
  const pitches = pitchesOf(clef)
  const steps = pitches.map((p) => p.step)
  const minStep = Math.min(...steps)
  const maxStep = Math.max(...steps)
  const cY = pitchToY(tonicOf(clef), STAFF_LAYOUT) // ドのY

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

      {/* 音部記号（ト音は正確なSVGパス・渦巻き中心をG4線に整列） */}
      {clef === 'treble' ? (
        <TrebleClef x={STAFF_LEFT + 8} />
      ) : (
        <BassClef x={STAFF_LEFT + 24} />
      )}

      {/* 常時ドレミラベル: 各音の高さに音名を薄く色付きで（置く前の手がかり） */}
      <g aria-hidden="true">
        {pitches.map((p) => (
          <text
            key={p.note}
            x={LABEL_X}
            y={pitchToY(p, STAFF_LAYOUT)}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={labelSize(p.step, minStep, maxStep)}
            fontWeight="bold"
            fill={colorOf(p)}
            opacity={0.5}
          >
            {p.solfa}
          </text>
        ))}
      </g>

      {/* ド足場ガイド: ドの高さに半透明の足場（ここに置けるよ）。
          ト音では五線の外（下加線）、ヘ音では五線の中の間にあたる。 */}
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
