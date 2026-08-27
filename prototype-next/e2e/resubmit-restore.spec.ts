import { test, expect, request as pwRequest } from '@playwright/test'

// PI-252: 서류 보완 재제출 시 원래 단계로 복원 (심사로 건너뛰지 않음).
// 서류 스크리닝(DOCUMENT_SCREENING_REQUIRED)에서 보완요청된 케이스를 고객이 재제출하면,
// 프론트가 백엔드 C8(resubmit)을 호출 → revisionRequestedFrom 기준으로 서류 스크리닝으로 복원.
const BASE = '/ARK_Onboarding'
const API = process.env.E2E_API_URL ?? 'http://localhost:8080'
const MASTER_CODE = '000000'

test('PI-252: 재제출 → 서류 스크리닝으로 복원(심사 건너뛰기 아님)', async ({ page }) => {
  test.setTimeout(60_000)
  const api = await pwRequest.newContext({ baseURL: API })
  const email = `e2e-resub-${Date.now()}@example.com`
  const custToken = (await (await api.post('/auth/otp/verify', { data: { email, code: MASTER_CODE } })).json()).token as string
  const custAuth = { Authorization: `Bearer ${custToken}` }

  // 케이스 생성 → 1차(CORP) → 2차 → 서류목록 → doc0 업로드
  const caseId = (await (await api.post('/cases', { headers: custAuth })).json()).id as string
  await api.post(`/cases/${caseId}/intake/first/submit`, { headers: custAuth, data: { answers: { businessType: 'corporation', foundingCountry: 'KR' } } })
  await api.post(`/cases/${caseId}/intake/second/submit`, { headers: custAuth, data: { answers: { qe_corp_name_kr: 'E2E법인', qc_fund_source: 'business_income' } } })
  const doc0 = (await (await api.get(`/cases/${caseId}/documents`, { headers: custAuth })).json())[0].id as string
  const pdf = Buffer.from('%PDF-1.4 e2e resubmit\n')
  await api.post(`/cases/${caseId}/documents/${doc0}/file`, { headers: custAuth, multipart: { file: { name: 'e2e.pdf', mimeType: 'application/pdf', buffer: pdf } } })

  // 내부: 서류 스크리닝 단계까지 advance
  const login = async (role: string) => `Bearer ${(await (await api.post('/internal/auth/mock-login', { data: { email: `${role.toLowerCase()}@sentbe.com`, role } })).json()).token}`
  const sales = await login('SALES'), ops = await login('OPS')
  await api.post(`/internal/cases/${caseId}/advance`, { headers: { Authorization: sales } }) // → INITIAL_SCREENING
  await api.post(`/internal/cases/${caseId}/advance`, { headers: { Authorization: sales } }) // → DOCUMENT_SCREENING_REQUIRED

  // OPS 보완요청 → case=REVISION_REQUESTED, revisionRequestedFrom=DOCUMENT_SCREENING_REQUIRED
  await api.post(`/internal/documents/${doc0}/revision-requests`, { headers: { Authorization: ops }, data: { reason: '재발급본 필요' } })
  // 고객 재업로드 → doc0=SUBMITTED (재제출 버튼 활성 조건 충족)
  await api.post(`/cases/${caseId}/documents/${doc0}/file`, { headers: custAuth, multipart: { file: { name: 'e2e2.pdf', mimeType: 'application/pdf', buffer: pdf } } })

  // 재제출 직전 상태 확인
  expect((await (await api.get(`/cases/${caseId}`, { headers: custAuth })).json()).status).toBe('REVISION_REQUESTED')

  // 고객 세션 주입 후 서류 페이지 진입
  await page.addInitScript(([t, e]) => {
    localStorage.setItem('session', JSON.stringify({ state: { session: { userId: e, role: 'CUSTOMER', name: '', email: e }, token: t }, version: 0 }))
  }, [custToken, email])
  await page.goto(`${BASE}/customer/case/documents/?id=${caseId}`)

  // 재제출하기 버튼 활성 → 클릭 (handleSubmit → C8)
  const submitBtn = page.getByRole('button', { name: '재제출하기' })
  await expect(submitBtn).toBeEnabled({ timeout: 15_000 })
  await submitBtn.click()

  // 케이스 페이지로 이동 + 서류 스크리닝으로 복원(심사 아님)
  await expect(page).toHaveURL(new RegExp(`/customer/case/?\\?id=${caseId}`), { timeout: 15_000 })
  await expect(page.getByText('서류 스크리닝 중입니다')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('컴플라이언스 심사 중입니다')).toHaveCount(0)

  // 백엔드 상태도 서류 스크리닝으로 복원됐는지 확인(C8 호출 증거)
  expect((await (await api.get(`/cases/${caseId}`, { headers: custAuth })).json()).status).toBe('DOCUMENT_SCREENING_REQUIRED')

  await api.dispose()
})
