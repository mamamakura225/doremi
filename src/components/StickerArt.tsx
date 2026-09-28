import type { ReactNode } from 'react'
import { OUTLINE_COLOR } from '../lib/colors'
import type { StickerId } from '../lib/stickers'
import { BearIcon, BellIcon, SaveIcon, ShelfIcon, StarIcon } from './Icons'

// シールの絵（#105）。白いふち＋淡色の地の丸いステッカー（48×48）。
// 7色は使わない（docs/art-direction.md）。まだもらっていないシールは、灰色の地に「？」。

const O = OUTLINE_COLOR
const BADGE: Record<StickerId, string> = {
  'first-note': '#ffc9dc',
  'tap-note': '#dff3ea',
  'long-note': '#ffe4cc',
  'play-end': '#fff3b0',
  save: '#ffc9dc',
  'shelf-listen': '#ffe4cc',
  bass: '#dff3ea',
  'long-song': '#d9ecff',
  'all-colors': '#fffdf5',
  'guide-complete': '#fff3b0',
  'ear-found': '#d9ecff',
}

/** 符頭＋符幹（チョコ色の音符） */
function Note({ x, y, tail = 0 }: { x: number; y: number; tail?: number }) {
  return (
    <g stroke={O} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      {tail > 0 && <rect x={x} y={y - 2.5} width={tail} height={5} rx={2.5} fill="#a07e62" />}
      <line x1={x + 4.8} y1={y - 0.5} x2={x + 4.8} y2={y - 17} />
      <ellipse cx={x} cy={y} rx={5.4} ry={4.1} fill="#a07e62" transform={`rotate(-20 ${x} ${y})`} />
    </g>
  )
}

const ART: Record<StickerId, ReactNode> = {
  'first-note': <Note x={21} y={31} />,
  'tap-note': <BellIcon x={11} y={11} width={26} height={26} />,
  'long-note': <Note x={15} y={30} tail={16} />,
  'play-end': <StarIcon x={10} y={10} width={28} height={28} />,
  save: <SaveIcon x={11} y={11} width={26} height={26} />,
  'shelf-listen': <ShelfIcon x={11} y={11} width={26} height={26} />,
  bass: <BearIcon x={10} y={10} width={28} height={28} />,
  'long-song': (
    <g>
      <Note x={16} y={31} />
      <Note x={29} y={27} />
      <path d="M20.8 14 L33.8 10" stroke={O} strokeWidth={3} strokeLinecap="round" />
    </g>
  ),
  'all-colors': (
    <g fill="none" strokeLinecap="round" strokeWidth={3}>
      {['#ffb3b3', '#ffd6a5', '#fff3b0', '#c8f0c8', '#bfe6ff', '#d9ccff', '#ffc9dc'].map((c, i) => (
        <path key={c} d={`M${10 + i * 1.6} 32 A${14 - i * 1.6} ${14 - i * 1.6} 0 0 1 ${38 - i * 1.6} 32`} stroke={c} />
      ))}
      <path d="M8.5 32 A15.5 15.5 0 0 1 39.5 32" stroke={O} strokeWidth={1.2} />
    </g>
  ),
  'ear-found': (
    <g stroke={O} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none">
      <path d="M16 21 A8.5 8.5 0 0 1 33 21 C33 26.5 28.4 27.6 27.8 31.6 A5.2 5.2 0 0 1 18 33" fill="#ffe8d6" />
      <path d="M21 21.6 A3.4 3.4 0 0 1 27.6 22 C27.6 24 25.5 24.6 24.6 26" />
      <path d="M36 14 Q39 21 36 28" />
    </g>
  ),
  'guide-complete': (
    <path
      d="M11 31 L13 17 L19 23 L24 14 L29 23 L35 17 L37 31 Z"
      fill="#ffe38f"
      stroke={O}
      strokeWidth={1.8}
      strokeLinejoin="round"
    />
  ),
}

interface Props {
  id: StickerId
  earned: boolean
  size?: number | string
}

export default function StickerArt({ id, earned, size = '100%' }: Props) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true" focusable="false">
      <circle cx={24} cy={24} r={22} fill={earned ? BADGE[id] : '#efe9df'} stroke="#fff" strokeWidth={3} />
      <circle cx={24} cy={24} r={23.4} fill="none" stroke={earned ? O : '#cfc6b8'} strokeWidth={1.2} />
      {earned ? (
        ART[id]
      ) : (
        <text x={24} y={31} textAnchor="middle" fontSize={20} fontWeight="bold" fill="#cfc6b8">
          ？
        </text>
      )}
    </svg>
  )
}
