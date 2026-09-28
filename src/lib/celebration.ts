// お祝いの段階（#103）。純ロジック（Vitest 対象）。

export type CelebrationLevel = 'small' | 'big' | 'special'

/**
 * 段階ごとの長さ（ms）。どれも 2 秒以内（docs/art-direction.md の「動き」）。
 * 毎回大げさだと音を聴かなくなる（講師ペルソナ）ので、ふつうは短く小さく。
 */
export const CELEBRATION_MS: Record<CelebrationLevel, number> = {
  small: 1400,
  big: 1800,
  special: 2000,
}

interface Input {
  /** 再生した曲の、音符のあるページ数 */
  pages: number
  /** おてほんモードで、お手本どおりに最後まで置けたか */
  guideComplete: boolean
}

/** 最後まで聞いたときのお祝いの強さ。おてほんの完成がいちばん特別、次に長い曲（複数ページ） */
export function celebrationLevel({ pages, guideComplete }: Input): CelebrationLevel {
  if (guideComplete) return 'special'
  if (pages > 1) return 'big'
  return 'small'
}

/** おてほんの音をすべて、順番どおりに置けたか（余分な音があれば完成ではない） */
export function isGuideComplete(placed: readonly string[], targets: readonly string[]): boolean {
  return (
    targets.length > 0 &&
    placed.length === targets.length &&
    targets.every((t, i) => placed[i] === t)
  )
}
