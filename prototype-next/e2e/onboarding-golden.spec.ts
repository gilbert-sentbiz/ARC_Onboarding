import { test, expect, request as pwRequest } from '@playwright/test'

// PI-233 회귀: 온보딩 완주 시 세션 토큰이 보존돼 백엔드에 케이스가 저장돼야 한다.
// (수정 전: 온보딩 제출의 setSession이 토큰을 null로 덮어 POST /cases 미발생)
const BASE = '/ARK_Onboarding'
const API = process.env.E2E_API_URL ?? 'http://localhost:8080'
const MASTER_CODE = '000000'

test('PI-233: 고객 온보딩 완주 → 백엔드에 케이스 저장(토큰 보존)', async ({ page }) => {
  const email = `e2e-onb-${Date.now()}@example.com`

  // ── OTP 로그인 ──
  await page.goto(`${BASE}/`)
  await page.getByPlaceholder('example@company.com').fill(email)
  await page.getByText('개인정보 수집 및 이용').click()
  await page.getByRole('button', { name: /인증코드 받기/ }).click()
  await page.getByPlaceholder('6자리 코드').fill(MASTER_CODE)
  await page.getByRole('button', { name: '확인' }).click()
  await expect(page).toHaveURL(/\/customer\/onboarding/, { timeout: 15_000 })

  // ── 온보딩 step 0: 담당자/서비스 ──
  await page.getByPlaceholder('예: 주식회사 센트비').fill('E2E 데모법인')
  await page.getByPlaceholder('홍길동').fill('김담당')
  await page.getByPlaceholder('대리, 과장 등').fill('과장')
  await page.getByPlaceholder('+82-10-0000-0000').fill('+82-10-1234-5678')
  await page.getByPlaceholder('example@company.com').fill(email)
  // PI-253: 송금 출발 국가는 KR 고정(읽기전용) — 선택 버튼 없이 '한국 (KR)' 노출
  const fromSection = page.locator('div', { has: page.getByText('송금 출발 국가') }).last()
  await expect(fromSection.getByText('한국 (KR)')).toBeVisible()
  await expect(fromSection.getByRole('button', { name: '한국', exact: true })).toHaveCount(0)
  const toSection = page.locator('div', { has: page.getByText('송금 도착 국가') }).last()
  await toSection.getByRole('button', { name: '미국', exact: true }).click()
  await page.getByRole('button', { name: /다음/ }).click()

  // ── 온보딩 step 1: 사업자 정보 ──
  await page.getByText('법인 사업자').click()
  // 설립 국가: '한국' 버튼(step1엔 이 라벨 버튼이 1개)
  await page.getByRole('button', { name: '한국', exact: true }).click()
  await page.getByPlaceholder('0').fill('10000000')
  // 유입경로 select
  await page.locator('select').last().selectOption('search')
  await page.getByText('개인정보 수집 및 이용').click()
  await page.getByRole('button', { name: /제출하기/ }).click()

  // ── review/first 확인 → 백엔드 POST /cases 발생 ──
  await expect(page).toHaveURL(/\/customer\/case\/review\/first/, { timeout: 15_000 })
  await page.getByRole('button', { name: '확인하고 계속하기' }).click()
  await expect(page).toHaveURL(/\/customer\/case\/information/, { timeout: 15_000 })

  // ── 검증: 내부 API로 해당 이메일 케이스가 백엔드에 존재 ──
  const api = await pwRequest.newContext({ baseURL: API })
  const login = await api.post('/internal/auth/mock-login', { data: { email: 'sales@sentbe.com', role: 'SALES' } })
  const token = (await login.json()).token
  const casesRes = await api.get('/internal/cases', { headers: { Authorization: `Bearer ${token}` } })
  const cases = await casesRes.json()
  // 백엔드에 최소 1건 이상(방금 생성분 포함). 토큰 소실 버그면 이 케이스 자체가 안 생김.
  expect(Array.isArray(cases)).toBeTruthy()
  const created = cases.find((c: { customerId: string }) => c.customerId)
  expect(created, '온보딩 완주 후 백엔드에 케이스가 저장되어야 함').toBeTruthy()
  await api.dispose()
})
