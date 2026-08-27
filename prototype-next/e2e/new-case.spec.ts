import { test, expect, request as pwRequest } from '@playwright/test'

// PI-245: 종료(COMPLETED/CLOSED) 케이스 상태 화면에서 "새 케이스 시작하기" →
// 로그아웃(로그인화면) 아니라 온보딩 1차 입력폼으로, 세션 유지.
const BASE = '/ARK_Onboarding'
const API = process.env.E2E_API_URL ?? 'http://localhost:8080'
const MASTER_CODE = '000000'

test('PI-245: 완료 케이스에서 새 케이스 시작 → 온보딩 이동, 세션 유지(로그아웃 아님)', async ({ page }) => {
  const email = `e2e-newcase-${Date.now()}@example.com`

  // ── API로 케이스를 COMPLETED까지 진행 ──
  const api = await pwRequest.newContext({ baseURL: API })
  const token = (await (await api.post('/auth/otp/verify', { data: { email, code: MASTER_CODE } })).json()).token as string
  const auth = { Authorization: `Bearer ${token}` }
  const caseId = (await (await api.post('/cases', { headers: auth })).json()).id as string
  await api.post(`/cases/${caseId}/intake/first/submit`, { headers: auth, data: { answers: { businessType: 'corporation', foundingCountry: 'KR' } } })
  await api.post(`/cases/${caseId}/intake/second/submit`, { headers: auth, data: { answers: { x: 'y' } } })
  const login = async (role: string) => `Bearer ${(await (await api.post('/internal/auth/mock-login', { data: { email: `${role.toLowerCase()}@sentbe.com`, role } })).json()).token}`
  const adv = async (a: string) => api.post(`/internal/cases/${caseId}/advance`, { headers: { Authorization: a } })
  const sales = await login('SALES'), ops = await login('OPS'), comp = await login('COMPLIANCE')
  await adv(sales); await adv(sales); await adv(ops); await adv(comp); await adv(ops) // → COMPLETED

  // ── 브라우저: 세션 주입 후 상태 페이지 진입 ──
  await page.addInitScript(([t, e]) => {
    localStorage.setItem('session', JSON.stringify({ state: { session: { userId: e, role: 'CUSTOMER', name: '', email: e }, token: t }, version: 0 } ))
  }, [token, email])
  await page.goto(`${BASE}/customer/case/?id=${caseId}`)
  await expect(page.getByText('케이스를 찾을 수 없습니다')).toHaveCount(0, { timeout: 15_000 })

  // "새 케이스 시작하기" 클릭 → 온보딩으로, 로그인 화면 아님
  await page.getByRole('button', { name: /새 케이스 시작하기/ }).click()
  await expect(page).toHaveURL(/\/customer\/onboarding/, { timeout: 15_000 })
  // 온보딩 첫 화면(회사명 입력)이 보여야 함 + 세션 유지(로그인 OTP 화면 아님)
  await expect(page.getByPlaceholder('예: 주식회사 센트비')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByPlaceholder('6자리 코드')).toHaveCount(0)

  await api.dispose()
})
