import { OUTLINE_COLOR, PAPER } from '../lib/colors'
import { type ThemeId, themeOf } from '../lib/themes'

// ページ背景「おんぷのもり」（#99・docs/art-direction.md の「画面の層」）。
// 盤面 SVG の外に敷く。端末の縦横比で見える範囲が変わる（スマホ横は上が、タブレット横は
// 左右が切れる）ので、1枚の SVG を `xMidYMax slice` で敷き、丘は常に下端に残す。
// 主役になるもの（音符・マスコット）は置かず、切れても困らない飾りだけにする。

const W = 1600
const H = 900

/** 雲（幅 ~104・高さ ~44） */
function Cloud({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path
        d="M20 40 Q0 40 4 26 Q8 12 26 16 Q32 0 52 4 Q70 -4 80 14 Q100 10 102 28 Q104 42 86 42 Z"
        fill="#fff"
      />
      <path
        d="M12 38 Q50 46 96 38"
        fill="none"
        stroke="#dcebf6"
        strokeWidth={4}
        strokeLinecap="round"
      />
    </g>
  )
}

/** 白い小花（7色は音の高さ専用なので使わない） */
function Flower({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill={PAPER} stroke={OUTLINE_COLOR} strokeWidth={2}>
      <circle cx={0} cy={-7} r={5.5} />
      <circle cx={6.7} cy={-2.2} r={5.5} />
      <circle cx={4.1} cy={5.7} r={5.5} />
      <circle cx={-4.1} cy={5.7} r={5.5} />
      <circle cx={-6.7} cy={-2.2} r={5.5} />
      <circle r={3.6} fill="#ffe38f" />
    </g>
  )
}

/** さくらの花びら */
function Petal({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <path
      d="M0 -9 C6 -9 9 -3 0 9 C-9 -3 -6 -9 0 -9 Z"
      transform={`translate(${x} ${y}) rotate(${r})`}
      fill="#ffc9dc"
      stroke={OUTLINE_COLOR}
      strokeWidth={1.5}
    />
  )
}

/** 雪のつぶ */
function Snow({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return <circle cx={x} cy={y} r={10 * s} fill="#fff" stroke="#9fb4cc" strokeWidth={2.5} />
}

/** 夜空の星（4つ角） */
function Star({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <path
      d="M0 -12 Q2.4 -2.4 12 0 Q2.4 2.4 0 12 Q-2.4 2.4 -12 0 Q-2.4 -2.4 0 -12 Z"
      transform={`translate(${x} ${y}) scale(${s})`}
      fill="#fff6cf"
    />
  )
}

// 空に散らす飾りの位置（ヘッダーの後ろと、紙の外の左右に見える所）
const SKY_SPOTS: [number, number, number][] = [
  [120, 230, 1], [300, 120, 0.8], [520, 250, 0.9], [700, 110, 1.1], [930, 230, 0.8],
  [1150, 120, 1], [1470, 250, 0.9], [60, 420, 0.8], [1540, 450, 1], [40, 590, 0.7], [1560, 610, 0.8],
]

export default function Background({ themeId = 'meadow' }: { themeId?: ThemeId }) {
  const t = themeOf(themeId)
  const night = t.celestial === 'moon'
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      data-testid="page-background"
      data-theme={t.id}
    >
      <defs>
        <linearGradient id="bg-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={t.sky[0]} />
          <stop offset="0.5" stopColor={t.sky[1]} />
          <stop offset="0.85" stopColor={t.sky[2]} />
        </linearGradient>
        {/* 三日月は円を切り抜いて作る（空の色で塗って隠すと、グラデーションと光の輪の上で円盤に見える） */}
        <mask id="bg-moon-cut">
          <rect width={W} height={H} fill="#fff" />
          <circle cx={1350} cy={218} r={34} fill="#000" />
        </mask>
        <radialGradient id="bg-sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.55" stopColor={night ? '#fff6cf' : '#fff1a8'} stopOpacity={night ? 0.35 : 1} />
          <stop offset="1" stopColor="#fff1a8" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill="url(#bg-sky)" />
      {/* 太陽（夜は三日月）は右上。スマホ横（上が切れる）でも欠けにくい高さに置く */}
      <circle cx={1330} cy={230} r={110} fill="url(#bg-sun)" />
      {night ? (
        <circle cx={1330} cy={230} r={40} fill="#fff6cf" mask="url(#bg-moon-cut)" />
      ) : (
        <circle cx={1330} cy={230} r={42} fill="#ffe680" />
      )}
      {/* 雲はゆっくり流れる（reduced-motion で止まる）。夜はうすく */}
      <g className="cloud-drift" opacity={night ? 0.3 : 1}>
        <Cloud x={260} y={150} s={1.3} />
        <Cloud x={760} y={130} s={0.9} />
        <Cloud x={1060} y={165} s={1.1} />
      </g>
      {t.deco === 'star' && SKY_SPOTS.map(([x, y, s], i) => <Star key={i} x={x} y={y} s={s} />)}
      {t.deco === 'snow' && SKY_SPOTS.map(([x, y, s], i) => <Snow key={i} x={x} y={y} s={s} />)}
      {t.deco === 'petal' && SKY_SPOTS.map(([x, y], i) => <Petal key={i} x={x} y={y} r={i * 37} />)}
      {/* 丘（遠・近）と小花。花は左右の端だけ——中央は端末によって紙か鍵盤の下に入り、
          半分隠れて見えるため（スマホ横は x≈136〜1268 が紙の下、タブレット横は x≈263〜1192 が
          鍵盤の下で x<199・x>1399 は画面外）。両方で見えるのは右の x≈1270〜1395 だけ */}
      <path d="M0 760 Q260 690 560 745 T1160 725 T1600 735 V900 H0 Z" fill={t.hills[0]} />
      <path d="M0 815 Q340 770 760 808 T1600 796 V900 H0 Z" fill={t.hills[1]} />
      {(t.deco === 'flower' || t.deco === 'petal') && (
        <>
          <Flower x={50} y={866} />
          <Flower x={110} y={884} s={0.85} />
          <Flower x={1295} y={874} s={0.85} />
          <Flower x={1370} y={858} />
          <Flower x={1510} y={880} s={0.85} />
        </>
      )}
    </svg>
  )
}
