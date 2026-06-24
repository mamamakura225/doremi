interface Props {
  x: number
  y: number
  fill?: string
  opacity?: number
}

/** 四分音符（符頭＋符幹）を描く（SVG内の <g>） */
export default function NoteHead({ x, y, fill = '#3b3b3b', opacity = 1 }: Props) {
  return (
    <g opacity={opacity}>
      <line
        x1={x + 15}
        y1={y - 2}
        x2={x + 15}
        y2={y - 70}
        stroke={fill}
        strokeWidth={4}
        strokeLinecap="round"
      />
      <ellipse
        cx={x}
        cy={y}
        rx={17}
        ry={13}
        fill={fill}
        transform={`rotate(-20 ${x} ${y})`}
      />
    </g>
  )
}
