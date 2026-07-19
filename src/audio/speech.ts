// Web Speech API の薄いラッパー。音名（ドレミ）の読み上げのみに使う。
// 端末に日本語音声が無い場合もあるため、常に「無ければ黙って諦める」設計。
//
// オフラインPWAとしての既知の制約:
// 端末によって ja-JP 音声がネットワーク音声（Android Chrome 等）で、機内モードでは
// 読み上げが出ない。うたモードは楽器音に重ねて鳴らすため、その場合も「ぴあの相当」に
// 劣化するだけで無音にはならない。録音サンプル同梱（Tone.Sampler）へ差し替える余地あり。

/** 読み上げが使える環境か（jsdom・非対応ブラウザでは false） */
export function isSpeechSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    'SpeechSynthesisUtterance' in window
  )
}

let primed = false

/**
 * 読み上げを解錠する。
 * iOS Safari は初回 speak() を**ユーザー操作と同じtick**で呼ぶ必要があり、
 * await を挟んだ後の speak では解錠されない（＝以後ずっと無言になる）。
 * うたモードを選んだタップの中から同期的に呼ぶこと。
 */
export function primeSpeech(): void {
  if (primed || !isSpeechSupported()) return
  primed = true
  const u = new window.SpeechSynthesisUtterance('')
  u.volume = 0
  window.speechSynthesis.speak(u)
}

/**
 * 音名を1つ読み上げる。
 * 再生は1音600msなので、前の発話が残っているとどんどん遅れる。
 * 必ず cancel してから話す（キューに積まない）。
 */
export function speakSolfa(text: string, rate = 1.2): void {
  if (!isSpeechSupported()) return
  const u = new window.SpeechSynthesisUtterance(text)
  u.lang = 'ja-JP'
  u.rate = rate
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(u)
}

/** 再生を止めるときに読み上げも止める。 */
export function stopSpeech(): void {
  if (!isSpeechSupported()) return
  window.speechSynthesis.cancel()
}
