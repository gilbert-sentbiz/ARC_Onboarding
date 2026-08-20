import { describe, expect, it } from 'vitest'

describe('MSW handlers', () => {
  it('intercepts GET /api/session', async () => {
    const res = await fetch('http://localhost/api/session')
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toEqual({ email: 'tester@sentbe.com', name: '테스터' })
  })

  it('intercepts POST /api/case', async () => {
    const res = await fetch('http://localhost/api/case', { method: 'POST' })
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data).toEqual({ id: 'case-001' })
  })
})
