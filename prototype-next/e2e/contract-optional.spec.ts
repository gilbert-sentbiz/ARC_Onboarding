import { test, expect, request as pwRequest } from '@playwright/test'

// PI-256: 계약서(CONTRACT)는 전 세그먼트 항상 선택(optional) — 미제출도 서류 제출 통과.
// CORP 케이스에서 CONTRACT는 required=false, 필수 서류만 올리면(계약서 제외) 제출하기 활성.
const BASE = '/ARK_Onboarding'
const API = process.env.E2E_API_URL ?? 'http://localhost:8080'
const MASTER_CODE = '000000'

test('PI-256: CORP 계약서 optional — 미제출도 제출 통과', async ({ page }) => {
  test.setTimeout(60_000)
  const api = await pwRequest.newContext({ baseURL: API })
  const email = `e2e-contract-${Date.now()}@example.com`
  const token = (await (await api.post('/auth/otp/verify', { data: { email, code: MASTER_CODE } })).json()).token as string
  const auth = { Authorization: `Bearer ${token}` }

  const caseId = (await (await api.post('/cases', { headers: auth })).json()).id as string
  await api.post(`/cases/${caseId}/intake/first/submit`, { headers: auth, data: { answers: { businessType: 'corporation', foundingCountry: 'KR' } } })
  await api.post(`/cases/${caseId}/intake/second/submit`, { headers: auth, data: { answers: { qe_corp_name_kr: 'E2E법인', qc_fund_source: 'business_income' } } })

  const docs = (await (await api.get(`/cases/${caseId}/documents`, { headers: auth })).json()) as { id: string; type: string; required: boolean }[]
  const contract = docs.find((d) => d.type === 'CONTRACT')
  expect(contract, 'CONTRACT 서류 존재').toBeTruthy()
  expect(contract!.required, 'CONTRACT는 optional').toBe(false)

  // 계약서를 제외한 필수 서류만 업로드 (미제출 = CONTRACT)
  const pdf = Buffer.from('%PDF-1.4 e2e contract\n')
  for (const d of docs.filter((x) => x.required)) {
    await api.post(`/cases/${caseId}/documents/${d.id}/file`, { headers: auth, multipart: { file: { name: 'e2e.pdf', mimeType: 'application/pdf', buffer: pdf } } })
  }

  // 고객 세션 주입 후 서류 페이지 진입 (백엔드 하이드레이션)
  await page.addInitScript(([t, e]) => {
    localStorage.setItem('session', JSON.stringify({ state: { session: { userId: e, role: 'CUSTOMER', name: '', email: e }, token: t }, version: 0 }))
  }, [token, email])
  await page.goto(`${BASE}/customer/case/documents/?id=${caseId}`)

  // 계약서 행 표시 + 필수 미제출 없음 → 제출하기 활성 (계약서 미업로드여도 통과)
  await expect(page.getByText(/계약서/).first()).toBeVisible({ timeout: 15_000 })
  await expect(page.getByRole('button', { name: '제출하기' })).toBeEnabled({ timeout: 15_000 })

  await api.dispose()
})
