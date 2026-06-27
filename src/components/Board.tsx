import { useRef, useState } from 'react'
import {
  PLACE_LEFT,
  PLACE_RIGHT,
  TOOLBOX_CX,
  TOOLBOX_CY,
  TOOLBOX_W,
  TOOLBOX_X,
  TRASH_CX,
  TRASH_CY,
  VIEW_H,
  VIEW_W,
  columnX,
  isOverPlacement,
  isOverTrash,
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
  onRemove: (id: string) => void
  playingIndex: number | null
  celebrating: boolean
  /** おてほんモードのお手本音列（未指定＝自由制作） */
  targets?: Pitch[]
}

interface DragState {
  pointerId: number
  x: number
  pitch: Pitch
}

/** 配置済み音符を掴んでゴミ箱へ捨てる操作 */
interface DeleteDragState {
  pointerId: number
  id: string
  pitch: Pitch
  x: number
  y: number
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
  onRemove,
  playingIndex,
  celebrating,
  targets,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [drag, setDrag] = useState<DragState | null>(null)
  const [del, setDel] = useState<DeleteDragState | null>(null)
  const [touched, setTouched] = useState(false)
  const playing = playingIndex !== null
  const enabled = canAddNote(notes) && !playing && !celebrating
  // 配置済み音符の編集（捨てる）は満杯でも可。再生・演出中のみ不可。
  const editable = !playing && !celebrating
  // 起動直後（未操作）のみヒント表示。初回タップで消える＝それがAudioContext解除も兼ねる。
  const showHint = enabled && !touched

  function handlePointerDown(e: React.PointerEvent) {
    if (!enabled || !svgRef.current) return
    const p = clientToSvg(svgRef.current, e.clientX, e.clientY)
    if (!p) return
    setTouched(true)
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

  // 配置済み音符を掴む → ゴミ箱で離すと削除（タップ削除は採らない＝誤操作防止）
  function handleNoteDown(e: React.PointerEvent, note: PlacedNote) {
    if (!editable || !svgRef.current) return
    e.stopPropagation()
    const p = clientToSvg(svgRef.current, e.clientX, e.clientY)
    if (!p) return
    e.currentTarget.setPointerCapture(e.pointerId)
    setDel({ pointerId: e.pointerId, id: note.id, pitch: note.pitch, x: p.x, y: p.y })
  }

  function handleNoteMove(e: React.PointerEvent) {
    if (!del || e.pointerId !== del.pointerId || !svgRef.current) return
    const p = clientToSvg(svgRef.current, e.clientX, e.clientY)
    if (!p) return
    setDel({ ...del, x: p.x, y: p.y })
  }

  function handleNoteUp(e: React.PointerEvent) {
    if (!del || e.pointerId !== del.pointerId) return
    if (isOverTrash(del.x, del.y)) onRemove(del.id)
    setDel(null)
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

      {/* おてほんモード: お手本ゴースト（これから置く音）＋現在位置の発光 */}
      {targets?.map((t, i) =>
        i < notes.length ? null : (
          <g key={`ghost-${i}`}>
            {i === notes.length && (
              <circle
                className="target-glow"
                cx={columnX(i)}
                cy={pitchToY(t, STAFF_LAYOUT)}
                r={30}
                fill={colorOf(t)}
              />
            )}
            <NoteHead
              x={columnX(i)}
              y={pitchToY(t, STAFF_LAYOUT)}
              fill={colorOf(t)}
              opacity={0.28}
            />
          </g>
        ),
      )}

      {/* 配置済み音符（置いた順に左→右へ等間隔）。掴んでゴミ箱へ捨てられる。 */}
      {notes.map((n, i) => {
        const matched = targets?.[i]?.note === n.pitch.note
        const dragging = del?.id === n.id
        return (
          <g
            key={n.id}
            className={
              celebrating ? 'note-bounce' : matched ? 'match-pop' : undefined
            }
            style={{
              ...(celebrating ? { animationDelay: `${i * 80}ms` } : {}),
              cursor: editable ? 'grab' : 'default',
            }}
            onPointerDown={(e) => handleNoteDown(e, n)}
            onPointerMove={handleNoteMove}
            onPointerUp={handleNoteUp}
          >
            <NoteHead
              x={columnX(i)}
              y={pitchToY(n.pitch, STAFF_LAYOUT)}
              fill={colorOf(n.pitch)}
              highlight={i === playingIndex}
              opacity={dragging ? 0.25 : 1}
            />
            {matched && (
              <text
                x={columnX(i) + 20}
                y={pitchToY(n.pitch, STAFF_LAYOUT) - 28}
                fontSize={26}
                textAnchor="middle"
              >
                ✨
              </text>
            )}
          </g>
        )
      })}

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
        <g className={showHint ? 'note-hint' : undefined}>
          <NoteHead
            x={TOOLBOX_CX}
            y={TOOLBOX_CY}
            opacity={enabled ? 1 : 0.3}
          />
        </g>
      </g>

      {/* 起動ヒント: 指アイコン＋「さわってね」（読めない子にも指で直感誘発） */}
      {showHint && (
        <g aria-hidden="true">
          <text
            className="finger-poke"
            x={TOOLBOX_CX}
            y={TOOLBOX_CY + 78}
            textAnchor="middle"
            fontSize={48}
          >
            👆
          </text>
          <text
            x={TOOLBOX_CX}
            y={TOOLBOX_CY + 132}
            textAnchor="middle"
            fontSize={26}
            fontWeight="bold"
            fill="#6b6375"
          >
            さわってね
          </text>
        </g>
      )}

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

      {/* 音符を掴んでいる間だけゴミ箱を表示（捨て先を明示）。重なると拡大して反応。 */}
      {del && (
        <g aria-hidden="true">
          {(() => {
            const over = isOverTrash(del.x, del.y)
            return (
              <text
                x={TRASH_CX}
                y={TRASH_CY}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={over ? 64 : 48}
                opacity={over ? 1 : 0.7}
              >
                🗑️
              </text>
            )
          })()}
        </g>
      )}

      {/* 捨てるために掴んだ音符のゴースト（指に追従） */}
      {del && (
        <NoteHead
          x={del.x}
          y={del.y}
          fill={colorOf(del.pitch)}
          opacity={isOverTrash(del.x, del.y) ? 0.5 : 0.9}
          scale={1.3}
          shadow
        />
      )}
    </svg>
  )
}
