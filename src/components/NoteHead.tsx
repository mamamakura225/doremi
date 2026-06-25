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
}: Props) {
  return (
    <g
      transform={`translate(${x} ${y}) scale(${scale})`}
      opacity={opacity}
      filter={shadow ? 'url(#note-shadow)' : undefined}
    >
      {highlight && <circle cx={0} cy={0} r={32} fill={fill} opacity={0.35} />}
      <line
        x1={15}
        y1={-2}
        x2={15}
        y2={-70}
        stroke={fill}
        strokeWidth={4}
        strokeLinecap="round"
      />
      <ellipse cx={0} cy={0} rx={17} ry={13} fill={fill} transform="rotate(-20)" />
    </g>
  )
}
