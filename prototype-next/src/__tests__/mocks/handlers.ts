import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('*/api/session', () =>
    HttpResponse.json({ email: 'tester@sentbe.com', name: '테스터' })
  ),
  http.post('*/api/case', () => HttpResponse.json({ id: 'case-001' }, { status: 201 })),
]
