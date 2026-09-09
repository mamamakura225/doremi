import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// 全 synth インスタンスで共有する triggerAttackRelease。うたモードでも
// 楽器音を鳴らしている（重ねている）ことをテストから確認できるようにする。
const h = vi.hoisted(() => ({ attack: vi.fn() }))

// Tone.js は AudioContext を要求するので最小のフェイクに差し替える。
vi.mock('tone', () => {
  class FakeSynth {
    toDestination() {
      return this
    }
    triggerAttackRelease = h.attack
    triggerRelease = vi.fn()
  }
  class FakePoly {
    toDestination() {
      return this
    }
    triggerAttackRelease = vi.fn()
  }
  return { start: vi.fn().mockResolvedValue(undefined), Synth: FakeSynth, FMSynth: FakeSynth, PolySynth: FakePoly }
})

import { playMelodyNote, setClef, setPlaybackVoice } from './synth'

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
  h.attack.mockClear()
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
