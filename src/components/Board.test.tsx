import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import type { Clef } from '../lib/pitch'
import type { PlacedNote } from '../lib/notes'
import Board from './Board'

vi.mock('../audio/synth', () => ({
  ensureAudio: vi.fn().mockResolvedValue(undefined),
  playNote: vi.fn(),
}))

// jsdom は SVG の座標変換を持たない。恒等変換のスタブ（client 座標＝viewBox 座標）。
beforeAll(() => {
  const proto = SVGSVGElement.prototype as unknown as Record<string, unknown>
  proto.createSVGPoint = function () {
    return {
      x: 0,
      y: 0,
      matrixTransform() {
        return { x: this.x, y: this.y }
      },
    }
  }
  proto.getScreenCTM = () => ({ inverse: () => ({}) })
  ;(SVGElement.prototype as unknown as Record<string, unknown>).setPointerCapture = () => {}
})

afterEach(cleanup)

function renderBoard(clef: Clef, onPlace = vi.fn(), notes: PlacedNote[] = []) {
  const view = render(
    <Board
      notes={notes}
      onPlace={onPlace}
      onRemove={vi.fn()}
      playingIndex={null}
      celebrating={false}
      clef={clef}
    />,
  )
  return { onPlace, view }
}

// このファイルが通しているのは「clef prop 変化 → レンダー中に drag を捨てる」経路。
// もう一方の防御（handlePointerUp の canPlace による音部一致チェック＝ブラウザで
// リセットが1フレーム遅れる窓を塞ぐ）は純関数として notes.test.ts で固定している。
describe('音部切替とドラッグ', () => {
  it('掴んでいる最中に音部が変わったら、配置エリアで離しても置かない（#56）', () => {
    const { onPlace, view } = renderBoard('treble')
    const toolbox = view.getByTestId('toolbox-normal')

    fireEvent.pointerDown(toolbox, { pointerId: 1, clientX: 950, clientY: 200 })
    fireEvent.pointerMove(toolbox, { pointerId: 1, clientX: 400, clientY: 200 }) // 配置エリア内へ

    // App の toggleClef 相当（clef prop が bass に変わる）
    view.rerender(
      <Board
        notes={[]}
        onPlace={onPlace}
        onRemove={vi.fn()}
        playingIndex={null}
        celebrating={false}
        clef={'bass'}
      />,
    )

    fireEvent.pointerUp(toolbox, { pointerId: 1, clientX: 400, clientY: 200 })
    expect(onPlace).not.toHaveBeenCalled()
  })

  it('音部が変わらなければ配置エリアで離すと置く（対照）', () => {
    const { onPlace, view } = renderBoard('treble')
    const toolbox = view.getByTestId('toolbox-normal')

    fireEvent.pointerDown(toolbox, { pointerId: 1, clientX: 950, clientY: 200 })
    fireEvent.pointerMove(toolbox, { pointerId: 1, clientX: 400, clientY: 200 })
    fireEvent.pointerUp(toolbox, { pointerId: 1, clientX: 400, clientY: 200 })

    expect(onPlace).toHaveBeenCalledTimes(1)
    expect(onPlace.mock.calls[0][0].clef).toBe('treble')
  })
})
