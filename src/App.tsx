import { useEffect, useRef, useState } from 'react'
import Board from './components/Board'
import Bookshelf from './components/Bookshelf'
import RotateOverlay from './components/RotateOverlay'
import { usePortrait } from './hooks/usePortrait'
import { type PlacedNote, addNote, removeById, removeLast } from './lib/notes'
import { type Pitch, pitchByNote } from './lib/pitch'
import { CELEBRATE_MS, playbackSchedule } from './lib/playback'
import { TWINKLE } from './lib/songs'
import { type SavedSong, loadSongs, saveSong } from './lib/storage'
import {
  type Voice,
  VOICES,
  ensureAudio,
  playMelodyNote,
  playSparkle,
  setPlaybackVoice,
} from './audio/synth'

export default function App() {
  const [notes, setNotes] = useState<PlacedNote[]>([])
  const [playingIndex, setPlayingIndex] = useState<number | null>(null)
  const [celebrating, setCelebrating] = useState(false)
  const [guide, setGuide] = useState(false)
  const [savedSongs, setSavedSongs] = useState<SavedSong[]>(() => loadSongs())
  const [shelfOpen, setShelfOpen] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const [voice, setVoice] = useState<Voice>('piano')
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

  function handleRemove(id: string) {
    if (busy) return
    setNotes((prev) => removeById(prev, id))
  }

  function handleSave() {
    if (busy || notes.length === 0) return
    setSavedSongs(saveSong(notes.map((n) => n.pitch.note)))
    setJustSaved(true)
    timers.current.push(window.setTimeout(() => setJustSaved(false), 1200))
  }

  // 本棚から選んだ曲を盤面に読み込み、そのまま再生（自由モード扱い）。
  function handleSelectSong(song: SavedSong) {
    const seq = song.notes
      .map(pitchByNote)
      .filter((p): p is Pitch => !!p)
      .reduce<PlacedNote[]>((acc, pitch) => addNote(acc, pitch), [])
    setShelfOpen(false)
    setGuide(false)
    setNotes(seq)
    void playSequence(seq)
  }

  async function playSequence(seq: PlacedNote[]) {
    if (seq.length === 0) return
    clearTimers()
    await ensureAudio()
    const { ticks, endAt } = playbackSchedule(seq.length)
    for (const tick of ticks) {
      timers.current.push(
        window.setTimeout(() => {
          playMelodyNote(seq[tick.index].pitch.note)
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

  function handlePlay() {
    if (busy || notes.length === 0) return
    void playSequence(notes)
  }

  // 再生音色を選ぶ。選んだ瞬間にその音色で試聴（タップ＝AudioContext起動も兼ねる）。
  function handleSelectVoice(v: Voice) {
    setVoice(v)
    setPlaybackVoice(v)
    void ensureAudio().then(() => playMelodyNote('C5'))
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
        <div
          className="flex items-center gap-1 rounded-2xl bg-white px-2 py-1 shadow"
          role="group"
          aria-label="さいせいの おと"
        >
          {VOICES.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => handleSelectVoice(v.id)}
              aria-pressed={voice === v.id}
              className={`rounded-xl px-3 py-2 text-2xl ${
                voice === v.id ? 'bg-[#f59e0b]' : 'bg-transparent'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
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
          onClick={handleSave}
          disabled={busy || notes.length === 0}
          className="rounded-2xl bg-white px-6 py-3 text-xl font-bold text-[#6b6375] shadow disabled:opacity-40"
        >
          {justSaved ? '✓ ほぞんした' : '💾 ほぞん'}
        </button>
        <button
          type="button"
          onClick={() => setShelfOpen(true)}
          disabled={busy}
          className="rounded-2xl bg-white px-6 py-3 text-xl font-bold text-[#6b6375] shadow disabled:opacity-40"
        >
          📚 ほんだな
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
      <main className="relative min-h-0 flex-1">
        <Board
          notes={notes}
          onPlace={handlePlace}
          onRemove={handleRemove}
          playingIndex={playingIndex}
          celebrating={celebrating}
          targets={targets}
        />
        {shelfOpen && (
          <Bookshelf
            songs={savedSongs}
            onSelect={handleSelectSong}
            onClose={() => setShelfOpen(false)}
          />
        )}
      </main>
    </div>
  )
}
