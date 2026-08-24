import { test, expect, request as pwRequest } from '@playwright/test'

// PI-230: 전체 골든패스를 실 API로 검증 (docker 풀스택).
// 고객: OTP(만능키) → 케이스 생성 → 1차(분류) → 2차 → 서류목록 → 파일 업로드(MinIO)
// 내부: mock-login → 5단계 심사(advance) → COMPLETED
const API = process.env.E2E_API_URL ?? 'http://localhost:8080'
const MASTER_CODE = '000000'

test('API 골든패스: 고객 온보딩 → 서류 업로드(MinIO) → 내부 5단계 심사 → COMPLETED', async () => {
  const api = await pwRequest.newContext({ baseURL: API })

  // ── 고객: OTP 만능키로 세션 토큰 ──
  const email = `e2e-${Date.now()}@example.com`
  const verify = await api.post('/auth/otp/verify', { data: { email, code: MASTER_CODE } })
  expect(verify.ok()).toBeTruthy()
  const custToken = (await verify.json()).token as string
  expect(custToken).toBeTruthy()
  const custAuth = { Authorization: `Bearer ${custToken}` }

  // ── 케이스 생성 (C1) ──
  const created = await api.post('/cases', { headers: custAuth })
  expect(created.ok()).toBeTruthy()
  const caseId = (await created.json()).id as string
  expect(caseId).toBeTruthy()

  // ── 1차 제출 (C4) → CORP 분류 ──
  const first = await api.post(`/cases/${caseId}/intake/first/submit`, {
    headers: custAuth,
    data: { answers: { qc_biz_reg_no: '1234567890', businessType: 'corporation', foundingCountry: 'KR' } },
  })
  expect(first.ok()).toBeTruthy()
  expect((await first.json()).entityCode).toBe('ENTITY_CORP')

  // ── 2차 제출 (C6) → DOCUMENT_SUBMISSION_REQUIRED ──
  const second = await api.post(`/cases/${caseId}/intake/second/submit`, {
    headers: custAuth,
    data: { answers: { qe_corp_name_kr: 'E2E데모법인', qc_fund_source: 'business_income' } },
  })
  expect(second.ok()).toBeTruthy()
  expect((await second.json()).status).toBe('DOCUMENT_SUBMISSION_REQUIRED')

  // ── 서류 목록 (C9) → 첫 문서에 파일 업로드 (C10, MinIO 실저장) ──
  const docsRes = await api.get(`/cases/${caseId}/documents`, { headers: custAuth })
  expect(docsRes.ok()).toBeTruthy()
  const docs = await docsRes.json()
  expect(Array.isArray(docs) && docs.length).toBeTruthy()
  const docId = docs[0].id as string

  const pdf = Buffer.from('%PDF-1.4 e2e demo pdf\n')
  const upload = await api.post(`/cases/${caseId}/documents/${docId}/file`, {
    headers: custAuth,
    multipart: { file: { name: 'e2e.pdf', mimeType: 'application/pdf', buffer: pdf } },
  })
  expect(upload.ok()).toBeTruthy()
  expect((await upload.json()).status).toBe('SUBMITTED')

  // ── 내부: 5단계 심사 advance → COMPLETED ──
  const login = async (role: string) => {
    const res = await api.post('/internal/auth/mock-login', {
      data: { email: `${role.toLowerCase()}@sentbe.com`, role },
    })
    expect(res.ok()).toBeTruthy()
    return `Bearer ${(await res.json()).token}`
  }
  const advance = async (auth: string) => {
    const res = await api.post(`/internal/cases/${caseId}/advance`, { headers: { Authorization: auth } })
    expect(res.ok()).toBeTruthy()
  }
  const status = async (auth: string) => {
    const res = await api.get(`/internal/cases/${caseId}`, { headers: { Authorization: auth } })
    return (await res.json()).status as string
  }

  const sales = await login('SALES')
  const ops = await login('OPS')
  const compliance = await login('COMPLIANCE')

  await advance(sales)      // DOCUMENT_SUBMISSION_REQUIRED → INITIAL_SCREENING
  await advance(sales)      // → DOCUMENT_SCREENING_REQUIRED
  await advance(ops)        // → APPROVAL_REVIEW_REQUIRED
  await advance(compliance) // → ACCOUNT_SETUP_REQUIRED
  await advance(ops)        // → COMPLETED
  expect(await status(sales)).toBe('COMPLETED')

  await api.dispose()
})
