// Tone.js の薄いラッパー。AudioContextのunlockと単音発音のみ。
import * as Tone from 'tone'
import { pitchByNote, type Clef } from '../lib/pitch'
import { primeSpeech, speakSolfa, stopSpeech } from './speech'

let started = false
// 音部記号で地の音色が変わる（ヘ音＝低くて温かい音＝クマ・ゾウ）。
let clefMode: Clef = 'treble'

const makingSynths: Partial<Record<Clef, Tone.Synth>> = {}

function makeMakingSynth(clef: Clef): Tone.Synth {
  return clef === 'bass'
    ? new Tone.Synth({
        // サイン波＋ゆっくりした立ち上がりで丸く柔らかい低音に
        oscillator: { type: 'sine' },
        envelope: { attack: 0.04, decay: 0.4, sustain: 0.4, release: 0.8 },
      }).toDestination()
    : new Tone.Synth({
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.4 },
      }).toDestination()
}

function getSynth(): Tone.Synth {
  return (makingSynths[clefMode] ??= makeMakingSynth(clefMode))
}

/** 音部記号を切り替える（地の音色が変わる）。 */
export function setClef(clef: Clef): void {
  clefMode = clef
}

/** iOS等のためAudioContextをユーザー操作で起動（初回のみ実効）。 */
export async function ensureAudio(): Promise<void> {
  if (started) return
  await Tone.start()
  started = true
}

/** 1音鳴らす（科学的音名 例 'C4'）。制作（配置・スクラブ）中はこの通常音で固定。 */
export function playNote(note: string, duration: Tone.Unit.Time = '8n'): void {
  getSynth().triggerAttackRelease(note, duration)
}

// 再生時のみ切り替えられる音色（制作中の音は通常音のまま＝学習を妨げない）。
export type Voice = 'piano' | 'bell' | 'pico' | 'sing'
export const VOICES: { id: Voice; label: string; name: string }[] = [
  { id: 'piano', label: '🎹', name: 'ぴあの' },
  { id: 'bell', label: '🔔', name: 'べる' },
  { id: 'pico', label: '🎵', name: 'ぴこぴこ' },
  { id: 'sing', label: '🎤', name: 'うた（ドレミ）' },
]

type AnySynth = Tone.Synth | Tone.FMSynth
// ヘ音の「ぴあの」は温かい低音に差し替えるため、鍵に音部記号を含める。
type VoiceKey = Voice | 'piano-bass'
const voiceCache: Partial<Record<VoiceKey, AnySynth>> = {}
let playbackVoice: Voice = 'piano'

function makeVoice(v: VoiceKey): AnySynth {
  switch (v) {
    case 'piano-bass':
      // 制作中と同じ丸い低音。ヘ音の地の音（クマ・ゾウ）。
      return new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.04, decay: 0.4, sustain: 0.4, release: 0.8 },
      }).toDestination()
    case 'bell':
      return new Tone.FMSynth({
        harmonicity: 3.01,
        modulationIndex: 14,
        envelope: { attack: 0.01, decay: 1.2, sustain: 0, release: 1.2 },
        modulationEnvelope: { attack: 0.01, decay: 0.4, sustain: 0, release: 0.4 },
      }).toDestination()
    case 'pico':
      return new Tone.Synth({
        oscillator: { type: 'square' },
        envelope: { attack: 0.005, decay: 0.1, sustain: 0.25, release: 0.2 },
        volume: -8,
      }).toDestination()
    default:
      return new Tone.Synth({
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.2, release: 0.4 },
      }).toDestination()
  }
}

function getVoice(v: Voice): AnySynth {
  // べる・ぴこぴこは子どもが自分で選んだ音なので音部記号では変えない。
  const key: VoiceKey = v === 'piano' && clefMode === 'bass' ? 'piano-bass' : v
  return (voiceCache[key] ??= makeVoice(key))
}

/** 再生音色を切り替える（既定=piano）。タップハンドラから同期で呼ばれる前提。 */
export function setPlaybackVoice(v: Voice): void {
  if (playbackVoice === 'sing' && v !== 'sing') stopSpeech()
  // 解錠はタップと同一tickでないと効かないため、ここで済ませる（primeSpeech参照）。
  if (v === 'sing') primeSpeech()
  playbackVoice = v
}

/**
 * 再生用に1音鳴らす（選択中の音色を使用）。
 * うたモードは音名を読み上げるが、読み上げ自体には音の高さが無い。
 * 高さの学習を損なわないよう、ピアノ音に重ねて歌わせる。
 */
export function playMelodyNote(note: string, duration: Tone.Unit.Time = '8n'): void {
  if (playbackVoice === 'sing') {
    getVoice('piano').triggerAttackRelease(note, duration)
    const solfa = pitchByNote(note)?.solfa
    if (solfa) speakSolfa(solfa)
    return
  }
  getVoice(playbackVoice).triggerAttackRelease(note, duration)
}

/**
 * 再生中断時に読み上げだけを止める。
 * 楽器音は 8n で自然減衰するため Tone 側は触らない（＝メロディ全体の停止ではない）。
 */
export function stopMelodySpeech(): void {
  stopSpeech()
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
