import { useState } from 'react'
import Board from './components/Board'
import { type PlacedNote, addNote } from './lib/notes'
import type { Pitch } from './lib/pitch'

export default function App() {
  const [notes, setNotes] = useState<PlacedNote[]>([])

  function handlePlace(pitch: Pitch) {
    setNotes((prev) => addNote(prev, pitch))
  }

  return (
    <div className="flex h-full w-full flex-col bg-[#fdf6e3]">
      <header className="flex shrink-0 gap-3 p-3">
        <button
          type="button"
          onClick={() => setNotes([])}
          disabled={notes.length === 0}
          className="rounded-2xl bg-white px-6 py-3 text-xl font-bold text-[#6b6375] shadow disabled:opacity-40"
        >
          ↺ クリア
        </button>
      </header>
      <main className="min-h-0 flex-1">
        <Board notes={notes} onPlace={handlePlace} />
      </main>
    </div>
  )
}
