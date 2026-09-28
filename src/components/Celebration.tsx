import type { CSSProperties } from 'react'
import type { CelebrationLevel } from '../lib/celebration'
import Mascot from './Mascot'

// 再生を最後まで聞いたときのお祝い（#103）。盤面の上に重ねる HTML の層で、触れない。
// 段階: small＝1ページ／big＝複数ページを完走／special＝おてほんを完成（星が降る）。
// 紙吹雪は7色を使わない淡色と白（docs/art-direction.md の禁則2）。
// reduced-motion では紙吹雪を出さず、ぴぴは静止（index.css）。

const CONFETTI_COLORS = ['#ffc9dc', '#dff3ea', '#ffe4cc', '#fff3b0', '#ffffff', '#d9ecff']
const COUNT: Record<CelebrationLevel, number> = { small: 14, big: 28, special: 22 }

/** 0〜1 の決まった並び（描画のたびに位置が変わらないよう、乱数でなく添字から作る） */
function spread(i: number, salt: number) {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453
  return x - Math.floor(x)
}

export default function Celebration({ level }: { level: CelebrationLevel }) {
  const n = COUNT[level]
  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
      aria-hidden="true"
      data-testid="celebration"
      data-level={level}
    >
      {Array.from({ length: n }, (_, i) => {
        const left = 4 + spread(i, 1) * 92
        const delay = spread(i, 2) * 0.5
        const drift = (spread(i, 3) - 0.5) * 120
        const spin = 180 + spread(i, 4) * 360
        const size = 10 + spread(i, 5) * 10
        const style = {
          left: `${left}%`,
          width: size,
          height: level === 'special' ? size : size * 0.55,
          background: level === 'special' ? 'transparent' : CONFETTI_COLORS[i % CONFETTI_COLORS.length],
          animationDelay: `${delay}s`,
          '--drift': `${drift}px`,
          '--spin': `${spin}deg`,
        } as CSSProperties
        return level === 'special' ? (
          <svg key={i} className="confetti absolute -top-8" style={style} viewBox="0 0 24 24">
            <path
              d="M12 2.5 Q13.4 10.6 21.5 12 Q13.4 13.4 12 21.5 Q10.6 13.4 2.5 12 Q10.6 10.6 12 2.5 Z"
              fill="#fff3b0"
              stroke="#5b524b"
              strokeWidth={2}
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <span key={i} className="confetti absolute -top-6 rounded-sm" style={style} />
        )
      })}
      {/* ぴぴがばんざいで跳ねる（右下＝お道具箱の手前。五線の紙にはかけない） */}
      <div className="celebrate-pipi absolute right-2 bottom-2 w-[18%] max-w-[150px] min-w-[84px]">
        <Mascot mood="banzai" width="100%" height="100%" />
      </div>
    </div>
  )
}
