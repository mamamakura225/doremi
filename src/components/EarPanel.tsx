import { FOUND_PER_STAGE, type Judge } from '../lib/ear'
import { OUTLINE_COLOR } from '../lib/colors'
import Mascot from './Mascot'

/** 耳（きく） */
function EarIcon() {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" fill="none" stroke={OUTLINE_COLOR} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 9.5 A5.5 5.5 0 0 1 18 9.5 C18 13 15 13.8 14.6 16.4 A3.4 3.4 0 0 1 8.2 17.4" fill="#ffe8d6" />
      <path d="M10.4 10 A2.2 2.2 0 0 1 14.6 10.3 C14.6 11.6 13.2 12 12.6 13" />
      <path d="M20 5.5 Q22 9.5 20 13.5" strokeWidth={1.8} />
    </svg>
  )
}

/** 上・下の矢印（お題はもっと高い／低い） */
function Arrow({ up }: { up: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" fill="none" stroke={OUTLINE_COLOR} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
      <path d={up ? 'M12 19 V5 M6.5 10.5 L12 5 L17.5 10.5' : 'M12 5 V19 M6.5 13.5 L12 19 L17.5 13.5'} />
    </svg>
  )
}

/**
 * ききとりあそび（#110）の案内。紙の上端の余白（五線より上）に重ねる（art-direction の禁則1の例外）。
 * 「もういちど きく」でお題をもう一度鳴らす。違ったときは上下の矢印で教える（×・ブブーは無し）
 */
export default function EarPanel({
  found,
  hint,
  onListen,
}: {
  found: number
  hint: Judge | null
  onListen: () => void
}) {
  const inStage = found % FOUND_PER_STAGE
  return (
    <div className="pointer-events-none absolute top-1 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3">
      <button
        type="button"
        onClick={onListen}
        aria-label="もういちど きく"
        className="pointer-events-auto flex items-center gap-2 rounded-full bg-white px-5 py-2 text-2xl font-bold whitespace-nowrap text-[#6b6375] shadow-lg active:scale-95"
      >
        <EarIcon /> もういちど きく
      </button>
      {/* この段階で見つけた数（5つで次の段階へ） */}
      <span role="img" className="flex gap-1" aria-label={`${inStage} こ みつけた`}>
        {Array.from({ length: FOUND_PER_STAGE }, (_, i) => (
          <span
            key={i}
            className="inline-block h-3.5 w-3.5 rounded-full border-2"
            style={{ borderColor: OUTLINE_COLOR, background: i < inStage ? '#ffe38f' : 'transparent' }}
          />
        ))}
      </span>
      {/* 幅を固定して、ヒントが出ても「もういちど きく」が横に動かないようにする */}
      <span role="status" className="flex w-[12.5rem] items-center gap-1 text-2xl font-bold whitespace-nowrap text-[#6b6375]">
        {hint === 'same' && (
          <span className="flex items-center gap-1">
            <span className="inline-block w-10">
              <Mascot mood="banzai" width="100%" height="100%" />
            </span>
            みつけた！
          </span>
        )}
        {(hint === 'higher' || hint === 'lower') && (
          <span className="flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 shadow">
            <Arrow up={hint === 'higher'} /> {hint === 'higher' ? 'もっと たかい' : 'もっと ひくい'}
          </span>
        )}
      </span>
    </div>
  )
}
