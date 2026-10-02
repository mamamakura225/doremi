import { useEffect, useRef } from 'react'
import { PlayIcon } from './Icons'
import Mascot from './Mascot'
import TitleLogo from './TitleLogo'

/**
 * はじめて開いたときのタイトル（#112）。「▶ はじめる」のタップが音の解錠を兼ねるので、
 * 最初の音から確実に鳴る。ページ背景（空・丘）の上に重ねる。
 * ロゴの「ど・れ・み」は、その音の色（音の名前そのものなので、7色を使ってよい）。絵は TitleLogo（#144）。
 * 「はじめる」は白い文字を読ませるので、ファの緑より濃い緑（白との比 5:1）にする。
 */
export default function TitleScreen({ onStart }: { onStart: () => void }) {
  const startRef = useRef<HTMLButtonElement>(null)
  useEffect(() => startRef.current?.focus(), [])
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="どれみ"
      className="absolute inset-0 z-30 flex items-center justify-center gap-6 bg-white/70 p-4"
    >
      <div className="title-pipi w-[22%] max-w-[200px] min-w-[96px]">
        <Mascot mood="happy" width="100%" height="100%" />
      </div>
      <div className="flex flex-col items-center gap-4">
        <h1 className="w-[clamp(240px,40vw,440px)]" aria-label="どれみ">
          <TitleLogo />
        </h1>
        <button
          ref={startRef}
          type="button"
          onClick={onStart}
          aria-label="はじめる"
          className="flex items-center gap-3 rounded-full bg-[#15803d] px-10 py-4 text-3xl font-bold text-white shadow-lg transition-transform active:scale-95 motion-reduce:transition-none"
        >
          <PlayIcon /> はじめる
        </button>
      </div>
    </div>
  )
}
