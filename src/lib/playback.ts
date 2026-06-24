// 再生スケジュール（純ロジック・Vitest対象）。
export interface Tick {
  index: number
  /** 再生開始からの相対時刻(ms) */
  at: number
}

/** 1音あたりの間隔(ms) */
export const STEP_MS = 600
/** お祝い演出の表示時間(ms) */
export const CELEBRATE_MS = 1400

/** 音符を左→右に等間隔で鳴らすスケジュールと終了時刻を返す。 */
export function playbackSchedule(
  count: number,
  step: number = STEP_MS,
): { ticks: Tick[]; endAt: number } {
  const ticks: Tick[] = Array.from({ length: count }, (_, i) => ({
    index: i,
    at: i * step,
  }))
  return { ticks, endAt: count * step }
}
