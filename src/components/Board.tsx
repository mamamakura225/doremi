import { useRef, useState } from 'react'
import {
  PLACE_LEFT,
  PLACE_RIGHT,
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
import { colorOf } from '../lib/colors'
import { ensureAudio, playNote } from '../audio/synth'
import NoteHead from './NoteHead'
import Staff from './Staff'

interface Props {
  notes: PlacedNote[]
  onPlace: (pitch: Pitch) => void
  playingIndex: number | null
  celebrating: boolean
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

export default function Board({
  notes,
  onPlace,
  playingIndex,
  celebrating,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [drag, setDrag] = useState<DragState | null>(null)
  const playing = playingIndex !== null
  const enabled = canAddNote(notes) && !playing && !celebrating

  function handlePointerDown(e: React.PointerEvent) {
    if (!enabled || !svgRef.current) return
    const p = clientToSvg(svgRef.current, e.clientX, e.clientY)
    if (!p) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const pitch = snapYToPitch(p.y, STAFF_LAYOUT)
    setDrag({ pointerId: e.pointerId, x: p.x, pitch })
    // 初回タップでAudioContext起動 → 掴んだ音を鳴らす
    void ensureAudio().then(() => playNote(pitch.note))
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!drag || e.pointerId !== drag.pointerId || !svgRef.current) return
    const p = clientToSvg(svgRef.current, e.clientX, e.clientY)
    if (!p) return
    const pitch = snapYToPitch(p.y, STAFF_LAYOUT)
    // ゾーン（音）を跨いだ瞬間のみ再トリガ（暴発防止）
    if (pitch.note !== drag.pitch.note) playNote(pitch.note)
    setDrag({ ...drag, x: p.x, pitch })
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (!drag || e.pointerId !== drag.pointerId) return
    if (isOverPlacement(drag.x)) {
      onPlace(drag.pitch)
      playNote(drag.pitch.note)
    }
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
      <defs>
        <filter id="note-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow
            dx="0"
            dy="6"
            stdDeviation="5"
            floodColor="#000"
            floodOpacity="0.3"
          />
        </filter>
      </defs>

      <Staff />

      {/* スナップ先の行ハイライト（指で隠れても着地点が分かる） */}
      {drag && isOverPlacement(drag.x) && (
        <rect
          x={PLACE_LEFT}
          y={pitchToY(drag.pitch, STAFF_LAYOUT) - 18}
          width={PLACE_RIGHT - PLACE_LEFT}
          height={36}
          rx={18}
          fill={colorOf(drag.pitch)}
          opacity={0.22}
        />
      )}

      {/* 配置済み音符（置いた順に左→右へ等間隔） */}
      {notes.map((n, i) => (
        <g
          key={n.id}
          className={celebrating ? 'note-bounce' : undefined}
          style={celebrating ? { animationDelay: `${i * 80}ms` } : undefined}
        >
          <NoteHead
            x={columnX(i)}
            y={pitchToY(n.pitch, STAFF_LAYOUT)}
            fill={colorOf(n.pitch)}
            highlight={i === playingIndex}
          />
        </g>
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

      {/* ドラッグ中のゴースト音符（拡大＋影で持ち上がり表現） */}
      {drag && (
        <NoteHead
          x={drag.x}
          y={pitchToY(drag.pitch, STAFF_LAYOUT)}
          fill={colorOf(drag.pitch)}
          opacity={0.9}
          scale={1.4}
          shadow
        />
      )}
    </svg>
  )
}
