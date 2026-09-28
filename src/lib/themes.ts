// 背景の着せ替え（#111）。純データ＋薄い I/O（Vitest 対象）。
// どのテーマでも五線の紙（PAPER）は同じ——読みやすさ（輪郭色との比 7:1）はテーマで変わらない。
// 7色は使わない（docs/art-direction.md）。

export type ThemeId = 'meadow' | 'sakura' | 'snow' | 'night'

export interface Theme {
  id: ThemeId
  name: string
  /** 解放に要るシールの枚数 */
  need: number
  /** 空（上・中・下） */
  sky: [string, string, string]
  /** 遠くの丘・近くの丘 */
  hills: [string, string]
  /** 空に出すもの */
  celestial: 'sun' | 'moon'
  /** 飾り */
  deco: 'flower' | 'petal' | 'snow' | 'star'
}

export const THEMES: Theme[] = [
  {
    id: 'meadow',
    name: 'はらっぱ',
    need: 0,
    sky: ['#cdeeff', '#eaf8ff', '#fdf6e3'],
    hills: ['#d6efc8', '#bfe3a8'],
    celestial: 'sun',
    deco: 'flower',
  },
  {
    id: 'sakura',
    name: 'さくら',
    need: 3,
    sky: ['#ffe4ef', '#fff3f7', '#fdf6e3'],
    hills: ['#e6f2d6', '#d3e9bf'],
    celestial: 'sun',
    deco: 'petal',
  },
  {
    id: 'snow',
    name: 'ゆき',
    need: 6,
    sky: ['#c6d9ee', '#e2ecf7', '#fbfdff'],
    hills: ['#f4f8fc', '#e6eef7'],
    celestial: 'sun',
    deco: 'snow',
  },
  {
    id: 'night',
    name: 'よぞら',
    need: 9,
    sky: ['#2f3d6b', '#4b5a8f', '#8b95bd'],
    hills: ['#5d6b8f', '#4a5779'],
    celestial: 'moon',
    deco: 'star',
  },
]

/** テーマを id で引く（知らない id ははらっぱ） */
export function themeOf(id: string | null | undefined): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0]
}

/** シールの枚数で使えるテーマか */
export function isUnlocked(theme: Theme, stickers: number): boolean {
  return stickers >= theme.need
}

const KEY = 'doremi.theme.v1'

/** 選んでいたテーマ（読めない・まだ解放されていない・知らないなら はらっぱ） */
export function loadTheme(stickers: number): ThemeId {
  try {
    const t = themeOf(localStorage.getItem(KEY))
    return isUnlocked(t, stickers) ? t.id : 'meadow'
  } catch {
    return 'meadow'
  }
}

/** 選んだテーマを覚える（書けなければ黙って諦める） */
export function saveTheme(id: ThemeId): void {
  try {
    localStorage.setItem(KEY, id)
  } catch {
    // 次に開いたときは はらっぱ
  }
}
