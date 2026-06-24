import Staff from './components/Staff'

export default function App() {
  return (
    <div className="flex h-full w-full flex-col bg-[#fdf6e3]">
      {/* コントロール（再生/クリアは #2・#4 で実装） */}
      <header className="flex shrink-0 gap-3 p-3" />
      <main className="min-h-0 flex-1">
        <Staff />
      </main>
    </div>
  )
}
