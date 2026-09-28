import { RotateIcon } from './Icons'

/** 縦向き時に「横にしてね」を全面表示する案内オーバーレイ */
export default function RotateOverlay() {
  return (
    <div
      role="dialog"
      aria-label="よこむきにしてね"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-[#fdf6e3] text-[#6b6375]"
    >
      <RotateIcon className="motion-safe:animate-pulse text-9xl" />
      <p className="text-3xl font-bold">よこむきに してね</p>
    </div>
  )
}
