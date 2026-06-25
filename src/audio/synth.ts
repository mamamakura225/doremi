// Tone.js の薄いラッパー。AudioContextのunlockと単音発音のみ。
import * as Tone from 'tone'

let synth: Tone.Synth | null = null
let started = false

function getSynth(): Tone.Synth {
  if (!synth) {
    synth = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.4 },
    }).toDestination()
  }
  return synth
}

/** iOS等のためAudioContextをユーザー操作で起動（初回のみ実効）。 */
export async function ensureAudio(): Promise<void> {
  if (started) return
  await Tone.start()
  started = true
}

/** 1音鳴らす（科学的音名 例 'C4'）。 */
export function playNote(note: string, duration: Tone.Unit.Time = '8n'): void {
  getSynth().triggerAttackRelease(note, duration)
}

// おてほん一致時の控えめキラキラ音（メロディ用synthを止めないよう別系統）。
let sparkle: Tone.PolySynth | null = null
function getSparkle(): Tone.PolySynth {
  if (!sparkle) {
    sparkle = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.005, decay: 0.15, sustain: 0, release: 0.1 },
      volume: -12,
    }).toDestination()
  }
  return sparkle
}

/** お手本と一致した時の控えめなキラキラ音。 */
export function playSparkle(): void {
  getSparkle().triggerAttackRelease(['C6', 'E6', 'G6'], '16n')
}
