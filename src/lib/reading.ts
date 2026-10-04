// よみとりあそび（#155）の純ロジック（Vitest 対象）。
// 五線の音符を見て、鍵盤で答える（ききとり #110 の逆向き）。採点しない——よめた数は段階を進める
// ためだけに数え、点数として見せない。ト音記号だけ（ヘ音・大譜表は後のフェーズ）。
import { type Pitch, pitchesOf } from './pitch'
import type { StickerId } from './stickers'

/** 段階ごとに出す音。真ん中のドから少しずつ上へ広げる（片手の5本指＝ド〜ソ を2段目に置く） */
const STAGES: string[][] = [
  ['C4', 'D4', 'E4'],
  ['C4', 'D4', 'E4', 'F4', 'G4'],
  ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'],
  ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5'],
]

export const STAGE_COUNT = STAGES.length

/** 何回よめたら次の段階へ進むか（ききとりと同じ刻み） */
export const READ_PER_STAGE = 5

/** 何回まちがえたら、正しい鍵をうっすら光らせるか */
export const HINT_AFTER_MISSES = 2

/** 段階をクリアしたときのシール（段階の順） */
export const STAGE_STICKERS: StickerId[] = ['read-stage-1', 'read-stage-2', 'read-stage-3', 'read-stage-4']

/** 範囲外・小数を 0〜最後の段階 に丸める */
export function clampStage(stage: number): number {
  return Number.isInteger(stage) ? Math.min(Math.max(stage, 0), STAGE_COUNT - 1) : 0
}

/** その段階で出す音（ト音の Pitch・低い順） */
export function readingPitches(stage: number): Pitch[] {
  const names = STAGES[clampStage(stage)]
  return pitchesOf('treble').filter((p) => names.includes(p.note))
}

/** 苦手の重み（音名 → 0〜WEAK_MAX）。アプリを開いている間だけ持つ（保存しない） */
export type Weak = Readonly<Record<string, number>>

const WEAK_MAX = 3

/** まちがえた音を出やすくする */
export function missed(weak: Weak, note: string): Weak {
  return { ...weak, [note]: Math.min((weak[note] ?? 0) + 1, WEAK_MAX) }
}

/** 1回でよめた音は、出やすさを1つ戻す */
export function readFirstTry(weak: Weak, note: string): Weak {
  return { ...weak, [note]: Math.max((weak[note] ?? 0) - 1, 0) }
}

/**
 * 次の問題。直前と同じ音は出さない。苦手な音ほど出やすい（重み = 1 + weak）。
 * random は 0 以上 1 未満（テストでは決まった値を渡す）
 */
export function nextReading(stage: number, prev: Pitch | null, weak: Weak, random: () => number): Pitch {
  const all = readingPitches(stage)
  const choices = prev && all.length > 1 ? all.filter((p) => p.note !== prev.note) : all
  const weights = choices.map((p) => 1 + (weak[p.note] ?? 0))
  let r = random() * weights.reduce((a, b) => a + b, 0)
  for (let i = 0; i < choices.length; i++) {
    r -= weights[i]
    if (r < 0) return choices[i]
  }
  return choices[choices.length - 1]
}

export interface ReadingProgress {
  stage: number
  /** いまの段階でよめた数（0〜READ_PER_STAGE-1・開き直すと 0） */
  count: number
}

/**
 * 1つよめたあとの進み具合。READ_PER_STAGE 回で次の段階へ（最後の段階では数え直す）。
 * cleared はクリアした段階（シールを出す）。クリアしていなければ null
 */
export function afterRead(p: ReadingProgress): ReadingProgress & { cleared: number | null } {
  const count = p.count + 1
  if (count < READ_PER_STAGE) return { stage: p.stage, count, cleared: null }
  return { stage: Math.min(p.stage + 1, STAGE_COUNT - 1), count: 0, cleared: p.stage }
}

/**
 * よめた数に入れるか。正しい鍵が光ったあと（HINT_AFTER_MISSES 回まちがえたあと）の正解は
 * 答えを見て押したのと同じなので数えない——数えると、読まずに段階が進んでしまう
 */
export function counts(misses: number): boolean {
  return misses < HINT_AFTER_MISSES
}

const KEY = 'doremi.reading.v1'

/** 保存した段階を復元する（壊れている・範囲外なら最初の段階） */
export function parseReading(raw: string | null): number {
  if (!raw) return 0
  try {
    const data = JSON.parse(raw)
    return typeof data?.stage === 'number' ? clampStage(data.stage) : 0
  } catch {
    return 0
  }
}

/** 到達した段階を読み込む（サイトデータ遮断でも例外を出さない） */
export function loadReading(): number {
  try {
    return parseReading(localStorage.getItem(KEY))
  } catch {
    return 0
  }
}

/** 到達した段階を保存する。失敗しても黙って諦める（このセッション中は手元の段階で続く） */
export function saveReading(stage: number): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ stage: clampStage(stage) }))
  } catch {
    // 読めない年齢なので失敗は伝えない
  }
}
