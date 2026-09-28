import { type SVGProps, useId } from 'react'
import { OUTLINE_COLOR } from '../lib/colors'

// マスコット「ぴぴ」（ひよこ）。art/mascot.svg を移植したもの。規則は docs/art-direction.md。
// 1体は 200×200 の座標。表情は4種で足りるようにする。

export type Mood = 'normal' | 'happy' | 'surprised' | 'banzai'

const O = OUTLINE_COLOR
const EYE = '#3d3530'
const BODY_LIGHT = '#fff6cf'
const BODY = '#ffe38f'
const WING = '#ffd166'
const BEAK = '#ffa94d'
const MOUTH = '#ff7a59'
const CHEEK = '#ff8fab'
const RIBBON = '#ffc9dc'

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
        <radialGradient id={grad} cx="0.38" cy="0.32" r="0.75">
          <stop offset="0" stopColor={BODY_LIGHT} />
          <stop offset="0.65" stopColor={BODY} />
          <stop offset="1" stopColor={WING} />
        </radialGradient>
      </defs>
      <g stroke={O} strokeLinejoin="round" strokeLinecap="round">
        <ellipse cx={100} cy={190} rx={50} ry={7} fill={O} opacity={0.12} stroke="none" />
        {/* あし */}
        <ellipse cx={84} cy={180} rx={11} ry={6} fill={BEAK} strokeWidth={4} />
        <ellipse cx={116} cy={180} rx={11} ry={6} fill={BEAK} strokeWidth={4} />
        {/* からだ */}
        <ellipse cx={100} cy={113} rx={66} ry={64} fill={`url(#${grad})`} strokeWidth={5} />
        <ellipse cx={100} cy={140} rx={36} ry={26} fill="#fffbee" opacity={0.75} stroke="none" />
        <ellipse cx={72} cy={76} rx={15} ry={9} fill="#fff" opacity={0.7} stroke="none" transform="rotate(-30 72 76)" />
        {/* とさか */}
        <path d="M90 52 C84 34 98 28 101 42 C104 28 120 32 110 52" fill={BODY} strokeWidth={4} />
        {/* リボン（淡い桃。シの色そのものは使わない） */}
        <g transform="translate(133 58) rotate(18)" strokeWidth={4}>
          <path d="M0 0 L-17 -11 Q-22 0 -17 11 Z" fill={RIBBON} />
          <path d="M0 0 L17 -11 Q22 0 17 11 Z" fill={RIBBON} />
          <circle r={5} fill="#fff0f6" />
        </g>
        {/* ほっぺ */}
        <ellipse cx={62} cy={130} rx={12} ry={7.5} fill={CHEEK} opacity={0.6} stroke="none" />
        <ellipse cx={138} cy={130} rx={12} ry={7.5} fill={CHEEK} opacity={0.6} stroke="none" />
        {/* はね */}
        {mood === 'banzai' ? (
          <g fill={WING} strokeWidth={4}>
            <ellipse cx={30} cy={94} rx={23} ry={12} transform="rotate(55 30 94)" />
            <ellipse cx={170} cy={94} rx={23} ry={12} transform="rotate(-55 170 94)" />
          </g>
        ) : (
          <g fill={WING} strokeWidth={4}>
            <path d="M40 118 Q22 132 36 150 Q52 146 50 126 Z" />
            <path d="M160 118 Q178 132 164 150 Q148 146 150 126 Z" />
          </g>
        )}
        {/* め */}
        {happy ? (
          <g fill="none" stroke={EYE} strokeWidth={5}>
            <path d="M68 111 Q78 98 88 111" />
            <path d="M112 111 Q122 98 132 111" />
          </g>
        ) : mood === 'surprised' ? (
          <g stroke={EYE} strokeWidth={4}>
            <circle cx={78} cy={107} r={12} fill="#fff" />
            <circle cx={122} cy={107} r={12} fill="#fff" />
            <circle cx={78} cy={108} r={5.5} fill={EYE} stroke="none" />
            <circle cx={122} cy={108} r={5.5} fill={EYE} stroke="none" />
          </g>
        ) : (
          <g stroke="none">
            <ellipse cx={78} cy={108} rx={9.5} ry={11.5} fill={EYE} />
            <ellipse cx={122} cy={108} rx={9.5} ry={11.5} fill={EYE} />
            <circle cx={81} cy={103} r={3.6} fill="#fff" />
            <circle cx={125} cy={103} r={3.6} fill="#fff" />
            <circle cx={75.5} cy={112.5} r={1.7} fill="#fff" />
            <circle cx={119.5} cy={112.5} r={1.7} fill="#fff" />
          </g>
        )}
        {/* くちばし */}
        {happy ? (
          <g strokeWidth={4}>
            <path d="M88 121 Q100 110 112 121 Q100 126 88 121 Z" fill={BEAK} />
            <path d="M93 125 Q100 138 107 125 Q100 127 93 125 Z" fill={MOUTH} />
          </g>
        ) : mood === 'surprised' ? (
          <ellipse cx={100} cy={129} rx={7} ry={8} fill={MOUTH} strokeWidth={4} />
        ) : (
          <path d="M92 123 Q100 116 108 123 Q100 133 92 123 Z" fill={BEAK} strokeWidth={4} />
        )}
      </g>
    </svg>
  )
}
