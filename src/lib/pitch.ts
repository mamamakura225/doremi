// 音高と五線譜上の縦位置のマッピング。
// 音部記号の違いは「音名の並び」と「最上線からの step」の表だけで吸収する。
// 純ロジックのみ。SVG/React/Tone.js に依存しない（Vitest対象）。

export type Solfa = 'ド' | 'レ' | 'ミ' | 'ファ' | 'ソ' | 'ラ' | 'シ'

/** 音部記号のモード（初期状態はト音） */
export type Clef = 'treble' | 'bass'

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
  /**
   * この音がどの音部記号で解決されたか。`step` が音部相対なので、
   * 値だけでは「同じ位置でも別の音」を区別できない（#56）。
   */
  readonly clef: Clef
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

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B']

/**
 * 最低音から1音ずつ上へ count 個ぶんの表を作る。
 * 低い音ほど step が大きいので、1音上がるごとに step を1減らす。
 */
function buildPitches(
  lowest: { letter: string; octave: number },
  lowestStep: number,
  count: number,
  clef: Clef,
): Pitch[] {
  const start = LETTERS.indexOf(lowest.letter)
  return Array.from({ length: count }, (_, i) => {
    const letter = LETTERS[(start + i) % 7]
    // C を跨ぐたびにオクターブが上がる
    const octave = lowest.octave + Math.floor((start + i) / 7)
    return {
      note: `${letter}${octave}`,
      solfa: SOLFA_BY_LETTER[letter],
      step: lowestStep - i,
      clef,
    }
  })
}

// ト音記号: 最上線=F5(step 0)。演奏範囲は ド(C4・下加線1本) 〜 高いミ(E5)。
// C4 は最上線から半スペース10個下（下加線1本）。
export const TREBLE_PITCHES: Pitch[] = buildPitches({ letter: 'C', octave: 4 }, 10, 10, 'treble')

// ヘ音記号: 最上線=A3(step 0)。演奏範囲は ファ(F2・五線の下の間) 〜 ラ(A3・最上線)。
// ド(C3)は五線の中（上から2番目の間）にあり、加線が要らない。
export const BASS_PITCHES: Pitch[] = buildPitches({ letter: 'F', octave: 2 }, 9, 10, 'bass')

const PITCHES: Record<Clef, Pitch[]> = { treble: TREBLE_PITCHES, bass: BASS_PITCHES }

/** その音部記号で演奏可能な音（低→高） */
export function pitchesOf(clef: Clef): Pitch[] {
  return PITCHES[clef]
}

/** その音部記号の「ド」（足場ガイドの対象） */
export function tonicOf(clef: Clef): Pitch {
  return pitchesOf(clef).find((p) => p.solfa === 'ド')!
}

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
export function snapYToPitch(y: number, layout: StaffLayout, clef: Clef): Pitch {
  const pitches = pitchesOf(clef)
  const rawStep = (y - layout.topLineY) / (layout.staffSpace / 2)
  const minStep = Math.min(...pitches.map((p) => p.step))
  const maxStep = Math.max(...pitches.map((p) => p.step))
  const clamped = Math.min(maxStep, Math.max(minStep, Math.round(rawStep)))
  // 全 step に音があるとは限らないため、最近傍の演奏可能 step を選ぶ。
  let best = pitches[0]
  let bestDist = Infinity
  for (const p of pitches) {
    const d = Math.abs(p.step - clamped)
    if (d < bestDist) {
      bestDist = d
      best = p
    }
  }
  return best
}

const PITCH_BY_NOTE: Record<Clef, Map<string, Pitch>> = {
  treble: new Map(TREBLE_PITCHES.map((p) => [p.note, p])),
  bass: new Map(BASS_PITCHES.map((p) => [p.note, p])),
}

/**
 * 科学的音名 → 音（その音部記号の演奏範囲外は undefined）。
 * clef の既定値は置かない——ト音とヘ音の音名は非重複なので、渡し忘れると
 * ヘ音側で 100% undefined になり、しかも型では見えない（#54）。
 */
export function pitchByNote(note: string, clef: Clef): Pitch | undefined {
  return PITCH_BY_NOTE[clef].get(note)
}

/** ド(C4・下加線)の音 */
export const MIDDLE_C: Pitch = TREBLE_PITCHES.find((p) => p.note === 'C4')!

// ミ→ファ と シ→ド の間には黒鍵が無い（半音で隣り合っている）。
const NO_SHARP_ABOVE = new Set(['E', 'B'])

/**
 * その音の「すぐ上」に黒鍵があるか（鍵盤併記で黒鍵を置く位置の判定）。
 * ♯♭ は演奏対象ではないので、描くだけの飾りとして使う。
 */
export function hasSharpAbove(pitch: Pitch): boolean {
  return !NO_SHARP_ABOVE.has(pitch.note[0])
}
