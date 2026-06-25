import { useEffect, useRef, useState } from 'react'
import Board from './components/Board'
import RotateOverlay from './components/RotateOverlay'
import { usePortrait } from './hooks/usePortrait'
import { type PlacedNote, addNote, removeLast } from './lib/notes'
import type { Pitch } from './lib/pitch'
import { CELEBRATE_MS, playbackSchedule } from './lib/playback'
import { TWINKLE } from './lib/songs'
import { ensureAudio, playNote, playSparkle } from './audio/synth'

export default function App() {
  const [notes, setNotes] = useState<PlacedNote[]>([])
  const [playingIndex, setPlayingIndex] = useState<number | null>(null)
  const [celebrating, setCelebrating] = useState(false)
  const [guide, setGuide] = useState(false)
  const timers = useRef<number[]>([])
  const portrait = usePortrait()

  function clearTimers() {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }
  useEffect(() => clearTimers, [])

  const busy = playingIndex !== null || celebrating
  const targets = guide ? TWINKLE.pitches : undefined

  function handlePlace(pitch: Pitch) {
    if (busy) return
    const idx = notes.length
    // お手本と一致したら控えめなキラキラ音（不一致でも普通に置ける・×なし）
    if (targets?.[idx]?.note === pitch.note) playSparkle()
    setNotes((prev) => addNote(prev, pitch))
  }

  function resetBoard() {
    clearTimers()
    setPlayingIndex(null)
    setCelebrating(false)
    setNotes([])
  }

  function handleClear() {
    resetBoard()
  }

  function toggleGuide() {
    resetBoard()
    setGuide((g) => !g)
  }

  function handleUndo() {
    if (busy) return
    setNotes((prev) => removeLast(prev))
  }

  async function handlePlay() {
    if (busy || notes.length === 0) return
    await ensureAudio()
    const { ticks, endAt } = playbackSchedule(notes.length)
    for (const tick of ticks) {
      timers.current.push(
        window.setTimeout(() => {
          playNote(notes[tick.index].pitch.note)
          setPlayingIndex(tick.index)
        }, tick.at),
      )
    }
    timers.current.push(
      window.setTimeout(() => {
        setPlayingIndex(null)
        setCelebrating(true)
        timers.current.push(
          window.setTimeout(() => setCelebrating(false), CELEBRATE_MS),
        )
      }, endAt),
    )
  }

  return (
    <div className="flex h-full w-full flex-col bg-[#fdf6e3]">
      {portrait && <RotateOverlay />}
      <header className="flex shrink-0 gap-3 p-3">
        <button
          type="button"
          onClick={handlePlay}
          disabled={busy || notes.length === 0}
          className="rounded-2xl bg-[#22c55e] px-6 py-3 text-xl font-bold text-white shadow disabled:opacity-40"
        >
          ▶ さいせい
        </button>
        <button
          type="button"
          onClick={handleUndo}
          disabled={busy || notes.length === 0}
          className="rounded-2xl bg-white px-6 py-3 text-xl font-bold text-[#6b6375] shadow disabled:opacity-40"
        >
          ↩ ひとつもどる
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={notes.length === 0}
          className="rounded-2xl bg-white px-6 py-3 text-xl font-bold text-[#6b6375] shadow disabled:opacity-40"
        >
          ↺ クリア
        </button>
        <button
          type="button"
          onClick={toggleGuide}
          disabled={busy}
          className={`ml-auto rounded-2xl px-6 py-3 text-xl font-bold shadow disabled:opacity-40 ${
            guide ? 'bg-[#f59e0b] text-white' : 'bg-white text-[#6b6375]'
          }`}
        >
          {guide ? '🎵 おてほん' : '✏️ じゆう'}
        </button>
      </header>
      <main className="min-h-0 flex-1">
        <Board
          notes={notes}
          onPlace={handlePlace}
          playingIndex={playingIndex}
          celebrating={celebrating}
          targets={targets}
        />
      </main>
    </div>
  )
}
