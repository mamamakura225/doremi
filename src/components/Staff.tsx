import { MIDDLE_C, pitchToY, type StaffLayout } from '../lib/pitch'

// SVGビューボックス座標系（横向き前提）。
const VIEW_W = 1000
const VIEW_H = 500
const LAYOUT: StaffLayout = { topLineY: 140, staffSpace: 50 }
const STAFF_LEFT = 60
const STAFF_RIGHT = VIEW_W - 40
// 音符を置く領域（お道具箱は #2 で右側に追加するため、ここでは描画のみ）
const PLACE_LEFT = 180
const PLACE_RIGHT = STAFF_RIGHT - 40

export const STAFF_LAYOUT = LAYOUT

/** 五線・ト音記号・ド足場ガイドを描く五線譜（音符配置は #2 以降） */
export default function Staff() {
  const lineYs = [0, 1, 2, 3, 4].map((i) => LAYOUT.topLineY + i * LAYOUT.staffSpace)
  const cY = pitchToY(MIDDLE_C, LAYOUT) // ド（下加線）のY

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="xMidYMid meet"
      className="h-full w-full"
      role="img"
      aria-label="五線譜"
    >
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

      {/* ト音記号（5歳児にはシンボルとして提示） */}
      <text
        x={STAFF_LEFT + 8}
        y={lineYs[4] + 18}
        fontSize={300}
        fill="#5b524b"
        style={{ fontFamily: 'serif' }}
      >
        𝄞
      </text>

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
    </svg>
  )
}
