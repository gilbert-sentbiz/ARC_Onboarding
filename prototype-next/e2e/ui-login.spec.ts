import { test, expect } from '@playwright/test'

// PI-230: 브라우저 UI e2e — 실 API 로그인 진입점 (docker 풀스택).
const BASE = '/ARK_Onboarding'
const MASTER_CODE = '000000'

test('고객: OTP 로그인(만능키) → 온보딩 진입', async ({ page }) => {
  await page.goto(`${BASE}/`)

  // 이메일 입력 + 동의
  await page.getByPlaceholder('example@company.com').fill(`e2e-ui-${Date.now()}@example.com`)
  await page.getByText('개인정보 수집 및 이용').click()
  await page.getByRole('button', { name: /인증코드 받기/ }).click()

  // 코드 입력 → verify (실 API) → 온보딩 이동
  await page.getByPlaceholder('6자리 코드').fill(MASTER_CODE)
  await page.getByRole('button', { name: '확인' }).click()

  await expect(page).toHaveURL(/\/customer\/onboarding/, { timeout: 15_000 })
})

test('내부: mock-login → 대시보드 진입', async ({ page }) => {
  await page.goto(`${BASE}/internal`)

  await page.getByPlaceholder('이메일 주소').fill('sales@sentbe.com')
  await page.getByPlaceholder('비밀번호').fill('sentbe1234')
  await page.getByRole('button', { name: '로그인' }).click()

  await expect(page).toHaveURL(/\/internal\/dashboard/, { timeout: 15_000 })
  // 대시보드 필터 탭 등 핵심 UI 렌더 확인
  await expect(page.getByRole('button', { name: '전체' })).toBeVisible({ timeout: 10_000 })
})
