import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from './App'
import RotateOverlay from './components/RotateOverlay'
import {
  ensureAudio,
  playFanfare,
  playMelodyNote,
  playNote,
  playPop,
  playSparkle,
  setPlaybackVoice,
} from './audio/synth'

const SONG_2P = JSON.stringify([
  { id: 'x', createdAt: 1, clef: 'treble', pages: [['C4', 'D4'], ['E4']] },
])

// ensureAudio を「あとで手で解決する Promise」にして、再生開始直後の
// 割り込み窓（await Tone.start() が開いている隙間）を再現する。
const h = vi.hoisted(() => ({ resolveAudio: null as null | (() => void) }))

vi.mock('./audio/synth', () => ({
  VOICES: [
    { id: 'piano', name: 'ピアノ' },
    { id: 'bell', name: 'ベル' },
  ],
  ensureAudio: vi.fn(
    () =>
      new Promise<void>((resolve) => {
        h.resolveAudio = resolve
      }),
  ),
  playMelodyNote: vi.fn(),
  playFanfare: vi.fn(),
  playChime: vi.fn(),
  playNote: vi.fn(),
  playPop: vi.fn(),
  playSparkle: vi.fn(),
  setClef: vi.fn(),
  setPlaybackVoice: vi.fn(),
  stopMelody: vi.fn(),
}))

beforeEach(() => {
  localStorage.clear()
  // タイトル（#112）は見たことにしておく——出たままだと、実際には触れないヘッダーや盤面を
  // テストだけが操作することになる。タイトルのテストでは消してから描く
  localStorage.setItem('doremi.titleSeen.v1', '1')
  h.resolveAudio = null
  vi.mocked(ensureAudio).mockClear()
  vi.mocked(playMelodyNote).mockClear()
  vi.mocked(playNote).mockClear()
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.restoreAllMocks() // localStorage を塞ぐ spyOn を後のテストに漏らさない
})

/** ⚙ を長押ししておとなメニューを開く（フェイクタイマー前提） */
function openAdultMenu() {
  fireEvent.pointerDown(screen.getByLabelText('おとなの メニュー（ながおし）'), { pointerId: 1 })
  act(() => {
    vi.advanceTimersByTime(1500)
  })
}

test('再生開始直後にクリアしても、止めた再生のtickが盤面を壊さない', async () => {
  // 2ページの曲を本棚に用意する
  localStorage.setItem(
    'doremi.songs.v1',
    JSON.stringify([
      { id: 'x', createdAt: 1, clef: 'treble', pages: [['C4', 'D4'], ['E4']] },
    ]),
  )
  vi.useFakeTimers()
  render(<App />)

  // 📚 ほんだな → 曲を選ぶ（handleSelectSong → playSequence。ensureAudio は未解決）
  fireEvent.click(screen.getByLabelText('ほんだな'))
  fireEvent.click(screen.getByText('きく'))
  expect(ensureAudio).toHaveBeenCalled()

  // 音が鳴る前に、おとなメニューの「ぜんぶけす」
  openAdultMenu()
  fireEvent.click(screen.getByLabelText('ぜんぶけす'))

  // ここで割り込み窓を閉じる。古い2ページ分の tick が積まれてはいけない。
  await act(async () => {
    h.resolveAudio?.()
    await vi.runAllTimersAsync()
  })

  // ゴースト再生が起きていない（世代トークンが await 後の継続を無効化した）
  expect(playMelodyNote).not.toHaveBeenCalled()
  // 白画面になっていない＝ヘッダーが生きている
  expect(screen.getByLabelText('さいせい')).toBeTruthy()
  // resetBoard 済みでページドット（2ページ表示）が消えている
  expect(screen.queryByLabelText(/ぜんぶで2ページ/)).toBeNull()
})

test('割り込み窓で空スケジュールの曲を選んでも、前の再生が生き残らない', async () => {
  // 1曲目=2ページの曲、2曲目=空ページだけ（壊れた localStorage 相当。normalize は通す）
  localStorage.setItem(
    'doremi.songs.v1',
    JSON.stringify([
      { id: 'a', createdAt: 2, clef: 'treble', pages: [['C4', 'D4'], ['E4']] },
      { id: 'b', createdAt: 1, clef: 'treble', pages: [[]] },
    ]),
  )
  vi.useFakeTimers()
  render(<App />)

  fireEvent.click(screen.getByLabelText('ほんだな'))
  fireEvent.click(screen.getAllByText('きく')[0]) // 2ページの曲 → 窓が開く（本棚は閉じる）
  // 窓の中（busy はまだ false）で本棚を開き直し、空の曲を選ぶ
  fireEvent.click(screen.getByLabelText('ほんだな'))
  fireEvent.click(screen.getAllByText('きく')[1])

  await act(async () => {
    h.resolveAudio?.()
    await vi.runAllTimersAsync()
  })

  // 空スケジュールの early return が clearTimers より後なので、
  // 1曲目の継続は世代ずれで捨てられる（ゴースト再生なし）
  expect(playMelodyNote).not.toHaveBeenCalled()
})

test('ほぞん直後に別操作しても「✓ほぞんした」が固着しない（#60-1）', async () => {
  localStorage.setItem('doremi.songs.v1', SONG_2P)
  vi.useFakeTimers()
  render(<App />)

  // 曲を読み込んで盤面を非空にする（ensureAudio 未解決＝busy にならない）
  fireEvent.click(screen.getByLabelText('ほんだな'))
  fireEvent.click(screen.getByText('きく'))

  fireEvent.click(screen.getByLabelText('ほぞん'))
  expect(screen.getByLabelText('ほぞんした')).toBeTruthy()

  // 1.2秒以内に ▶ さいせい（clearTimers を呼ぶ）
  fireEvent.click(screen.getByLabelText('さいせい'))

  await act(async () => {
    await vi.advanceTimersByTimeAsync(1300)
  })

  // 専用タイマーなので clearTimers に巻き込まれず、ラベルが戻っている
  // （#101 でアイコンは SVG になった。戻ったかは読み上げ名で見る）
  expect(screen.getByLabelText('ほぞん')).toBeTruthy()
  expect(screen.queryByLabelText('ほぞんした')).toBeNull()
})

test('音部切替の試聴は「地の音色」で鳴らす（再生音色ではない・#60-3）', async () => {
  vi.useFakeTimers()
  render(<App />)
  openAdultMenu()
  fireEvent.click(screen.getByLabelText('おとの たかさ')) // 🐤→🐻

  await act(async () => {
    h.resolveAudio?.()
    await Promise.resolve()
  })

  // 制作系の playNote（ヘ音の地の音 C3）。再生系の playMelodyNote は使わない
  expect(playNote).toHaveBeenCalledWith('C3')
  expect(playMelodyNote).not.toHaveBeenCalled()
})

test('全消しで空になったページは、ページ移動で畳まれる（#60-6）', () => {
  // [['C4'], ['E4']] を読み込み、1ページ目を空にして つぎ➔ を押す
  localStorage.setItem(
    'doremi.songs.v1',
    JSON.stringify([
      { id: 'x', createdAt: 1, clef: 'treble', pages: [['C4'], ['E4']] },
    ]),
  )
  vi.useFakeTimers()
  render(<App />)
  fireEvent.click(screen.getByLabelText('ほんだな'))
  fireEvent.click(screen.getByText('きく'))

  expect(screen.getByLabelText(/ぜんぶで2ページ/)).toBeTruthy()

  // 1ページ目の音符を消す（ensureAudio 未解決＝busy にならない）
  fireEvent.click(screen.getByLabelText('ひとつもどる'))
  // つぎ➔ で移動しようとすると、空の1ページ目が畳まれる
  fireEvent.click(screen.getByText(/つぎ/))

  expect(screen.queryByLabelText(/ぜんぶで2ページ/)).toBeNull()
})

test('再生中は音色ボタンが disabled（#60-2）', async () => {
  localStorage.setItem('doremi.songs.v1', SONG_2P)
  vi.useFakeTimers()
  render(<App />)

  fireEvent.click(screen.getByLabelText('ほんだな'))
  fireEvent.click(screen.getByText('きく'))
  // 再生を開始させて最初の tick を撃つ（playing がセットされ busy になる）
  await act(async () => {
    h.resolveAudio?.()
    await vi.advanceTimersByTimeAsync(1)
  })

  openAdultMenu()
  expect((screen.getByLabelText('ベル') as HTMLButtonElement).disabled).toBe(true)
})

test('おといろは子どもの面に無く、おとなメニューで選ぶ（#141）', () => {
  vi.useFakeTimers()
  render(<App />)
  // 子どもの面（ヘッダー）には音色のボタンが無い
  expect(screen.queryByLabelText('おといろ')).toBeNull()
  expect(screen.queryByLabelText('ベル')).toBeNull()

  openAdultMenu()
  const bell = screen.getByLabelText('ベル')
  expect(screen.getByLabelText('ピアノ').getAttribute('aria-pressed')).toBe('true')
  fireEvent.click(bell)
  expect(setPlaybackVoice).toHaveBeenCalledWith('bell')
  expect(bell.getAttribute('aria-pressed')).toBe('true')
  // 聴き比べられるよう、選んでもメニューは閉じない
  expect(screen.getByRole('dialog', { name: 'おとなの メニュー' })).toBeTruthy()
})

test('盤面の外にページ背景（おんぷのもり）を敷き、操作の邪魔をしない（#99）', () => {
  render(<App />)
  const bg = screen.getByTestId('page-background')
  expect(bg.getAttribute('aria-hidden')).toBe('true')
  expect(bg.getAttribute('class')).toContain('pointer-events-none')
  // 背景は盤面より先（下）に描かれる
  const board = screen.getByLabelText('五線譜ボード')
  expect(bg.compareDocumentPosition(board) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  // absolute の背景より上に描くには、ヘッダーも positioned である必要がある
  // （DOM 順だけでは absolute と static の重なりは決まらない。jsdom は CSS を計算しないのでクラスで見る）
  expect(screen.getByRole('banner').className).toContain('relative')
})

test('おとなメニューは短いタップでは開かず、1.5秒の長押しで開く（#102）', () => {
  vi.useFakeTimers()
  render(<App />)
  const gear = screen.getByLabelText('おとなの メニュー（ながおし）')

  fireEvent.click(gear, { detail: 1 }) // 指のタップ（click の detail は 1 以上）
  fireEvent.pointerDown(gear, { pointerId: 1 })
  act(() => {
    vi.advanceTimersByTime(1000)
  })
  fireEvent.pointerUp(gear, { pointerId: 1 }) // 途中で離す
  act(() => {
    vi.advanceTimersByTime(1000)
  })
  expect(screen.queryByRole('dialog', { name: 'おとなの メニュー' })).toBeNull()
  // 子どもの面には、消す・音部・モードのボタンが無い
  expect(screen.queryByLabelText('ぜんぶけす')).toBeNull()
  expect(screen.queryByLabelText('おとの たかさ')).toBeNull()

  openAdultMenu()
  expect(screen.getByRole('dialog', { name: 'おとなの メニュー' })).toBeTruthy()
  fireEvent.click(screen.getByLabelText('とじる'))
  expect(screen.queryByRole('dialog', { name: 'おとなの メニュー' })).toBeNull()

  // キーボード・読み上げの操作（detail=0 の click）ではすぐ開き、Escape で閉じる
  fireEvent.click(gear, { detail: 0 })
  const dialog = screen.getByRole('dialog', { name: 'おとなの メニュー' })
  expect(document.activeElement).toBe(screen.getByLabelText('とじる'))
  fireEvent.keyDown(dialog, { key: 'Escape' })
  expect(screen.queryByRole('dialog', { name: 'おとなの メニュー' })).toBeNull()
})

test('再生中は ▶ が ⏹ とめる になり、曲を消さずに止める（#102）', async () => {
  localStorage.setItem('doremi.songs.v1', SONG_2P)
  vi.useFakeTimers()
  render(<App />)
  fireEvent.click(screen.getByLabelText('ほんだな'))
  fireEvent.click(screen.getByText('きく'))
  await act(async () => {
    h.resolveAudio?.()
    await vi.advanceTimersByTimeAsync(1)
  })
  vi.mocked(playMelodyNote).mockClear()

  // ▶ の連打（押した直後の2回目）では止めない
  fireEvent.click(screen.getByLabelText('とめる'))
  await act(async () => {
    await vi.advanceTimersByTimeAsync(700)
  })
  expect(playMelodyNote).toHaveBeenCalled()
  vi.mocked(playMelodyNote).mockClear()

  fireEvent.click(screen.getByLabelText('とめる'))
  await act(async () => {
    await vi.runAllTimersAsync()
  })

  expect(playMelodyNote).not.toHaveBeenCalled() // 残りの tick は捨てられた
  expect(screen.getByLabelText('さいせい')).toBeTruthy()
  expect(screen.getByLabelText(/ぜんぶで2ページ/)).toBeTruthy() // 曲は残っている
})

test('押下音が失敗しても、ボタンの操作は実行される（#102・#116）', () => {
  render(<App />)
  vi.mocked(playPop).mockImplementationOnce(() => {
    throw new Error('Start time must be strictly greater than previous start time')
  })
  expect(() => fireEvent.click(screen.getByLabelText('ほんだな'))).not.toThrow()
  expect(screen.getByText(/ほんだな/, { selector: 'h2' })).toBeTruthy()
})

test('画面に絵文字を出さない（OS ごとに絵柄が変わる・#101）', () => {
  // 絵文字として描かれうる文字（▶◀ は iOS で絵文字になる。→ はおとなメニューの地の文で使うので除く）
  const emoji =
    /[\p{Extended_Pictographic}\u{2600}-\u{27BF}\u{21A9}\u{21AA}\u{21BA}\u{21BB}\u{25B6}\u{25C0}]/u
  localStorage.setItem('doremi.songs.v1', SONG_2P)
  vi.useFakeTimers()
  render(<App />)
  // 子どもの面・盤面（起動ヒント）
  expect(document.body.textContent ?? '').not.toMatch(emoji)
  // おとなメニュー
  openAdultMenu()
  expect(document.body.textContent ?? '').not.toMatch(emoji)
  fireEvent.click(screen.getByLabelText('とじる'))
  // 本棚（曲あり）
  fireEvent.click(screen.getByLabelText('ほんだな'))
  expect(screen.getByText('きく')).toBeTruthy()
  expect(document.body.textContent ?? '').not.toMatch(emoji)
  // シール帳
  fireEvent.click(screen.getByLabelText('シールちょう'))
  expect(screen.getByRole('dialog', { name: 'シールちょう' })).toBeTruthy()
  expect(document.body.textContent ?? '').not.toMatch(emoji)
  cleanup()
  // 回転の案内
  render(<RotateOverlay />)
  expect(document.body.textContent ?? '').not.toMatch(emoji)
})

test('複数ページの曲を最後まで聞くと「大」のお祝いが出て、しばらくで消える（#103）', async () => {
  localStorage.setItem('doremi.songs.v1', SONG_2P)
  vi.useFakeTimers()
  render(<App />)
  fireEvent.click(screen.getByLabelText('ほんだな'))
  fireEvent.click(screen.getByText('きく'))
  expect(screen.queryByTestId('celebration')).toBeNull()

  // 3音＋ページ境界の小休符ぶん進めて、最後まで聞き終える
  await act(async () => {
    h.resolveAudio?.()
    await vi.advanceTimersByTimeAsync(600 * 5)
  })
  const c = screen.getByTestId('celebration')
  expect(c.getAttribute('data-level')).toBe('big')
  expect(playFanfare).toHaveBeenCalledWith('big')

  await act(async () => {
    await vi.advanceTimersByTimeAsync(1800)
  })
  expect(screen.queryByTestId('celebration')).toBeNull()
})

test('おてほんどおりに置いて聞くと「特別」のお祝い（#103）', async () => {
  // jsdom には SVG の座標変換が無いので、client 座標＝viewBox 座標にする（Board.test と同じ）
  const proto = SVGSVGElement.prototype as unknown as Record<string, unknown>
  const identity = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }
  proto.getScreenCTM = () => ({ inverse: () => identity })
  ;(SVGElement.prototype as unknown as Record<string, unknown>).setPointerCapture = () => {}

  vi.useFakeTimers()
  render(<App />)
  openAdultMenu()
  fireEvent.click(screen.getByLabelText('じゆう')) // → おてほん

  fireEvent.click(screen.getByLabelText('きらきらぼし'))

  // きらきらぼしは2ページ（#128）。ト音の y: ド390・レ365・ミ340・ファ315・ソ290・ラ265
  for (const y of [390, 390, 290, 290, 265, 265]) placeNote(y)
  placeLongNote(290)
  // 8列（10列に満たない）でも、お手本を置き終えたら次のページへ進める
  fireEvent.click(screen.getByText('つづき'))
  expect(document.querySelectorAll('[data-testid="guide-ghost"]').length).toBe(7)
  for (const y of [315, 315, 340, 340, 365, 365]) placeNote(y)
  placeLongNote(390)

  fireEvent.click(screen.getByLabelText('さいせい'))
  await act(async () => {
    h.resolveAudio?.()
    await vi.advanceTimersByTimeAsync(600 * 18)
  })
  expect(screen.getByTestId('celebration').getAttribute('data-level')).toBe('special')
})

test('ページをまたぐお手本は、1ページめだけでは「特別」にならない（#128）', async () => {
  stubSvgGeometry()
  vi.useFakeTimers()
  render(<App />)
  openAdultMenu()
  fireEvent.click(screen.getByLabelText('じゆう'))
  fireEvent.click(screen.getByLabelText('きらきらぼし'))
  for (const y of [390, 390, 290, 290, 265, 265]) placeNote(y)
  expect(screen.queryByText('つづき')).toBeNull() // お手本の途中では進めない
  placeLongNote(290)

  fireEvent.click(screen.getByLabelText('さいせい'))
  await act(async () => {
    h.resolveAudio?.()
    await vi.advanceTimersByTimeAsync(600 * 9)
  })
  expect(screen.getByTestId('celebration').getAttribute('data-level')).toBe('small')
})

test('おてほんモード中に本棚の曲を聞いても、おてほん完成とは数えない（#103）', async () => {
  // おてほんのきらきらぼし（2フレーズ）と同じ並びの保存曲
  const twinkle = [
    ['C4', 'C4', 'G4', 'G4', 'A4', 'A4', 'G4~'],
    ['F4', 'F4', 'E4', 'E4', 'D4', 'D4', 'C4~'],
  ]
  localStorage.setItem(
    'doremi.songs.v1',
    JSON.stringify([{ id: 't', createdAt: 1, clef: 'treble', pages: twinkle }]),
  )
  vi.useFakeTimers()
  render(<App />)
  openAdultMenu()
  fireEvent.click(screen.getByLabelText('じゆう')) // → おてほん
  fireEvent.click(screen.getByLabelText('ほんだな'))
  fireEvent.click(screen.getByText('きく')) // 選ぶと同じハンドラでおてほんが切れる

  await act(async () => {
    h.resolveAudio?.()
    await vi.advanceTimersByTimeAsync(600 * 18)
  })
  expect(screen.getByTestId('celebration').getAttribute('data-level')).toBe('big') // 2ページの曲
})

test('じゆうモードでは10列が埋まるまで次のページを作らない（おてほんのページ送りは効かない・#128）', () => {
  stubSvgGeometry()
  vi.useFakeTimers()
  render(<App />)
  for (let i = 0; i < 8; i++) placeNote(390)
  expect(screen.queryByText('つぎのうた')).toBeNull()
  expect(screen.queryByText('つづき')).toBeNull()
  placeNote(390)
  placeNote(390)
  expect(screen.getByText('つぎのうた')).toBeTruthy()
})

test('1ページの曲は「小」のお祝いで、1.4秒で消える（#103）', async () => {
  localStorage.setItem(
    'doremi.songs.v1',
    JSON.stringify([{ id: 's', createdAt: 1, clef: 'treble', pages: [['C4']] }]),
  )
  vi.useFakeTimers()
  render(<App />)
  fireEvent.click(screen.getByLabelText('ほんだな'))
  fireEvent.click(screen.getByText('きく'))
  // 1音を聞き終えるまで進める（終わった瞬間にお祝いが始まる）
  await act(async () => {
    h.resolveAudio?.()
    await vi.advanceTimersByTimeAsync(1)
  })
  let t = 1
  while (!screen.queryByTestId('celebration') && t < 5000) {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10)
    })
    t += 10
  }
  expect(screen.getByTestId('celebration').getAttribute('data-level')).toBe('small')
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1390)
  })
  expect(screen.queryByTestId('celebration')).not.toBeNull() // まだ出ている
  await act(async () => {
    await vi.advanceTimersByTimeAsync(20)
  })
  expect(screen.queryByTestId('celebration')).toBeNull()
})

test('お祝いの途中で次の音符を置くと、お祝いが終わって置ける（ふさぎすぎない・#103）', async () => {
  const proto = SVGSVGElement.prototype as unknown as Record<string, unknown>
  const identity = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }
  proto.getScreenCTM = () => ({ inverse: () => identity })
  ;(SVGElement.prototype as unknown as Record<string, unknown>).setPointerCapture = () => {}

  localStorage.setItem(
    'doremi.songs.v1',
    JSON.stringify([{ id: 's', createdAt: 1, clef: 'treble', pages: [['C4']] }]),
  )
  vi.useFakeTimers()
  render(<App />)
  fireEvent.click(screen.getByLabelText('ほんだな'))
  fireEvent.click(screen.getByText('きく'))
  await act(async () => {
    h.resolveAudio?.()
    await vi.advanceTimersByTimeAsync(1200)
  })
  expect(screen.getByTestId('celebration')).toBeTruthy()

  const toolbox = screen.getByTestId('toolbox-normal')
  fireEvent.pointerDown(toolbox, { pointerId: 1, clientX: 1000, clientY: 165 })
  fireEvent.pointerMove(toolbox, { pointerId: 1, clientX: 400, clientY: 290 })
  fireEvent.pointerUp(toolbox, { pointerId: 1, clientX: 400, clientY: 290 })

  expect(screen.queryByTestId('celebration')).toBeNull()
  expect(screen.getByLabelText('さいせい')).toBeTruthy() // ⏹ ではなく ▶ に戻っている
  expect(document.querySelectorAll('[data-testid^="note-"]').length).toBe(2)
})

/** jsdom には SVG の座標変換が無いので、client 座標＝viewBox 座標にする（Board.test と同じ） */
function stubSvgGeometry() {
  const proto = SVGSVGElement.prototype as unknown as Record<string, unknown>
  const identity = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }
  proto.getScreenCTM = () => ({ inverse: () => identity })
  ;(SVGElement.prototype as unknown as Record<string, unknown>).setPointerCapture = () => {}
}

/** お道具箱から (400, y) へ音符を1つ置く */
function placeNote(y: number) {
  const toolbox = screen.getByTestId('toolbox-normal')
  fireEvent.pointerDown(toolbox, { pointerId: 1, clientX: 1000, clientY: 165 })
  fireEvent.pointerMove(toolbox, { pointerId: 1, clientX: 400, clientY: y })
  fireEvent.pointerUp(toolbox, { pointerId: 1, clientX: 400, clientY: y })
}

function placeLongNote(y: number) {
  const long = screen.getByTestId('toolbox-long')
  fireEvent.pointerDown(long, { pointerId: 1, clientX: 1000, clientY: 335 })
  fireEvent.pointerMove(long, { pointerId: 1, clientX: 400, clientY: y })
  fireEvent.pointerUp(long, { pointerId: 1, clientX: 400, clientY: y })
}

test('はじめて音符を置くとシールがもらえ、シール帳に入る（#105）', () => {
  stubSvgGeometry()
  vi.useFakeTimers()
  render(<App />)
  placeNote(390)
  const toast = screen.getByRole('status')
  expect(toast.textContent).toContain('はじめての おんぷ')
  expect(JSON.parse(localStorage.getItem('doremi.stickers.v1') ?? '[]')).toEqual(['first-note'])

  // 2つ目では同じシールは出ない
  act(() => {
    vi.advanceTimersByTime(3000)
  })
  placeNote(290)
  expect(screen.getByRole('status').textContent).toBe('')

  fireEvent.click(screen.getByLabelText('シールちょう'))
  const book = screen.getByRole('dialog', { name: 'シールちょう' })
  expect(book.textContent).toContain('1 / 16')
})

test('localStorage が使えなくても、シールで白画面にならない（#105・#57 と同じ方針）', () => {
  stubSvgGeometry()
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new DOMException('blocked', 'SecurityError')
  })
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('blocked', 'SecurityError')
  })
  vi.useFakeTimers()
  render(<App />)
  placeNote(390)
  expect(screen.getByRole('status').textContent).toContain('はじめての おんぷ') // このセッション中はもらえる
})

test('一度に何枚かもらったら、お知らせは1枚ずつ順番に出る（#105）', () => {
  stubSvgGeometry()
  vi.useFakeTimers()
  render(<App />)
  openAdultMenu()
  fireEvent.click(screen.getByLabelText('おとの たかさ')) // くま（ヘ音）
  placeNote(290) // はじめての おんぷ ＋ くまさんの ひくい おと
  const first = screen.getByRole('status')
  expect(first.textContent).toContain('はじめての おんぷ')
  act(() => {
    vi.advanceTimersByTime(2300)
  })
  expect(screen.getByRole('status').textContent).toContain('くまさんの ひくい おと')
  act(() => {
    vi.advanceTimersByTime(2300)
  })
  expect(screen.getByRole('status').textContent).toBe('')
  // 同じハンドラで続けてもらっても、2枚とも保存される（state を待たずに ref で判定する理由）
  expect(JSON.parse(localStorage.getItem('doremi.stickers.v1') ?? '[]')).toEqual(['first-note', 'bass'])
})

test('最後まで聞くと「さいごまで きいた」、途中で止めたらもらえない（#105）', async () => {
  localStorage.setItem('doremi.songs.v1', SONG_2P)
  vi.useFakeTimers()
  render(<App />)
  fireEvent.click(screen.getByLabelText('ほんだな'))
  fireEvent.click(screen.getByText('きく'))
  await act(async () => {
    h.resolveAudio?.()
    await vi.advanceTimersByTimeAsync(700)
  })
  fireEvent.click(screen.getByLabelText('とめる'))
  await act(async () => {
    await vi.runAllTimersAsync()
  })
  const stored = () => JSON.parse(localStorage.getItem('doremi.stickers.v1') ?? '[]') as string[]
  expect(stored()).not.toContain('play-end')

  fireEvent.click(screen.getByLabelText('さいせい'))
  await act(async () => {
    h.resolveAudio?.()
    await vi.advanceTimersByTimeAsync(600 * 5)
  })
  expect(stored()).toEqual(expect.arrayContaining(['shelf-listen', 'play-end', 'long-song']))
})

test('おてほんに入ると曲えらびが開き、えらんだ曲のお手本が出る（#106）', () => {
  vi.useFakeTimers()
  render(<App />)
  openAdultMenu()
  fireEvent.click(screen.getByLabelText('じゆう')) // → おてほん
  const picker = screen.getByRole('dialog', { name: 'きょくを えらぶ' })
  expect(picker.textContent).toContain('かえるのうた')
  fireEvent.click(screen.getByLabelText('かえるのうた'))

  expect(screen.queryByRole('dialog', { name: 'きょくを えらぶ' })).toBeNull()
  const ghosts = document.querySelectorAll('[data-testid="guide-ghost"]')
  expect(ghosts.length).toBe(7) // ド レ ミ ファ ミ レ ドー
  expect(ghosts[6].getAttribute('data-long')).toBe('true')
  expect(ghosts[6].getAttribute('data-col')).toBe('6')

  // おてほん中はヘッダーから選び直せる
  fireEvent.click(screen.getByLabelText('きょくを えらぶ'))
  expect(screen.getByRole('dialog', { name: 'きょくを えらぶ' })).toBeTruthy()
})

test('かえるのうたをお手本どおり（のばす音も）置いて聞くと「特別」のお祝い（#106）', async () => {
  stubSvgGeometry()
  vi.useFakeTimers()
  render(<App />)
  openAdultMenu()
  fireEvent.click(screen.getByLabelText('じゆう'))
  fireEvent.click(screen.getByLabelText('かえるのうた'))

  // ド レ ミ ファ ミ レ（ふつう）→ ド（のばす）｜ミ ファ ソ ラ ソ ファ → ミ（のばす）
  // ト音の y: ド390・レ365・ミ340・ファ315・ソ290・ラ265
  for (const y of [390, 365, 340, 315, 340, 365]) placeNote(y)
  placeLongNote(390)
  fireEvent.click(screen.getByText('つづき'))
  for (const y of [340, 315, 290, 265, 290, 315]) placeNote(y)
  placeLongNote(340)

  fireEvent.click(screen.getByLabelText('さいせい'))
  await act(async () => {
    h.resolveAudio?.()
    await vi.advanceTimersByTimeAsync(600 * 18)
  })
  expect(screen.getByTestId('celebration').getAttribute('data-level')).toBe('special')
})

test('のばす音で列が押し出され、残りを次のページに置いても「特別」（長さは採点しない・#128）', async () => {
  stubSvgGeometry()
  vi.useFakeTimers()
  render(<App />)
  openAdultMenu()
  fireEvent.click(screen.getByLabelText('じゆう'))
  fireEvent.click(screen.getByLabelText('ぶんぶんぶん'))
  // ソ ファ ミ レ ミ ファ レ ド（ちょうど10列）のはじめ2音を のばす音 にすると ド が入らない
  // ト音の y: ド390・レ365・ミ340・ファ315・ソ290
  placeLongNote(290)
  placeLongNote(315)
  placeLongNote(340)
  for (const y of [365, 340, 315, 365]) placeNote(y)
  fireEvent.click(screen.getByText('つづき')) // 10列で満杯。曲はまだ続く
  // 押し出された ド を次のページで案内する
  expect(document.querySelectorAll('[data-testid="guide-ghost"]').length).toBe(1)
  placeNote(390)

  fireEvent.click(screen.getByLabelText('さいせい'))
  await act(async () => {
    h.resolveAudio?.()
    await vi.advanceTimersByTimeAsync(600 * 14)
  })
  expect(screen.getByTestId('celebration').getAttribute('data-level')).toBe('special')
})

test('ほんだなで選んだ本が開く演出が出て、再生はすぐ始まる（#109）', () => {
  localStorage.setItem('doremi.songs.v1', SONG_2P)
  vi.useFakeTimers()
  render(<App />)
  fireEvent.click(screen.getByLabelText('ほんだな'))
  expect(screen.getByRole('dialog', { name: 'ほんだな' })).toBeTruthy()
  fireEvent.click(screen.getByText('きく'))
  expect(screen.getByTestId('book-opening')).toBeTruthy()
  expect(ensureAudio).toHaveBeenCalled() // 演出を待たずに再生へ
  act(() => {
    vi.advanceTimersByTime(600)
  })
  expect(screen.queryByTestId('book-opening')).toBeNull()
})

test('ほんだなが空なら、空の棚とぴぴ（#109）', () => {
  render(<App />)
  fireEvent.click(screen.getByLabelText('ほんだな'))
  const shelf = screen.getByRole('dialog', { name: 'ほんだな' })
  expect(shelf.textContent).toContain('まだ なにも ほぞんして いないよ')
  expect(shelf.querySelector('svg[viewBox="0 0 200 200"]')).not.toBeNull() // ぴぴ
})

test('ほんだなは開くと「とじる」にフォーカスし、Escape で閉じる（#109）', () => {
  render(<App />)
  fireEvent.click(screen.getByLabelText('ほんだな'))
  const shelf = screen.getByRole('dialog', { name: 'ほんだな' })
  expect(document.activeElement).toBe(screen.getByLabelText('とじる'))
  fireEvent.keyDown(shelf, { key: 'Escape' })
  expect(screen.queryByRole('dialog', { name: 'ほんだな' })).toBeNull()
})

test('はじめて開いたときだけタイトルが出て、はじめるで音を解錠する（#112）', async () => {
  localStorage.removeItem('doremi.titleSeen.v1')
  const first = render(<App />)
  expect(screen.getByRole('banner').hasAttribute('inert')).toBe(true) // 裏には触れない
  const title = screen.getByRole('dialog', { name: 'どれみ' })
  expect(title.textContent).toContain('はじめる')
  vi.mocked(ensureAudio).mockClear()
  fireEvent.click(screen.getByLabelText('はじめる'))
  expect(ensureAudio).toHaveBeenCalled()
  expect(screen.queryByRole('dialog', { name: 'どれみ' })).toBeNull()
  expect(screen.getByRole('banner').hasAttribute('inert')).toBe(false)
  vi.mocked(playSparkle).mockClear()
  await act(async () => {
    h.resolveAudio?.()
  })
  expect(playSparkle).toHaveBeenCalled() // 解錠できたら最初の音を鳴らす
  first.unmount()

  // 2回目に開いたときは出さない
  render(<App />)
  expect(screen.queryByRole('dialog', { name: 'どれみ' })).toBeNull()
})

test('ききとり: 違う音を置くと、お題を鳴らして上下で教え、置いた音は片づく（#110）', async () => {
  stubSvgGeometry()
  vi.spyOn(Math, 'random').mockReturnValue(0) // 最初のお題は ド（C4）
  vi.useFakeTimers()
  render(<App />)
  openAdultMenu()
  vi.mocked(playNote).mockClear()
  fireEvent.click(screen.getByLabelText('ききとり'))
  await act(async () => {
    h.resolveAudio?.()
  })
  expect(playNote).toHaveBeenCalledWith('C4')
  expect(screen.getByLabelText('もういちど きく')).toBeTruthy()

  placeNote(290) // ソ を置く（お題の ド はもっと低い）
  expect(screen.getByText('もっと ひくい')).toBeTruthy()
  vi.mocked(playNote).mockClear()
  act(() => {
    vi.advanceTimersByTime(700)
  })
  expect(playNote).toHaveBeenCalledWith('C4') // 比べるためにお題を鳴らす
  act(() => {
    vi.advanceTimersByTime(1300)
  })
  expect(document.querySelectorAll('[data-testid^="note-"]').length).toBe(0) // 片づいた
  expect(screen.queryByText('もっと ひくい')).toBeNull()
})

test('ききとり: 同じ音を置くと「みつけた」とシール、次のお題は別の音（#110）', async () => {
  stubSvgGeometry()
  vi.spyOn(Math, 'random').mockReturnValue(0)
  vi.useFakeTimers()
  render(<App />)
  openAdultMenu()
  fireEvent.click(screen.getByLabelText('ききとり'))
  await act(async () => {
    h.resolveAudio?.()
  })
  placeNote(390) // ド
  expect(screen.getByText('みつけた！')).toBeTruthy()
  expect(JSON.parse(localStorage.getItem('doremi.stickers.v1') ?? '[]')).toContain('ear-found')

  vi.mocked(playNote).mockClear()
  await act(async () => {
    vi.advanceTimersByTime(1400)
    h.resolveAudio?.()
  })
  const asked = vi.mocked(playNote).mock.calls.map((c) => c[0])
  expect(asked.length).toBeGreaterThan(0)
  expect(asked.at(-1)).not.toBe('C4') // 直前と同じ音は出さない
})

test('ききとり中は ▶・ほぞん を押せず、答え合わせ中は次の音を置けない（#110）', async () => {
  stubSvgGeometry()
  vi.spyOn(Math, 'random').mockReturnValue(0)
  vi.useFakeTimers()
  render(<App />)
  openAdultMenu()
  fireEvent.click(screen.getByLabelText('ききとり'))
  await act(async () => {
    h.resolveAudio?.()
  })
  placeNote(290) // 違う音（ソ）→ 答え合わせ中
  expect((screen.getByLabelText('さいせい') as HTMLButtonElement).disabled).toBe(true)
  expect((screen.getByLabelText('ほぞん') as HTMLButtonElement).disabled).toBe(true)
  placeNote(390) // 答え合わせ中は置けない（盤面が止まっている）
  expect(document.querySelectorAll('[data-testid^="note-"]').length).toBe(1)
})

test('ききとり中に音部記号を変えると、試聴音は鳴らさず新しいお題を鳴らす（#110・#116）', async () => {
  vi.spyOn(Math, 'random').mockReturnValue(0)
  vi.useFakeTimers()
  render(<App />)
  openAdultMenu()
  fireEvent.click(screen.getByLabelText('ききとり'))
  await act(async () => {
    h.resolveAudio?.()
  })
  vi.mocked(playNote).mockClear()
  openAdultMenu()
  fireEvent.click(screen.getByLabelText('おとの たかさ')) // くま（ヘ音）
  await act(async () => {
    h.resolveAudio?.()
  })
  const played = vi.mocked(playNote).mock.calls.map((c) => c[0])
  expect(played).toEqual(['C3']) // お題（ヘ音の ド）だけ。試聴の C3 と重ねて2回鳴らさない
})

test('シールを集めると背景を着せ替えられ、選んだ背景を覚える（#111）', () => {
  localStorage.setItem('doremi.stickers.v1', JSON.stringify(['first-note', 'save', 'bass']))
  const first = render(<App />)
  expect(screen.getByTestId('page-background').getAttribute('data-theme')).toBe('meadow')
  fireEvent.click(screen.getByLabelText('シールちょう'))
  expect((screen.getByLabelText('さくら') as HTMLButtonElement).disabled).toBe(false)
  expect((screen.getByLabelText('よぞら あと 6（シール 9 まいで つかえる）') as HTMLButtonElement).disabled).toBe(true)
  fireEvent.click(screen.getByLabelText('さくら'))
  expect(screen.getByTestId('page-background').getAttribute('data-theme')).toBe('sakura')
  first.unmount()

  render(<App />)
  expect(screen.getByTestId('page-background').getAttribute('data-theme')).toBe('sakura')
})

test('iPhone 横向きのノッチ・ホームインジケータを避ける（#66）', () => {
  const { container } = render(<App />)
  const root = container.firstElementChild as HTMLElement
  expect(root.className).toContain('pl-[env(safe-area-inset-left)]')
  expect(root.className).toContain('pr-[env(safe-area-inset-right)]')
  expect(container.querySelector('header')!.className).toContain('env(safe-area-inset-top)')
})

test('⚙ を短く押して離すと「ながおし してね」を出し、しばらくで消える（#139）', () => {
  vi.useFakeTimers()
  render(<App />)
  const gear = screen.getByLabelText('おとなの メニュー（ながおし）')
  fireEvent.pointerDown(gear, { pointerId: 1 })
  fireEvent.pointerUp(gear, { pointerId: 1 })
  expect(screen.getByText('ながおし してね')).toBeTruthy()
  act(() => {
    vi.advanceTimersByTime(2000)
  })
  expect(screen.queryByText('ながおし してね')).toBeNull()

  // 長押しで開いたあとに離しても出さない
  openAdultMenu()
  fireEvent.pointerUp(gear, { pointerId: 1 })
  expect(screen.queryByText('ながおし してね')).toBeNull()
})

test('ほんだなの曲はおとなメニューの「せいり」からだけ消せる（#142）', () => {
  localStorage.setItem(
    'doremi.songs.v1',
    JSON.stringify([
      { id: 'a', createdAt: 2, clef: 'treble', pages: [['C4']] },
      { id: 'b', createdAt: 1, clef: 'treble', pages: [['E4']] },
    ]),
  )
  vi.useFakeTimers()
  render(<App />)

  // 子どもの 📚 から開いた本棚には消す手段が無い
  fireEvent.click(screen.getByLabelText('ほんだな'))
  expect(screen.queryAllByLabelText('この きょくを けす')).toHaveLength(0)
  fireEvent.click(screen.getByLabelText('とじる'))

  openAdultMenu()
  fireEvent.click(screen.getByLabelText('ほんだなを せいり'))
  expect(screen.getByRole('dialog', { name: 'ほんだなを せいり' })).toBeTruthy()

  // やめる なら消えない
  fireEvent.click(screen.getAllByLabelText('この きょくを けす')[0])
  fireEvent.click(screen.getByText('やめる'))
  expect(screen.getAllByLabelText('この きょくを けす')).toHaveLength(2)

  // けす で1冊消え、保存先からも消える
  fireEvent.click(screen.getAllByLabelText('この きょくを けす')[0])
  fireEvent.click(screen.getByText('けす', { selector: '[role="alertdialog"] button' }))
  expect(screen.getAllByLabelText('この きょくを けす')).toHaveLength(1)
  expect(JSON.parse(localStorage.getItem('doremi.songs.v1')!).map((s: { id: string }) => s.id)).toEqual(['b'])

  // 閉じて 📚 から開き直すと、ふつうの本棚に戻っている
  fireEvent.click(screen.getByLabelText('とじる'))
  fireEvent.click(screen.getByLabelText('ほんだな'))
  expect(screen.queryAllByLabelText('この きょくを けす')).toHaveLength(0)
  expect(screen.getAllByText('きく')).toHaveLength(1)
})

test('⚙ は右端ぎりぎりに置かず、内側へ寄せる（#153）', () => {
  render(<App />)
  expect(screen.getByLabelText('おとなの メニュー（ながおし）').className).toMatch(/\bmr-8\b/)
})

// ---- よみとりあそび（#155） ----

/** おとなメニューから よみとり に入り、最初の問題の音（解錠待ち）を通す */
async function enterReading() {
  openAdultMenu()
  fireEvent.click(screen.getByLabelText('よみとり'))
  await act(async () => {
    h.resolveAudio?.()
  })
}

const key = (note: string) => screen.getByTestId(`key-${note}`)
const press = (note: string) => fireEvent.pointerDown(key(note), { pointerId: 1 })
const earnedStickers = () => JSON.parse(localStorage.getItem('doremi.stickers.v1') ?? '[]') as string[]

/** いま出ている問題（最後に鳴った音）を正しい鍵で読み、次の問題まで進める */
function readCurrent() {
  const asked = vi.mocked(playNote).mock.calls.map((c) => c[0])
  press(asked.at(-1)!)
  vi.mocked(playNote).mockClear()
  act(() => {
    vi.advanceTimersByTime(1400)
  })
}

test('よみとり: 色なしの音符と音で出題し、ラベル・足場は出さず、ドには加線を描く（#155）', async () => {
  vi.spyOn(Math, 'random').mockReturnValue(0) // 段階1（ド・レ・ミ）の最初＝ド
  vi.useFakeTimers()
  render(<App />)
  vi.mocked(playNote).mockClear()
  await enterReading()
  expect(playNote).toHaveBeenCalledWith('C4')
  const note = screen.getByTestId('reading-note')
  expect(note.querySelector('ellipse')?.getAttribute('fill')).toBe('#a07e62') // 答えるまで音の色を付けない
  expect(screen.getByTestId('ledger')).toBeTruthy()
  // 答えになる手がかり（五線の音名ラベル）が無い。鍵盤の音名（家のピアノへの橋渡し）は残す
  const svg = screen.getByRole('application', { name: 'よみとりの がめん' })
  const staffTexts = [...svg.querySelectorAll('text')].filter((t) => !t.closest('[data-testid^="key-"]'))
  expect(staffTexts.map((t) => t.textContent)).not.toContain('ド')
  expect(svg.querySelector('[stroke-dasharray]')).toBeNull() // ド足場ガイド（破線）も出さない
  // 絵文字を出さない（#101）
  expect(document.body.textContent ?? '').not.toMatch(/\p{Extended_Pictographic}/u)
  // 子どもの面: ▶ ↩ ほぞん は使わない
  expect((screen.getByLabelText('さいせい') as HTMLButtonElement).disabled).toBe(true)
  expect((screen.getByLabelText('ほぞん') as HTMLButtonElement).disabled).toBe(true)
})

test('よみとり: 出題は楽器の音だけ（再生の音色＝うたの読み上げでは鳴らさない）（#155）', async () => {
  vi.spyOn(Math, 'random').mockReturnValue(0)
  vi.useFakeTimers()
  render(<App />)
  vi.mocked(playMelodyNote).mockClear()
  vi.mocked(playNote).mockClear()
  await enterReading()
  press('E4') // ちがう鍵 → 正しい音を鳴らして比べる経路も通す
  act(() => {
    vi.advanceTimersByTime(1900)
  })
  expect(vi.mocked(playNote).mock.calls.map((c) => c[0])).toEqual(['C4', 'E4', 'C4'])
  expect(playMelodyNote).not.toHaveBeenCalled()
})

test('よみとり: 正しい鍵で「よめた」・色と音名・シール、次の問題は別の音（#155）', async () => {
  vi.spyOn(Math, 'random').mockReturnValue(0)
  vi.useFakeTimers()
  render(<App />)
  await enterReading()
  press('C4')
  expect(screen.getByText('よめた！')).toBeTruthy()
  const note = screen.getByTestId('reading-note')
  expect(note.getAttribute('data-solved')).toBe('true')
  expect(note.textContent).toContain('ド')
  expect(earnedStickers()).toContain('read-found')
  expect(screen.getByRole('img', { name: '1 こ よめた' })).toBeTruthy()
  vi.mocked(playNote).mockClear()
  act(() => {
    vi.advanceTimersByTime(1400)
  })
  const asked = vi.mocked(playNote).mock.calls.map((c) => c[0])
  expect(asked).toHaveLength(1)
  expect(asked[0]).toBe('D4') // 直前と同じ音は出さない（ド を除いた レ・ミ の最初）
  expect(screen.queryByText('よめた！')).toBeNull()
  expect(screen.queryByTestId('ledger')).toBeNull() // 加線はドだけ（レは五線の下に接する）
})

test('よみとり: ちがう鍵は上下で教えて同じ問題に戻る。2回で正しい鍵が光り、そのあとの正解は数えない（#155）', async () => {
  vi.spyOn(Math, 'random').mockReturnValue(0) // ド
  vi.useFakeTimers()
  render(<App />)
  await enterReading()
  press('E4') // ミ（お題のドはもっと低い）
  expect(screen.getByText('もっと ひくい')).toBeTruthy()
  // 答え合わせの間はほかの鍵を受け付けない（2本目の指・連打を1回の答えにする）。
  // 同じ tick に来た2本目も止める（state の反映を待つロックだと通ってしまう）
  act(() => {
    press('D4')
    press('C4')
  })
  expect(screen.queryByText('よめた！')).toBeNull()
  vi.mocked(playNote).mockClear()
  act(() => {
    vi.advanceTimersByTime(700)
  })
  expect(playNote).toHaveBeenCalledWith('C4') // 比べるために正しい音を鳴らす
  act(() => {
    vi.advanceTimersByTime(1200)
  })
  expect(screen.queryByText('もっと ひくい')).toBeNull()
  expect(key('C4').getAttribute('data-hint')).toBe('false') // 1回ではまだ光らせない
  press('D4')
  act(() => {
    vi.advanceTimersByTime(1900)
  })
  expect(key('C4').getAttribute('data-hint')).toBe('true')
  press('C4')
  expect(screen.getByText('よめた！')).toBeTruthy() // 演出は出す（何も失わない）
  expect(screen.getByRole('img', { name: '0 こ よめた' })).toBeTruthy() // 数えない
  expect(earnedStickers()).not.toContain('read-found')
  // 陽性対照: 次の問題を1回で読むと数える（問題ごとにミス数が 0 に戻っている）
  act(() => {
    vi.advanceTimersByTime(1400)
  })
  readCurrent()
  expect(screen.getByRole('img', { name: '1 こ よめた' })).toBeTruthy()
})

// jsdom は pointer-events の当たり判定をしないので、黒鍵が押下を受け止めることは属性で固定する
// （実際に下の白鍵へ素通しされないかは実機・preview で確認する）
test('よみとり: 黒鍵を押しても答えにならない（#155）', async () => {
  vi.spyOn(Math, 'random').mockReturnValue(0)
  vi.useFakeTimers()
  render(<App />)
  await enterReading()
  const blacks = document.querySelector('[aria-label="けんばん"] g[aria-hidden="true"]') as SVGGElement
  expect(blacks.getAttribute('pointer-events')).toBe('auto')
  fireEvent.pointerDown(blacks.querySelector('rect')!, { pointerId: 1 })
  expect(screen.queryByText('よめた！')).toBeNull()
  expect(screen.queryByText('もっと ひくい')).toBeNull()
  expect(screen.queryByText('もっと たかい')).toBeNull()
})

test('よみとり: 5回よめたら次の段階へ・シール・段階は開き直しても残る（#155）', async () => {
  const random = vi.spyOn(Math, 'random').mockReturnValue(0) // ド・レ が交互に出る
  vi.useFakeTimers()
  const view = render(<App />)
  vi.mocked(playNote).mockClear()
  await enterReading()
  for (let i = 0; i < 4; i++) readCurrent()
  expect(earnedStickers()).not.toContain('read-stage-1')
  // 5回目（ド）。クリアした「よめた！」のあいだは点を5つ埋めて見せる
  random.mockReturnValue(0.999)
  press(vi.mocked(playNote).mock.calls.at(-1)![0])
  expect(screen.getByRole('img', { name: '5 こ よめた' })).toBeTruthy()
  expect(earnedStickers()).toContain('read-stage-1')
  expect(JSON.parse(localStorage.getItem('doremi.reading.v1') ?? '{}')).toEqual({ stage: 1 })
  vi.mocked(playNote).mockClear()
  act(() => {
    vi.advanceTimersByTime(1400)
  })
  // 次の問題は新しい段階（ド〜ソ）から。前の段階のままなら ミ までしか出ない
  expect(vi.mocked(playNote).mock.calls.map((c) => c[0])).toEqual(['G4'])
  expect(screen.getByRole('img', { name: '0 こ よめた' })).toBeTruthy()
  // 開き直しても段階2から
  view.unmount()
  render(<App />)
  await enterReading()
  openAdultMenu()
  expect(screen.getByLabelText('だんかい 2').getAttribute('aria-pressed')).toBe('true')
})

test('よみとり: おとなメニューで段階を選び直せる。飛ばした段階のシールは付かない（#155）', async () => {
  vi.useFakeTimers()
  render(<App />)
  await enterReading()
  openAdultMenu()
  vi.mocked(playNote).mockClear()
  fireEvent.click(screen.getByLabelText('だんかい 3'))
  await act(async () => {
    h.resolveAudio?.()
  })
  expect(vi.mocked(playNote).mock.calls).toHaveLength(1) // 新しい段階で出し直して鳴らす
  for (let i = 0; i < 5; i++) readCurrent()
  const got = earnedStickers()
  expect(got).toContain('read-stage-3')
  expect(got).not.toContain('read-stage-1')
  expect(got).not.toContain('read-stage-2')
})

test('よみとり: じゆうから入って出ると、つくりかけの曲が残る。よみとり中はページ送りを出さない（#155）', async () => {
  stubSvgGeometry()
  vi.useFakeTimers()
  render(<App />)
  for (let i = 0; i < 10; i++) placeNote(390) // 満杯 → 「つぎのうた」が出る
  expect(screen.getByText(/つぎのうた/)).toBeTruthy()
  await enterReading()
  expect(screen.queryByText(/つぎのうた/)).toBeNull() // 鍵盤に重ならない・見えない曲のページを動かさない
  expect(screen.queryByTestId('toolbox-normal')).toBeNull()
  openAdultMenu()
  expect(screen.queryByLabelText('ぜんぶけす')).toBeNull() // 見えていない曲を消させない
  expect(screen.queryByLabelText('おとの たかさ')).toBeNull()
  // 「じゆう → おてほんに する」と出すと、じゆうに戻るつもりで押して曲を消してしまう
  expect(screen.queryByText('じゆう → おてほんに する')).toBeNull()
  expect(screen.getByText('おてほん あそび')).toBeTruthy()
  fireEvent.click(screen.getByLabelText('よみとり')) // じゆうに戻る
  expect(document.querySelectorAll('[data-testid^="note-"]').length).toBe(10)
})

test('よみとり: ききとりから入ると、答え合わせ中の仮の音を持ち帰らない（#155）', async () => {
  stubSvgGeometry()
  vi.spyOn(Math, 'random').mockReturnValue(0)
  vi.useFakeTimers()
  render(<App />)
  openAdultMenu()
  fireEvent.click(screen.getByLabelText('ききとり'))
  await act(async () => {
    h.resolveAudio?.()
  })
  placeNote(290) // 違う音（答え合わせ中は盤面に残っている）
  expect(document.querySelectorAll('[data-testid^="note-"]').length).toBe(1)
  await enterReading()
  expect(screen.getByRole('application', { name: 'よみとりの がめん' })).toBeTruthy()
  openAdultMenu()
  fireEvent.click(screen.getByLabelText('よみとり'))
  expect(document.querySelectorAll('[data-testid^="note-"]').length).toBe(0)
})

test('よみとり: ほんだなの曲を選ぶと、よみとりを終えて再生する（#155）', async () => {
  localStorage.setItem('doremi.songs.v1', SONG_2P)
  vi.useFakeTimers()
  render(<App />)
  await enterReading()
  fireEvent.click(screen.getByLabelText('ほんだな'))
  fireEvent.click(screen.getAllByText('きく')[0])
  expect(screen.queryByRole('application', { name: 'よみとりの がめん' })).toBeNull()
  expect(screen.getByRole('application', { name: '五線譜ボード' })).toBeTruthy()
})

test('よみとり: 段階を選び直すと、前の問題のタイマーは鳴らない（#155）', async () => {
  vi.spyOn(Math, 'random').mockReturnValue(0) // ド
  vi.useFakeTimers()
  render(<App />)
  await enterReading()
  openAdultMenu() // メニューを開いたまま（長押しの時間ぶんタイマーが進むので、先に開く）
  press('C4') // よめた → 1.4s 後に次の問題のタイマー
  vi.mocked(playNote).mockClear()
  fireEvent.click(screen.getByLabelText('だんかい 3'))
  await act(async () => {
    h.resolveAudio?.()
  })
  act(() => {
    vi.advanceTimersByTime(2000)
  })
  expect(vi.mocked(playNote).mock.calls).toHaveLength(1) // 新しい段階の最初の問題だけ
})

test('よみとり: 音の解錠待ちの再生は、よみとりに入ったら鳴り出さない（#155）', async () => {
  localStorage.setItem('doremi.songs.v1', SONG_2P)
  vi.useFakeTimers()
  render(<App />)
  fireEvent.click(screen.getByLabelText('ほんだな'))
  fireEvent.click(screen.getAllByText('きく')[0]) // 再生は ensureAudio を待っている
  const resolvePlay = h.resolveAudio
  await enterReading()
  vi.mocked(playMelodyNote).mockClear()
  await act(async () => {
    resolvePlay?.()
    await vi.runAllTimersAsync()
  })
  expect(playMelodyNote).not.toHaveBeenCalled()
  expect(screen.getByRole('application', { name: 'よみとりの がめん' })).toBeTruthy()
})
