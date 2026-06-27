import { SOLFA_COLOR } from '../lib/colors'
import { pitchByNote } from '../lib/pitch'
import type { SavedSong } from '../lib/storage'

interface Props {
  songs: SavedSong[]
  onSelect: (song: SavedSong) => void
  onClose: () => void
}

/** 各音を音高色の丸で並べたミニプレビュー（読めない子も色で見分けられる）。 */
function Preview({ notes }: { notes: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {notes.map((n, i) => {
        const p = pitchByNote(n)
        const color = p ? SOLFA_COLOR[p.solfa] : '#cbd5e1'
        return (
          <span
            key={i}
            className="inline-block h-5 w-5 rounded-full"
            style={{ backgroundColor: color }}
          />
        )
      })}
    </div>
  )
}

/** つくった曲の本棚（端末内 localStorage の一覧）。タップで盤面に読み込み再生。 */
export default function Bookshelf({ songs, onSelect, onClose }: Props) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-black/40 p-4">
      <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col rounded-3xl bg-[#fdf6e3] p-4 shadow-xl">
        <div className="mb-3 flex shrink-0 items-center justify-between">
          <h2 className="text-2xl font-bold text-[#6b6375]">📚 ほんだな</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="とじる"
            className="rounded-2xl bg-white px-5 py-2 text-xl font-bold text-[#6b6375] shadow"
          >
            ✕ とじる
          </button>
        </div>

        {songs.length === 0 ? (
          <p className="flex flex-1 items-center justify-center text-center text-xl text-[#9a8f80]">
            まだ なにも ほぞんして いないよ
          </p>
        ) : (
          <div className="grid min-h-0 flex-1 grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3">
            {songs.map((song) => (
              <button
                key={song.id}
                type="button"
                onClick={() => onSelect(song)}
                className="flex flex-col gap-2 rounded-2xl bg-white p-3 text-left shadow active:scale-95"
              >
                <Preview notes={song.notes} />
                <span className="text-base font-bold text-[#22c55e]">▶ きく</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
