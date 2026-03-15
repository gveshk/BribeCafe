import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { renderHook } from '@testing-library/react'
import { useState } from 'react'

describe('App Context', () => {
  it('useState works', () => {
    const { result } = renderHook(() => useState('test'))
    expect(result.current[0]).toBe('test')
  })
})
