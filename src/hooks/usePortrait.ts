import { useEffect, useState } from 'react'
import { isPortrait } from '../lib/orientation'

/** 端末が縦向きかを返す（リサイズ/回転に追従）。 */
export function usePortrait(): boolean {
  const [portrait, setPortrait] = useState(() =>
    isPortrait(window.innerWidth, window.innerHeight),
  )

  useEffect(() => {
    const update = () =>
      setPortrait(isPortrait(window.innerWidth, window.innerHeight))
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [])

  return portrait
}
