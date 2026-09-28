import { useEffect, useRef } from 'react'
import { STICKERS, type StickerId } from '../lib/stickers'
import { CloseIcon, StarIcon } from './Icons'
import StickerArt from './StickerArt'

/** もらったシールを並べるシール帳（#105）。まだのシールは「？」で、何枚あるかが見える */
export function StickerBook({
  earned,
  onClose,
}: {
  earned: readonly StickerId[]
  onClose: () => void
}) {
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => closeRef.current?.focus(), [])
  return (
    <div
      className="absolute inset-0 z-20 flex flex-col bg-[#3d3530]/30 p-3"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="シールちょう"
        className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col rounded-3xl bg-[#fdf6e3] p-4 shadow-xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-2xl font-bold text-[#6b6375]">
            <StarIcon className="text-3xl" /> シールちょう
            <span className="text-lg">
              {earned.length} / {STICKERS.length}
            </span>
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="とじる"
            className="flex items-center gap-2 rounded-2xl bg-white px-5 py-2 text-xl font-bold text-[#6b6375] shadow"
          >
            <CloseIcon /> とじる
          </button>
        </div>
        <ul className="grid min-h-0 flex-1 grid-cols-5 content-start gap-3 overflow-y-auto">
          {STICKERS.map((s) => {
            const got = earned.includes(s.id)
            return (
              <li key={s.id} className="flex flex-col items-center gap-1 text-center">
                <div className="aspect-square w-full max-w-24">
                  <StickerArt id={s.id} earned={got} />
                </div>
                <span className={`text-sm font-bold ${got ? 'text-[#6b6375]' : 'text-[#cfc6b8]'}`}>
                  {got ? s.name : '？'}
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

/** シールをもらったときのお知らせ（触れない。読み上げは App 側の role=status の入れ物で） */
export function StickerToast({ id, name }: { id: StickerId; name: string }) {
  return (
    // ヘッダーの右寄り（⚙ の左の空き）に出す——紙の上（五線の上端）にかぶせない。
    // 位置（外）と登場の動き（内・transform）を分ける
    <div className="pointer-events-none fixed top-2 right-[4.5rem] z-30">
      <div className="sticker-pop flex items-center gap-2 rounded-3xl bg-white/95 px-4 py-2 shadow-xl">
        <div className="h-11 w-11 shrink-0">
          <StickerArt id={id} earned />
        </div>
        <div className="text-left">
          <p className="text-lg font-bold whitespace-nowrap text-[#6b6375]">シール ゲット！</p>
          <p className="text-base font-bold whitespace-nowrap text-[#9a8f80]">{name}</p>
        </div>
      </div>
    </div>
  )
}
