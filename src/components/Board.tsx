import { useRef, useState } from 'react'
import {
  TOOLBOX_CX,
  TOOLBOX_CY,
  TOOLBOX_W,
  TOOLBOX_X,
  VIEW_H,
  VIEW_W,
  columnX,
  isOverPlacement,
} from '../lib/layout'
import { STAFF_LAYOUT } from '../lib/layout'
import { type Pitch, pitchToY, snapYToPitch } from '../lib/pitch'
import type { PlacedNote } from '../lib/notes'
import { canAddNote } from '../lib/notes'
import NoteHead from './NoteHead'
import Staff from './Staff'

interface Props {
  notes: PlacedNote[]
  onPlace: (pitch: Pitch) => void
}

interface DragState {
  pointerId: number
  x: number
  pitch: Pitch
}

function clientToSvg(svg: SVGSVGElement, clientX: number, clientY: number) {
  const pt = svg.createSVGPoint()
  pt.x = clientX
  pt.y = clientY
  const ctm = svg.getScreenCTM()
  if (!ctm) return null
  return pt.matrixTransform(ctm.inverse())
}

export default function Board({ notes, onPlace }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [drag, setDrag] = useState<DragState | null>(null)
  const enabled = canAddNote(notes)

  function handlePointerDown(e: React.PointerEvent) {
    if (!enabled || !svgRef.current) return
    const p = clientToSvg(svgRef.current, e.clientX, e.clientY)
    if (!p) return
    e.currentTarget.setPointerCapture(e.pointerId)
    setDrag({ pointerId: e.pointerId, x: p.x, pitch: snapYToPitch(p.y, STAFF_LAYOUT) })
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!drag || e.pointerId !== drag.pointerId || !svgRef.current) return
    const p = clientToSvg(svgRef.current, e.clientX, e.clientY)
    if (!p) return
    setDrag({ ...drag, x: p.x, pitch: snapYToPitch(p.y, STAFF_LAYOUT) })
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (!drag || e.pointerId !== drag.pointerId) return
    if (isOverPlacement(drag.x)) onPlace(drag.pitch)
    setDrag(null)
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="xMidYMid meet"
      className="h-full w-full select-none"
      style={{ touchAction: 'none' }}
      role="application"
      aria-label="五線譜ボード"
    >
      <Staff />

      {/* 配置済み音符（置いた順に左→右へ等間隔） */}
      {notes.map((n, i) => (
        <NoteHead
          key={n.id}
          x={columnX(i)}
          y={pitchToY(n.pitch, STAFF_LAYOUT)}
        />
      ))}

      {/* お道具箱（右側）: 四分音符が1つ常駐 */}
      <g
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ cursor: enabled ? 'grab' : 'default' }}
      >
        <rect
          x={TOOLBOX_X}
          y={40}
          width={TOOLBOX_W}
          height={VIEW_H - 80}
          rx={16}
          fill="#f0e6cf"
          stroke="#d8c9a6"
          strokeWidth={2}
        />
        <NoteHead
          x={TOOLBOX_CX}
          y={TOOLBOX_CY}
          opacity={enabled ? 1 : 0.3}
        />
      </g>

      {/* ドラッグ中のゴースト音符 */}
      {drag && (
        <NoteHead
          x={drag.x}
          y={pitchToY(drag.pitch, STAFF_LAYOUT)}
          opacity={0.6}
        />
      )}
    </svg>
  )
}
