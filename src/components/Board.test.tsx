import type { ComponentProps } from 'react'
import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import {
  NOTE_HEAD_RX,
  NOTE_HIT_W,
  STAFF_LAYOUT,
  STAFF_LEFT,
  STAFF_RIGHT,
  TRASH_CX,
  TRASH_CY,
  columnX,
} from '../lib/layout'
import { type Clef, type Pitch, TREBLE_PITCHES, pitchByNote } from '../lib/pitch'
import type { PlacedNote } from '../lib/notes'
import { PAPER, TOOLBOX_NOTE_COLOR } from '../lib/colors'
import Board from './Board'

vi.mock('../audio/synth', () => ({
  ensureAudio: vi.fn().mockResolvedValue(undefined),
  playNote: vi.fn(),
}))

// jsdom は SVG の座標変換を持たない。getScreenCTM に恒等行列を返させて
// client 座標 = viewBox 座標にする。行列演算そのものは svgPoint.test.ts が検査する。
beforeAll(() => {
  const proto = SVGSVGElement.prototype as unknown as Record<string, unknown>
  const identity = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }
  proto.getScreenCTM = () => ({ inverse: () => identity })
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

  it('配置済み音符は符頭より広い不可視ヒット矩形で受ける（#62）', () => {
    const view = render(<Board {...boardProps({ notes: [note('n1')] })} />)
    const g = view.getByTestId('note-n1')
    const hit = g.querySelector('rect')
    expect(hit).not.toBeNull()
    expect(hit!.getAttribute('fill')).toBe('transparent')
    expect(Number(hit!.getAttribute('width'))).toBe(NOTE_HIT_W)
    expect(Number(hit!.getAttribute('width'))).toBeGreaterThan(NOTE_HEAD_RX * 2)
  })

  it('のばす音のヒット矩形は2列ぶん（#62）', () => {
    const long: PlacedNote = { ...note('L1'), long: true }
    const view = render(<Board {...boardProps({ notes: [long] })} />)
    const hit = view.getByTestId('note-L1').querySelector('rect')
    expect(Number(hit!.getAttribute('width'))).toBe(NOTE_HIT_W * 2)
  })

  it('掴んでいる音符が配列から消えたら、ゴースト（ゴミ箱）が残らない', () => {
    const props = boardProps({ notes: [note('n1')] })
    const view = render(<Board {...props} />)

    fireEvent.pointerDown(view.getByTestId('note-n1'), {
      pointerId: 1,
      clientX: 300,
      clientY: 300,
    })
    // タップと区別するため、少し動かしてから「掴んだ」になる（#108）
    fireEvent.pointerMove(view.getByTestId('note-n1'), { pointerId: 1, clientX: 300, clientY: 360 })
    expect(view.queryByTestId('trash')).not.toBeNull() // 掴めている

    // 別の指で ↩ / ページ切替 → その音符が notes から消える
    view.rerender(<Board {...boardProps({ notes: [], onPlace: props.onPlace })} />)

    expect(view.queryByTestId('trash')).toBeNull()

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

describe('配置済み音符の符尾（#97）', () => {
  function stemY2(view: ReturnType<typeof render>, id: string) {
    return Number(view.getByTestId(`note-${id}`).querySelector('line')!.getAttribute('y2'))
  }

  it('第3線より上（ト音の高いミ）は下向き、下のドは上向き', () => {
    const notes: PlacedNote[] = [
      { id: 'low', pitch: pitchByNote('C4', 'treble')!, long: false },
      { id: 'high', pitch: pitchByNote('E5', 'treble')!, long: false },
    ]
    const view = render(<Board {...boardProps({ notes })} />)
    expect(stemY2(view, 'low')).toBeLessThan(0)
    expect(stemY2(view, 'high')).toBeGreaterThan(0)
  })

  it('おてほんのゴーストも同じ規則に従う', () => {
    const targets = [pitchByNote('E5', 'treble')!]
    const view = render(<Board {...boardProps({ targets })} />)
    const ghost = view.container.querySelector('g[opacity="0.28"] line')!
    expect(Number(ghost.getAttribute('y2'))).toBeGreaterThan(0)
  })

  it('ドラッグ中のゴーストは、置ける場所の高い音で下向き・置けない場所では上向き', () => {
    const view = render(<Board {...boardProps()} />)
    const toolbox = view.getByTestId('toolbox-normal')
    const ghostY2 = () =>
      Number(view.container.querySelector('g[filter] line')!.getAttribute('y2'))

    fireEvent.pointerDown(toolbox, { pointerId: 1, clientX: 950, clientY: 200 })
    fireEvent.pointerMove(toolbox, { pointerId: 1, clientX: 400, clientY: 165 }) // 高いミ
    expect(ghostY2()).toBeGreaterThan(0)

    fireEvent.pointerMove(toolbox, { pointerId: 1, clientX: 400, clientY: 460 }) // 下の帯（置けない）
    expect(ghostY2()).toBeLessThan(0)
  })
})

describe('置いた瞬間の演出とお道具箱（#100）', () => {
  function placeAt(view: ReturnType<typeof render>, x: number, y: number) {
    const toolbox = view.getByTestId('toolbox-normal')
    fireEvent.pointerDown(toolbox, { pointerId: 1, clientX: 950, clientY: 200 })
    fireEvent.pointerMove(toolbox, { pointerId: 1, clientX: x, clientY: y })
    fireEvent.pointerUp(toolbox, { pointerId: 1, clientX: x, clientY: y })
  }

  it('置いた音符だけが着地してキラ粒を出し、しばらくすると消える', () => {
    vi.useFakeTimers()
    try {
      const old: PlacedNote = { id: 'old', pitch: pitchByNote('C4', 'treble')!, long: false }
      const onPlace = vi.fn<(pitch: Pitch, long: boolean) => void>()
      const props = boardProps({ notes: [old], onPlace })
      const view = render(<Board {...props} />)
      placeAt(view, 400, 290)
      expect(onPlace).toHaveBeenCalledTimes(1)

      // App が末尾に足した状態で描き直される
      const added: PlacedNote = { id: 'new', pitch: onPlace.mock.calls[0][0], long: false }
      view.rerender(<Board {...props} notes={[old, added]} />)

      const fresh = view.getByTestId('note-new')
      expect(fresh.querySelector('.note-land')).not.toBeNull()
      expect(fresh.querySelectorAll('.sparkle').length).toBeGreaterThan(0)
      expect(view.getByTestId('note-old').querySelector('.note-land')).toBeNull()

      act(() => vi.advanceTimersByTime(1000))
      expect(fresh.querySelector('.note-land')).toBeNull()
      expect(fresh.querySelectorAll('.sparkle').length).toBe(0)
    } finally {
      vi.useRealTimers()
    }
  })

  it('演出の間にページが変わっても、新しいページの音符は跳ねない', () => {
    const onPlace = vi.fn<(pitch: Pitch, long: boolean) => void>()
    const page2: PlacedNote[] = [{ id: 'p2', pitch: pitchByNote('C4', 'treble')!, long: false }]
    const props = boardProps({ notes: page2, onPlace })
    const view = render(<Board {...props} />)
    placeAt(view, 400, 290)
    expect(onPlace).toHaveBeenCalledTimes(1)

    // 置いてすぐ ▶ を押すと、再生が1ページ目へ切り替える（id はページをまたいで一意）
    const page1: PlacedNote[] = [
      { id: 'a', pitch: pitchByNote('E4', 'treble')!, long: false },
      { id: 'b', pitch: pitchByNote('G4', 'treble')!, long: false },
    ]
    view.rerender(<Board {...props} notes={page1} />)
    expect(view.container.querySelector('.note-land')).toBeNull()
    expect(view.container.querySelector('.sparkle')).toBeNull()
  })

  it('お道具箱の音符は7色に無いチョコ色（色は置いてから決まる）', () => {
    const view = render(<Board {...boardProps()} />)
    const head = view.getByTestId('toolbox-normal').querySelector('ellipse')!
    expect(head.getAttribute('fill')).toBe(TOOLBOX_NOTE_COLOR)
  })
})

describe('五線の紙（#99）', () => {
  it('不透明な紙が五線とゴミ箱帯を覆い、五線より先に描かれる', () => {
    const view = render(<Board {...boardProps()} />)
    const paper = view.getByTestId('paper')
    expect(paper.getAttribute('fill')).toBe(PAPER)
    expect(paper.getAttribute('opacity') ?? '1').toBe('1')
    const x = Number(paper.getAttribute('x'))
    const y = Number(paper.getAttribute('y'))
    const right = x + Number(paper.getAttribute('width'))
    const bottom = y + Number(paper.getAttribute('height'))
    expect(x).toBeLessThanOrEqual(STAFF_LEFT)
    expect(right).toBeGreaterThanOrEqual(STAFF_RIGHT)
    expect(y).toBeLessThanOrEqual(STAFF_LAYOUT.topLineY)
    // 掴んだときのゴミ箱アイコン（最大 fontSize 64・中心 TRASH_CY）の下端まで覆う
    expect(bottom).toBeGreaterThanOrEqual(TRASH_CY + 32)
    // 紙は下に敷く（五線の線より文書順で前）
    const firstLine = view.container.querySelector('line')!
    expect(paper.compareDocumentPosition(firstLine) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})

describe('起動ヒント（#101）', () => {
  it('指と「さわってね」はポインタを受けない（下のお道具箱を掴める）', () => {
    const view = render(<Board {...boardProps()} />)
    const hint = view.getByText('さわってね').closest('g[aria-hidden="true"]')!
    expect(hint.getAttribute('pointer-events')).toBe('none')
  })
})

describe('置いた音符をタップすると鳴って揺れる（#108）', () => {
  it('動かさずに離すと、その音が鳴って揺れる（捨てない・ゴミ箱も出ない）', async () => {
    const { playNote } = await import('../audio/synth')
    vi.mocked(playNote).mockClear()
    const n: PlacedNote = { id: 't1', pitch: pitchByNote('G4', 'treble')!, long: false }
    const onRemove = vi.fn()
    const view = render(<Board {...boardProps({ notes: [n], onRemove })} />)
    const g = view.getByTestId('note-t1')

    fireEvent.pointerDown(g, { pointerId: 1, clientX: 300, clientY: 290 })
    expect(view.queryByTestId('trash')).toBeNull() // 押しただけではゴミ箱を出さない
    fireEvent.pointerMove(g, { pointerId: 1, clientX: 305, clientY: 293 }) // 指のぶれ（あそびの内）
    expect(view.queryByTestId('trash')).toBeNull()
    fireEvent.pointerUp(g, { pointerId: 1, clientX: 305, clientY: 293 })

    await act(async () => {
      await Promise.resolve()
    })
    expect(playNote).toHaveBeenCalledWith('G4', expect.anything())
    expect(g.querySelector('.note-wiggle')).not.toBeNull()
    expect(onRemove).not.toHaveBeenCalled()
  })

  it('あそびより大きく動かすと掴んだことになり、離しても鳴らさない', async () => {
    const { playNote } = await import('../audio/synth')
    const n: PlacedNote = { id: 't2', pitch: pitchByNote('G4', 'treble')!, long: false }
    const view = render(<Board {...boardProps({ notes: [n] })} />)
    const g = view.getByTestId('note-t2')

    fireEvent.pointerDown(g, { pointerId: 1, clientX: 300, clientY: 290 })
    fireEvent.pointerMove(g, { pointerId: 1, clientX: 300, clientY: 340 })
    expect(view.queryByTestId('trash')).not.toBeNull()
    vi.mocked(playNote).mockClear()
    fireEvent.pointerMove(g, { pointerId: 1, clientX: 300, clientY: 292 }) // 戻ってきても掴んだまま
    fireEvent.pointerUp(g, { pointerId: 1, clientX: 300, clientY: 292 })
    await act(async () => {
      await Promise.resolve()
    })
    expect(playNote).not.toHaveBeenCalled()
    expect(g.querySelector('.note-wiggle')).toBeNull()
  })
})

describe('タップと掴みの境界（#108）', () => {
  function pressMove(view: ReturnType<typeof render>, id: string, dy: number) {
    const g = view.getByTestId(`note-${id}`)
    fireEvent.pointerDown(g, { pointerId: 1, clientX: 300, clientY: 290 })
    fireEvent.pointerMove(g, { pointerId: 1, clientX: 300, clientY: 290 + dy })
    return g
  }
  const one = (id: string): PlacedNote[] => [{ id, pitch: pitchByNote('G4', 'treble')!, long: false }]

  it('あそび（18）の内側で動いてもタップのまま、外側に出たら掴み', () => {
    const inside = render(<Board {...boardProps({ notes: one('in') })} />)
    pressMove(inside, 'in', 17)
    expect(inside.queryByTestId('trash')).toBeNull()
    cleanup()
    const outside = render(<Board {...boardProps({ notes: one('out') })} />)
    pressMove(outside, 'out', 19)
    expect(outside.queryByTestId('trash')).not.toBeNull()
  })

  it('押したあと pointercancel したら鳴らさない（#58 と両立）', async () => {
    const { playNote } = await import('../audio/synth')
    vi.mocked(playNote).mockClear()
    const view = render(<Board {...boardProps({ notes: one('c') })} />)
    const g = view.getByTestId('note-c')
    fireEvent.pointerDown(g, { pointerId: 1, clientX: 300, clientY: 290 })
    fireEvent.pointerCancel(g, { pointerId: 1, clientX: 300, clientY: 290 })
    fireEvent.pointerUp(g, { pointerId: 1, clientX: 300, clientY: 290 })
    await act(async () => {
      await Promise.resolve()
    })
    expect(playNote).not.toHaveBeenCalled()
  })

  it('同じ音符を続けてタップすると、揺れを最初からやり直す', () => {
    const view = render(<Board {...boardProps({ notes: one('r') })} />)
    const tap = () => {
      const g = view.getByTestId('note-r')
      fireEvent.pointerDown(g, { pointerId: 1, clientX: 300, clientY: 290 })
      fireEvent.pointerUp(g, { pointerId: 1, clientX: 300, clientY: 290 })
      return view.getByTestId('note-r').querySelector('.note-wiggle')
    }
    const first = tap()
    const second = tap()
    expect(first).not.toBeNull()
    expect(second).not.toBeNull()
    expect(second).not.toBe(first) // 作り直された＝CSS アニメが再始動する
  })
})

describe('再生中にぴぴが音符の上を渡り歩く（#104）', () => {
  const notes: PlacedNote[] = [
    { id: 'a', pitch: pitchByNote('C4', 'treble')!, long: false },
    { id: 'b', pitch: pitchByNote('E5', 'treble')!, long: true },
    { id: 'c', pitch: pitchByNote('G4', 'treble')!, long: false },
  ]

  it('再生していないときは出ない', () => {
    const view = render(<Board {...boardProps({ notes })} />)
    expect(view.queryByTestId('walker')).toBeNull()
  })

  it('鳴っている音の列の真上、五線より上にいる（符頭・五線を隠さない）', () => {
    const view = render(<Board {...boardProps({ notes, playingIndex: 2 })} />)
    const walker = view.getByTestId('walker')
    // のばす音（b）が2列ぶん占めるので、c は3列目（columnX(3)）
    const x = Number(walker.getAttribute('data-x'))
    expect(x).toBeCloseTo(columnX(3))
    const pipi = walker.querySelector('svg')!
    const bottom = Number(pipi.getAttribute('y')) + Number(pipi.getAttribute('height'))
    expect(bottom).toBeLessThan(STAFF_LAYOUT.topLineY)
    expect(Number(pipi.getAttribute('height'))).toBeGreaterThanOrEqual(26 * 2) // 符頭の高さの2倍以上
  })

  it('のばす音では着地したまま揺れる', () => {
    const view = render(<Board {...boardProps({ notes, playingIndex: 1 })} />)
    expect(view.getByTestId('walker').querySelector('.pipi-sway')).not.toBeNull()
    view.rerender(<Board {...boardProps({ notes, playingIndex: 0 })} />)
    expect(view.getByTestId('walker').querySelector('.pipi-sway')).toBeNull()
  })
})
