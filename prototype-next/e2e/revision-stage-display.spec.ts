import { test, expect, request as pwRequest } from '@playwright/test'

// PI-254: 고객 화면 보완요청 표시가 실제 요청 단계(revisionRequestedFrom)를 반영.
// 서류 스크리닝(OPS) 단계에서 보완요청 → 배너는 "운영팀 서류 검토 결과…"(심사·승인 아님),
// 스텝퍼는 '서류 스크리닝' 행에 "서류 보완 요청 중".
const BASE = '/ARK_Onboarding'
const API = process.env.E2E_API_URL ?? 'http://localhost:8080'
const MASTER_CODE = '000000'

test('PI-254: 서류 스크리닝 단계 보완요청 → 배너/스텝퍼가 해당 단계로 표시(심사·승인 하드코딩 아님)', async ({ page }) => {
  test.setTimeout(60_000)
  const api = await pwRequest.newContext({ baseURL: API })
  const email = `e2e-revdisp-${Date.now()}@example.com`
  const custToken = (await (await api.post('/auth/otp/verify', { data: { email, code: MASTER_CODE } })).json()).token as string
  const custAuth = { Authorization: `Bearer ${custToken}` }

  const caseId = (await (await api.post('/cases', { headers: custAuth })).json()).id as string
  await api.post(`/cases/${caseId}/intake/first/submit`, { headers: custAuth, data: { answers: { businessType: 'corporation', foundingCountry: 'KR' } } })
  await api.post(`/cases/${caseId}/intake/second/submit`, { headers: custAuth, data: { answers: { qe_corp_name_kr: 'E2E법인', qc_fund_source: 'business_income' } } })
  const doc0 = (await (await api.get(`/cases/${caseId}/documents`, { headers: custAuth })).json())[0].id as string
  const pdf = Buffer.from('%PDF-1.4 e2e\n')
  await api.post(`/cases/${caseId}/documents/${doc0}/file`, { headers: custAuth, multipart: { file: { name: 'e2e.pdf', mimeType: 'application/pdf', buffer: pdf } } })

  const login = async (role: string) => `Bearer ${(await (await api.post('/internal/auth/mock-login', { data: { email: `${role.toLowerCase()}@sentbe.com`, role } })).json()).token}`
  const sales = await login('SALES'), ops = await login('OPS')
  await api.post(`/internal/cases/${caseId}/advance`, { headers: { Authorization: sales } }) // → INITIAL_SCREENING
  await api.post(`/internal/cases/${caseId}/advance`, { headers: { Authorization: sales } }) // → DOCUMENT_SCREENING_REQUIRED
  await api.post(`/internal/documents/${doc0}/revision-requests`, { headers: { Authorization: ops }, data: { reason: '재발급본 필요' } })
  // case=REVISION_REQUESTED, revisionRequestedFrom=DOCUMENT_SCREENING_REQUIRED

  await page.addInitScript(([t, e]) => {
    localStorage.setItem('session', JSON.stringify({ state: { session: { userId: e, role: 'CUSTOMER', name: '', email: e }, token: t }, version: 0 }))
  }, [custToken, email])
  await page.goto(`${BASE}/customer/case/?id=${caseId}`)

  // 보완요청 배너: 운영팀(서류 스크리닝) 문구, 컴플라이언스 문구 아님
  await expect(page.getByText('서류 보완이 필요합니다')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText(/운영팀 서류 검토 결과/)).toBeVisible()
  await expect(page.getByText(/컴플라이언스 검토 결과/)).toHaveCount(0)
  // 스텝퍼: '서류 보완 요청 중' 표기 존재
  await expect(page.getByText('서류 보완 요청 중')).toBeVisible()

  await api.dispose()
})
