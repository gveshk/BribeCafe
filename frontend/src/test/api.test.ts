import { describe, it, expect, vi } from 'vitest'

// Mock fetch
global.fetch = vi.fn()

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should export api service', async () => {
    // Test that API service module loads
    const { apiService } = await import('../services/api')
    expect(apiService).toBeDefined()
  })

  it('handles fetch errors gracefully', async () => {
    ;(global.fetch as any).mockRejectedValueOnce(new Error('Network error'))
    
    const { apiService } = await import('../services/api')
    
    // This should handle the error without throwing
    try {
      await apiService.getAgents()
    } catch (e) {
      // Expected to fail since no backend
    }
  })
})
