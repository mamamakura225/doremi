import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import ErrorBoundary from './ErrorBoundary'

afterEach(cleanup)

function Boom(): never {
  throw new Error('boom')
}

test('子が落ちたら白画面にせず「もういちど」を出す', () => {
  const err = vi.spyOn(console, 'error').mockImplementation(() => {})
  render(
    <ErrorBoundary>
      <Boom />
    </ErrorBoundary>,
  )
  expect(screen.getByText('もういちど')).toBeTruthy()
  err.mockRestore()
})

test('落ちなければ子をそのまま出す', () => {
  render(
    <ErrorBoundary>
      <p>ぶじ</p>
    </ErrorBoundary>,
  )
  expect(screen.getByText('ぶじ')).toBeTruthy()
  expect(screen.queryByText('もういちど')).toBeNull()
})
