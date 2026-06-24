import { useEffect, useRef, useState } from 'react'
import Board from './components/Board'
import { type PlacedNote, addNote } from './lib/notes'
import type { Pitch } from './lib/pitch'
import { CELEBRATE_MS, playbackSchedule } from './lib/playback'
import { ensureAudio, playNote } from './audio/synth'

export default function App() {
  const [notes, setNotes] = useState<PlacedNote[]>([])
  const [playingIndex, setPlayingIndex] = useState<number | null>(null)
  const [celebrating, setCelebrating] = useState(false)
  const timers = useRef<number[]>([])

  function clearTimers() {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }
  useEffect(() => clearTimers, [])

  const busy = playingIndex !== null || celebrating

  function handlePlace(pitch: Pitch) {
    if (busy) return
    setNotes((prev) => addNote(prev, pitch))
  }

  function handleClear() {
    clearTimers()
    setPlayingIndex(null)
    setCelebrating(false)
    setNotes([])
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
          onClick={handleClear}
          disabled={notes.length === 0}
          className="rounded-2xl bg-white px-6 py-3 text-xl font-bold text-[#6b6375] shadow disabled:opacity-40"
        >
          ↺ クリア
        </button>
      </header>
      <main className="min-h-0 flex-1">
        <Board
          notes={notes}
          onPlace={handlePlace}
          playingIndex={playingIndex}
          celebrating={celebrating}
        />
      </main>
    </div>
  )
}
