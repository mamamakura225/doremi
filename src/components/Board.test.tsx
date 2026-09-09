import type { ComponentProps } from 'react'
import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { TRASH_CX, TRASH_CY } from '../lib/layout'
import { type Clef, TREBLE_PITCHES } from '../lib/pitch'
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

function boardProps(over: Partial<ComponentProps<typeof Board>> = {}) {
  return {
    notes: [] as PlacedNote[],
    onPlace: vi.fn(),
    onRemove: vi.fn(),
    playingIndex: null,
    celebrating: false,
    clef: 'treble' as Clef,
    ...over,
  }
}

function renderBoard(clef: Clef, onPlace = vi.fn(), notes: PlacedNote[] = []) {
  const props = boardProps({ clef, onPlace, notes })
  const view = render(<Board {...props} />)
  return { onPlace, view }
}

function note(id: string): PlacedNote {
  return { id, pitch: TREBLE_PITCHES[0], long: false }
}

// このファイルが通しているのは「clef prop 変化 → レンダー中に drag を捨てる」経路。
// もう一方の防御（handlePointerUp の canPlace による音部一致チェック＝ブラウザで
// リセットが1フレーム遅れる窓を塞ぐ）は純関数として notes.test.ts で固定している。
// 鍵盤タップの tracking ガード（handleKeyPress）は、useFitsKeyboard が jsdom の
// getBoundingClientRect（全0）で常に false になり Keyboard が描画されないため、
// ここでは固定できない（#70 の E2E の領分）。
describe('音部切替とドラッグ', () => {
  it('掴んでいる最中に音部が変わったら、配置エリアで離しても置かない（#56）', () => {
    const onPlace = vi.fn()
    const view = render(<Board {...boardProps({ onPlace })} />)
    const toolbox = view.getByTestId('toolbox-normal')

    fireEvent.pointerDown(toolbox, { pointerId: 1, clientX: 950, clientY: 200 })
    fireEvent.pointerMove(toolbox, { pointerId: 1, clientX: 400, clientY: 200 }) // 配置エリア内へ

    // App の toggleClef 相当（clef prop が bass に変わる）
    view.rerender(<Board {...boardProps({ onPlace, clef: 'bass' })} />)

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

describe('配置領域を Y でも切る（#59）', () => {
  it('ゴミ箱帯・鍵盤の上で離したら音符を置かない', () => {
    const { onPlace, view } = renderBoard('treble')
    const toolbox = view.getByTestId('toolbox-normal')

    fireEvent.pointerDown(toolbox, { pointerId: 1, clientX: 950, clientY: 200 })
    // 配置エリアの X だが、Y は帯の中（恒等スタブなので clientY = viewBox y）
    fireEvent.pointerMove(toolbox, { pointerId: 1, clientX: 400, clientY: 460 })
    fireEvent.pointerUp(toolbox, { pointerId: 1, clientX: 400, clientY: 460 })

    expect(onPlace).not.toHaveBeenCalled()
  })

  it('五線の上（帯の直前）で離せば置ける（対照）', () => {
    const { onPlace, view } = renderBoard('treble')
    const toolbox = view.getByTestId('toolbox-normal')

    fireEvent.pointerDown(toolbox, { pointerId: 1, clientX: 950, clientY: 200 })
    fireEvent.pointerMove(toolbox, { pointerId: 1, clientX: 400, clientY: 300 })
    fireEvent.pointerUp(toolbox, { pointerId: 1, clientX: 400, clientY: 300 })

    expect(onPlace).toHaveBeenCalledTimes(1)
  })
})

describe('単一ポインタ追跡（#58）', () => {
  it('2本目の pointerdown はドラッグを横取りしない', () => {
    const { onPlace, view } = renderBoard('treble')
    const toolbox = view.getByTestId('toolbox-normal')

    fireEvent.pointerDown(toolbox, { pointerId: 1, clientX: 950, clientY: 200 })
    // 2本目の指（手のひら）が同じお道具箱を押す
    fireEvent.pointerDown(toolbox, { pointerId: 2, clientX: 950, clientY: 100 })
    // 1本目のドラッグで配置まで完了できる
    fireEvent.pointerMove(toolbox, { pointerId: 1, clientX: 400, clientY: 200 })
    fireEvent.pointerUp(toolbox, { pointerId: 1, clientX: 400, clientY: 200 })

    expect(onPlace).toHaveBeenCalledTimes(1)

    // 1個置いて離したら、すぐ次を掴んで置ける（tracking ガードが解けている）
    fireEvent.pointerDown(toolbox, { pointerId: 3, clientX: 950, clientY: 200 })
    fireEvent.pointerMove(toolbox, { pointerId: 3, clientX: 500, clientY: 200 })
    fireEvent.pointerUp(toolbox, { pointerId: 3, clientX: 500, clientY: 200 })
    expect(onPlace).toHaveBeenCalledTimes(2)
  })

  it('掴んでいる音符があるとき、2本目の指は別の音符を掴めない', () => {
    const onRemove = vi.fn()
    const view = render(
      <Board {...boardProps({ notes: [note('n1'), note('n2')], onRemove })} />,
    )
    fireEvent.pointerDown(view.getByTestId('note-n1'), {
      pointerId: 1,
      clientX: 300,
      clientY: 300,
    })
    // 2本目の指が別の音符を掴もうとする → 無視される
    fireEvent.pointerDown(view.getByTestId('note-n2'), {
      pointerId: 2,
      clientX: 400,
      clientY: 300,
    })
    // 1本目をゴミ箱で離す → n1 が消える（del が n2 に化けていない）
    fireEvent.pointerMove(view.getByTestId('note-n1'), {
      pointerId: 1,
      clientX: TRASH_CX,
      clientY: TRASH_CY,
    })
    fireEvent.pointerUp(view.getByTestId('note-n1'), {
      pointerId: 1,
      clientX: TRASH_CX,
      clientY: TRASH_CY,
    })
    expect(onRemove).toHaveBeenCalledWith('n1')
  })

  it('掴んでいる音符が配列から消えたら、ゴースト（ゴミ箱）が残らない', () => {
    const props = boardProps({ notes: [note('n1')] })
    const view = render(<Board {...props} />)

    fireEvent.pointerDown(view.getByTestId('note-n1'), {
      pointerId: 1,
      clientX: 300,
      clientY: 300,
    })
    expect(view.queryByText('🗑️')).not.toBeNull() // 掴めている

    // 別の指で ↩ / ページ切替 → その音符が notes から消える
    view.rerender(<Board {...boardProps({ notes: [], onPlace: props.onPlace })} />)

    expect(view.queryByText('🗑️')).toBeNull()

    // 掴みが解けている＝盤面が生きている（お道具箱から普通に置ける）
    fireEvent.pointerDown(view.getByTestId('toolbox-normal'), {
      pointerId: 2,
      clientX: 950,
      clientY: 200,
    })
    fireEvent.pointerMove(view.getByTestId('toolbox-normal'), {
      pointerId: 2,
      clientX: 400,
      clientY: 200,
    })
    fireEvent.pointerUp(view.getByTestId('toolbox-normal'), {
      pointerId: 2,
      clientX: 400,
      clientY: 200,
    })
    expect(props.onPlace).toHaveBeenCalledTimes(1)
  })

  it('pointercancel の後は、その指で離しても音符を置かない', () => {
    const { onPlace, view } = renderBoard('treble')
    const toolbox = view.getByTestId('toolbox-normal')

    fireEvent.pointerDown(toolbox, { pointerId: 1, clientX: 950, clientY: 200 })
    fireEvent.pointerMove(toolbox, { pointerId: 1, clientX: 400, clientY: 200 })
    // システムジェスチャ等でブラウザがポインタを中断
    fireEvent.pointerCancel(toolbox, { pointerId: 1, clientX: 400, clientY: 200 })
    fireEvent.pointerUp(toolbox, { pointerId: 1, clientX: 400, clientY: 200 })

    expect(onPlace).not.toHaveBeenCalled()
  })
})
