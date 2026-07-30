import { useEffect, useRef, useState } from 'react'
import Board from './components/Board'
import Bookshelf from './components/Bookshelf'
import RotateOverlay from './components/RotateOverlay'
import { usePortrait } from './hooks/usePortrait'
import { useShortScreen } from './hooks/useShortScreen'
import { type PlacedNote, addNote, noteWidth, removeById, removeLast } from './lib/notes'
import { canAddPage, parseNoteName, toNoteNames } from './lib/pages'
import { type Clef, type Pitch, pitchByNote } from './lib/pitch'
import { CELEBRATE_MS, noteDuration, playbackSchedule } from './lib/playback'
import { TWINKLE } from './lib/songs'
import { type SavedSong, loadSongs, saveSong } from './lib/storage'
import {
  type Voice,
  VOICES,
  ensureAudio,
  playMelodyNote,
  playSparkle,
  setClef,
  setPlaybackVoice,
  stopMelodySpeech,
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
  const [clef, setClefMode] = useState<Clef>('treble')
  const timers = useRef<number[]>([])
  const portrait = usePortrait()
  // 縦が短い画面（横向きスマホ）ではヘッダーを絵文字だけに畳む。
  // 文字を並べるとボタンが潰れてラベルが縦に折り返し、ヘッダーが画面の6割を食う。
  const compact = useShortScreen()
  const pad = compact ? 'px-3 py-2' : 'px-6 py-3'
  const label = (icon: string, text: string) => (compact ? icon : `${icon} ${text}`)

  function clearTimers() {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
    stopMelodySpeech()
  }
  useEffect(() => clearTimers, [])

  const notes = pages[currentPage]
  const busy = playing !== null || celebrating
  // おてほんは1フレーズ＝1ページめのみを対象にする。
  const targets = guide && currentPage === 0 ? TWINKLE[clef].pitches : undefined

  function updateCurrentPage(fn: (page: PlacedNote[]) => PlacedNote[]) {
    setPages((prev) => prev.map((pg, i) => (i === currentPage ? fn(pg) : pg)))
  }

  function handlePlace(pitch: Pitch, long: boolean) {
    if (busy) return
    const idx = notes.length
    // お手本と一致したら控えめなキラキラ音（不一致でも普通に置ける・×なし）
    if (targets?.[idx]?.note === pitch.note) playSparkle()
    updateCurrentPage((pg) => addNote(pg, pitch, long))
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

  /**
   * 音部記号を切り替える。置いてある音符は今の音部記号の高さで解決されているので、
   * 盤面ごとリセットする（切替のたびに音符が別の音に化けるのを避ける）。
   */
  function toggleClef() {
    if (busy) return
    const next: Clef = clef === 'treble' ? 'bass' : 'treble'
    resetBoard()
    setClefMode(next)
    // 地の音色（ヘ音＝低くて温かい音）を切り替えて、そのまま試聴する。
    setClef(next)
    void ensureAudio().then(() => playMelodyNote(next === 'bass' ? 'C3' : 'C5'))
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
    setSavedSongs(saveSong(songPages, clef))
    setJustSaved(true)
    timers.current.push(window.setTimeout(() => setJustSaved(false), 1200))
  }

  // 本棚から選んだ曲を盤面に読み込み、そのまま再生（自由モード扱い）。
  // 保存時の音部記号でしか音名を解決できないので、盤面もその音部記号へ切り替える。
  function handleSelectSong(song: SavedSong) {
    const pgs = song.pages.map((names) =>
      names
        .map(parseNoteName)
        .map((n) => ({ pitch: pitchByNote(n.note, song.clef), long: n.long }))
        .filter((n): n is { pitch: Pitch; long: boolean } => !!n.pitch)
        .reduce<PlacedNote[]>((acc, n) => addNote(acc, n.pitch, n.long), []),
    )
    const loaded = pgs.length > 0 ? pgs : [[]]
    setShelfOpen(false)
    setGuide(false)
    setClefMode(song.clef)
    setClef(song.clef)
    setPages(loaded)
    setCurrentPage(0)
    void playSequence(loaded)
  }

  async function playSequence(pgs: PlacedNote[][]) {
    const pageSteps = pgs.map((p) => p.map(noteWidth))
    if (pageSteps.every((s) => s.length === 0)) return
    clearTimers()
    await ensureAudio()
    const { ticks, endAt } = playbackSchedule(pageSteps)
    for (const tick of ticks) {
      timers.current.push(
        window.setTimeout(() => {
          playMelodyNote(
            pgs[tick.page][tick.index].pitch.note,
            noteDuration(tick.steps),
          )
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
    void ensureAudio().then(() => playMelodyNote(clef === 'bass' ? 'C3' : 'C5'))
  }

  return (
    <div className="flex h-full w-full flex-col bg-[#fdf6e3]">
      {portrait && <RotateOverlay />}
      {/* ボタンは縮ませない（潰れるとラベルが縦に折り返してヘッダーが伸びる）。
          幅が足りなければ行を折り返す＝はみ出して切れることはない。 */}
      <header
        className={`flex shrink-0 flex-wrap items-center ${compact ? 'gap-2 p-2' : 'gap-3 p-3'}`}
      >
        <button
          type="button"
          onClick={handlePlay}
          disabled={busy || empty}
          aria-label="さいせい"
          className={`shrink-0 rounded-2xl bg-[#22c55e] ${pad} text-xl font-bold text-white shadow disabled:opacity-40`}
        >
          {label('▶', 'さいせい')}
        </button>
        <div
          className={`flex shrink-0 items-center gap-1 rounded-2xl bg-white shadow ${
            compact ? 'px-1' : 'px-2 py-1'
          }`}
          role="group"
          aria-label="さいせいの おと"
        >
          {VOICES.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => handleSelectVoice(v.id)}
              aria-label={v.name}
              aria-pressed={voice === v.id}
              className={`rounded-xl ${compact ? 'px-2 py-1.5 text-2xl' : 'px-3 py-2 text-2xl'} ${
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
          aria-label="ひとつもどる"
          className={`shrink-0 rounded-2xl bg-white ${pad} text-xl font-bold text-[#6b6375] shadow disabled:opacity-40`}
        >
          {label('↩', 'ひとつもどる')}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={empty}
          aria-label="クリア"
          className={`shrink-0 rounded-2xl bg-white ${pad} text-xl font-bold text-[#6b6375] shadow disabled:opacity-40`}
        >
          {label('↺', 'クリア')}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={busy || empty}
          aria-label="ほぞん"
          className={`shrink-0 rounded-2xl bg-white ${pad} text-xl font-bold text-[#6b6375] shadow disabled:opacity-40`}
        >
          {justSaved ? label('✓', 'ほぞんした') : label('💾', 'ほぞん')}
        </button>
        <button
          type="button"
          onClick={() => setShelfOpen(true)}
          disabled={busy}
          aria-label="ほんだな"
          className={`shrink-0 rounded-2xl bg-white ${pad} text-xl font-bold text-[#6b6375] shadow disabled:opacity-40`}
        >
          {label('📚', 'ほんだな')}
        </button>
        {/* 音部記号の切替。「ト音／ヘ音」は5歳児に通じないので、
            高さのイメージ（ことり＝高い／くま＝低い）で見せる。 */}
        <button
          type="button"
          onClick={toggleClef}
          disabled={busy}
          aria-label="おとの たかさ"
          className={`ml-auto shrink-0 rounded-2xl ${pad} text-xl font-bold shadow disabled:opacity-40 ${
            clef === 'bass' ? 'bg-[#8b5cf6] text-white' : 'bg-white text-[#6b6375]'
          }`}
        >
          {clef === 'bass' ? label('🐻', 'くま') : label('🐤', 'ことり')}
        </button>
        <button
          type="button"
          onClick={toggleGuide}
          disabled={busy}
          aria-label={guide ? 'おてほん' : 'じゆう'}
          className={`shrink-0 rounded-2xl ${pad} text-xl font-bold shadow disabled:opacity-40 ${
            guide ? 'bg-[#f59e0b] text-white' : 'bg-white text-[#6b6375]'
          }`}
        >
          {guide ? label('🎵', 'おてほん') : label('✏️', 'じゆう')}
        </button>
      </header>
      <main className="relative min-h-0 flex-1">
        <Board
          notes={notes}
          onPlace={handlePlace}
          onRemove={handleRemove}
          playingIndex={playing?.page === currentPage ? playing.index : null}
          celebrating={celebrating}
          clef={clef}
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
