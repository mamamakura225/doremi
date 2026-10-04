import { describe, expect, it } from 'vitest'
import {
  KEYBOARD_H,
  NOTE_HEAD_RY_ROTATED,
  READING_KEY_LEFT,
  READING_KEY_RIGHT,
  READING_KEY_TOP,
  READING_NOTE_X,
  READING_PANEL_X,
  READING_PAPER_BOTTOM,
  READING_PAPER_TOP,
  READING_STAFF_RIGHT,
  READING_VIEW_H,
  READING_VIEW_Y,
  STAFF_LAYOUT,
  VIEW_W,
} from './layout'
import { pitchByNote, pitchToY } from './pitch'

// よみとり（#155）の盤面。体験を決める値は要件の式とリテラルで固定する（実装の定数の写しにしない）。
const treble = (n: string) => pitchToY(pitchByNote(n, 'treble')!, STAFF_LAYOUT)

/** viewBox を meet で入れたときの倍率 */
const scaleAt = (w: number, h: number) => Math.min(w / VIEW_W, h / READING_VIEW_H)

describe('よみとりの盤面（#155）', () => {
  it('スマホ横（812×315 の盤面）でも鍵盤を出し、五線は今の盤面（倍率 0.63）より小さくしない', () => {
    expect(scaleAt(812, 315)).toBeGreaterThanOrEqual(0.7)
    // 白鍵1つの幅は指で押せる大きさ（44 CSS px の下限を十分に超える）
    const keyW = ((READING_KEY_RIGHT - READING_KEY_LEFT) / 10) * scaleAt(812, 315)
    expect(keyW).toBeGreaterThanOrEqual(60)
    expect(KEYBOARD_H * scaleAt(812, 315)).toBeGreaterThanOrEqual(80)
  })

  it('ノッチのある iPhone 横（844×390 から左右 47px を除いた盤面 750×330）でも縮みすぎない', () => {
    expect(scaleAt(750, 330)).toBeGreaterThanOrEqual(0.65)
  })

  it('鍵盤は真ん中のド（下加線）の符頭より下・表示範囲の中', () => {
    const c4Bottom = treble('C4') + NOTE_HEAD_RY_ROTATED
    expect(READING_KEY_TOP - c4Bottom).toBeGreaterThanOrEqual(10)
    expect(READING_KEY_TOP + KEYBOARD_H).toBeLessThanOrEqual(READING_VIEW_Y + READING_VIEW_H)
    // 紙はドの符頭を載せ、鍵盤には掛からない
    expect(READING_PAPER_BOTTOM).toBeGreaterThan(c4Bottom)
    expect(READING_PAPER_BOTTOM).toBeLessThanOrEqual(READING_KEY_TOP)
    expect(READING_PAPER_TOP).toBeGreaterThanOrEqual(READING_VIEW_Y)
  })

  it('ト音記号の頭が表示範囲の上で欠けない', () => {
    // Staff は高さ 5.6 間で描く。渦巻き（元座標 y25.2 / 全高 40.768）を G4 線に合わせる。
    // TrebleClef / Staff の値を意図して写している（記号の大きさを変えたら、ここで欠けないかを見直す）
    const h = STAFF_LAYOUT.staffSpace * 5.6
    const clefTop = treble('G4') - (h / 40.768) * 25.2
    expect(clefTop).toBeGreaterThanOrEqual(READING_VIEW_Y + 10)
  })

  it('問題の音符は五線の中ほど・案内パネルは五線の右（重ならない）', () => {
    expect(READING_NOTE_X).toBeGreaterThan(300) // ト音記号（右端 ≈166）から離す
    expect(READING_NOTE_X + 100).toBeLessThan(READING_STAFF_RIGHT) // 音名を出しても五線の中
    expect(READING_PANEL_X).toBeGreaterThan(READING_STAFF_RIGHT)
  })
})
