import { describe, expect, it } from 'vitest'
import { FOUND_PER_STAGE, judge, nextQuestion, stageOf, stagePitches } from './ear'
import { pitchByNote } from './pitch'

const P = (n: string, clef: 'treble' | 'bass' = 'treble') => pitchByNote(n, clef)!

describe('ききとりあそび（#110）', () => {
  it('ド・ミ・ソ の3音から始まり、5回見つけるごとに広がる', () => {
    expect(stagePitches(stageOf(0), 'treble').map((p) => p.solfa)).toEqual(['ド', 'ミ', 'ソ'])
    expect(stageOf(FOUND_PER_STAGE - 1)).toBe(0)
    expect(stagePitches(stageOf(FOUND_PER_STAGE), 'treble').map((p) => p.solfa)).toEqual([
      'ド', 'レ', 'ミ', 'ファ', 'ソ',
    ])
    expect(stagePitches(stageOf(FOUND_PER_STAGE * 2), 'treble')).toHaveLength(10)
    expect(stageOf(999)).toBe(2) // 最後の段階で止まる
  })

  it('ヘ音では1オクターブ下・音域に無い音は出さない', () => {
    expect(stagePitches(0, 'bass').map((p) => p.note)).toEqual(['C3', 'E3', 'G3'])
    for (const p of stagePitches(2, 'bass')) expect(p.clef).toBe('bass')
  })

  it('直前と同じ音は続けて出さない', () => {
    const prev = P('C4')
    for (const r of [0, 0.34, 0.5, 0.99]) {
      expect(nextQuestion(0, 'treble', prev, () => r).note).not.toBe('C4')
    }
    // 最初の問題は全部から
    expect(nextQuestion(0, 'treble', null, () => 0).note).toBe('C4')
    expect(nextQuestion(0, 'treble', null, () => 0.999).note).toBe('G4')
  })

  it('置いた音とお題を比べる（同じ／お題はもっと高い／もっと低い）', () => {
    expect(judge(P('E4'), P('E4'))).toBe('same')
    expect(judge(P('C4'), P('G4'))).toBe('higher') // 置いたド より お題のソ は上
    expect(judge(P('A4'), P('E4'))).toBe('lower')
  })
})
