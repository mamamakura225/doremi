import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { OUTLINE_COLOR } from '../lib/colors'
import NoteHead from './NoteHead'

afterEach(cleanup)

function draw(props: Partial<Parameters<typeof NoteHead>[0]> = {}) {
  const { container } = render(
    <svg>
      <NoteHead x={0} y={0} fill="#facc15" {...props} />
    </svg>,
  )
  return container
}

describe('NoteHead の輪郭（#61）', () => {
  it('符頭の楕円に五線と同色の輪郭が入る', () => {
    const ellipse = draw().querySelector('ellipse')
    expect(ellipse).not.toBeNull()
    expect(ellipse!.getAttribute('stroke')).toBe(OUTLINE_COLOR)
    expect(Number(ellipse!.getAttribute('stroke-width'))).toBeGreaterThan(0)
  })

  it('符幹も輪郭色（塗り色に依存しない）', () => {
    const line = draw().querySelector('line')
    expect(line!.getAttribute('stroke')).toBe(OUTLINE_COLOR)
  })

  it('再生ハイライトは塗りなしの輪郭リング（薄い符頭色でも見える）', () => {
    const circle = draw({ highlight: true }).querySelector('circle')
    expect(circle).not.toBeNull()
    expect(circle!.getAttribute('fill')).toBe('none')
    expect(circle!.getAttribute('stroke')).toBe(OUTLINE_COLOR)
  })

  it('ハイライト無しのときリングは描かれない', () => {
    expect(draw().querySelector('circle')).toBeNull()
  })

  it('のばしバーにも輪郭が入る', () => {
    const rect = draw({ tail: 40 }).querySelector('rect')
    expect(rect!.getAttribute('stroke')).toBe(OUTLINE_COLOR)
  })
})
