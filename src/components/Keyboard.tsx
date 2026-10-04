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
  /**
   * 光らせる鍵（押している・五線で鳴っている・掴んでいる音・#107）。
   * 同じ色で塗り、少し沈める
   */
  pressed?: string | null
  /** 正しい鍵をうっすら光らせる（よみとりで2回まちがえたあと・#155） */
  hint?: string | null
  /**
   * 黒鍵で押下を受け止める（鳴らさない）。よみとり（#155）では黒鍵の上を押したときに
   * 下の白鍵の答えとして数えないように。既定は素通し（じゆうでは隣の白鍵が鳴るだけ）
   */
  blockBlackKeys?: boolean
  /** 置き場所（viewBox 座標）。既定は五線譜の下の帯。よみとりは自分の盤面に合わせて渡す */
  top?: number
  left?: number
  right?: number
}

const BLACK_H = KEYBOARD_H * 0.58
/** 光っている白鍵が沈む量（押したように見せる） */
const SINK = 3

/**
 * 五線譜の下に併記する鍵盤（家でピアノに触るときの橋渡し）。
 * 白鍵はその音部記号で置ける音そのもの。黒鍵は本物の並びに見せるための飾りで、
 * 押しても鳴らない（♯♭はこのアプリの対象外）。
 */
export default function Keyboard({
  clef,
  onPress,
  pressed,
  hint = null,
  blockBlackKeys = false,
  top = KEYBOARD_TOP,
  left = KEY_LEFT,
  right = KEY_RIGHT,
}: Props) {
  const whites = pitchesOf(clef)
  const w = whiteKeyW(whites.length, left, right)
  const labelY = top + KEYBOARD_H - 22

  return (
    <g aria-label="けんばん">
      {whites.map((p, i) => {
        const x = whiteKeyX(i, whites.length, left, right)
        const on = pressed === p.note
        const hinted = !on && hint === p.note
        return (
          <g
            key={p.note}
            data-testid={`key-${p.note}`}
            data-lit={on}
            data-hint={hinted}
            onPointerDown={() => onPress(p)}
            style={{ cursor: 'pointer' }}
          >
            <rect
              x={x}
              y={top + (on ? SINK : 0)}
              width={w}
              height={KEYBOARD_H - (on ? SINK : 0)}
              rx={6}
              fill={on ? colorOf(p) : WHITE_KEY_BG}
              opacity={on ? 0.75 : 1}
              stroke="#d8c9a6"
              strokeWidth={2}
            />
            {/* ヒント: 同じ色をうすく敷き、輪郭で囲む（押したときの「沈む」とは見分けられるように動かさない） */}
            {hinted && (
              <rect
                x={x + 4}
                y={top + 4}
                width={w - 8}
                height={KEYBOARD_H - 8}
                rx={5}
                fill={colorOf(p)}
                fillOpacity={0.35}
                stroke={OUTLINE_COLOR}
                strokeWidth={3}
                pointerEvents="none"
              />
            )}
            {/* 符頭と同じ色の帯で、譜面の音と鍵を結びつける */}
            <rect
              x={x + 6}
              y={top + KEYBOARD_H - 12}
              width={w - 12}
              height={7}
              rx={3.5}
              fill={colorOf(p)}
            />
            <text
              x={x + w / 2}
              y={labelY}
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
      <g aria-hidden="true" pointerEvents={blockBlackKeys ? 'auto' : 'none'}>
        {whites.map((p, i) =>
          i < whites.length - 1 && hasSharpAbove(p) ? (
            <rect
              key={`b-${p.note}`}
              x={whiteKeyX(i, whites.length, left, right) + w * 0.68}
              y={top}
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
        x={left}
        y={top}
        width={right - left}
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
