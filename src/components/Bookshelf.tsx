import { useEffect, useRef, useState } from 'react'
import type { SavedSong } from '../lib/storage'
import BookCover from './BookCover'
import { CloseIcon, PlayIcon, ShelfIcon, TrashIcon } from './Icons'
import Mascot from './Mascot'
import { WOOD } from '../lib/colors'

/** 棚板の色（木の地 WOOD より濃い） */
const WOOD_EDGE = '#c9a878'

interface Props {
  songs: SavedSong[]
  onSelect: (song: SavedSong) => void
  onClose: () => void
  /**
   * 「せいり」の本棚（おとなメニューから開く・#142）。本を押しても再生せず、けす ボタンを出す。
   * 子どもが開く本棚には消す手段を出さない
   */
  tidy?: boolean
  onDelete?: (song: SavedSong) => void
}

/**
 * つくった曲の本棚（端末内 localStorage の一覧・#109）。曲は木の棚に並んだ絵本で、表紙は
 * 曲の音から自動で描く（同じ曲は同じ表紙）。タップで盤面に読み込み再生。
 */
export default function Bookshelf({ songs, onSelect, onClose, tidy = false, onDelete }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => closeRef.current?.focus(), [])
  // せいり: けす前に1冊ずつ確かめる
  const [confirming, setConfirming] = useState<SavedSong | null>(null)
  return (
    <div
      className="absolute inset-0 z-20 flex flex-col bg-[#3d3530]/30 p-3"
      onKeyDown={(e) => {
        if (e.key !== 'Escape') return
        // 確かめている途中なら、まずそれを取りやめる
        if (confirming) setConfirming(null)
        else onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={tidy ? 'ほんだなを せいり' : 'ほんだな'}
        className="relative mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col rounded-3xl bg-[#fdf6e3] p-4 shadow-xl"
      >
        <div className="mb-3 flex shrink-0 items-center justify-between">
          <h2 className="flex items-center gap-2 text-2xl font-bold text-[#6b6375]">
            <ShelfIcon className="text-3xl" /> {tidy ? 'ほんだなを せいり' : 'ほんだな'}
          </h2>
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

        {songs.length === 0 ? (
          // 空: 空っぽの棚とびっくりしたぴぴ（文字は添えるだけ）
          <div className="flex flex-1 flex-col items-center justify-center gap-3">
            <div className="flex items-end gap-2">
              <div className="w-24">
                <Mascot mood="surprised" width="100%" height="100%" />
              </div>
              <div
                className="h-16 w-40 rounded-b-lg border-x-4 border-b-8"
                style={{ borderColor: WOOD_EDGE, background: `${WOOD}80` }}
              />
            </div>
            <p className="text-center text-xl text-[#9a8f80]">まだ なにも ほぞんして いないよ</p>
          </div>
        ) : (
          // 横向きスマホ（棚の見える高さ ~195px）でも1段が収まるよう、本は小さめに多く並べる
          <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl p-3" style={{ background: WOOD }}>
            <ul className="grid grid-cols-4 gap-x-3 gap-y-4 sm:grid-cols-6">
              {songs.map((song) => (
                <li key={song.id} className="border-b-8 pb-2" style={{ borderColor: WOOD_EDGE }}>
                  {tidy ? (
                    <button
                      type="button"
                      onClick={() => setConfirming(song)}
                      aria-label="この きょくを けす"
                      className="flex w-full flex-col items-center gap-1 active:scale-95"
                    >
                      <span className="w-full opacity-80 drop-shadow-md">
                        <BookCover pages={song.pages} clef={song.clef} />
                      </span>
                      <span className="flex items-center gap-1 rounded-full bg-white px-2 text-base font-bold text-[#b91c1c]">
                        <TrashIcon /> けす
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSelect(song)}
                      className="flex w-full flex-col items-center gap-1 active:scale-95"
                    >
                      <span className="w-full drop-shadow-md">
                        <BookCover pages={song.pages} clef={song.clef} />
                      </span>
                      <span className="flex items-center gap-1 text-base font-bold text-[#22c55e]">
                        <PlayIcon /> きく
                      </span>
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        {confirming && (
          <div
            role="alertdialog"
            aria-modal="true"
            aria-label="この きょくを けしますか"
            className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl bg-[#3d3530]/40 p-4"
          >
            <div className="flex items-center gap-4 rounded-3xl bg-[#fdf6e3] p-5 shadow-xl">
              <span className="w-20 shrink-0 drop-shadow-md">
                <BookCover pages={confirming.pages} clef={confirming.clef} />
              </span>
              <div className="flex flex-col gap-3">
                <p className="text-xl font-bold text-[#6b6375]">この きょくを けしますか？</p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      onDelete?.(confirming)
                      setConfirming(null)
                    }}
                    className="rounded-2xl bg-[#b91c1c] px-5 py-2 text-xl font-bold text-white shadow"
                  >
                    けす
                  </button>
                  <button
                    type="button"
                    autoFocus
                    onClick={() => setConfirming(null)}
                    className="rounded-2xl bg-white px-5 py-2 text-xl font-bold text-[#6b6375] shadow"
                  >
                    やめる
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
