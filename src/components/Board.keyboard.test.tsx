import type { ComponentProps } from 'react'
import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { STAFF_LAYOUT } from '../lib/layout'
import { type Clef, pitchByNote, pitchToY } from '../lib/pitch'
import type { PlacedNote } from '../lib/notes'
import { colorOf } from '../lib/colors'
import Board from './Board'

// 鍵盤は縦に余裕のある画面でだけ出る（useFitsKeyboard）。jsdom は大きさを持たないので、
// このファイルでは「鍵盤が出る画面」として描く（#107）。
vi.mock('../hooks/useFitsKeyboard', () => ({ useFitsKeyboard: () => true }))
vi.mock('../audio/synth', () => ({
  ensureAudio: vi.fn().mockResolvedValue(undefined),
  playNote: vi.fn(),
}))

beforeAll(() => {
  const proto = SVGSVGElement.prototype as unknown as Record<string, unknown>
  const identity = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }
  proto.getScreenCTM = () => ({ inverse: () => identity })
  ;(SVGElement.prototype as unknown as Record<string, unknown>).setPointerCapture = () => {}
})

afterEach(cleanup)

function props(over: Partial<ComponentProps<typeof Board>> = {}) {
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

const lit = (view: ReturnType<typeof render>) =>
  [...view.container.querySelectorAll('[data-testid^="key-"]')]
    .filter((k) => k.getAttribute('data-lit') === 'true')
    .map((k) => k.getAttribute('data-testid'))

describe('鍵盤と五線を光でつなぐ（#107）', () => {
  it('鍵盤を押すと、五線のその音の高さに同じ色の光が出る', () => {
    const view = render(<Board {...props()} />)
    fireEvent.pointerDown(view.getByTestId('key-G4'))
    const echo = view.getByTestId('key-echo')
    expect(Number(echo.getAttribute('data-y'))).toBe(pitchToY(pitchByNote('G4', 'treble')!, STAFF_LAYOUT))
    expect(echo.getAttribute('data-color')).toBe(colorOf(pitchByNote('G4', 'treble')!))
    expect(lit(view)).toEqual(['key-G4'])
  })

  it('再生で鳴っている音の白鍵が光る', () => {
    const notes: PlacedNote[] = [
      { id: 'a', pitch: pitchByNote('C4', 'treble')!, long: false },
      { id: 'b', pitch: pitchByNote('E4', 'treble')!, long: false },
    ]
    const view = render(<Board {...props({ notes, playingIndex: 1 })} />)
    expect(lit(view)).toEqual(['key-E4'])
    expect(view.queryByTestId('key-echo')).toBeNull() // 五線の光は鍵盤から押したときだけ
  })

  it('音符を掴んで五線の上を動かすと、その高さの白鍵が光る（置けない場所では消える）', () => {
    const view = render(<Board {...props()} />)
    const toolbox = view.getByTestId('toolbox-normal')
    fireEvent.pointerDown(toolbox, { pointerId: 1, clientX: 1000, clientY: 165 })
    fireEvent.pointerMove(toolbox, { pointerId: 1, clientX: 400, clientY: 265 }) // ラ
    expect(lit(view)).toEqual(['key-A4'])
    fireEvent.pointerMove(toolbox, { pointerId: 1, clientX: 400, clientY: 460 }) // 下の帯
    expect(lit(view)).toEqual([])
  })

  it('置いた直後は、その音の白鍵が光る', () => {
    const onPlace = vi.fn()
    const p = props({ onPlace })
    const view = render(<Board {...p} />)
    const toolbox = view.getByTestId('toolbox-normal')
    fireEvent.pointerDown(toolbox, { pointerId: 1, clientX: 1000, clientY: 165 })
    fireEvent.pointerMove(toolbox, { pointerId: 1, clientX: 400, clientY: 390 })
    fireEvent.pointerUp(toolbox, { pointerId: 1, clientX: 400, clientY: 390 })
    const placed: PlacedNote = { id: 'n', pitch: onPlace.mock.calls[0][0], long: false }
    view.rerender(<Board {...p} notes={[placed]} />)
    expect(lit(view)).toEqual(['key-C4'])
  })
})
