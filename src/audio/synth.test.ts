import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// うたモードでも楽器音を重ねていること（attack）・停止で「その音色」を release
// すること（#60-4）をテストから確認できるようにする。release は synth の生成時
// オプションを渡すので、どの音色を止めたかを同定できる。
const h = vi.hoisted(() => ({
  attack: vi.fn(),
  release: vi.fn<(opts?: unknown) => void>(),
  now: 0,
}))

// Tone.js は AudioContext を要求するので最小のフェイクに差し替える。
// モノフォニックの synth は、前回以下の時刻での発音に例外を投げる（#116）。本物は「直前と
// 同じ時刻」だけで投げるので、それより厳しい（同じ tick の2回目はどちらでも投げる）。
vi.mock('tone', () => {
  class FakeSynth {
    opts: unknown
    last = -Infinity
    constructor(opts?: unknown) {
      this.opts = opts
    }
    toDestination() {
      return this
    }
    triggerAttackRelease = (note: string, duration: unknown, time?: number) => {
      const t = time ?? h.now
      if (!(t > this.last)) throw new Error('Start time must be strictly greater than previous start time')
      this.last = t
      h.attack(note, duration)
    }
    triggerRelease = () => h.release(this.opts)
  }
  class FakePoly {
    toDestination() {
      return this
    }
    triggerAttackRelease = vi.fn()
  }
  return {
    start: vi.fn().mockResolvedValue(undefined),
    now: () => h.now,
    Synth: FakeSynth,
    FMSynth: FakeSynth,
    MembraneSynth: FakeSynth,
    PolySynth: FakePoly,
  }
})

import {
  ensureAudio,
  playChime,
  playMelodyNote,
  playNote,
  playPop,
  setClef,
  setPlaybackVoice,
  stopMelody,
} from './synth'

// jsdom は speechSynthesis を持たない。発話テキストだけ拾えるスタブを入れる。
function installSpeech() {
  const spoken: string[] = []
  class Utterance {
    lang = ''
    rate = 1
    volume = 1
    text: string
    constructor(text: string) {
      this.text = text
    }
  }
  vi.stubGlobal('SpeechSynthesisUtterance', Utterance)
  vi.stubGlobal('speechSynthesis', {
    cancel: vi.fn(),
    speak: (u: Utterance) => spoken.push(u.text),
  })
  return spoken
}

beforeEach(() => {
  h.now += 10 // テストごとに時計を進める（synth はモジュール内で使い回される）
  h.attack.mockClear()
  h.release.mockClear()
  // モジュール可変状態を既定へ戻す。
  setClef('treble')
  setPlaybackVoice('piano')
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('playMelodyNote のうたモード', () => {
  it('ヘ音モードのうたは低い音でもドレミを読み上げる（#54）', () => {
    const spoken = installSpeech()
    setClef('bass')
    setPlaybackVoice('sing')
    playMelodyNote('C3') // ヘ音の「ド」
    expect(spoken).toContain('ド')
    // 読み上げ単体にせず楽器音に重ねる（docs/architecture.md「うたモードは楽器音に重ねる」）
    expect(h.attack).toHaveBeenCalledWith('C3', '8n')
  })

  it('ト音モードのうたも読み上げる', () => {
    const spoken = installSpeech()
    setPlaybackVoice('sing')
    playMelodyNote('C4')
    expect(spoken).toContain('ド')
  })

  it('うた以外の音色では読み上げない', () => {
    const spoken = installSpeech()
    setPlaybackVoice('bell')
    playMelodyNote('C4')
    expect(spoken).toEqual([])
  })
})

describe('stopMelody（#60-4）', () => {
  it('release 済みの後に再度呼んでも二重に release しない', () => {
    installSpeech()
    setPlaybackVoice('bell')
    playMelodyNote('C4', 1.1)
    stopMelody()
    h.release.mockClear()
    stopMelody() // ringing は既に null
    expect(h.release).not.toHaveBeenCalled()
  })

  it('直前に鳴らした再生音色（べる）を release する', () => {
    installSpeech()
    setPlaybackVoice('bell')
    playMelodyNote('C4', 1.1) // のばす音
    stopMelody()
    // べる = FMSynth（harmonicity を持つ）
    expect(h.release).toHaveBeenCalledWith(
      expect.objectContaining({ harmonicity: 3.01 }),
    )
  })

  it('うたモード＋ヘ音では実音の piano-bass（サイン波）を release する', () => {
    installSpeech()
    setClef('bass')
    setPlaybackVoice('sing')
    playMelodyNote('C3', 1.1)
    stopMelody()
    expect(h.release).toHaveBeenCalledWith(
      expect.objectContaining({ oscillator: { type: 'sine' } }),
    )
  })
})

describe('同じ時刻に2回鳴らしても例外にしない（#116）', () => {
  it('制作中の音（スクラブ・鍵盤の連打）', () => {
    expect(() => {
      playNote('C4')
      playNote('D4') // 同じ tick＝同じ音声時刻
    }).not.toThrow()
    expect(h.attack).toHaveBeenCalledTimes(2)
  })

  it('再生の音（おてほんの聞き比べなどで続けて鳴らす）', () => {
    installSpeech()
    setPlaybackVoice('bell')
    expect(() => {
      playMelodyNote('C4')
      playMelodyNote('E4')
    }).not.toThrow()
  })

  it('押下音の連打', async () => {
    await ensureAudio()
    expect(() => {
      playPop()
      playPop()
    }).not.toThrow()
  })

  it('シールの音を続けて鳴らしても、2回目の2音とも鳴る', () => {
    expect(() => {
      playChime()
      playChime() // 1回目の1音めと同じ時刻（同じ tick）から始まる
    }).not.toThrow()
    expect(h.attack).toHaveBeenCalledTimes(4)
  })
})
