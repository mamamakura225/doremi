// 五線譜ボードのジオメトリ（SVGビューボックス座標・横向き）。
// 純データ。SVG/Reactに依存しない（Vitest対象）。
import type { Clef, StaffLayout } from './pitch'

// 横向き画面に近い 2.2:1 に固定し、`meet` の左右余白を最小化（余白は背景色で吸収）。
export const VIEW_W = 1100
export const VIEW_H = 500

export const STAFF_LAYOUT: StaffLayout = { topLineY: 140, staffSpace: 50 }

export const STAFF_LEFT = 60

// お道具箱（右端）
export const TOOLBOX_W = 120
export const TOOLBOX_X = VIEW_W - 40 - TOOLBOX_W // 940
export const TOOLBOX_CX = TOOLBOX_X + TOOLBOX_W / 2
export const TOOLBOX_CY = VIEW_H / 2
// お道具箱には「ふつうの音」と「のばす音」の2つが常駐する（上下に離して掴み分ける）
export const TOOLBOX_NORMAL_CY = TOOLBOX_CY - 85
export const TOOLBOX_LONG_CY = TOOLBOX_CY + 85

// 五線はお道具箱の手前まで伸ばす
export const STAFF_RIGHT = TOOLBOX_X - 30 // 910

// 音符を置く領域（ト音記号の右〜五線右端の手前）
export const PLACE_LEFT = 210
export const PLACE_RIGHT = STAFF_RIGHT - 30 // 880

// 符頭（楕円）の寸法。NoteHead が描画に、列間隔・帯の隙間計算がここを参照する。
// ここを触ると MIN_COLUMN_PITCH / TRASH_TOP の根拠が変わるので、両方のコメントを見直す。
export const NOTE_HEAD_RX = 17
export const NOTE_HEAD_RY = 13
/** 符頭の横幅（= rx*2）。MIN_COLUMN_PITCH の根拠。 */
export const NOTE_HEAD_W = NOTE_HEAD_RX * 2 // 34
/** 符頭の回転角（度）。傾けて音符らしく見せている。 */
export const NOTE_HEAD_ROTATION_DEG = 20
/**
 * 回転後の符頭の縦方向の張り出し（中心からの半径）。
 * 傾いた楕円の y 方向の最大値は √((rx·sinθ)² + (ry·cosθ)²)。ry より大きくなる（≈13.5）。
 */
export const NOTE_HEAD_RY_ROTATED = Math.hypot(
  NOTE_HEAD_RX * Math.sin((NOTE_HEAD_ROTATION_DEG * Math.PI) / 180),
  NOTE_HEAD_RY * Math.cos((NOTE_HEAD_ROTATION_DEG * Math.PI) / 180),
)

// 列間隔の下限（ビューボックス単位）。符頭幅 NOTE_HEAD_W(34) に対して同じくらいの
// 余白を隣との間に残す値。横向きスマホでは倍率が0.375まで落ちるため、これを割ると
// 隣の符頭と接して掴み間違いが起きる（実測値は docs/architecture.md）。NOTE_MAX はここから決まる。
export const MIN_COLUMN_PITCH = 65

export const NOTE_MAX = 10

/** 列の間隔（1列＝ふつうの音1つぶん） */
export const COLUMN_PITCH = (PLACE_RIGHT - PLACE_LEFT) / NOTE_MAX

/** i列目（0始まり）の中心X座標 */
export function columnX(index: number): number {
  return PLACE_LEFT + (index + 0.5) * COLUMN_PITCH
}

// 配置済み音符の不可視ヒット矩形（#62）。符頭そのものは横向きスマホで倍率 0.63 まで
// 落ち、21.5 × 16.4 CSS px しかない（HIG 44pt / Material 48dp の半分以下）。お道具箱は
// 透明矩形で箱の上下半分まで的を広げているのに、配置済み音符には手当てが無かった。
/** 横幅は列間隔ぶん（= 隣の列と重ならない・列は固定グリッドなので安全）。のばす音は2列ぶん。 */
export const NOTE_HIT_W = COLUMN_PITCH
/**
 * 高さ（符頭中心から上下に半分ずつ）。スナップ間隔 staffSpace(50) を超えない範囲。
 * これ以上は最低音から TRASH_TOP までの余白を食う。縦の的が 27.8 CSS px 止まりなのは
 * 五線の寸法を変えないと解決しないので、本issueでは横の拡大に留める。
 */
export const NOTE_HIT_H = 44

// ゴミ箱ゾーン（配置済み音符をドラッグして捨てる：画面下部の帯）。
// 帯の上端は「最も低い音の符頭の下端」から TRASH_GAP ぶん離す（#59）。中心座標だけで
// 決めると、ト音の C4（符頭下端 ≈ y403.5）との隙間が 4 CSS px しか残らず、
// ドを下寄りに掴むだけで削除が成立していた。
/** ゴミ箱帯と最低音の符頭の下端の間に最低限残す余裕（符頭の張り出し1つぶん）。 */
export const TRASH_GAP = NOTE_HEAD_RY_ROTATED
export const TRASH_TOP = VIEW_H - 70 // 430（C4符頭下端403.5 に対し余裕26.5 ≥ TRASH_GAP）
export const TRASH_CX = (PLACE_LEFT + PLACE_RIGHT) / 2
export const TRASH_CY = VIEW_H - 42

/**
 * 配置領域（五線譜側）に離した座標が入っているか。
 * X だけでなく Y も見る（#59）——見ないと鍵盤の上・ヘッダーの上・ゴミ箱帯の上で
 * 離しても `snapYToPitch` の端クランプで必ず何か置かれ、5歳児には因果が読めない。
 * 上端は `y >= 0`（ビューボックスの内側）まで許す——最高音より上には競合物が無く、
 * 五線の少し上で離しても最高音になるのは直感に合う。下端は帯と衝突するので切る。
 */
export function isOverPlacement(x: number, y: number): boolean {
  return x >= STAFF_LEFT && x <= STAFF_RIGHT && y >= 0 && y < TRASH_TOP
}

/**
 * 掴んでいる音を、いま盤面に置いてよいか。
 * 音部が一致していること（掴んだあとに切り替わっていない・#56）＋配置エリアの上。
 * 音部が違う音を流し込むと、保存時に音域外でサイレントに消える。
 */
export function canPlace(
  dragClef: Clef,
  boardClef: Clef,
  x: number,
  y: number,
): boolean {
  return dragClef === boardClef && isOverPlacement(x, y)
}

/**
 * ゴミ箱ゾーン（下部の帯・お道具箱を除く）に入っているか。
 * 下端は VIEW_H で切る——鍵盤併記のときに鍵盤の上で離した音符が
 * 捨てられてしまわないようにするため。
 */
export function isOverTrash(x: number, y: number): boolean {
  return y >= TRASH_TOP && y < VIEW_H && x >= STAFF_LEFT && x < TOOLBOX_X
}

// 鍵盤併記（家庭学習との接続）。五線譜の下に足す帯で、VIEW_H より下に置く。
export const KEYBOARD_H = 120
export const VIEW_H_KEYS = VIEW_H + KEYBOARD_H // 620
export const KEYBOARD_TOP = VIEW_H
export const KEY_LEFT = STAFF_LEFT
export const KEY_RIGHT = STAFF_RIGHT

/**
 * 鍵盤を出せる縦横比の下限（高さ÷幅）。
 * これを下回る（＝横に細長い）と、鍵盤ぶん縦が伸びた viewBox が高さ基準になり、
 * 五線譜そのものが縮む。スマホ横がここに該当する。
 */
export const KEYBOARD_MIN_RATIO = VIEW_H_KEYS / VIEW_W

/**
 * 盤面のサイズ（CSS px）から、鍵盤を併記できる形の画面かを判定する純関数。
 * 横に細長い端末（スマホ横）で出すと鍵盤ぶん縦が伸びた viewBox が高さ基準になり
 * 五線譜そのものが縮むため、そこでは出さない。iPhone 横 ≈ false / iPad 横 ≈ true。
 */
export function fitsKeyboard(width: number, height: number): boolean {
  return width > 0 && height / width >= KEYBOARD_MIN_RATIO
}

/** i番目（0始まり）の白鍵の左端X */
export function whiteKeyX(index: number, count: number): number {
  return KEY_LEFT + (index * (KEY_RIGHT - KEY_LEFT)) / count
}

/** 白鍵1つぶんの幅 */
export function whiteKeyW(count: number): number {
  return (KEY_RIGHT - KEY_LEFT) / count
}
