import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from '../design-system/Button'

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    render(<Button isLoading>Click me</Button>)
    expect(screen.getByLabelText(/loading/i)).toBeInTheDocument()
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
