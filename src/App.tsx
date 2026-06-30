import { useEffect, useRef, useState } from 'react'
import Board from './components/Board'
import Bookshelf from './components/Bookshelf'
import RotateOverlay from './components/RotateOverlay'
import { usePortrait } from './hooks/usePortrait'
import { type PlacedNote, addNote, removeById, removeLast } from './lib/notes'
import { canAddPage, toNoteNames } from './lib/pages'
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

interface Playing {
  page: number
  index: number
}

export default function App() {
  const [pages, setPages] = useState<PlacedNote[][]>([[]])
  const [currentPage, setCurrentPage] = useState(0)
  const [playing, setPlaying] = useState<Playing | null>(null)
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

  const notes = pages[currentPage]
  const busy = playing !== null || celebrating
  // おてほんは1フレーズ＝1ページめのみを対象にする。
  const targets = guide && currentPage === 0 ? TWINKLE.pitches : undefined

  function updateCurrentPage(fn: (page: PlacedNote[]) => PlacedNote[]) {
    setPages((prev) => prev.map((pg, i) => (i === currentPage ? fn(pg) : pg)))
  }

  function handlePlace(pitch: Pitch) {
    if (busy) return
    const idx = notes.length
    // お手本と一致したら控えめなキラキラ音（不一致でも普通に置ける・×なし）
    if (targets?.[idx]?.note === pitch.note) playSparkle()
    updateCurrentPage((pg) => addNote(pg, pitch))
  }

  function resetBoard() {
    clearTimers()
    setPlaying(null)
    setCelebrating(false)
    setPages([[]])
    setCurrentPage(0)
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
    updateCurrentPage((pg) => removeLast(pg))
  }

  function handleRemove(id: string) {
    if (busy) return
    updateCurrentPage((pg) => removeById(pg, id))
  }

  // ページ移動。つぎは「次ページへ」または末尾満杯時の「新ページ追加」を兼ねる。
  const hasNextPage = currentPage < pages.length - 1
  const canCreatePage = canAddPage(pages, currentPage)
  const showPrev = currentPage > 0 && !busy
  const showNext = (hasNextPage || canCreatePage) && !busy

  function handlePrev() {
    if (showPrev) setCurrentPage((c) => c - 1)
  }

  function handleNext() {
    if (busy) return
    if (hasNextPage) {
      setCurrentPage((c) => c + 1)
    } else if (canCreatePage) {
      setPages((prev) => [...prev, []])
      setCurrentPage((c) => c + 1)
    }
  }

  function handleSave() {
    if (busy) return
    const songPages = toNoteNames(pages)
    if (songPages.length === 0) return
    setSavedSongs(saveSong(songPages))
    setJustSaved(true)
    timers.current.push(window.setTimeout(() => setJustSaved(false), 1200))
  }

  // 本棚から選んだ曲を盤面に読み込み、そのまま再生（自由モード扱い）。
  function handleSelectSong(song: SavedSong) {
    const pgs = song.pages.map((names) =>
      names
        .map(pitchByNote)
        .filter((p): p is Pitch => !!p)
        .reduce<PlacedNote[]>((acc, pitch) => addNote(acc, pitch), []),
    )
    const loaded = pgs.length > 0 ? pgs : [[]]
    setShelfOpen(false)
    setGuide(false)
    setPages(loaded)
    setCurrentPage(0)
    void playSequence(loaded)
  }

  async function playSequence(pgs: PlacedNote[][]) {
    const counts = pgs.map((p) => p.length)
    if (counts.every((c) => c === 0)) return
    clearTimers()
    await ensureAudio()
    const { ticks, endAt } = playbackSchedule(counts)
    for (const tick of ticks) {
      timers.current.push(
        window.setTimeout(() => {
          playMelodyNote(pgs[tick.page][tick.index].pitch.note)
          setCurrentPage(tick.page)
          setPlaying({ page: tick.page, index: tick.index })
        }, tick.at),
      )
    }
    timers.current.push(
      window.setTimeout(() => {
        setPlaying(null)
        setCelebrating(true)
        timers.current.push(
          window.setTimeout(() => setCelebrating(false), CELEBRATE_MS),
        )
      }, endAt),
    )
  }

  const empty = toNoteNames(pages).length === 0

  function handlePlay() {
    if (busy || empty) return
    void playSequence(pages)
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
          disabled={busy || empty}
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
          disabled={empty}
          className="rounded-2xl bg-white px-6 py-3 text-xl font-bold text-[#6b6375] shadow disabled:opacity-40"
        >
          ↺ クリア
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={busy || empty}
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
          playingIndex={playing?.page === currentPage ? playing.index : null}
          celebrating={celebrating}
          targets={targets}
        />
        {!shelfOpen && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex items-center justify-between px-6">
            {showPrev ? (
              <button
                type="button"
                onClick={handlePrev}
                className="pointer-events-auto rounded-2xl bg-white px-7 py-4 text-2xl font-bold text-[#6b6375] shadow-lg active:scale-95"
              >
                ⬅ まえ
              </button>
            ) : (
              <span />
            )}
            {pages.length > 1 && (
              <div
                className="flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 shadow"
                aria-label={`${currentPage + 1}ページめ / ぜんぶで${pages.length}ページ`}
              >
                {pages.map((_, i) => (
                  <span
                    key={i}
                    className={`h-3.5 w-3.5 rounded-full ${
                      i === currentPage ? 'bg-[#f59e0b]' : 'bg-[#d8c9a6]'
                    }`}
                  />
                ))}
              </div>
            )}
            {showNext ? (
              <button
                type="button"
                onClick={handleNext}
                className="pointer-events-auto rounded-2xl bg-[#38bdf8] px-7 py-4 text-2xl font-bold text-white shadow-lg active:scale-95"
              >
                {canCreatePage && !hasNextPage ? 'つぎのうた ➔' : 'つぎ ➔'}
              </button>
            ) : (
              <span />
            )}
          </div>
        )}
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
