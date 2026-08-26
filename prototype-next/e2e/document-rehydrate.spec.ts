import { test, expect, request as pwRequest } from '@playwright/test'

// PI-243: 재로그인 시 서류 페이지가 백엔드에서 케이스+제출서류를 하이드레이트해
// "업로드됨"을 복원해야 한다. (수정 전: localStorage만 읽어 "케이스를 찾을 수 없습니다")
const BASE = '/ARK_Onboarding'
const API = process.env.E2E_API_URL ?? 'http://localhost:8080'
const MASTER_CODE = '000000'

test('PI-243: 재로그인 서류 탭 — 제출 서류가 백엔드 하이드레이션으로 표시된다', async ({ page }) => {
  const email = `e2e-dochydra-${Date.now()}@example.com`

  // ── API로 케이스 생성 + 서류 업로드(백엔드/MinIO) ──
  const api = await pwRequest.newContext({ baseURL: API })
  const token = (await (await api.post('/auth/otp/verify', { data: { email, code: MASTER_CODE } })).json()).token as string
  const auth = { Authorization: `Bearer ${token}` }
  const caseId = (await (await api.post('/cases', { headers: auth })).json()).id as string
  await api.post(`/cases/${caseId}/intake/first/submit`, { headers: auth, data: { answers: { businessType: 'corporation', foundingCountry: 'KR' } } })
  await api.post(`/cases/${caseId}/intake/second/submit`, { headers: auth, data: { answers: { x: 'y' } } })
  const docs = await (await api.get(`/cases/${caseId}/documents`, { headers: auth })).json()
  const docId = docs[0].id as string
  const pdf = Buffer.from('%PDF-1.4 e2e doc hydrate\n')
  const up = await api.post(`/cases/${caseId}/documents/${docId}/file`, {
    headers: auth,
    multipart: { file: { name: 'hydrate-proof.pdf', mimeType: 'application/pdf', buffer: pdf } },
  })
  expect(up.ok()).toBeTruthy()

  // ── 브라우저: 로그인 세션(토큰) 주입 후 서류 페이지 직접 방문(재로그인 시나리오) ──
  await page.addInitScript(([t, e]) => {
    localStorage.setItem('session', JSON.stringify({
      state: { session: { userId: e, role: 'CUSTOMER', name: '', email: e }, token: t }, version: 0,
    }))
  }, [token, email])
  await page.goto(`${BASE}/customer/case/documents/?id=${caseId}`)

  // 케이스 하이드레이션 → "케이스를 찾을 수 없습니다" 아님, 업로드한 파일명이 표시돼야 함
  await expect(page.getByText('케이스를 찾을 수 없습니다')).toHaveCount(0, { timeout: 15_000 })
  await expect(page.getByText('hydrate-proof.pdf 업로드됨')).toBeVisible({ timeout: 15_000 })

  await api.dispose()
})
