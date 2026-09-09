import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from './App'
import { ensureAudio, playMelodyNote, playNote } from './audio/synth'

const SONG_2P = JSON.stringify([
  { id: 'x', createdAt: 1, clef: 'treble', pages: [['C4', 'D4'], ['E4']] },
])

// ensureAudio を「あとで手で解決する Promise」にして、再生開始直後の
// 割り込み窓（await Tone.start() が開いている隙間）を再現する。
const h = vi.hoisted(() => ({ resolveAudio: null as null | (() => void) }))

vi.mock('./audio/synth', () => ({
  VOICES: [
    { id: 'piano', name: 'ピアノ', label: '🎹' },
    { id: 'bell', name: 'ベル', label: '🔔' },
  ],
  ensureAudio: vi.fn(
    () =>
      new Promise<void>((resolve) => {
        h.resolveAudio = resolve
      }),
  ),
  playMelodyNote: vi.fn(),
  playNote: vi.fn(),
  playSparkle: vi.fn(),
  setClef: vi.fn(),
  setPlaybackVoice: vi.fn(),
  stopMelody: vi.fn(),
}))

beforeEach(() => {
  localStorage.clear()
  h.resolveAudio = null
  vi.mocked(ensureAudio).mockClear()
  vi.mocked(playMelodyNote).mockClear()
  vi.mocked(playNote).mockClear()
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

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
  fireEvent.click(screen.getByText('▶ きく'))
  expect(ensureAudio).toHaveBeenCalled()

  // 音が鳴る前に ↺ クリア
  fireEvent.click(screen.getByLabelText('クリア'))

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
  fireEvent.click(screen.getAllByText('▶ きく')[0]) // 2ページの曲 → 窓が開く（本棚は閉じる）
  // 窓の中（busy はまだ false）で本棚を開き直し、空の曲を選ぶ
  fireEvent.click(screen.getByLabelText('ほんだな'))
  fireEvent.click(screen.getAllByText('▶ きく')[1])

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
  fireEvent.click(screen.getByText('▶ きく'))

  fireEvent.click(screen.getByLabelText('ほぞん'))
  expect(screen.getByLabelText('ほぞん').textContent).toContain('ほぞんした')

  // 1.2秒以内に ▶ さいせい（clearTimers を呼ぶ）
  fireEvent.click(screen.getByLabelText('さいせい'))

  await act(async () => {
    await vi.advanceTimersByTimeAsync(1300)
  })

  // 専用タイマーなので clearTimers に巻き込まれず、ラベルが戻っている
  expect(screen.getByLabelText('ほぞん').textContent).toContain('ほぞん')
  expect(screen.getByLabelText('ほぞん').textContent).not.toContain('した')
})

test('音部切替の試聴は「地の音色」で鳴らす（再生音色ではない・#60-3）', async () => {
  render(<App />)
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
  fireEvent.click(screen.getByText('▶ きく'))

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
  fireEvent.click(screen.getByText('▶ きく'))
  // 再生を開始させて最初の tick を撃つ（playing がセットされ busy になる）
  await act(async () => {
    h.resolveAudio?.()
    await vi.advanceTimersByTimeAsync(1)
  })

  expect((screen.getByLabelText('ベル') as HTMLButtonElement).disabled).toBe(true)
})
