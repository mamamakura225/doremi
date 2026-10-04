import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ensureAudio, playNote, playSparkle } from '../audio/synth'
import { OUTLINE_COLOR, PAPER, PAPER_EDGE, TOOLBOX_NOTE_COLOR, colorOf } from '../lib/colors'
import { type Judge, judge } from '../lib/ear'
import {
  READING_KEY_LEFT,
  READING_KEY_RIGHT,
  READING_KEY_TOP,
  READING_NOTE_X,
  READING_PANEL_W,
  READING_PAPER_BOTTOM,
  READING_PAPER_TOP,
  READING_PANEL_X,
  READING_STAFF_RIGHT,
  READING_VIEW_H,
  READING_VIEW_Y,
  STAFF_LAYOUT,
  VIEW_W,
} from '../lib/layout'
import { type Pitch, pitchToY, stemDown } from '../lib/pitch'
import {
  HINT_AFTER_MISSES,
  READ_PER_STAGE,
  type Weak,
  counts,
  missed,
  nextReading,
  readFirstTry,
} from '../lib/reading'
import { Arrow, EarIcon } from './EarPanel'
import Keyboard from './Keyboard'
import Mascot from './Mascot'
import NoteHead, { NoteDefs } from './NoteHead'
import Sparkles from './Sparkles'
import Staff from './Staff'

/** よめた！から次の問題まで／押した音のあとに正しい音を鳴らすまで／同じ問題に戻るまで（ms・ききとりと揃える） */
export const READ_NEXT_MS = 1400
export const READ_COMPARE_MS = 700
export const READ_RETRY_MS = 1900

/** 紙（五線と案内パネルを載せる）。上下の範囲は layout.ts（鍵盤との関係をテストで固定） */
const PAPER_X = 20
const PAPER_W = VIEW_W - 40

/** 五線の最下線の1間下（下加線の位置）。ここより下の音には加線を描く */
const LEDGER_Y = STAFF_LAYOUT.topLineY + 5 * STAFF_LAYOUT.staffSpace

/** 1問の進み具合。ask=答えを待つ／right=よめた（次の問題まで）／wrong=くらべている（同じ問題に戻るまで） */
type Phase = 'ask' | 'right' | 'wrong'

interface Props {
  /** 最初の問題。App がおとなメニューのクリックの中で決めて鳴らす（音の解錠をタップと同じ tick にするため） */
  first: Pitch
  /** いまの段階（0 始まり）。次の問題はこの段階の音から出す */
  stage: number
  /** いまの段階でよめた数（点で見せる） */
  count: number
  /** 苦手の重み。App が持つ（開いている間だけ・段階を変えても残す） */
  weak: { current: Weak }
  /** よめた。counted=false はヒントのあとの正解（よめた数・シールには入れない） */
  onRead: (counted: boolean) => void
}

/**
 * よみとりあそび（#155）。五線の音符（色なし）を見て、鍵盤で答える。
 * 盤面（Board）には相乗りしない——置く・捨てる・10列が要らず、鍵盤をスマホ横でも出すために
 * viewBox を別に持つ（理由は docs/architecture.md）。ト音記号だけ。
 */
export default function ReadingGame({ first, stage, count, weak, onRead }: Props) {
  const [target, setTarget] = useState(first)
  const [phase, setPhase] = useState<Phase>('ask')
  // 押下の判定は state の反映を待たずに止める（同じ tick に2本目の指・連打が来ても1回の答えにする）
  const phaseRef = useRef<Phase>('ask')
  const [result, setResult] = useState<Judge | null>(null)
  const [pressed, setPressed] = useState<string | null>(null)
  const [misses, setMisses] = useState(0)
  // いまの「よめた」を数えたか（段階をクリアした瞬間は count が 0 に戻るので、そのあいだ点を全部埋めて見せる）
  const [counted, setCounted] = useState(false)
  // 次の問題のタイマーが発火するときの段階（よめて段階が上がった直後は新しい段階から出す）
  const stageRef = useRef(stage)
  stageRef.current = stage
  const timers = useRef<number[]>([])

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])

  // ロックを外すのは、新しい問題が描画に反映されてから。タイマーの中で ref を先に外すと、描画までの
  // 隙間に来た押下が古い問題（古い target・misses を掴んだ answer）で判定される
  useLayoutEffect(() => {
    if (phase === 'ask') phaseRef.current = 'ask'
  }, [phase])

  /** 答えを受け付けない側（right / wrong）へは即時に閉じる */
  function close(next: Phase) {
    phaseRef.current = next
    setPhase(next)
  }

  /** 音は飾り。失敗しても操作は止めない（モノフォニックの synth は同じ時刻の2回目で例外を投げる・#116） */
  function sound(fn: () => void) {
    try {
      fn()
    } catch {
      // 鳴らなくてよい
    }
  }

  function answer(p: Pitch) {
    if (phaseRef.current !== 'ask') return
    // 鍵盤（Board）と同じく、押すたびに音の準備を促す（ピアノの録音の読み込みを再試行する）
    void ensureAudio().catch(() => {})
    sound(() => playNote(p.note))
    const res = judge(p, target)
    setPressed(p.note)
    setResult(res)
    if (res === 'same') {
      close('right')
      setCounted(counts(misses))
      if (misses === 0) weak.current = readFirstTry(weak.current, target.note)
      sound(playSparkle)
      onRead(counts(misses))
      const prev = target
      timers.current.push(
        window.setTimeout(() => {
          const q = nextReading(stageRef.current, prev, weak.current, Math.random)
          setTarget(q)
          setMisses(0)
          setPressed(null)
          setResult(null)
          setPhase('ask')
          sound(() => playNote(q.note))
        }, READ_NEXT_MS),
      )
      return
    }
    close('wrong')
    // 苦手の重みは1問につき1回（同じ問題で何度まちがえても積み増さない）
    if (misses === 0) weak.current = missed(weak.current, target.note)
    setMisses((m) => m + 1)
    const t = target
    timers.current.push(
      window.setTimeout(() => sound(() => playNote(t.note)), READ_COMPARE_MS),
      window.setTimeout(() => {
        setPressed(null)
        setResult(null)
        setPhase('ask')
      }, READ_RETRY_MS),
    )
  }

  const y = pitchToY(target, STAFF_LAYOUT)
  const solved = phase === 'right'
  // 段階をクリアした「よめた！」のあいだは、count が 0 に戻っていても点を全部埋めて見せる
  const dots = solved && counted && count === 0 ? READ_PER_STAGE : count
  const hint = phase === 'ask' && misses >= HINT_AFTER_MISSES ? target.note : null
  const panelCx = READING_PANEL_X + READING_PANEL_W / 2

  return (
    <svg
      viewBox={`0 ${READING_VIEW_Y} ${VIEW_W} ${READING_VIEW_H}`}
      preserveAspectRatio="xMidYMid meet"
      className="h-full w-full select-none"
      style={{ touchAction: 'none' }}
      role="application"
      aria-label="よみとりの がめん"
    >
      <NoteDefs />
      <rect
        data-testid="reading-paper"
        x={PAPER_X}
        y={READING_PAPER_TOP}
        width={PAPER_W}
        height={READING_PAPER_BOTTOM - READING_PAPER_TOP}
        rx={36}
        fill={PAPER}
        stroke={PAPER_EDGE}
        strokeWidth={2}
        filter="url(#note-shadow-soft)"
      />
      {/* 五線と音部記号だけ。ドレミラベル・ド足場ガイドは答えになるので出さない */}
      <Staff clef="treble" bare right={READING_STAFF_RIGHT} />

      {/* 問題の音符。答えるまでは音の色を付けない（お道具箱と同じミルクチョコ色）。
          足場ガイドを出さないので、ドには本物の楽譜と同じ下加線を描く */}
      <g data-testid="reading-note" data-solved={solved}>
        {y >= LEDGER_Y && (
          <line
            data-testid="ledger"
            x1={READING_NOTE_X - 30}
            y1={LEDGER_Y}
            x2={READING_NOTE_X + 30}
            y2={LEDGER_Y}
            stroke={OUTLINE_COLOR}
            strokeWidth={3}
            strokeLinecap="round"
          />
        )}
        <NoteHead
          x={READING_NOTE_X}
          y={y}
          fill={solved ? colorOf(target) : TOOLBOX_NOTE_COLOR}
          stemDown={stemDown(target)}
        />
        {solved && (
          <>
            <text
              x={READING_NOTE_X + 70}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={40}
              fontWeight={900}
              fill={colorOf(target)}
              stroke={OUTLINE_COLOR}
              strokeWidth={1.6}
              paintOrder="stroke"
            >
              {target.solfa}
            </text>
            <Sparkles x={READING_NOTE_X} y={y} color={colorOf(target)} />
          </>
        )}
      </g>

      {/* 案内パネル（紙の右側）。viewBox の中に描くので、端末ごとの余白で五線との位置がずれない */}
      <g
        role="button"
        tabIndex={0}
        aria-label="もういちど きく"
        style={{ cursor: 'pointer' }}
        onClick={() => sound(() => playNote(target.note))}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') sound(() => playNote(target.note))
        }}
      >
        <rect x={READING_PANEL_X + 10} y={126} width={READING_PANEL_W - 20} height={76} rx={38} fill="#fff" stroke={OUTLINE_COLOR} strokeWidth={2.5} />
        <EarIcon x={READING_PANEL_X + 34} y={142} width={44} height={44} />
        <text x={panelCx + 26} y={165} textAnchor="middle" dominantBaseline="middle" fontSize={32} fontWeight="bold" fill="#6b6375">
          もういちど きく
        </text>
      </g>
      {/* この段階でよめた数（5つで次の段階へ）。点数としては見せない */}
      <g role="img" aria-label={`${dots} こ よめた`}>
        {Array.from({ length: READ_PER_STAGE }, (_, i) => (
          <circle
            key={i}
            cx={panelCx + (i - (READ_PER_STAGE - 1) / 2) * 44}
            cy={240}
            r={13}
            fill={i < dots ? '#ffe38f' : 'none'}
            stroke={OUTLINE_COLOR}
            strokeWidth={3}
          />
        ))}
      </g>
      <g role="status">
        {result === 'same' && (
          <g>
            <Mascot mood="banzai" x={READING_PANEL_X + 40} y={280} width={96} height={96} />
            <text x={panelCx + 40} y={330} textAnchor="middle" dominantBaseline="middle" fontSize={40} fontWeight="bold" fill="#6b6375">
              よめた！
            </text>
          </g>
        )}
        {(result === 'higher' || result === 'lower') && (
          <g>
            <Arrow up={result === 'higher'} x={READING_PANEL_X + 34} y={304} width={52} height={52} />
            <text x={panelCx + 30} y={330} textAnchor="middle" dominantBaseline="middle" fontSize={36} fontWeight="bold" fill="#6b6375">
              {result === 'higher' ? 'もっと たかい' : 'もっと ひくい'}
            </text>
          </g>
        )}
      </g>

      <Keyboard
        clef="treble"
        onPress={answer}
        pressed={pressed}
        hint={hint}
        blockBlackKeys
        top={READING_KEY_TOP}
        left={READING_KEY_LEFT}
        right={READING_KEY_RIGHT}
      />
    </svg>
  )
}
