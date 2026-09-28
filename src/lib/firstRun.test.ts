import { afterEach, describe, expect, it, vi } from 'vitest'
import { hasSeenTitle, markTitleSeen } from './firstRun'

describe('はじめて開いたか（#112）', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('はじめは見ていない・覚えたら見た', () => {
    expect(hasSeenTitle()).toBe(false)
    markTitleSeen()
    expect(hasSeenTitle()).toBe(true)
  })

  it('localStorage が使えなくても落ちない（はじめて扱い）', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })
    expect(hasSeenTitle()).toBe(false)
    expect(() => markTitleSeen()).not.toThrow()
  })
})
