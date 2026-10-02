import { useId } from 'react'
import { OUTLINE_COLOR, SOLFA_COLOR } from '../lib/colors'

// タイトルのロゴ「どれみ」（#144・案 M3「なみの五線」）。ゆれる五線の上を ど→れ→み が
// 音の高さどおりに1段ずつ上がっていく。文字はフォントに頼らず線で描く（OS で形が変わらない）。
// 1文字は 100×100 の座標の線（中心線）。規則は docs/art-direction.md。

const O = OUTLINE_COLOR

/** 字の線（中心線）。太い丸い線で描くと手描きの丸文字になる */
const GLYPH: Record<'ど' | 'れ' | 'み', string[]> = {
  ど: ['M24 7 L35 33', 'M80 30 Q40 44 22 62 Q8 80 30 87 Q52 91 95 88', 'M73 8 L78 20', 'M87 4 L92 16'],
  れ: ['M28 5 L28 97', 'M6 26 L35 26 L6 78', 'M28 58 Q46 14 62 13 Q78 14 75 48 Q70 84 82 86 Q90 86 96 70'],
  み: ['M16 14 L56 14 Q38 50 24 82 Q18 96 9 84 Q2 62 18 48 Q32 38 40 58 Q50 80 96 56', 'M80 30 Q82 66 56 94'],
}

/** 字の上の明るい色（グラデーションの上端）。下へ行くほどその音の色になる */
const TOP: Record<'ド' | 'レ' | 'ミ', string> = { ド: '#ff8a80', レ: '#ffb36b', ミ: '#fff08a' }

const LETTERS = [
  { ch: 'ど', solfa: 'ド', x: 30, y: 74, rot: -6 },
  { ch: 'れ', solfa: 'レ', x: 138, y: 44, rot: 3 },
  { ch: 'み', solfa: 'ミ', x: 246, y: 14, rot: -3 },
] as const

const SCALE = 0.95
const STROKE = 15

function Lines({ ds, stroke, width, ...rest }: { ds: string[]; stroke: string; width: number; opacity?: number; transform?: string }) {
  return ds.map((d) => (
    <path key={d} d={d} fill="none" stroke={stroke} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" {...rest} />
  ))
}

function Sparkle({ x, y, s, fill }: { x: number; y: number; s: number; fill: string }) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${s})`}
      d="M0 -10 Q2 -2 10 0 Q2 2 0 10 Q-2 2 -10 0 Q-2 -2 0 -10Z"
      fill={fill}
      stroke={O}
      strokeWidth={2 / s}
      strokeLinejoin="round"
    />
  )
}

export default function TitleLogo() {
  const id = useId().replace(/:/g, '')
  return (
    <svg viewBox="0 0 380 190" width="100%" aria-hidden="true" focusable="false">
      <defs>
        {LETTERS.map(({ solfa }) => (
          // 字の座標で塗る（objectBoundingBox だと れ の縦画＝幅0 にグラデが乗らない）
          <linearGradient key={solfa} id={`${id}-${solfa}`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="100">
            <stop offset="0" stopColor={TOP[solfa]} />
            <stop offset="0.55" stopColor={SOLFA_COLOR[solfa]} />
          </linearGradient>
        ))}
        <filter id={`${id}-shadow`} x="-15%" y="-15%" width="130%" height="150%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor={O} floodOpacity="0.25" />
        </filter>
      </defs>
      {/* ゆれる五線 */}
      {[-24, -12, 0, 12, 24].map((dy) => (
        <path
          key={dy}
          d={`M6 ${118 + dy} C80 ${88 + dy} 150 ${138 + dy} 220 ${104 + dy} S330 ${76 + dy} 376 ${92 + dy}`}
          fill="none"
          stroke={O}
          strokeWidth={2.4}
          strokeLinecap="round"
          opacity={0.45}
        />
      ))}
      <g filter={`url(#${id}-shadow)`}>
        {LETTERS.map(({ ch, solfa, x, y, rot }, i) => (
          <g key={ch} transform={`translate(${x} ${y}) rotate(${rot} ${50 * SCALE} ${50 * SCALE}) scale(${SCALE})`}>
            {/* 位置は属性の transform、ぽんっと出る動きは内側の <g> の CSS（CSS の transform は属性を上書きするため分ける） */}
            <g className="title-letter" style={{ animationDelay: `${i * 0.12}s`, transformBox: 'fill-box', transformOrigin: 'center' }}>
              <Lines ds={GLYPH[ch]} stroke="#fff" width={STROKE + 20} />
              <Lines ds={GLYPH[ch]} stroke={O} width={STROKE + 8} />
              <Lines ds={GLYPH[ch]} stroke={`url(#${id}-${solfa})`} width={STROKE} />
              <Lines ds={GLYPH[ch]} stroke="#fff" width={3.2} opacity={0.55} transform="translate(-2.2 -2.6)" />
            </g>
          </g>
        ))}
      </g>
      <Sparkle x={366} y={26} s={0.9} fill="#fff" />
      <Sparkle x={20} y={40} s={0.7} fill="#fff6cf" />
    </svg>
  )
}
