import { useEffect, useRef, useState } from 'react'
import type { Clef } from '../lib/pitch'
import { BearIcon, BellIcon, BirdIcon, ClearIcon, CloseIcon, FreeIcon, GearIcon, GuideIcon } from './Icons'

/** ⚙ を押し続けてメニューが開くまでの時間（短いタップでは開かない＝子どもの誤操作よけ） */
export const HOLD_MS = 1500

/** 短く押して離したときに「ながおし してね」を出しておく時間（ms・#139） */
export const HOLD_HINT_MS = 2000

interface ButtonProps {
  onOpen: () => void
  /** 丸ボタンの大きさ（ヘッダーと揃える） */
  sizeClass: string
}

/**
 * おとなメニューを開く ⚙（#102）。HOLD_MS 押し続けると開く。途中で離す・指が外れると取り消し。
 * 押している間はまわりのリングが満ちていく（reduced-motion ではリングは出ない）。
 * キーボード（Enter/Space）や読み上げの操作（どちらも detail=0 の click になる）ではすぐ開く——
 * それを使うのは大人なので。指やマウスのクリック（detail≥1）では開かない。
 */
export function AdultMenuButton({ onOpen, sizeClass }: ButtonProps) {
  const [holding, setHolding] = useState(false)
  // 短く押して離したら、長押しで開くことを教える（大人が「押せない」と受け取った・#139）
  const [hint, setHint] = useState(false)
  const timer = useRef(0)
  const hintTimer = useRef(0)
  useEffect(
    () => () => {
      window.clearTimeout(timer.current)
      window.clearTimeout(hintTimer.current)
    },
    [],
  )

  function start() {
    window.clearTimeout(timer.current)
    window.clearTimeout(hintTimer.current)
    setHint(false)
    setHolding(true)
    timer.current = window.setTimeout(() => {
      timer.current = 0
      setHolding(false)
      onOpen()
    }, HOLD_MS)
  }
  function cancel() {
    window.clearTimeout(timer.current)
    timer.current = 0
    setHolding(false)
  }
  function release() {
    // まだ開いていない（長押しの途中で離した）ときだけ教える。指が外れた取り消しでは出さない
    if (timer.current !== 0) {
      setHint(true)
      window.clearTimeout(hintTimer.current)
      hintTimer.current = window.setTimeout(() => setHint(false), HOLD_HINT_MS)
    }
    cancel()
  }

  return (
    <button
      type="button"
      aria-label="おとなの メニュー（ながおし）"
      onPointerDown={start}
      onPointerUp={release}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onContextMenu={(e) => e.preventDefault()}
      onClick={(e) => {
        if (e.detail === 0) onOpen()
      }}
      className={`relative ml-auto grid shrink-0 place-items-center rounded-full bg-white/90 text-[#9a8f80] shadow ${sizeClass}`}
    >
      <GearIcon width="62%" height="62%" />
      {holding && (
        <svg className="pointer-events-none absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 40 40" aria-hidden="true">
          <circle cx={20} cy={20} r={18} fill="none" stroke="#5b524b" strokeWidth={3} className="hold-ring" />
        </svg>
      )}
      {hint && (
        <span
          role="status"
          className="pointer-events-none absolute top-full right-0 z-30 mt-2 rounded-xl bg-white px-3 py-1 text-base font-bold whitespace-nowrap text-[#6b6375] shadow"
        >
          ながおし してね
        </span>
      )}
    </button>
  )
}

interface MenuProps {
  clef: Clef
  guide: boolean
  /** ききとりあそび中か（#110） */
  ear: boolean
  busy: boolean
  empty: boolean
  onClear: () => void
  onToggleClef: () => void
  onToggleGuide: () => void
  onToggleEar: () => void
  onClose: () => void
}

const ROW =
  'flex w-full items-center gap-3 rounded-2xl bg-white px-5 py-3 text-left text-xl font-bold text-[#6b6375] shadow disabled:opacity-40'

/** 子どもに触らせたくない操作をまとめたパネル（#102）。選ぶと閉じる。 */
export default function AdultMenu({
  clef,
  guide,
  ear,
  busy,
  empty,
  onClear,
  onToggleClef,
  onToggleGuide,
  onToggleEar,
  onClose,
}: MenuProps) {
  const act = (fn: () => void) => () => {
    fn()
    onClose()
  }
  // 開いたら「とじる」にフォーカスを移し、Escape で閉じる（背景の inert 化は #64）
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => closeRef.current?.focus(), [])
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#3d3530]/30 p-4"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="おとなの メニュー"
        className="flex max-h-full w-full max-w-md flex-col gap-3 overflow-y-auto rounded-3xl bg-[#fdf6e3] p-5 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#6b6375]">おとなの メニュー</h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="とじる"
            className="flex items-center gap-2 rounded-2xl bg-white px-5 py-2 text-xl font-bold text-[#6b6375] shadow"
          >
            <CloseIcon /> とじる
          </button>
        </div>
        {/* ↺ は再生中も押せる（非常停止を兼ねて曲ごと消す）。止めるだけなら ⏹ */}
        <button type="button" aria-label="ぜんぶけす" disabled={empty} onClick={act(onClear)} className={ROW}>
          <ClearIcon className="shrink-0 text-3xl" /> ぜんぶ けす
        </button>
        {/* 「ト音／ヘ音」は子どもに通じないので、ことり＝高い／くま＝低い で見せる */}
        <button type="button" aria-label="おとの たかさ" disabled={busy} onClick={act(onToggleClef)} className={ROW}>
          {clef === 'bass' ? <BearIcon className="shrink-0 text-3xl" /> : <BirdIcon className="shrink-0 text-3xl" />}
          {clef === 'bass' ? 'くま（ヘ音）→ ことりに する' : 'ことり（ト音）→ くまに する'}
        </button>
        <button
          type="button"
          aria-label={guide ? 'おてほん' : 'じゆう'}
          disabled={busy}
          onClick={act(onToggleGuide)}
          className={ROW}
        >
          {guide ? <GuideIcon className="shrink-0 text-3xl" /> : <FreeIcon className="shrink-0 text-3xl" />}
          {guide ? 'おてほん → じゆうに する' : 'じゆう → おてほんに する'}
        </button>
        {/* ききとりあそび（#110）: 鳴った音を五線で探す。採点しない */}
        <button type="button" aria-label="ききとり" disabled={busy} onClick={act(onToggleEar)} className={ROW}>
          <BellIcon className="shrink-0 text-3xl" />
          {ear ? 'ききとり → じゆうに する' : 'ききとり あそび（なった おとを さがす）'}
        </button>
      </div>
    </div>
  )
}
