// 音高と五線譜上の縦位置のマッピング（ト音記号）。
// 純ロジックのみ。SVG/React/Tone.js に依存しない（Vitest対象）。

export type Solfa = 'ド' | 'レ' | 'ミ' | 'ファ' | 'ソ' | 'ラ' | 'シ'

export interface Pitch {
  /** Tone.js 等で使う科学的音名（例: 'C4'） */
  note: string
  /** ドレミ表記 */
  solfa: Solfa
  /**
   * 五線譜の最上線からの半スペース数（下方向が正）。
   * 0=最上線(F5), 1=その下の間(E5), ... 1段ごとに線→間→線と下がる。
   */
  step: number
}

const SOLFA_BY_LETTER: Record<string, Solfa> = {
  C: 'ド',
  D: 'レ',
  E: 'ミ',
  F: 'ファ',
  G: 'ソ',
  A: 'ラ',
  B: 'シ',
}

// ト音記号: 最上線=F5(step 0)。下方向に半スペースずつ step が増える。
// 演奏範囲は ド(C4・下加線1本) 〜 高いミ(E5) の1オクターブ+α。
const TREBLE_STEP_OF_C4 = 10 // C4 は最上線から半スペース10個下（下加線1本）

function buildTreblePitches(): Pitch[] {
  const order: Array<{ letter: string; octave: number }> = [
    { letter: 'C', octave: 4 },
    { letter: 'D', octave: 4 },
    { letter: 'E', octave: 4 },
    { letter: 'F', octave: 4 },
    { letter: 'G', octave: 4 },
    { letter: 'A', octave: 4 },
    { letter: 'B', octave: 4 },
    { letter: 'C', octave: 5 },
    { letter: 'D', octave: 5 },
    { letter: 'E', octave: 5 },
  ]
  // 低い音ほど step が大きい。C4 を基準に1音ごとに step を1減らす。
  return order.map((o, i) => ({
    note: `${o.letter}${o.octave}`,
    solfa: SOLFA_BY_LETTER[o.letter],
    step: TREBLE_STEP_OF_C4 - i,
  }))
}

/** 演奏可能な音（低→高） */
export const TREBLE_PITCHES: Pitch[] = buildTreblePitches()

const MIN_STEP = Math.min(...TREBLE_PITCHES.map((p) => p.step))
const MAX_STEP = Math.max(...TREBLE_PITCHES.map((p) => p.step))
const PITCH_BY_STEP = new Map(TREBLE_PITCHES.map((p) => [p.step, p]))

export interface StaffLayout {
  /** 最上線(F5)のY座標 */
  topLineY: number
  /** 隣り合う線の間隔（1スペース） */
  staffSpace: number
}

/** step → Y座標 */
export function stepToY(step: number, layout: StaffLayout): number {
  return layout.topLineY + (step * layout.staffSpace) / 2
}

/** 音 → Y座標 */
export function pitchToY(pitch: Pitch, layout: StaffLayout): number {
  return stepToY(pitch.step, layout)
}

/**
 * Y座標を最も近い音（線上 or 間）にスナップする。
 * 演奏範囲外は端の音にクランプ。
 */
export function snapYToPitch(y: number, layout: StaffLayout): Pitch {
  const rawStep = (y - layout.topLineY) / (layout.staffSpace / 2)
  const clamped = Math.min(MAX_STEP, Math.max(MIN_STEP, Math.round(rawStep)))
  // 全 step に音があるとは限らないため、最近傍の演奏可能 step を選ぶ。
  const exact = PITCH_BY_STEP.get(clamped)
  if (exact) return exact
  let best = TREBLE_PITCHES[0]
  let bestDist = Infinity
  for (const p of TREBLE_PITCHES) {
    const d = Math.abs(p.step - clamped)
    if (d < bestDist) {
      bestDist = d
      best = p
    }
  }
  return best
}

const PITCH_BY_NOTE = new Map(TREBLE_PITCHES.map((p) => [p.note, p]))

/** 科学的音名 → 音（演奏範囲外は undefined） */
export function pitchByNote(note: string): Pitch | undefined {
  return PITCH_BY_NOTE.get(note)
}

/** ド(C4・下加線)の音 */
export const MIDDLE_C: Pitch = TREBLE_PITCHES.find((p) => p.note === 'C4')!
