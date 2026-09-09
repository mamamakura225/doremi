import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}
interface State {
  crashed: boolean
}

/**
 * ツリーが落ちても白画面にしない。子どもは原因を説明できる相手ではないので、
 * 選択肢は「もういちど」（リロード）1つだけに絞る。
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { crashed: false }

  static getDerivedStateFromError(): State {
    return { crashed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught', error, info.componentStack)
  }

  render() {
    if (!this.state.crashed) return this.props.children
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-8 bg-[#fdf6e3] p-8 text-center">
        <p className="text-7xl">🌀</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-2xl bg-[#22c55e] px-10 py-5 text-3xl font-bold text-white shadow"
        >
          もういちど
        </button>
      </div>
    )
  }
}
