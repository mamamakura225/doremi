import { useEffect, useState, type RefObject } from 'react'
import { fitsKeyboard } from '../lib/layout'

/**
 * 鍵盤を併記できる形の画面か（要素の 高さ÷幅 で判定）。
 * 横に細長い端末（スマホ横）で出すと五線譜そのものが縮むため、そこでは出さない。
 *
 * ResizeObserver は使わない——SVGルート要素に対してコールバックが飛ばない
 * ブラウザがあり、鍵盤が出ないまま静かに壊れる（実測で踏んだ）。
 * 盤面の大きさが変わるのは画面サイズ・向きが変わったときだけなので resize で足りる。
 */
export function useFitsKeyboard(ref: RefObject<Element | null>): boolean {
  const [fits, setFits] = useState(false)

  useEffect(() => {
    function measure() {
      const el = ref.current
      if (!el) return
      const { width, height } = el.getBoundingClientRect()
      setFits(fitsKeyboard(width, height))
    }
    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('orientationchange', measure)
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('orientationchange', measure)
    }
  }, [ref])

  return fits
}
