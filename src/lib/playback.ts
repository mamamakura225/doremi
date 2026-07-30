// 再生スケジュール（純ロジック・Vitest対象）。
export interface Tick {
  /** ページ番号(0始まり) */
  page: number
  /** ページ内の音符インデックス(0始まり) */
  index: number
  /** 再生開始からの相対時刻(ms) */
  at: number
  /** その音が占めるステップ数（ふつう=1・のばす=2） */
  steps: number
}

/** 1音あたりの間隔(ms) */
export const STEP_MS = 600
/** お祝い演出の表示時間(ms) */
export const CELEBRATE_MS = 1400
/** 音と音の間に空ける間(ms)。のばす音が次の音に食い込まないための余白。 */
const GAP_MS = 100

/**
 * 各ページの音符の長さ（ステップ数の配列）を受け取り、左→右・ページ順のスケジュールを返す。
 * ページ境界には1ステップ分の小休符を挟む（空ページは飛ばす）。
 */
export function playbackSchedule(
  pageSteps: number[][],
  step: number = STEP_MS,
): { ticks: Tick[]; endAt: number } {
  const ticks: Tick[] = []
  let slot = 0
  let emitted = false
  pageSteps.forEach((steps, page) => {
    if (steps.length === 0) return
    if (emitted) slot += 1 // ページ境界の小休符
    steps.forEach((s, index) => {
      ticks.push({ page, index, at: slot * step, steps: s })
      slot += s
    })
    emitted = true
  })
  return { ticks, endAt: slot * step }
}

/**
 * ステップ数から実際の発音長を返す。
 * ふつうの音は従来どおり短い減衰音（'8n'）。のばす音は次の音の手前まで実際に伸ばす。
 */
export function noteDuration(steps: number, step: number = STEP_MS): string | number {
  return steps >= 2 ? (steps * step - GAP_MS) / 1000 : '8n'
}
