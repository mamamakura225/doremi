import { afterEach, describe, expect, it, vi } from 'vitest'
import { isSpeechSupported, primeSpeech, speakSolfa, stopSpeech } from './speech'

// jsdom は speechSynthesis を持たないため、最小のスタブを差し込んで検証する。
function installStub() {
  const calls: string[] = []
  const spoken: { text: string; lang: string; rate: number; volume: number }[] = []
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
    cancel: () => calls.push('cancel'),
    speak: (u: Utterance) => {
      calls.push('speak')
      spoken.push({ text: u.text, lang: u.lang, rate: u.rate, volume: u.volume })
    },
  })
  return { calls, spoken }
}

afterEach(() => vi.unstubAllGlobals())

describe('isSpeechSupported', () => {
  it('APIが無ければ false', () => {
    expect(isSpeechSupported()).toBe(false)
  })

  it('APIがあれば true', () => {
    installStub()
    expect(isSpeechSupported()).toBe(true)
  })
})

describe('speakSolfa', () => {
  it('日本語で読み上げる', () => {
    const { spoken } = installStub()
    speakSolfa('ド')
    expect(spoken).toEqual([{ text: 'ド', lang: 'ja-JP', rate: 1.2, volume: 1 }])
  })

  it('発話が積み上がらないよう毎回 cancel してから話す', () => {
    const { calls } = installStub()
    speakSolfa('ド')
    speakSolfa('レ')
    expect(calls).toEqual(['cancel', 'speak', 'cancel', 'speak'])
  })

  it('非対応環境では何もしない（例外を投げない）', () => {
    expect(() => speakSolfa('ド')).not.toThrow()
    expect(() => stopSpeech()).not.toThrow()
    expect(() => primeSpeech()).not.toThrow()
  })
})

describe('primeSpeech', () => {
  it('無音の発話で解錠し、2回目以降は何もしない', () => {
    const { spoken } = installStub()
    primeSpeech()
    primeSpeech()
    expect(spoken).toEqual([{ text: '', lang: '', rate: 1, volume: 0 }])
  })
})
