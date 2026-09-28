import type { CSSProperties } from 'react'
import { OUTLINE_COLOR } from '../lib/colors'

/** 4つ角の星（中心(0,0)・半径9） */
const STAR = 'M0 -9 Q2 -2 9 0 Q2 2 0 9 Q-2 2 -9 0 Q-2 -2 0 -9 Z'
const COUNT = 6
/** 符頭の中心から飛ぶ距離（符頭の横半径17の外まで） */
const REACH = 42

interface Props {
  x: number
  y: number
  /** 鳴っている音の色（紙の上で7色を使ってよいのは、その音と同じ色だけ） */
  color: string
}

/**
 * 置いた瞬間に符頭のまわりへ散るキラ粒（#100）。一度きりのアニメで、Board が
 * LANDING_MS 後に外す。reduced-motion では index.css で非表示にする。
 */
export default function Sparkles({ x, y, color }: Props) {
  return (
    <g transform={`translate(${x} ${y})`} pointerEvents="none" aria-hidden="true">
      {Array.from({ length: COUNT }, (_, i) => {
        // 60°おきに6方向。軸から15°ずらして、真横（五線に沿う）・真下にそろわないようにする
        const a = ((i * 360) / COUNT - 75) * (Math.PI / 180)
        const style = {
          '--dx': `${Math.cos(a) * REACH}px`,
          '--dy': `${Math.sin(a) * REACH}px`,
          animationDelay: `${(i % 2) * 40}ms`,
        } as CSSProperties
        return (
          <path
            key={i}
            className="sparkle"
            d={STAR}
            fill={i % 2 ? '#fff' : color}
            stroke={OUTLINE_COLOR}
            strokeWidth={1.5}
            strokeLinejoin="round"
            style={style}
          />
        )
      })}
    </g>
  )
}
