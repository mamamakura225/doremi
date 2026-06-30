// 再生スケジュール（純ロジック・Vitest対象）。
export interface Tick {
  /** ページ番号(0始まり) */
  page: number
  /** ページ内の音符インデックス(0始まり) */
  index: number
  /** 再生開始からの相対時刻(ms) */
  at: number
}

/** 1音あたりの間隔(ms) */
export const STEP_MS = 600
/** お祝い演出の表示時間(ms) */
export const CELEBRATE_MS = 1400

/**
 * 各ページの音符数を受け取り、左→右・ページ順に等間隔で鳴らすスケジュールを返す。
 * ページ境界には1ステップ分の小休符を挟む（空ページは飛ばす）。
 */
export function playbackSchedule(
  counts: number[],
  step: number = STEP_MS,
): { ticks: Tick[]; endAt: number } {
  const ticks: Tick[] = []
  let slot = 0
  let emitted = false
  counts.forEach((count, page) => {
    if (count === 0) return
    if (emitted) slot += 1 // ページ境界の小休符
    for (let index = 0; index < count; index++) {
      ticks.push({ page, index, at: slot * step })
      slot += 1
    }
    emitted = true
  })
  return { ticks, endAt: slot * step }
}
