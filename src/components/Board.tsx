import { useEffect, useRef, useState } from 'react'
import {
  COLUMN_PITCH,
  NOTE_HIT_H,
  NOTE_HIT_W,
  NOTE_MAX,
  PLACE_LEFT,
  PLACE_RIGHT,
  TOOLBOX_CX,
  TOOLBOX_LONG_CY,
  TOOLBOX_NORMAL_CY,
  TOOLBOX_W,
  TOOLBOX_X,
  TRASH_CX,
  TRASH_CY,
  VIEW_H,
  VIEW_H_KEYS,
  VIEW_W,
  columnX,
  canPlace,
  isOverPlacement,
  isOverTrash,
} from '../lib/layout'
import { STAFF_LAYOUT } from '../lib/layout'
import { type Clef, type Pitch, pitchToY, snapYToPitch } from '../lib/pitch'
import type { PlacedNote } from '../lib/notes'
import { canAddNote, columnStarts, usedColumns } from '../lib/notes'
import { noteDuration } from '../lib/playback'
import { colorOf } from '../lib/colors'
import { ensureAudio, playNote } from '../audio/synth'
import { useFitsKeyboard } from '../hooks/useFitsKeyboard'
import Keyboard from './Keyboard'
import NoteHead from './NoteHead'
import Staff from './Staff'

interface Props {
  notes: PlacedNote[]
  onPlace: (pitch: Pitch, long: boolean) => void
  onRemove: (id: string) => void
  playingIndex: number | null
  celebrating: boolean
  /** 音部記号（譜面・スナップ先の音がまるごと変わる） */
  clef: Clef
  /** おてほんモードのお手本音列（未指定＝自由制作） */
  targets?: Pitch[]
}

interface DragState {
  pointerId: number
  x: number
  /** 離した位置の Y（配置判定に使う・#59）。スナップ先ではなく生のポインタ座標。 */
  y: number
  pitch: Pitch
  /** 掴んでいるのが「のばす音」か */
  long: boolean
}

/** 配置済み音符を掴んでゴミ箱へ捨てる操作 */
interface DeleteDragState {
  pointerId: number
  id: string
  pitch: Pitch
  long: boolean
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
  clef,
  targets,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [drag, setDrag] = useState<DragState | null>(null)
  const [del, setDel] = useState<DeleteDragState | null>(null)
  const [touched, setTouched] = useState(false)
  // 音部切替は盤面リセットと同義。App 側で pages は空になるが、掴んでいる最中の
  // drag/del は旧音部で解決された Pitch なので、ここで捨てる。
  // レンダー中に調整する（React 公式パターン）——effect だとペイント後になり、
  // 旧音部のゴーストが新しい五線の上に1フレーム残る。`<Board key={clef}>` で
  // 作り直す案は touched 初期化で起動ヒントが再表示され、鍵盤が出る端末では
  // useFitsKeyboard が再計測されて viewBox が一瞬跳ねるので採らない。
  const [prevClef, setPrevClef] = useState(clef)
  if (prevClef !== clef) {
    setPrevClef(clef)
    setDrag(null)
    setDel(null)
  }
  // 掴んでいる音符が配列から消えたら（別の指で ↩ / ページ切替）掴みを捨てる。
  // その <g> が DOM から消えるとポインタキャプチャが暗黙解放され、pointerup は
  // handleNoteUp に届かない＝ゴースト＋ゴミ箱が残り続けるため（#58 症状2）。
  if (del && !notes.some((n) => n.id === del.id)) setDel(null)
  const [pressedKey, setPressedKey] = useState<string | null>(null)
  // 鍵盤ハイライトの消灯タイマー。IDを保持しないと、連打時に前の押下の
  // タイマーが後の押下を消してしまう（#60-5）。
  const keyTimer = useRef(0)
  useEffect(() => () => window.clearTimeout(keyTimer.current), [])
  // 縦に余裕のある端末（タブレット横など）でだけ鍵盤を併記する
  const showKeyboard = useFitsKeyboard(svgRef)
  const playing = playingIndex !== null
  const busy = playing || celebrating
  const canNormal = canAddNote(notes, false) && !busy
  const canLong = canAddNote(notes, true) && !busy
  // 配置済み音符の編集（捨てる）は満杯でも可。再生・演出中のみ不可。
  const editable = !busy
  // 起動直後（未操作）のみヒント表示。初回タップで消える＝それがAudioContext解除も兼ねる。
  const showHint = canNormal && !touched
  // 音符の開始列（のばす音は2列ぶん占めるので、後続の列がその分ずれる）
  const starts = columnStarts(notes)

  /**
   * すでにポインタを1つ追跡していれば、新しい pointerdown は受け付けない。
   * 「記録するだけ」では単一追跡にならない——2本目の指が drag/del を上書きし、
   * 1本目のドラッグが宙に消える（#58 症状1）。子どもは画面に手をつく前提。
   */
  const tracking = drag !== null || del !== null

  /** 鍵盤を押したら、その音を通常音で鳴らす（譜面には置かない） */
  function handleKeyPress(pitch: Pitch) {
    if (busy || tracking) return
    setTouched(true)
    setPressedKey(pitch.note)
    window.clearTimeout(keyTimer.current)
    keyTimer.current = window.setTimeout(() => setPressedKey(null), 260)
    void ensureAudio().then(() => playNote(pitch.note))
  }

  /** 掴んだ音の長さに合わせた試聴音（のばす音は制作中も長く鳴る） */
  function previewNote(note: string, long: boolean) {
    playNote(note, noteDuration(long ? 2 : 1))
  }

  function handlePointerDown(e: React.PointerEvent, long: boolean) {
    if (tracking || !(long ? canLong : canNormal) || !svgRef.current) return
    const p = clientToSvg(svgRef.current, e.clientX, e.clientY)
    if (!p) return
    setTouched(true)
    e.currentTarget.setPointerCapture(e.pointerId)
    const pitch = snapYToPitch(p.y, STAFF_LAYOUT, clef)
    setDrag({ pointerId: e.pointerId, x: p.x, y: p.y, pitch, long })
    // 初回タップでAudioContext起動 → 掴んだ音を鳴らす
    void ensureAudio().then(() => previewNote(pitch.note, long))
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!drag || e.pointerId !== drag.pointerId || !svgRef.current) return
    const p = clientToSvg(svgRef.current, e.clientX, e.clientY)
    if (!p) return
    const pitch = snapYToPitch(p.y, STAFF_LAYOUT, clef)
    // ゾーン（音）を跨いだ瞬間のみ再トリガ（暴発防止）
    if (pitch.note !== drag.pitch.note) previewNote(pitch.note, drag.long)
    setDrag({ ...drag, x: p.x, y: p.y, pitch })
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (!drag || e.pointerId !== drag.pointerId) return
    // canPlace が音部一致も見る。prevClef のリセットが未反映のフレームで
    // pointerup が来ても、旧音部の音を新しい盤面に流し込まない（#56）。
    if (canPlace(drag.pitch.clef, clef, drag.x, drag.y)) {
      onPlace(drag.pitch, drag.long)
      previewNote(drag.pitch.note, drag.long)
    }
    setDrag(null)
  }

  /**
   * pointerup 以外でポインタが終わる経路の後始末（#58 症状2）:
   * - pointercancel（システムジェスチャ・タッチ点過多でブラウザが中断）
   * - キャプチャ先の <g> が消えて pointerup が個別ハンドラに届かなかったとき
   *   （SVG ルートまでバブルしてくる）
   * 置く・捨てるは行わず、掴みを解除するだけ。
   */
  function endTracking(e: React.PointerEvent) {
    if (drag && e.pointerId === drag.pointerId) setDrag(null)
    if (del && e.pointerId === del.pointerId) setDel(null)
  }

  // 配置済み音符を掴む → ゴミ箱で離すと削除（タップ削除は採らない＝誤操作防止）
  function handleNoteDown(e: React.PointerEvent, note: PlacedNote) {
    if (tracking || !editable || !svgRef.current) return
    e.stopPropagation()
    const p = clientToSvg(svgRef.current, e.clientX, e.clientY)
    if (!p) return
    e.currentTarget.setPointerCapture(e.pointerId)
    setDel({
      pointerId: e.pointerId,
      id: note.id,
      pitch: note.pitch,
      long: !!note.long,
      x: p.x,
      y: p.y,
    })
  }

  function handleNoteMove(e: React.PointerEvent) {
    if (!del || e.pointerId !== del.pointerId || !svgRef.current) return
    const p = clientToSvg(svgRef.current, e.clientX, e.clientY)
    if (!p) return
    setDel({ ...del, x: p.x, y: p.y })
  }

  function handleNoteUp(e: React.PointerEvent) {
    if (!del || e.pointerId !== del.pointerId) return
    // drag 側と同じく、音部が変わっていたら何もしない（対称にしておく）。
    if (del.pitch.clef === clef && isOverTrash(del.x, del.y)) onRemove(del.id)
    setDel(null)
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${VIEW_W} ${showKeyboard ? VIEW_H_KEYS : VIEW_H}`}
      preserveAspectRatio="xMidYMid meet"
      className="h-full w-full select-none"
      style={{ touchAction: 'none' }}
      role="application"
      aria-label="五線譜ボード"
      onPointerUp={endTracking}
      onPointerCancel={endTracking}
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

      <Staff clef={clef} />

      {showKeyboard && (
        <Keyboard clef={clef} onPress={handleKeyPress} pressed={pressedKey} />
      )}

      {/* スナップ先の行ハイライト（指で隠れても着地点が分かる） */}
      {drag && isOverPlacement(drag.x, drag.y) && (
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

      {/* おてほんモード: お手本ゴースト（これから置く音）＋現在位置の発光。
          お手本はふつうの音だけなので、置いた音符が使った列の続きに並べる。 */}
      {targets?.map((t, i) => {
        if (i < notes.length) return null
        const col = usedColumns(notes) + (i - notes.length)
        if (col >= NOTE_MAX) return null
        return (
          <g key={`ghost-${i}`}>
            {i === notes.length && (
              <circle
                className="target-glow"
                cx={columnX(col)}
                cy={pitchToY(t, STAFF_LAYOUT)}
                r={30}
                fill={colorOf(t)}
              />
            )}
            <NoteHead
              x={columnX(col)}
              y={pitchToY(t, STAFF_LAYOUT)}
              fill={colorOf(t)}
              opacity={0.28}
            />
          </g>
        )
      })}

      {/* 配置済み音符（置いた順に左→右へ等間隔）。掴んでゴミ箱へ捨てられる。 */}
      {notes.map((n, i) => {
        const matched = targets?.[i]?.note === n.pitch.note
        const dragging = del?.id === n.id
        return (
          <g
            key={n.id}
            data-testid={`note-${n.id}`}
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
            {/* 符頭は横向きスマホで 21.5 CSS px しかない。列間隔ぶんの不可視矩形で
                受けて、指1本で隣を掴まずに済むようにする（#62・お道具箱と同じ手当て）。 */}
            <rect
              x={columnX(starts[i]) - NOTE_HIT_W / 2}
              y={pitchToY(n.pitch, STAFF_LAYOUT) - NOTE_HIT_H / 2}
              width={NOTE_HIT_W * (n.long ? 2 : 1)}
              height={NOTE_HIT_H}
              fill="transparent"
            />
            <NoteHead
              x={columnX(starts[i])}
              y={pitchToY(n.pitch, STAFF_LAYOUT)}
              fill={colorOf(n.pitch)}
              highlight={i === playingIndex}
              opacity={dragging ? 0.25 : 1}
              tail={n.long ? COLUMN_PITCH : 0}
            />
            {matched && (
              <text
                x={columnX(starts[i]) + 20}
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

      {/* お道具箱（右側）: 「ふつうの音」と「のばす音」が常駐 */}
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
      {/* 掴む的は符頭だけでなく箱の上下半分ぜんぶ（指1本で外しにくくする） */}
      <g
        data-testid="toolbox-normal"
        onPointerDown={(e) => handlePointerDown(e, false)}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ cursor: canNormal ? 'grab' : 'default' }}
      >
        <rect
          x={TOOLBOX_X}
          y={40}
          width={TOOLBOX_W}
          height={(VIEW_H - 80) / 2}
          fill="transparent"
        />
        <g className={showHint ? 'note-hint' : undefined}>
          <NoteHead
            x={TOOLBOX_CX}
            y={TOOLBOX_NORMAL_CY}
            opacity={canNormal ? 1 : 0.3}
          />
        </g>
      </g>
      <g
        data-testid="toolbox-long"
        onPointerDown={(e) => handlePointerDown(e, true)}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ cursor: canLong ? 'grab' : 'default' }}
      >
        <rect
          x={TOOLBOX_X}
          y={40 + (VIEW_H - 80) / 2}
          width={TOOLBOX_W}
          height={(VIEW_H - 80) / 2}
          fill="transparent"
        />
        <NoteHead
          x={TOOLBOX_CX - 22}
          y={TOOLBOX_LONG_CY}
          opacity={canLong ? 1 : 0.3}
          tail={44}
        />
      </g>

      {/* 起動ヒント: 指アイコン＋「さわってね」（読めない子にも指で直感誘発） */}
      {showHint && (
        <g aria-hidden="true">
          <text
            className="finger-poke"
            x={TOOLBOX_CX}
            y={TOOLBOX_NORMAL_CY + 52}
            textAnchor="middle"
            fontSize={48}
          >
            👆
          </text>
          <text
            x={TOOLBOX_CX}
            y={TOOLBOX_NORMAL_CY + 96}
            textAnchor="middle"
            fontSize={26}
            fontWeight="bold"
            fill="#6b6375"
          >
            さわってね
          </text>
        </g>
      )}

      {/* ドラッグ中のゴースト音符（拡大＋影で持ち上がり表現）。
          置けない場所（帯・鍵盤・ヘッダーの上）では指の位置に薄く追従させ、
          「ここでは音符にならない」を見せる（#59・行ハイライトも同時に消える）。 */}
      {drag &&
        (() => {
          const placeable = isOverPlacement(drag.x, drag.y)
          return (
            <NoteHead
              x={drag.x}
              y={placeable ? pitchToY(drag.pitch, STAFF_LAYOUT) : drag.y}
              fill={colorOf(drag.pitch)}
              opacity={placeable ? 0.9 : 0.35}
              scale={1.4}
              shadow
              tail={drag.long ? COLUMN_PITCH : 0}
            />
          )
        })()}

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
          tail={del.long ? COLUMN_PITCH : 0}
        />
      )}
    </svg>
  )
}
