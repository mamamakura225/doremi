/// <reference types="node" />
import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

// アニメーションを足すたびに reduced-motion の停止を書き忘れないための機械的な検査（#63）。
// 対象年齢に感覚過敏の子が含まれるので、動きは OS の「視差効果を減らす」で必ず止める。
// ファイルは cwd 基準で読む（?raw は Vitest の CSS 処理で空文字になり、
// import.meta.url は jsdom 環境で http: になって fs で読めない）。
const SRC = resolve(process.cwd(), 'src')
const css = readFileSync(join(SRC, 'index.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')

const REDUCE_OPEN = '@media (prefers-reduced-motion: reduce)'
const ANIMATION_DECL = /(^|[;\s{])(-webkit-)?animation(-name)?\s*:/
const SINGLE_CLASS = /^\.([a-zA-Z][\w-]*)$/

function splitReduceBlock(src: string) {
  const start = src.indexOf(REDUCE_OPEN)
  if (start < 0) return { before: src, reduce: '', after: '' }
  // 対応する閉じ括弧まで（入れ子1段の @media を想定）
  let depth = 0
  let end = src.length
  for (let i = src.indexOf('{', start); i < src.length; i++) {
    if (src[i] === '{') depth++
    else if (src[i] === '}' && --depth === 0) {
      end = i + 1
      break
    }
  }
  return { before: src.slice(0, start), reduce: src.slice(start, end), after: src.slice(end) }
}

/** 宣言ブロックが条件に合うルールのセレクタ（カンマ区切りを1つずつ） */
function selectorsOf(src: string, test: (body: string) => boolean): string[] {
  return [...src.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter((m) => test(m[2]))
    .flatMap((m) => m[1].split(',').map((s) => s.trim()))
}

describe('prefers-reduced-motion（#63）', () => {
  const { before, reduce, after } = splitReduceBlock(css)

  it('reduced-motion ブロックがある', () => {
    expect(reduce).not.toBe('')
  })

  it('reduced-motion ブロックより後ろでアニメーションを宣言しない（同じ詳細度なら後勝ちで止まらない）', () => {
    expect(ANIMATION_DECL.test(after)).toBe(false)
  })

  it('アニメーションは単一クラスのセレクタで書く（詳細度で reduce 側が負けないように）', () => {
    const complex = selectorsOf(before, (b) => ANIMATION_DECL.test(b)).filter(
      (s) => !SINGLE_CLASS.test(s),
    )
    expect(complex).toEqual([])
  })

  it('アニメーションを持つクラスはすべて reduced-motion で animation: none になる', () => {
    const animated = selectorsOf(before, (b) => ANIMATION_DECL.test(b))
    expect(animated.length).toBeGreaterThan(0)
    const stopped = new Set(
      selectorsOf(reduce, (b) => /(^|[;\s{])animation\s*:\s*none/.test(b)).filter((s) =>
        SINGLE_CLASS.test(s),
      ),
    )
    expect(animated.filter((s) => !stopped.has(s))).toEqual([])
  })

  it('トランジションを持つクラスも reduced-motion で transition: none になる（#104）', () => {
    const TRANSITION_DECL = /(^|[;\s{])transition(-property)?\s*:/
    const moving = selectorsOf(before, (b) => TRANSITION_DECL.test(b))
    const stopped = new Set(
      selectorsOf(reduce, (b) => /(^|[;\s{])transition\s*:\s*none/.test(b)).filter((s) =>
        SINGLE_CLASS.test(s),
      ),
    )
    expect(moving.filter((s) => !stopped.has(s))).toEqual([])
  })

  it('Tailwind のアニメ（animate-*）は motion-safe: を付けて使う', () => {
    const tsx = readdirSync(SRC, { recursive: true })
      .map(String)
      .filter((f) => f.endsWith('.tsx') && !f.endsWith('.test.tsx'))
    const bare = tsx.flatMap((f) =>
      [...readFileSync(join(SRC, f), 'utf8').matchAll(/[\w:-]*\banimate-[\w-]+/g)]
        .map((m) => m[0])
        .filter((cls) => !cls.startsWith('motion-safe:'))
        .map((cls) => `${f}: ${cls}`),
    )
    expect(bare).toEqual([])
  })
})
