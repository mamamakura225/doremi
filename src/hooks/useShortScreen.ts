import { useEffect, useState } from 'react'
import { isShortScreen } from '../lib/orientation'

/** 縦が短い画面か（リサイズ/回転に追従）。ヘッダーの丸ボタンを小さくする判定に使う。 */
export function useShortScreen(): boolean {
  const [short, setShort] = useState(() => isShortScreen(window.innerHeight))

  useEffect(() => {
    const update = () => setShort(isShortScreen(window.innerHeight))
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [])

  return short
}
