import { useEffect, useRef } from 'react'
import { SONGS, type SongId, songOf } from '../lib/songs'
import { colorOf } from '../lib/colors'
import { CloseIcon } from './Icons'
import { SONG_ICON } from './songIcons'

/** おてほんの曲えらび（#106）。カードは曲の絵・名前・音の色の並び */
export default function SongPicker({
  current,
  onPick,
  onClose,
}: {
  current: SongId
  onPick: (id: SongId) => void
  onClose: () => void
}) {
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
        aria-label="きょくを えらぶ"
        className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col rounded-3xl bg-[#fdf6e3] p-4 shadow-xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-[#6b6375]">どの うたに する？</h2>
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
        <div className="grid min-h-0 flex-1 grid-cols-2 content-start gap-3 overflow-y-auto sm:grid-cols-4">
          {SONGS.map((s) => {
            const Icon = SONG_ICON[s.id]
            const notes = songOf(s.id, 'treble').notes
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onPick(s.id)}
                aria-label={s.name}
                aria-pressed={s.id === current}
                className={`flex flex-col items-center gap-2 rounded-2xl bg-white p-3 shadow active:scale-95 ${
                  s.id === current ? 'ring-4 ring-[#5b524b]/40' : ''
                }`}
              >
                <Icon width="56%" height="56%" />
                <span className="text-lg font-bold text-[#6b6375]">{s.name}</span>
                {/* 音の色の並び（のばす音は横長） */}
                <span className="flex flex-wrap justify-center gap-1" aria-hidden="true">
                  {notes.map((n, i) => (
                    <span
                      key={i}
                      className={`inline-block h-3.5 rounded-full border border-[#5b524b] ${n.long ? 'w-7' : 'w-3.5'}`}
                      style={{ background: colorOf(n.pitch) }}
                    />
                  ))}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
