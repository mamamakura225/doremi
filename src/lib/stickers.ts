// シール帳（#105）。端末内 localStorage のみ・外部送信なし。
// 「正解したら」ではなく「つくったら・きいたら」でもらえる。もらうだけで、失うことはない。
// 純ロジック（parse/award）と薄い I/O を分け、純ロジックを Vitest 対象にする。

export type StickerId =
  | 'first-note'
  | 'long-note'
  | 'bass'
  | 'tap-note'
  | 'play-end'
  | 'long-song'
  | 'all-colors'
  | 'save'
  | 'shelf-listen'
  | 'guide-complete'
  | 'ear-found'
  | 'read-found'
  | 'read-stage-1'
  | 'read-stage-2'
  | 'read-stage-3'
  | 'read-stage-4'

export interface Sticker {
  id: StickerId
  /** もらえること（シール帳に出す・ひらがな） */
  name: string
}

/** シール帳の並び（もらいやすい順）。条件の表は docs/requirements.md */
export const STICKERS: Sticker[] = [
  { id: 'first-note', name: 'はじめての おんぷ' },
  { id: 'tap-note', name: 'おんぷを さわった' },
  { id: 'long-note', name: 'のばす おと' },
  { id: 'play-end', name: 'さいごまで きいた' },
  { id: 'save', name: 'ほんだなに しまった' },
  { id: 'shelf-listen', name: 'ほんだなの うた' },
  { id: 'bass', name: 'くまさんの ひくい おと' },
  { id: 'long-song', name: 'ながい うた' },
  { id: 'all-colors', name: 'にじいろ' },
  { id: 'guide-complete', name: 'おてほん できた' },
  { id: 'ear-found', name: 'ききとり みつけた' },
  // よみとりあそび（#155）。段階のシールはその段階をクリアしたときだけ（おとなメニューで飛ばした段階には付かない）
  { id: 'read-found', name: 'よみとり よめた' },
  { id: 'read-stage-1', name: 'ドレミが よめた' },
  { id: 'read-stage-2', name: 'ド〜ソが よめた' },
  { id: 'read-stage-3', name: 'ド〜ドが よめた' },
  { id: 'read-stage-4', name: 'ぜんぶ よめた' },
]

const IDS = new Set<string>(STICKERS.map((s) => s.id))
const KEY = 'doremi.stickers.v1'

/** localStorage の生文字列を、もらったシールの一覧に復元（壊れていれば空・知らない id は捨てる） */
export function parseStickers(raw: string | null): StickerId[] {
  if (!raw) return []
  try {
    const data = JSON.parse(raw)
    if (!Array.isArray(data)) return []
    return [...new Set(data.filter((id): id is StickerId => typeof id === 'string' && IDS.has(id)))]
  } catch {
    return []
  }
}

/** シールを1枚あげる。もう持っていれば同じ一覧をそのまま返す（＝新しくもらえたかは参照で分かる） */
export function award(earned: readonly StickerId[], id: StickerId): readonly StickerId[] {
  return earned.includes(id) ? earned : [...earned, id]
}

/** 曲に7色（ドレミファソラシ）がぜんぶ入っているか（にじいろ） */
export function hasAllColors(solfas: Iterable<string>): boolean {
  return new Set(solfas).size >= 7
}

/** もらったシールを読み込む（サイトデータ遮断でも例外を出さない） */
export function loadStickers(): StickerId[] {
  try {
    return parseStickers(localStorage.getItem(KEY))
  } catch {
    return []
  }
}

/** もらったシールを保存する。失敗しても黙って諦める（このセッション中は手元の一覧で見える・#57 と同じ方針） */
export function saveStickers(earned: readonly StickerId[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(earned))
  } catch {
    // 読めない年齢なので失敗は伝えない
  }
}
