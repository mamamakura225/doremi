import {
  NOTE_HEAD_ROTATION_DEG,
  NOTE_HEAD_RX,
  NOTE_HEAD_RY,
} from '../lib/layout'
import { OUTLINE_COLOR } from '../lib/colors'

interface Props {
  x: number
  y: number
  fill?: string
  opacity?: number
  highlight?: boolean
  /** 拡大率（掴み中のゴーストで使用） */
  scale?: number
  /** 持ち上がり表現の影を付ける */
  shadow?: boolean
  /** のばす音の「のばしバー」の長さ（0＝ふつうの音） */
  tail?: number
  /** 符尾を下向き・符頭の左側に描く（第3線以上の音・#97） */
  stemDown?: boolean
}

/** 四分音符（符頭＋符幹）を描く（SVG内の <g>）。中心(x,y)基準。 */
export default function NoteHead({
  x,
  y,
  fill = '#3b3b3b',
  opacity = 1,
  highlight = false,
  scale = 1,
  shadow = false,
  tail = 0,
  stemDown = false,
}: Props) {
  return (
    <g
      transform={`translate(${x} ${y}) scale(${scale})`}
      opacity={opacity}
      filter={shadow ? 'url(#note-shadow)' : undefined}
    >
      {/* 再生ハイライトは色に依存しない輪郭リング（薄い符頭色でも「いまここ」が分かる） */}
      {highlight && (
        <circle
          cx={0}
          cy={0}
          r={30}
          fill="none"
          stroke={OUTLINE_COLOR}
          strokeWidth={4}
          opacity={0.9}
        />
      )}
      {/* のばす音は右へバーを伸ばす（音符の種類でなく「長さ」として見せる） */}
      {tail > 0 && (
        <rect
          x={0}
          y={-8}
          width={tail}
          height={16}
          rx={8}
          fill={fill}
          stroke={OUTLINE_COLOR}
          strokeWidth={2}
        />
      )}
      <line
        x1={stemDown ? -15 : 15}
        y1={stemDown ? 2 : -2}
        x2={stemDown ? -15 : 15}
        y2={stemDown ? 70 : -70}
        stroke={OUTLINE_COLOR}
        strokeWidth={4}
        strokeLinecap="round"
      />
      <ellipse
        cx={0}
        cy={0}
        rx={NOTE_HEAD_RX}
        ry={NOTE_HEAD_RY}
        fill={fill}
        stroke={OUTLINE_COLOR}
        strokeWidth={2}
        transform={`rotate(-${NOTE_HEAD_ROTATION_DEG})`}
      />
      {/* ぷっくり（#100）: 上からのハイライトと下の沈みを重ねる。輪郭に掛からないよう一回り小さく、
          当たり判定は持たせない。グラデーションは NoteDefs（Board・よみとりの SVG に置く）の #note-puff */}
      <ellipse
        cx={0}
        cy={0}
        rx={NOTE_HEAD_RX - 1}
        ry={NOTE_HEAD_RY - 1}
        fill="url(#note-puff)"
        pointerEvents="none"
        transform={`rotate(-${NOTE_HEAD_ROTATION_DEG})`}
      />
    </g>
  )
}

/**
 * 符頭と紙が参照する <defs>（ぷっくりのグラデーション #note-puff・影のフィルタ）。
 * 符頭を描く SVG ごとに1つ置く（盤面 Board と、よみとりの盤面 #155）
 */
export function NoteDefs() {
  return (
    <defs>
      {/* 符頭のぷっくり（#100）: 左上のハイライト→下の沈み（docs/art-direction.md の線と塗り） */}
      <radialGradient id="note-puff" cx="0.35" cy="0.3" r="0.8">
        <stop offset="0" stopColor="#fff" stopOpacity="0.75" />
        <stop offset="0.45" stopColor="#fff" stopOpacity="0" />
        <stop offset="1" stopColor="#000" stopOpacity="0.12" />
      </radialGradient>
      {/* 置き物のやわらかい落ち影（輪郭色系の半透明・ぼかしのみ） */}
      <filter id="note-shadow-soft" x="-20%" y="-10%" width="140%" height="130%">
        <feDropShadow dx="0" dy="6" stdDeviation="7" floodColor="#8a7a5c" floodOpacity="0.18" />
      </filter>
      <filter id="note-shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow
          dx="0"
          dy="6"
          stdDeviation="5"
          floodColor="#000"
          floodOpacity="0.3"
        />
      </filter>
    </defs>
  )
}
