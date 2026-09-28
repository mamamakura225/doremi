// ききとりあそび（#110）の純ロジック（Vitest 対象）。
// 鳴った音を五線で探す。採点しない——違っていても鳴らして比べるだけで、何も失わない。
import { type Clef, type Pitch, pitchesOf } from './pitch'

/** 段階ごとに出す音（ト音の音名。ヘ音では1オクターブ下）。最初は ド・ミ・ソ の3音から */
const STAGES: string[][] = [
  ['C4', 'E4', 'G4'],
  ['C4', 'D4', 'E4', 'F4', 'G4'],
  ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5'],
]

/** 何回見つけたら次の段階へ進むか */
export const FOUND_PER_STAGE = 5

/** 見つけた回数から、いまの段階（0 始まり・最後の段階で止まる） */
export function stageOf(found: number): number {
  return Math.min(Math.floor(found / FOUND_PER_STAGE), STAGES.length - 1)
}

/** その段階で出す音（その音部記号の Pitch） */
export function stagePitches(stage: number, clef: Clef): Pitch[] {
  const names = STAGES[Math.min(stage, STAGES.length - 1)].map((n) =>
    clef === 'bass' ? n.replace(/\d$/, (o) => String(Number(o) - 1)) : n,
  )
  // ヘ音の音域（F2〜A3）に無い音は出さない（段階3の シ〜高いミ）
  return pitchesOf(clef).filter((p) => names.includes(p.note))
}

/**
 * 次の問題。直前と同じ音は出さない（同じ音が続くと「当てっこ」にならない）。
 * random は 0 以上 1 未満（テストでは決まった値を渡す）
 */
export function nextQuestion(stage: number, clef: Clef, prev: Pitch | null, random: () => number): Pitch {
  const all = stagePitches(stage, clef)
  const choices = prev && all.length > 1 ? all.filter((p) => p.note !== prev.note) : all
  return choices[Math.min(Math.floor(random() * choices.length), choices.length - 1)]
}

export type Judge = 'same' | 'higher' | 'lower'

/**
 * 置いた音をお題と比べる。'higher' は「お題はもっと高い（上）」、'lower' は「もっと低い（下）」。
 * step は低い音ほど大きい
 */
export function judge(placed: Pitch, target: Pitch): Judge {
  if (placed.note === target.note) return 'same'
  return placed.step > target.step ? 'higher' : 'lower'
}
