import { test, expect, request as pwRequest } from '@playwright/test'

// PI-250: 내부 케이스 상세가 새 세션에서도 백엔드 하이드레이션으로 렌더되고,
// 세그먼트 판단 등 항목이 한글 라벨로 표시된다.
// (intake 답변의 라벨 치환은 review/second와 동일 공통 유틸 buildLabelMap/buildOptionMap 사용 —
//  내부 intake는 백엔드 조회 API 부재로 하이드레이트 불가, store 보유 시 표시. 여기선 케이스 렌더 검증.)
const BASE = '/ARK_Onboarding'
const API = process.env.E2E_API_URL ?? 'http://localhost:8080'
const MASTER_CODE = '000000'

test('PI-250: 내부 케이스 상세가 새 세션에서 하이드레이션 렌더된다(케이스 못 찾음 아님)', async ({ page }) => {
  const email = `e2e-ilbl-${Date.now()}@example.com`

  const api = await pwRequest.newContext({ baseURL: API })
  const token = (await (await api.post('/auth/otp/verify', { data: { email, code: MASTER_CODE } })).json()).token as string
  const auth = { Authorization: `Bearer ${token}` }
  const caseId = (await (await api.post('/cases', { headers: auth })).json()).id as string
  await api.post(`/cases/${caseId}/intake/first/submit`, { headers: auth, data: { answers: { businessType: 'corporation', foundingCountry: 'KR' } } })

  const salesTok = (await (await api.post('/internal/auth/mock-login', { data: { email: 'sales@sentbe.com', role: 'SALES' } })).json()).token as string
  await page.addInitScript(([t]) => {
    localStorage.setItem('session', JSON.stringify({ state: { session: { userId: 'sales@sentbe.com', role: 'SALES', name: '영업', email: 'sales@sentbe.com' }, token: t }, version: 0 } ))
  }, [salesTok])
  await page.goto(`${BASE}/internal/case/?id=${caseId}`)

  // 하이드레이션으로 케이스 렌더 — "케이스를 찾을 수 없습니다" 아님
  await expect(page.getByText('케이스를 찾을 수 없습니다')).toHaveCount(0, { timeout: 15_000 })
  // 세그먼트 판단이 한글 라벨(법인)로 표시 (entity_code=ENTITY_CORP → '법인')
  await expect(page.getByText('세그먼트 판단')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('법인').first()).toBeVisible()

  await api.dispose()
})
