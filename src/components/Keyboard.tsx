import {
  KEYBOARD_H,
  KEYBOARD_TOP,
  KEY_LEFT,
  KEY_RIGHT,
  whiteKeyW,
  whiteKeyX,
} from '../lib/layout'
import { hasSharpAbove, pitchesOf, type Clef, type Pitch } from '../lib/pitch'
import { OUTLINE_COLOR, WHITE_KEY_BG, colorOf } from '../lib/colors'

interface Props {
  clef: Clef
  onPress: (pitch: Pitch) => void
  /** 押している鍵（発音中の見た目） */
  pressed?: string | null
}

const BLACK_H = KEYBOARD_H * 0.58
const LABEL_Y = KEYBOARD_TOP + KEYBOARD_H - 22

/**
 * 五線譜の下に併記する鍵盤（家でピアノに触るときの橋渡し）。
 * 白鍵はその音部記号で置ける音そのもの。黒鍵は本物の並びに見せるための飾りで、
 * 押しても鳴らない（♯♭はこのアプリの対象外）。
 */
export default function Keyboard({ clef, onPress, pressed }: Props) {
  const whites = pitchesOf(clef)
  const w = whiteKeyW(whites.length)

  return (
    <g aria-label="けんばん">
      {whites.map((p, i) => {
        const x = whiteKeyX(i, whites.length)
        const on = pressed === p.note
        return (
          <g key={p.note} onPointerDown={() => onPress(p)} style={{ cursor: 'pointer' }}>
            <rect
              x={x}
              y={KEYBOARD_TOP}
              width={w}
              height={KEYBOARD_H}
              rx={6}
              fill={on ? colorOf(p) : WHITE_KEY_BG}
              opacity={on ? 0.75 : 1}
              stroke="#d8c9a6"
              strokeWidth={2}
            />
            {/* 符頭と同じ色の帯で、譜面の音と鍵を結びつける */}
            <rect
              x={x + 6}
              y={KEYBOARD_TOP + KEYBOARD_H - 12}
              width={w - 12}
              height={7}
              rx={3.5}
              fill={colorOf(p)}
            />
            <text
              x={x + w / 2}
              y={LABEL_Y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={20}
              fontWeight="bold"
              fill={OUTLINE_COLOR}
            >
              {p.solfa}
            </text>
          </g>
        )
      })}

      {/* 黒鍵（飾り・当たり判定なし）。白鍵の境目のうち半音が有るところだけ。 */}
      <g aria-hidden="true" pointerEvents="none">
        {whites.map((p, i) =>
          i < whites.length - 1 && hasSharpAbove(p) ? (
            <rect
              key={`b-${p.note}`}
              x={whiteKeyX(i, whites.length) + w * 0.68}
              y={KEYBOARD_TOP}
              width={w * 0.64}
              height={BLACK_H}
              rx={5}
              fill="#4b4038"
            />
          ) : null,
        )}
      </g>

      {/* 鍵盤の外枠（五線と同じ色でまとめる） */}
      <rect
        x={KEY_LEFT}
        y={KEYBOARD_TOP}
        width={KEY_RIGHT - KEY_LEFT}
        height={KEYBOARD_H}
        rx={6}
        fill="none"
        stroke="#5b524b"
        strokeWidth={3}
        pointerEvents="none"
      />
    </g>
  )
}
