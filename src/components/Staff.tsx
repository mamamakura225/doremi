import {
  PLACE_LEFT,
  PLACE_RIGHT,
  STAFF_LAYOUT,
  STAFF_LEFT,
  STAFF_RIGHT,
} from '../lib/layout'
import { pitchToY, pitchesOf, tonicOf, type Clef } from '../lib/pitch'
import { OUTLINE_COLOR, PAPER, colorOf } from '../lib/colors'
import BassClef from './BassClef'
import TrebleClef from './TrebleClef'

// ドレミラベルの2列のX。線の音は左・間の音は右に振り分け、同じ列の隣を 1間（50）離す
// （1列に詰めると 25 間隔で文字が接し、横向きスマホで読めなかった・#140）。
// 左列はト音記号の右端（≈166）の右、右列の右端は第1列の符頭の左端（≈226）の手前
const LABEL_X_LINE = 180
const LABEL_X_SPACE = 206

// 低い音(step大)ほど大きく、高い音(step小)ほど小さく＝オクターブ混乱を緩和
function labelSize(step: number, minStep: number, maxStep: number): number {
  return 28 + (4 * (step - minStep)) / (maxStep - minStep)
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
        <TrebleClef x={STAFF_LEFT + 2} height={STAFF_LAYOUT.staffSpace * 5.6} />
      ) : (
        <BassClef x={STAFF_LEFT + 24} />
      )}

      {/* 常時ドレミラベル: 各音の高さに音名を色付きで（置く前の手がかり）。
          紙の色の太い縁で五線を抜いてから、輪郭つきの色文字を重ねる */}
      <g aria-hidden="true">
        {pitches.map((p) => {
          const props = {
            x: p.step % 2 === 0 ? LABEL_X_LINE : LABEL_X_SPACE,
            y: pitchToY(p, STAFF_LAYOUT),
            textAnchor: 'middle',
            dominantBaseline: 'middle',
            fontSize: labelSize(p.step, minStep, maxStep),
            fontWeight: 900,
            // 2文字の「ファ」も1文字ぶんの幅に収める（隣の列・符頭にかからない）
            ...(p.solfa.length > 1 ? { textLength: 30, lengthAdjust: 'spacingAndGlyphs' } : {}),
          } as const
          return (
            <g key={p.note}>
              <text {...props} fill={PAPER} stroke={PAPER} strokeWidth={7} strokeLinejoin="round">
                {p.solfa}
              </text>
              <text {...props} fill={colorOf(p)} stroke={OUTLINE_COLOR} strokeWidth={1.4} paintOrder="stroke">
                {p.solfa}
              </text>
            </g>
          )
        })}
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
