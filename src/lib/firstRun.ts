// はじめて開いたか（タイトル画面を出すか・#112）。端末内 localStorage のみ。
// 読めない環境では「はじめて」として扱う（タイトルが出るだけで困らない）。書けなければ黙って諦める。

const KEY = 'doremi.titleSeen.v1'

/** タイトルを見たことがあるか */
export function hasSeenTitle(): boolean {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

/** タイトルを見たことを覚える */
export function markTitleSeen(): void {
  try {
    localStorage.setItem(KEY, '1')
  } catch {
    // 次に開いたときもタイトルが出るだけ
  }
}
