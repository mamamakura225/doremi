import { type ReactElement, useEffect, useRef, useState } from 'react'
import AdultMenu, { AdultMenuButton } from './components/AdultMenu'
import Background from './components/Background'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BellIcon,
  PianoIcon,
  PicoIcon,
  PlayIcon,
  SavedIcon,
  SaveIcon,
  ShelfIcon,
  SingIcon,
  StickerBookIcon,
  StopIcon,
  UndoIcon,
} from './components/Icons'
import Board from './components/Board'
import Celebration from './components/Celebration'
import { StickerBook, StickerToast } from './components/StickerBook'
import {
  STICKERS,
  type StickerId,
  award,
  hasAllColors,
  loadStickers,
  saveStickers,
} from './lib/stickers'
import Bookshelf from './components/Bookshelf'
import RotateOverlay from './components/RotateOverlay'
import { usePortrait } from './hooks/usePortrait'
import { useShortScreen } from './hooks/useShortScreen'
import { type PlacedNote, addNote, noteWidth, removeById, removeLast } from './lib/notes'
import { canAddPage, collapseEmptyPages, parseNoteName, toNoteNames } from './lib/pages'
import { type Clef, type Pitch, pitchByNote } from './lib/pitch'
import { STEP_MS, noteDuration, playbackSchedule } from './lib/playback'
import {
  CELEBRATION_MS,
  type CelebrationLevel,
  celebrationLevel,
  isGuideComplete,
} from './lib/celebration'
import { type GuideNote, type SongId, songOf } from './lib/songs'
import SongPicker from './components/SongPicker'
import { SONG_ICON } from './components/songIcons'
import { type SavedSong, loadSongs, saveSong } from './lib/storage'
import {
  type Voice,
  VOICES,
  ensureAudio,
  playMelodyNote,
  playFanfare,
  playNote,
  playChime,
  playPop,
  playSparkle,
  setClef,
  setPlaybackVoice,
  stopMelody,
} from './audio/synth'

/** おといろのアイコン（絵文字は OS ごとに絵柄が変わるので自前の SVG・#101） */
const VOICE_ICON: Record<Voice, (p: { width?: string; height?: string }) => ReactElement> = {
  piano: PianoIcon,
  bell: BellIcon,
  pico: PicoIcon,
  sing: SingIcon,
}

/** 子どもの面の丸ボタン（押すと沈む） */
const KID_BTN =
  'grid shrink-0 place-items-center rounded-full shadow-md transition-transform active:scale-90 motion-reduce:transition-none disabled:opacity-40'

/** シールのお知らせを出しておく時間（ms） */
const STICKER_TOAST_MS = 2000

interface Playing {
  page: number
  index: number
}

export default function App() {
  const [pages, setPages] = useState<PlacedNote[][]>([[]])
  const [currentPage, setCurrentPage] = useState(0)
  const [playing, setPlaying] = useState<Playing | null>(null)
  const [celebrating, setCelebrating] = useState(false)
  const [celebration, setCelebration] = useState<CelebrationLevel>('small')
  const [guide, setGuide] = useState(false)
  // おてほんの曲（#106）と、曲えらびを開いているか
  const [guideSong, setGuideSong] = useState<SongId>('twinkle')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [savedSongs, setSavedSongs] = useState<SavedSong[]>(() => loadSongs())
  const [shelfOpen, setShelfOpen] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const [voice, setVoice] = useState<Voice>('piano')
  const [clef, setClefMode] = useState<Clef>('treble')
  const [adultOpen, setAdultOpen] = useState(false)
  // シール帳（#105）。一覧は ref にも持つ——同じハンドラで2枚続けてもらっても、
  // state の更新を待たずに「もう持っているか」を判定できるように
  const [stickers, setStickers] = useState<readonly StickerId[]>(() => loadStickers())
  const stickersRef = useRef(stickers)
  const [stickerQueue, setStickerQueue] = useState<StickerId[]>([])
  const [bookOpen, setBookOpen] = useState(false)
  const celebratingRef = useRef(false)
  const timers = useRef<number[]>([])
  // 再生の世代。clearTimers のたびに繰り上がる。await をまたいだ継続は
  // 自分の世代が最新かを確認してからスケジュールする（タイマー削除だけでは
  // await の隙間に入った中断を無効化できない）。
  const gen = useRef(0)
  // 「✓ ほぞんした」の解除タイマー。共有バッグ（timers）に積むと clearTimers に
  // 巻き込まれてラベルが固着するので、専用に持って clearTimers の管理外に置く（#60-1）。
  const saveToast = useRef(0)
  const portrait = usePortrait()
  // 縦が短い画面（横向きスマホ）では丸ボタンを小さくして盤面に高さを譲る。
  // それでも 44px（タップ的の下限）は割らない。
  // 再生を始めた時刻。▶ を連打すると2回目が同じ場所の ⏹ に当たるので、
  // 始めてすぐの ⏹ は受け付けない（handleStop・#102）。
  const playStartedAt = useRef(0)
  const compact = useShortScreen()
  const size = compact ? 'h-11 w-11 text-2xl' : 'h-16 w-16 text-3xl'

  function clearTimers() {
    gen.current += 1
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
    stopMelody()
  }
  useEffect(() => {
    return () => {
      clearTimers()
      window.clearTimeout(saveToast.current)
    }
  }, [])

  // 保険: 世代トークンをすり抜けた tick が古いページ番号を指しても落ちない。
  const notes = pages[currentPage] ?? []
  const busy = playing !== null || celebrating
  // おてほんは1フレーズ＝1ページめのみを対象にする。
  const guideNotes = songOf(guideSong, clef).notes
  const targets = guide && currentPage === 0 ? guideNotes : undefined

  function updateCurrentPage(fn: (page: PlacedNote[]) => PlacedNote[]) {
    setPages((prev) => prev.map((pg, i) => (i === currentPage ? fn(pg) : pg)))
  }

  /**
   * シールを1枚あげる（#105）。もう持っていれば何もしない。保存に失敗しても、このセッション中は
   * 手元の一覧で見える（#57 と同じ方針）。もらったら、お知らせとキラキラ音
   */
  function giveSticker(id: StickerId) {
    const next = award(stickersRef.current, id)
    if (next === stickersRef.current) return
    stickersRef.current = next
    setStickers(next)
    saveStickers(next)
    setStickerQueue((q) => [...q, id])
  }

  // お知らせは1枚ずつ、順番に出す。音もお知らせ1枚ごとに鳴らす（何枚か同時にもらっても
  // 重ならない）。お祝い中はファンファーレと重なるので鳴らさない。キラキラ音（おてほんの一致）
  // とは別の音にする——意味が混ざらないように
  celebratingRef.current = celebrating
  const shownSticker = stickerQueue[0]
  useEffect(() => {
    if (!shownSticker) return
    if (!celebratingRef.current) {
      try {
        playChime()
      } catch {
        // 音は飾り（#116）
      }
    }
    const t = window.setTimeout(() => setStickerQueue((q) => q.slice(1)), STICKER_TOAST_MS)
    return () => window.clearTimeout(t)
  }, [shownSticker])

  /** お祝いの途中で盤面を触ったら、お祝いを終えて次の操作に移る（ふさぎすぎない・#103） */
  function endCelebration() {
    if (!celebrating) return
    clearTimers()
    setCelebrating(false)
  }

  function handlePlace(pitch: Pitch, long: boolean) {
    if (playing) return
    endCelebration()
    const idx = notes.length
    // お手本と一致したら控えめなキラキラ音（不一致でも普通に置ける・×なし）
    if (targets?.[idx]?.pitch.note === pitch.note) playSparkle()
    updateCurrentPage((pg) => addNote(pg, pitch, long))
    giveSticker('first-note')
    if (long) giveSticker('long-note')
    if (clef === 'bass') giveSticker('bass')
  }

  function resetBoard() {
    clearTimers()
    setPlaying(null)
    setCelebrating(false)
    setPages([[]])
    setCurrentPage(0)
  }

  // ↺（おとなメニューの「ぜんぶけす」）は再生中も押せる。await 窓の中の割り込みも
  // ここが受ける（⏹ は busy になってから出るので、窓の中では押せない）。
  function handleClear() {
    resetBoard()
  }

  function toggleGuide() {
    resetBoard()
    // おてほんに入ったら、まず曲をえらぶ（#106）。切るときは曲えらびも閉じる
    // （開いたまま曲を選ぶと、pickSong でおてほんに戻ってしまう）
    if (!guide) openPicker()
    else setPickerOpen(false)
    setGuide((g) => !g)
  }

  /** 曲えらびを開く（ほかの重ねる画面は閉じる） */
  function openPicker() {
    setShelfOpen(false)
    setBookOpen(false)
    setPickerOpen(true)
  }

  /** 曲をえらんだら、盤面を空にしてその曲のお手本を出す */
  function pickSong(id: SongId) {
    resetBoard()
    setGuideSong(id)
    setGuide(true)
    setPickerOpen(false)
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
    setClef(next)
    // 地の音色（制作中の音＝playNote 系）を切り替えて、そのまま試聴する。
    // playMelodyNote は再生音色（べる等）なので使わない（#60-3）。
    void ensureAudio().then(() => playNote(next === 'bass' ? 'C3' : 'C5'))
  }

  function handleUndo() {
    if (busy) return
    updateCurrentPage((pg) => removeLast(pg))
  }

  function handleRemove(id: string) {
    if (playing) return
    endCelebration()
    updateCurrentPage((pg) => removeById(pg, id))
  }

  // ページ移動。つぎは「次ページへ」または末尾満杯時の「新ページ追加」を兼ねる。
  const hasNextPage = currentPage < pages.length - 1
  const canCreatePage = canAddPage(pages, currentPage)
  const showPrev = currentPage > 0 && !busy
  const showNext = (hasNextPage || canCreatePage) && !busy

  // ページ移動の前に、末尾以外の空ページを畳む（#60-6）。
  // 全消しで空になったページがドット表示と再生内容のズレを生むため。
  function handlePrev() {
    if (!showPrev) return
    const c = collapseEmptyPages(pages, currentPage)
    setPages(c.pages)
    setCurrentPage(Math.max(0, c.currentPage - 1))
  }

  function handleNext() {
    if (busy) return
    const c = collapseEmptyPages(pages, currentPage)
    if (c.currentPage < c.pages.length - 1) {
      setPages(c.pages)
      setCurrentPage(c.currentPage + 1)
    } else if (canAddPage(c.pages, c.currentPage)) {
      setPages([...c.pages, []])
      setCurrentPage(c.currentPage + 1)
    } else if (c.pages.length !== pages.length) {
      // 行き先は無いが空ページは畳む
      setPages(c.pages)
      setCurrentPage(c.currentPage)
    }
  }

  function handleSave() {
    if (busy) return
    const songPages = toNoteNames(pages)
    if (songPages.length === 0) return
    setSavedSongs(saveSong(songPages, clef))
    giveSticker('save')
    setJustSaved(true)
    window.clearTimeout(saveToast.current)
    saveToast.current = window.setTimeout(() => setJustSaved(false), 1200)
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
    giveSticker('shelf-listen') // 選んだ瞬間（そのまま再生される）
    setGuide(false)
    setClefMode(song.clef)
    setClef(song.clef)
    setPages(loaded)
    setCurrentPage(0)
    void playSequence(loaded)
  }

  /**
   * @param guideTargets おてほんの完成を判定するお手本。呼び出し側が渡す——本棚から選んだときは
   *   同じハンドラでおてほんを切るので、描画時点の `targets` を閉包で読むと古い値になる（#103）
   */
  async function playSequence(pgs: PlacedNote[][], guideTargets?: GuideNote[]) {
    // 中断（世代繰り上げ）は常に成立させる。空スケジュールでの early return を
    // clearTimers より前に置くと、進行中の別の playSequence が生き残る。
    clearTimers()
    const my = gen.current
    const pageSteps = pgs.map((p) => p.map(noteWidth))
    if (pageSteps.every((s) => s.length === 0)) return
    // お祝いの強さは再生を始めた時点の曲とモードで決める（#103）
    const level = celebrationLevel({
      pages: pgs.filter((p) => p.length > 0).length,
      guideComplete:
        guideTargets !== undefined &&
        isGuideComplete(
          (pgs[0] ?? []).map((n) => n.pitch.note),
          guideTargets.map((t) => t.pitch.note),
        ),
    })
    await ensureAudio()
    // await 中にクリア・音部切替・曲選択などの中断が入っていたら何も積まない。
    if (my !== gen.current) return
    const { ticks, endAt } = playbackSchedule(pageSteps)
    playStartedAt.current = Date.now()
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
        setCelebration(level)
        giveSticker('play-end')
        if (pgs.filter((p) => p.length > 0).length > 1) giveSticker('long-song')
        if (level === 'special') giveSticker('guide-complete')
        if (hasAllColors(pgs.flat().map((n) => n.pitch.solfa))) giveSticker('all-colors')
        setCelebrating(true)
        try {
          playFanfare(level)
        } catch {
          // ファンファーレは飾り。鳴らなくてもお祝いの絵は出す（#116）
        }
        timers.current.push(
          window.setTimeout(() => setCelebrating(false), CELEBRATION_MS[level]),
        )
      }, endAt),
    )
  }

  const empty = toNoteNames(pages).length === 0

  function handlePlay() {
    setBookOpen(false)
    setPickerOpen(false)
    if (busy || empty) return
    // おてほんの完成は、いま表示しているページに関係なく1ページ目で判定する
    void playSequence(pages, guide ? guideNotes : undefined)
  }

  /**
   * 再生・お祝いを止める。盤面（曲）はそのまま（#102）。
   * 始めて STEP_MS 以内は受け付けない: ▶ と ⏹ は同じ場所なので、▶ の連打の2回目で
   * 1音で止まってしまう（最初の tick は at=0 なので、押した直後にはもう ⏹ になっている）。
   */
  function handleStop() {
    if (Date.now() - playStartedAt.current < STEP_MS) return
    clearTimers()
    setPlaying(null)
    setCelebrating(false)
  }

  /**
   * 押下音を添える（ボタンが働いた手応え・#102）。操作が先・音は後で、音が失敗しても
   * 操作は止めない（モノフォニックの synth は同じ時刻に2回鳴らすと例外を投げる・#116）。
   */
  const withPop = (fn: () => void) => () => {
    fn()
    try {
      playPop()
    } catch {
      // 押下音は飾り。鳴らなくてよい
    }
  }

  const currentVoice = VOICES.find((v) => v.id === voice) ?? VOICES[0]
  const VoiceIcon = VOICE_ICON[currentVoice.id]
  function handleNextVoice() {
    const i = VOICES.findIndex((v) => v.id === voice)
    handleSelectVoice(VOICES[(i + 1) % VOICES.length].id)
  }

  // 再生音色を選ぶ。選んだ瞬間にその音色で試聴（タップ＝AudioContext起動も兼ねる）。
  function handleSelectVoice(v: Voice) {
    if (busy) return
    setVoice(v)
    setPlaybackVoice(v)
    void ensureAudio().then(() => playMelodyNote(clef === 'bass' ? 'C3' : 'C5'))
  }

  return (
    <div className="relative flex h-full w-full flex-col bg-[#fdf6e3]">
      {/* ページ背景（空・丘）。盤面 SVG の紙の外とヘッダーの後ろに見える（#99） */}
      <Background />
      {portrait && <RotateOverlay />}
      {/* 子どもの面（#102）: 大きな丸ボタンだけ。消す・音部・モードは ⚙ 長押しのおとなメニューへ。
          ボタンは縮ませない。幅が足りなければ行を折り返す＝はみ出して切れることはない。 */}
      <header
        className={`relative flex shrink-0 flex-wrap items-center ${compact ? 'gap-2 p-2' : 'gap-3 p-3'}`}
      >
        {/* 再生中は ⏹。曲を消さずに止める（これまで止める手段はクリア＝曲ごと消す だけだった） */}
        {busy ? (
          <button
            type="button"
            onClick={handleStop}
            aria-label="とめる"
            className={`${KID_BTN} ${size} bg-[#6b6375] text-white`}
          >
            <StopIcon width="62%" height="62%" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handlePlay}
            disabled={empty}
            aria-label="さいせい"
            className={`${KID_BTN} ${size} bg-[#22c55e] text-white`}
          >
            <PlayIcon width="62%" height="62%" />
          </button>
        )}
        {/* 音色は1つのボタンで順に巡る（4つ並べると、子どもには何のボタンか分からない） */}
        <button
          type="button"
          onClick={handleNextVoice}
          disabled={busy}
          aria-label="おといろ"
          title={currentVoice.name}
          className={`${KID_BTN} ${size} bg-white`}
        >
          <VoiceIcon width="62%" height="62%" />
        </button>
        <button
          type="button"
          onClick={withPop(handleUndo)}
          disabled={busy || notes.length === 0}
          aria-label="ひとつもどる"
          className={`${KID_BTN} ${size} bg-white text-[#6b6375]`}
        >
          <UndoIcon width="58%" height="58%" />
        </button>
        <button
          type="button"
          onClick={withPop(handleSave)}
          disabled={busy || empty}
          aria-label={justSaved ? 'ほぞんした' : 'ほぞん'}
          className={`${KID_BTN} ${size} bg-white text-[#6b6375]`}
        >
          {justSaved ? <SavedIcon width="62%" height="62%" /> : <SaveIcon width="62%" height="62%" />}
        </button>
        <button
          type="button"
          onClick={withPop(() => {
            setBookOpen(false)
            setPickerOpen(false)
            setShelfOpen(true)
          })}
          disabled={busy}
          aria-label="ほんだな"
          className={`${KID_BTN} ${size} bg-white`}
        >
          <ShelfIcon width="62%" height="62%" />
        </button>
        <button
          type="button"
          onClick={withPop(() => {
            setShelfOpen(false)
            setPickerOpen(false)
            setBookOpen(true)
          })}
          disabled={busy}
          aria-label="シールちょう"
          className={`${KID_BTN} ${size} bg-white`}
        >
          <StickerBookIcon width="62%" height="62%" />
        </button>
        {/* おてほん中は、いまの曲の絵。押すと曲えらび（#106） */}
        {guide && (
          <button
            type="button"
            onClick={withPop(openPicker)}
            disabled={busy}
            aria-label="きょくを えらぶ"
            title={songOf(guideSong, clef).name}
            className={`${KID_BTN} ${size} bg-white`}
          >
            {(() => {
              const SongIcon = SONG_ICON[guideSong]
              return <SongIcon width="62%" height="62%" />
            })()}
          </button>
        )}
        <AdultMenuButton onOpen={() => setAdultOpen(true)} sizeClass={`${size} text-2xl`} />
      </header>
      {adultOpen && (
        <AdultMenu
          clef={clef}
          guide={guide}
          busy={busy}
          empty={empty}
          onClear={handleClear}
          onToggleClef={toggleClef}
          onToggleGuide={toggleGuide}
          onClose={() => setAdultOpen(false)}
        />
      )}
      <main className="relative min-h-0 flex-1">
        <Board
          notes={notes}
          onPlace={handlePlace}
          onRemove={handleRemove}
          onTapNote={() => giveSticker('tap-note')}
          playingIndex={playing?.page === currentPage ? playing.index : null}
          playingPage={playing?.page}
          celebrating={celebrating}
          clef={clef}
          targets={targets}
        />
        {celebrating && <Celebration level={celebration} />}
        {!shelfOpen && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex items-center justify-between px-6">
            {showPrev ? (
              <button
                type="button"
                onClick={handlePrev}
                className="pointer-events-auto flex items-center gap-2 rounded-2xl bg-white px-7 py-4 text-2xl font-bold text-[#6b6375] shadow-lg active:scale-95"
              >
                <ArrowLeftIcon /> まえ
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
                      i === currentPage ? 'bg-[#5b524b]' : 'bg-[#d8c9a6]'
                    }`}
                  />
                ))}
              </div>
            )}
            {showNext ? (
              <button
                type="button"
                onClick={handleNext}
                className="pointer-events-auto flex items-center gap-2 rounded-2xl bg-[#dff3ea] px-7 py-4 text-2xl font-bold text-[#5b524b] shadow-lg active:scale-95"
              >
                {canCreatePage && !hasNextPage ? 'つぎのうた' : 'つぎ'} <ArrowRightIcon />
              </button>
            ) : (
              <span />
            )}
          </div>
        )}
        {bookOpen && <StickerBook earned={stickers} onClose={() => setBookOpen(false)} />}
        {pickerOpen && (
          <SongPicker current={guideSong} onPick={pickSong} onClose={() => setPickerOpen(false)} />
        )}
        {/* 読み上げの入れ物は常に置き、中身だけ出し入れする（live region は先に DOM に無いと読まれにくい） */}
        <div role="status" className="contents">
          {shownSticker && (
            <StickerToast
              key={shownSticker}
              id={shownSticker}
              name={STICKERS.find((s) => s.id === shownSticker)?.name ?? ''}
            />
          )}
        </div>
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
