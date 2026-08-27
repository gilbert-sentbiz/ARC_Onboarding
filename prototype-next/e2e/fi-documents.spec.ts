import { test, expect, request as pwRequest } from '@playwright/test'

// PI-246: 백엔드 엔티티 분류(ENTITY_FI) + 서류 세트 프론트 파리티 (docker 풀스택).
// FI(businessType=financial, KR) 온보딩 → entity_code=ENTITY_FI, 서류 8종(공통6 + FI-own 2).
// CORP=9 / INDIV=6 회귀도 함께 확인.
const API = process.env.E2E_API_URL ?? 'http://localhost:8080'
const MASTER_CODE = '000000'

async function onboardAndGetDocs(api: import('@playwright/test').APIRequestContext, businessType: string) {
  const email = `e2e-fi-${businessType}-${Date.now()}@example.com`
  const token = (await (await api.post('/auth/otp/verify', { data: { email, code: MASTER_CODE } })).json()).token as string
  const auth = { Authorization: `Bearer ${token}` }
  const caseId = (await (await api.post('/cases', { headers: auth })).json()).id as string
  const first = await (await api.post(`/cases/${caseId}/intake/first/submit`, {
    headers: auth,
    data: { answers: { businessType, foundingCountry: 'KR', services: ['remittance'] } },
  })).json()
  await api.post(`/cases/${caseId}/intake/second/submit`, { headers: auth, data: { answers: { x: 'y' } } })
  const docs = await (await api.get(`/cases/${caseId}/documents`, { headers: auth })).json()
  return { entityCode: first.entityCode as string, types: (docs as { type: string }[]).map((d) => d.type).sort() }
}

test('PI-246: FI 온보딩 → ENTITY_FI 분류 + 서류 8종(공통6 + FI-own 2)', async () => {
  const api = await pwRequest.newContext({ baseURL: API })

  const fi = await onboardAndGetDocs(api, 'financial')
  expect(fi.entityCode).toBe('ENTITY_FI')
  expect(fi.types).toEqual([
    'BANK_PROOF', 'BIZ_REGISTRATION', 'CORPORATE_REGISTRY', 'ID_COPY',
    'INTERNAL_POLICIES', 'REMITTANCE_LICENSE', 'SEAL_CERTIFICATE', 'SHAREHOLDER_LIST',
  ])
  // FI 전용 서류가 실제로 포함 + 미해당 공통(CONTRACT·SAMPLE·WEBSITE) 제외
  expect(fi.types).toContain('REMITTANCE_LICENSE')
  expect(fi.types).toContain('INTERNAL_POLICIES')
  expect(fi.types).not.toContain('CONTRACT')
  expect(fi.types).not.toContain('WEBSITE_URL')

  // 회귀: CORP=9, INDIV=6
  const corp = await onboardAndGetDocs(api, 'corporation')
  expect(corp.entityCode).toBe('ENTITY_CORP')
  expect(corp.types).toHaveLength(9)

  const indiv = await onboardAndGetDocs(api, 'individual')
  expect(indiv.entityCode).toBe('ENTITY_INDIV')
  expect(indiv.types).toHaveLength(6)

  await api.dispose()
})
