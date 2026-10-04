import type { ReactNode, SVGProps } from 'react'
import { OUTLINE_COLOR } from '../lib/colors'

// オリジナルのアイコン（#101）。絵文字は OS ごとに絵柄が変わり世界観が揃わないので、
// docs/art-direction.md の線と塗りで描き直す。24×24 のグリッド・輪郭色の丸い線・
// ドレミ7色は使わない（淡色の塗り）。大きさは既定で文字サイズ（1em）に追従する。

const O = OUTLINE_COLOR
const CREAM = '#fffdf5'
const PINK = '#ffc9dc'
const MINT = '#dff3ea'
const PEACH = '#ffe4cc'
const CHICK = '#ffe38f'
// くちばし・鈴の舌。ぴぴ本体の #ffa94d はレの橙に近いので、アイコンでは淡くする
const BEAK = '#ffc79a'

type IconProps = Omit<SVGProps<SVGSVGElement>, 'children'>

function Icon({ children, width = '1em', height = '1em', ...rest }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={width}
      height={height}
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke={O}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {children}
    </svg>
  )
}

/** さいせい（文字色で塗る。緑の丸ボタンでは白、本棚の「きく」では緑） */
export const PlayIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M8.5 5.5 L18.5 12 L8.5 18.5 Z" fill="currentColor" stroke="currentColor" strokeWidth={2.4} />
  </Icon>
)

/** とめる */
export const StopIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x={7} y={7} width={10} height={10} rx={2.5} fill="#fff" stroke="#fff" />
  </Icon>
)

/** おといろ: ぴあの */
export const PianoIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x={3} y={6} width={18} height={12} rx={2.5} fill={CREAM} />
    <path d="M7.5 12 V18 M12 12 V18 M16.5 12 V18" strokeWidth={1.8} />
    <g fill={O} stroke="none">
      <rect x={5.9} y={6} width={3.1} height={6.2} rx={1} />
      <rect x={10.45} y={6} width={3.1} height={6.2} rx={1} />
      <rect x={15} y={6} width={3.1} height={6.2} rx={1} />
    </g>
  </Icon>
)

/** おといろ: べる */
export const BellIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 2.8 V4.3" />
    <path d="M12 4.3 C8.4 4.3 6.4 7.2 6.4 10.6 V13.6 L4.6 16.4 H19.4 L17.6 13.6 V10.6 C17.6 7.2 15.6 4.3 12 4.3 Z" fill={CHICK} />
    <circle cx={12} cy={18.8} r={1.9} fill={BEAK} />
    <path d="M9 8.2 C9.4 7.3 10.1 6.8 10.9 6.6" stroke="#fff" strokeWidth={1.8} />
  </Icon>
)

/** おといろ: ぴこぴこ（レトロなゲームの音 → ゲームのコントローラー） */
export const PicoIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x={2.5} y={7} width={19} height={10.5} rx={5} fill={MINT} />
    <path d="M7.5 10 V14.5 M5.25 12.25 H9.75" strokeWidth={1.8} />
    <circle cx={15.6} cy={13.4} r={1.35} fill={PINK} strokeWidth={1.8} />
    <circle cx={18.1} cy={10.9} r={1.35} fill={PINK} strokeWidth={1.8} />
  </Icon>
)

/** おといろ: うた（ぴぴが口を開けて歌う） */
export const SingIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx={10} cy={13.5} r={7.5} fill={CHICK} />
    <path d="M6.6 12 Q7.4 11 8.2 12 M11.8 12 Q12.6 11 13.4 12" strokeWidth={1.8} />
    <ellipse cx={10} cy={15.8} rx={1.7} ry={1.9} fill={BEAK} strokeWidth={1.8} />
    <path d="M18.5 3.5 V8.6" strokeWidth={1.8} />
    <ellipse cx={17.3} cy={8.8} rx={1.6} ry={1.25} fill={O} stroke="none" transform="rotate(-20 17.3 8.8)" />
    <path d="M18.5 3.5 Q20.6 4 21 5.8" strokeWidth={1.8} />
  </Icon>
)

/** ひとつもどる */
export const UndoIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9.5 6.5 L4.8 11 L9.5 15.5" strokeWidth={2.4} />
    <path d="M5.3 11 H14.2 A4.6 4.6 0 0 1 14.2 20.2 H10.8" strokeWidth={2.4} />
  </Icon>
)

/** ほぞん（ハートの本を本棚へ） */
export const SaveIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 3.8 H17.5 A1.5 1.5 0 0 1 19 5.3 V20.2 H7.2 A2.2 2.2 0 0 1 5 18 V4.8 A1 1 0 0 1 6 3.8 Z" fill={PINK} />
    <path d="M5 18 A2.2 2.2 0 0 1 7.2 15.8 H19" strokeWidth={1.8} />
    <path d="M12 12.6 C10.2 11.4 9.4 10.3 9.4 9.3 A1.4 1.4 0 0 1 12 8.6 A1.4 1.4 0 0 1 14.6 9.3 C14.6 10.3 13.8 11.4 12 12.6 Z" fill="#fff" strokeWidth={1.8} />
  </Icon>
)

/** ほぞんした */
export const SavedIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx={12} cy={12} r={8.5} fill={MINT} />
    <path d="M8 12.4 L10.8 15.2 L16.2 9.4" strokeWidth={2.4} />
  </Icon>
)

/** ほんだな（本が3冊） */
export const ShelfIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x={3.5} y={5} width={4.6} height={15} rx={1.2} fill={PINK} />
    <rect x={8.6} y={3.5} width={4.6} height={16.5} rx={1.2} fill={MINT} />
    <rect x={13.8} y={6.2} width={4.6} height={14} rx={1.2} fill={PEACH} transform="rotate(12 16.1 13.2)" />
    <path d="M2.5 20.5 H21.5" strokeWidth={2.2} />
  </Icon>
)

/** おとなのメニュー（歯車） */
export const GearIcon = (p: IconProps) => (
  <Icon {...p}>
    <g fill={O} stroke="none">
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={i} x={10.4} y={2.3} width={3.2} height={4.4} rx={1} transform={`rotate(${i * 45} 12 12)`} />
      ))}
    </g>
    <circle cx={12} cy={12} r={6.4} fill="#efe3c8" />
    <circle cx={12} cy={12} r={2.3} fill={CREAM} strokeWidth={1.8} />
  </Icon>
)

/** まえ */
export const ArrowLeftIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M19 12 H6 M11 7 L6 12 L11 17" strokeWidth={2.6} />
  </Icon>
)

/** つぎ */
export const ArrowRightIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 12 H18 M13 7 L18 12 L13 17" strokeWidth={2.6} />
  </Icon>
)

/** おてほんと一致したときの星 */
export const StarIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 2.5 Q13.4 10.6 21.5 12 Q13.4 13.4 12 21.5 Q10.6 13.4 2.5 12 Q10.6 10.6 12 2.5 Z" fill="#fff3b0" strokeWidth={3} />
  </Icon>
)

/** 起動ヒントの指（さわってね） */
export const HandIcon = (p: IconProps) => (
  <Icon {...p}>
    {/* 人差し指（左寄り）だけ立て、ほかの指は折る。真ん中の指を立てると別の意味に見える */}
    <path d="M8.2 12.6 V4.4 A1.7 1.7 0 0 1 11.6 4.4 V10.8 A1.6 1.6 0 0 1 14.8 10.8 A1.6 1.6 0 0 1 18 11 V16.2 A5.2 5.2 0 0 1 12.8 21.4 H12.2 A5 5 0 0 1 7.8 18.8 L5.2 14.3 A1.5 1.5 0 0 1 7.7 12.6 Z" fill="#ffe8d6" />
    <path d="M11.6 10.8 V13.6 M14.8 10.8 V13.6" strokeWidth={1.8} />
  </Icon>
)

/** ゴミ箱（捨てる場所） */
export const TrashIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9.5 5.2 V4 A1.3 1.3 0 0 1 10.8 2.7 H13.2 A1.3 1.3 0 0 1 14.5 4 V5.2" strokeWidth={1.8} />
    <rect x={4} y={5.2} width={16} height={3} rx={1.4} fill="#efe3c8" />
    <path d="M5.6 8.2 H18.4 L17.3 20 A1.6 1.6 0 0 1 15.7 21.4 H8.3 A1.6 1.6 0 0 1 6.7 20 Z" fill="#e8e2d6" />
    <path d="M10 11.5 V18 M14 11.5 V18" strokeWidth={1.8} />
  </Icon>
)

/** よこむきに してね（たての画面 → 回す） */
export const RotateIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x={3} y={6.5} width={9} height={14.5} rx={2} fill={CREAM} />
    <path d="M6.5 18.2 H8.5" strokeWidth={1.8} />
    <path d="M14 3.5 A7 7 0 0 1 21 10.5" strokeWidth={2} />
    <path d="M18.2 9.8 L21 10.5 L21.8 7.7" strokeWidth={2} />
  </Icon>
)

/** 予期しない不具合（ぐるぐる） */
export const SwirlIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 12 m0 -1.5 a1.5 1.5 0 1 1 -1.5 1.5 a3 3 0 1 1 3 3 a4.5 4.5 0 1 1 4.5 -4.5 a6 6 0 1 1 -6 -6" stroke="#8fb8de" strokeWidth={2.2} />
  </Icon>
)

/** ぜんぶけす */
export const ClearIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M18.6 12.5 A6.6 6.6 0 1 1 16.4 7.2" strokeWidth={2.2} />
    <path d="M16.9 3.4 V7.6 H12.7" strokeWidth={2.2} />
  </Icon>
)

/** ことり（ト音・高い音） */
export const BirdIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M10.6 5.2 C10.2 3.4 11.8 2.8 12 4.2 C12.3 2.8 14.1 3.3 13.3 5.2" fill={CHICK} strokeWidth={1.8} />
    <circle cx={12} cy={13} r={8} fill={CHICK} />
    <circle cx={9.3} cy={12} r={1.15} fill="#3d3530" stroke="none" />
    <circle cx={14.7} cy={12} r={1.15} fill="#3d3530" stroke="none" />
    <path d="M10.6 14.4 Q12 13.4 13.4 14.4 Q12 16 10.6 14.4 Z" fill={BEAK} strokeWidth={1.8} />
  </Icon>
)

/** くま（ヘ音・低い音） */
export const BearIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx={6} cy={6.5} r={2.8} fill="#c89f7a" />
    <circle cx={18} cy={6.5} r={2.8} fill="#c89f7a" />
    <circle cx={12} cy={13} r={8} fill="#c89f7a" />
    <ellipse cx={12} cy={15.6} rx={3.6} ry={2.8} fill="#f3d9ae" strokeWidth={1.8} />
    <circle cx={9} cy={11.4} r={1.1} fill="#3d3530" stroke="none" />
    <circle cx={15} cy={11.4} r={1.1} fill="#3d3530" stroke="none" />
    <ellipse cx={12} cy={14.6} rx={1.3} ry={0.9} fill="#3d3530" stroke="none" />
  </Icon>
)

/** おてほん（音符と星） */
export const GuideIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M13 17.5 V5 Q16.5 5.6 17.5 8.4" strokeWidth={1.8} />
    <ellipse cx={10.2} cy={17.6} rx={3.2} ry={2.4} fill={PEACH} transform="rotate(-20 10.2 17.6)" strokeWidth={1.8} />
    <path d="M5.5 3 Q6 5.5 8.5 6 Q6 6.5 5.5 9 Q5 6.5 2.5 6 Q5 5.5 5.5 3 Z" fill="#fff3b0" strokeWidth={1.8} />
  </Icon>
)

/** じゆう（えんぴつ） */
export const FreeIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M15.5 4.5 L19.5 8.5 L9 19 L4 20 L5 15 Z" fill={PEACH} />
    <path d="M13.5 6.5 L17.5 10.5" strokeWidth={1.8} />
    <path d="M5 15 L9 19" strokeWidth={1.8} />
  </Icon>
)

/** よみとり（めがね・#155）。五線の音符を「見て」答える */
export const ReadIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx={7} cy={14} r={3.8} fill={PEACH} />
    <circle cx={17} cy={14} r={3.8} fill={PEACH} />
    <path d="M10.8 13.4 Q12 12.4 13.2 13.4" strokeWidth={1.8} />
    <path d="M3.3 13 L2 9 M20.7 13 L22 9" strokeWidth={1.8} />
  </Icon>
)

/** シール帳（星の付いた本・#105）。曲の「きらきらぼし」の星と見分けられるよう、本の形にする */
export const StickerBookIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x={4.5} y={3.5} width={15} height={17} rx={2.2} fill={PEACH} />
    <path d="M7.5 3.5 V20.5" strokeWidth={1.8} />
    <path d="M13.5 7.6 Q14.2 10.6 17 11.3 Q14.2 12 13.5 15 Q12.8 12 10 11.3 Q12.8 10.6 13.5 7.6 Z" fill="#fff3b0" strokeWidth={1.8} />
  </Icon>
)

/** 曲: かえるのうた（#106） */
export const FrogIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx={7.5} cy={7.5} r={3.2} fill={MINT} />
    <circle cx={16.5} cy={7.5} r={3.2} fill={MINT} />
    <ellipse cx={12} cy={14.5} rx={9} ry={6.8} fill={MINT} />
    <circle cx={7.5} cy={7.3} r={1.2} fill="#3d3530" stroke="none" />
    <circle cx={16.5} cy={7.3} r={1.2} fill="#3d3530" stroke="none" />
    <path d="M8 15.5 Q12 18.6 16 15.5" strokeWidth={1.8} />
    <ellipse cx={6.3} cy={15} rx={1.5} ry={0.9} fill={PINK} stroke="none" />
    <ellipse cx={17.7} cy={15} rx={1.5} ry={0.9} fill={PINK} stroke="none" />
  </Icon>
)

/** 曲: メリーさんのひつじ（#106） */
export const SheepIcon = (p: IconProps) => (
  <Icon {...p}>
    <path
      d="M6 9.5 A3 3 0 0 1 9.5 5.6 A3 3 0 0 1 14.5 5.6 A3 3 0 0 1 18 9.5 A3 3 0 0 1 18.4 14.8 A3 3 0 0 1 14.8 18.6 A3 3 0 0 1 9.2 18.6 A3 3 0 0 1 5.6 14.8 A3 3 0 0 1 6 9.5 Z"
      fill={CREAM}
    />
    <ellipse cx={12} cy={12.8} rx={3.8} ry={4.4} fill={PEACH} />
    <circle cx={10.6} cy={12.2} r={0.9} fill="#3d3530" stroke="none" />
    <circle cx={13.4} cy={12.2} r={0.9} fill="#3d3530" stroke="none" />
    <path d="M11.2 14.8 Q12 15.5 12.8 14.8" strokeWidth={1.8} />
  </Icon>
)

/** 曲: ぶんぶんぶん（#106） */
export const BeeIcon = (p: IconProps) => (
  <Icon {...p}>
    <ellipse cx={9} cy={7.5} rx={3.6} ry={2.6} fill="#fff" transform="rotate(-25 9 7.5)" />
    <ellipse cx={15} cy={7.5} rx={3.6} ry={2.6} fill="#fff" transform="rotate(25 15 7.5)" />
    <ellipse cx={12} cy={14} rx={7.5} ry={6} fill={CHICK} />
    <path d="M10 8.6 Q9.2 14 10 19.6 M14 8.6 Q14.8 14 14 19.6" strokeWidth={2.2} />
    <circle cx={6.8} cy={13} r={0.9} fill="#3d3530" stroke="none" />
    <path d="M5.8 15.6 Q6.9 16.4 8 15.6" strokeWidth={1.8} />
  </Icon>
)

/** とじる */
export const CloseIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6.5 6.5 L17.5 17.5 M17.5 6.5 L6.5 17.5" strokeWidth={2.6} />
  </Icon>
)
