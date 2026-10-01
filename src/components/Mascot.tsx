import { type SVGProps, useId } from 'react'
import { OUTLINE_COLOR } from '../lib/colors'

// マスコット「ぴぴ」（ひよこ）。art/mascot.svg を移植したもの。規則は docs/art-direction.md。
// 1体は 200×200 の座標。表情は4種で足りるようにする。

export type Mood = 'normal' | 'happy' | 'surprised' | 'banzai'

const O = OUTLINE_COLOR
const EYE = '#3d3530'
const BODY_LIGHT = '#fffbe6'
const BODY = '#ffeaa0'
const WING = '#ffd77a'
const BEAK = '#ffa94d'
const MOUTH = '#ff7a59'
const CHEEK = '#ff8fab'
const RIBBON = '#ffc9dc'

/** 下ぶくれの「もちもち」の体（#143） */
const BODY_PATH = 'M100 40 C150 40 178 84 178 128 C178 166 146 184 100 184 C54 184 22 166 22 128 C22 84 50 40 100 40 Z'
/** 目の中心（低く・離して置く＝幼く見える） */
const EYE_Y = 122
const EYE_LX = 70
const EYE_RX = 130

interface Props extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  mood?: Mood
}

/**
 * ぴぴを描く。単独の <svg>（HTML 側）でも、盤面 SVG の中に入れ子の <svg>（x/y/width/height）
 * でも使える。グラデーションの id は描画ごとに一意にする（同じ表情が同じ画面に複数出ても、
 * 先頭の1体が非表示になったとき残りの塗りが消えないように）。
 */
export default function Mascot({ mood = 'normal', ...rest }: Props) {
  const grad = `pipi-body-${useId().replace(/:/g, '')}`
  const happy = mood === 'happy' || mood === 'banzai'
  return (
    <svg viewBox="0 0 200 200" aria-hidden="true" focusable="false" {...rest}>
      <defs>
        <radialGradient id={grad} cx="0.38" cy="0.3" r="0.8">
          <stop offset="0" stopColor={BODY_LIGHT} />
          <stop offset="0.6" stopColor={BODY} />
          <stop offset="1" stopColor={WING} />
        </radialGradient>
      </defs>
      <ellipse cx={100} cy={190} rx={52} ry={6} fill={O} opacity={0.13} />
      <g stroke={O} strokeWidth={4} strokeLinejoin="round" strokeLinecap="round">
        {/* あし */}
        <ellipse cx={80} cy={182} rx={10} ry={6} fill={BEAK} />
        <ellipse cx={120} cy={182} rx={10} ry={6} fill={BEAK} />
        {/* からだ */}
        <path d={BODY_PATH} fill={`url(#${grad})`} />
        {/* とさか */}
        <path d="M96 42 C88 26 96 18 103 26 C106 16 118 20 110 40" fill={BODY} />
        {/* はね */}
        {mood === 'banzai' ? (
          <g fill={WING}>
            <ellipse cx={26} cy={100} rx={22} ry={11} transform="rotate(55 26 100)" />
            <ellipse cx={174} cy={100} rx={22} ry={11} transform="rotate(-55 174 100)" />
          </g>
        ) : (
          <g fill={WING}>
            <path d="M28 128 Q12 140 22 156 Q36 154 36 138 Z" />
            <path d="M172 128 Q188 140 178 156 Q164 154 164 138 Z" />
          </g>
        )}
      </g>
      {/* つや・ほっぺ */}
      <ellipse cx={78} cy={70} rx={16} ry={9} fill="#fff" opacity={0.75} transform="rotate(-28 78 70)" />
      <ellipse cx={52} cy={140} rx={14} ry={8.5} fill={CHEEK} opacity={0.6} />
      <ellipse cx={148} cy={140} rx={14} ry={8.5} fill={CHEEK} opacity={0.6} />
      {/* め */}
      {happy ? (
        <g fill="none" stroke={EYE} strokeWidth={5} strokeLinecap="round">
          <path d={`M${EYE_LX - 11} ${EYE_Y + 2} Q${EYE_LX} ${EYE_Y - 13} ${EYE_LX + 11} ${EYE_Y + 2}`} />
          <path d={`M${EYE_RX - 11} ${EYE_Y + 2} Q${EYE_RX} ${EYE_Y - 13} ${EYE_RX + 11} ${EYE_Y + 2}`} />
        </g>
      ) : mood === 'surprised' ? (
        <g stroke={EYE} strokeWidth={4}>
          <circle cx={EYE_LX} cy={EYE_Y} r={13} fill="#fff" />
          <circle cx={EYE_RX} cy={EYE_Y} r={13} fill="#fff" />
          <circle cx={EYE_LX} cy={EYE_Y + 1} r={6} fill={EYE} stroke="none" />
          <circle cx={EYE_RX} cy={EYE_Y + 1} r={6} fill={EYE} stroke="none" />
        </g>
      ) : (
        <g>
          <ellipse cx={EYE_LX} cy={EYE_Y} rx={11} ry={12.6} fill={EYE} />
          <ellipse cx={EYE_RX} cy={EYE_Y} rx={11} ry={12.6} fill={EYE} />
          <circle cx={EYE_LX + 3.9} cy={EYE_Y - 5} r={4.6} fill="#fff" />
          <circle cx={EYE_RX + 3.9} cy={EYE_Y - 5} r={4.6} fill="#fff" />
          <circle cx={EYE_LX - 4.4} cy={EYE_Y + 5.5} r={2} fill="#fff" />
          <circle cx={EYE_RX - 4.4} cy={EYE_Y + 5.5} r={2} fill="#fff" />
        </g>
      )}
      {/* くちばし（小さく・目のあいだの低いところ） */}
      <g stroke={O} strokeWidth={3.5} strokeLinejoin="round">
        {happy ? (
          <>
            <path d="M93 136 Q100 130 107 136 Q100 139 93 136 Z" fill={BEAK} />
            <path d="M95.5 137.8 Q100 147 104.5 137.8 Z" fill={MOUTH} />
          </>
        ) : mood === 'surprised' ? (
          <ellipse cx={100} cy={142} rx={6} ry={7} fill={MOUTH} />
        ) : (
          <path d="M93.7 136 Q100 129.7 106.3 136 Q100 144.1 93.7 136 Z" fill={BEAK} />
        )}
      </g>
      {/* リボン（淡い桃。シの色そのものは使わない） */}
      <g transform="translate(140 58) rotate(20) scale(0.85)" stroke={O} strokeWidth={3.5} strokeLinejoin="round">
        <path d="M0 0 L-16 -11 Q-21 0 -16 11 Z" fill={RIBBON} />
        <path d="M0 0 L16 -11 Q21 0 16 11 Z" fill={RIBBON} />
        <circle r={5} fill="#fff0f6" />
      </g>
    </svg>
  )
}
