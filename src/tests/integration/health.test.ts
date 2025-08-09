import { describe, it, expect } from 'vitest'

describe('Health Check API', () => {
  it('should return health status', async () => {
    const response = await fetch('http://localhost:3000/api/health')
    expect(response.status).toBe(200)
    
    const data = await response.json()
    expect(data).toHaveProperty('status')
    expect(data).toHaveProperty('timestamp')
    expect(data).toHaveProperty('database')
  })
})