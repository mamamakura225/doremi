/// <reference types="node" />
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// ?raw は Vitest の CSS 処理で空文字になるので、ファイルを直接読む
const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8')

// アニメーションを足すたびに reduced-motion の停止を書き忘れないための機械的な検査（#63）。
// 対象年齢に感覚過敏の子が含まれるので、動きは OS の「視差効果を減らす」で必ず止める。

const REDUCE_OPEN = '@media (prefers-reduced-motion: reduce)'

function splitReduceBlock(src: string): { outside: string; reduce: string } {
  const start = src.indexOf(REDUCE_OPEN)
  if (start < 0) return { outside: src, reduce: '' }
  // 対応する閉じ括弧まで（入れ子1段の @media を想定）
  let depth = 0
  let end = start
  for (let i = src.indexOf('{', start); i < src.length; i++) {
    if (src[i] === '{') depth++
    else if (src[i] === '}' && --depth === 0) {
      end = i + 1
      break
    }
  }
  return { outside: src.slice(0, start) + src.slice(end), reduce: src.slice(start, end) }
}

/** `animation:` を宣言しているルールのクラス名 */
function animatedClasses(src: string): string[] {
  const names = new Set<string>()
  const rule = /([^{}]+)\{([^{}]*)\}/g
  for (const m of src.matchAll(rule)) {
    if (!/(^|;|\s)animation(-name)?\s*:/.test(m[2])) continue
    for (const c of m[1].matchAll(/\.([a-zA-Z][\w-]*)/g)) names.add(c[1])
  }
  return [...names]
}

describe('prefers-reduced-motion（#63）', () => {
  const { outside, reduce } = splitReduceBlock(css.replace(/\/\*[\s\S]*?\*\//g, ''))

  it('reduced-motion ブロックがある', () => {
    expect(reduce).not.toBe('')
  })

  it('アニメーションを持つクラスはすべて reduced-motion で animation: none になる', () => {
    const animated = animatedClasses(outside)
    expect(animated.length).toBeGreaterThan(0)
    const stopped = new Set(
      [...reduce.matchAll(/([^{}]+)\{([^{}]*animation\s*:\s*none[^{}]*)\}/g)].flatMap((m) =>
        [...m[1].matchAll(/\.([a-zA-Z][\w-]*)/g)].map((c) => c[1]),
      ),
    )
    expect(animated.filter((c) => !stopped.has(c))).toEqual([])
  })
})
