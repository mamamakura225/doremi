import { useEffect, useRef } from 'react'
import type { SavedSong } from '../lib/storage'
import BookCover from './BookCover'
import { CloseIcon, PlayIcon, ShelfIcon } from './Icons'
import Mascot from './Mascot'

interface Props {
  songs: SavedSong[]
  onSelect: (song: SavedSong) => void
  onClose: () => void
}

/**
 * つくった曲の本棚（端末内 localStorage の一覧・#109）。曲は木の棚に並んだ絵本で、表紙は
 * 曲の音から自動で描く（同じ曲は同じ表紙）。タップで盤面に読み込み再生。
 */
export default function Bookshelf({ songs, onSelect, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => closeRef.current?.focus(), [])
  return (
    <div
      className="absolute inset-0 z-20 flex flex-col bg-[#3d3530]/30 p-3"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="ほんだな"
        className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col rounded-3xl bg-[#fdf6e3] p-4 shadow-xl"
      >
        <div className="mb-3 flex shrink-0 items-center justify-between">
          <h2 className="flex items-center gap-2 text-2xl font-bold text-[#6b6375]">
            <ShelfIcon className="text-3xl" /> ほんだな
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
              <div className="h-16 w-40 rounded-b-lg border-x-4 border-b-8 border-[#c9a878] bg-[#f3d9ae]/50" />
            </div>
            <p className="text-center text-xl text-[#9a8f80]">まだ なにも ほぞんして いないよ</p>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl bg-[#f3d9ae] p-3">
            <ul className="grid grid-cols-3 gap-x-4 gap-y-5 sm:grid-cols-4">
              {songs.map((song) => (
                <li key={song.id} className="border-b-8 border-[#c9a878] pb-2">
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
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
