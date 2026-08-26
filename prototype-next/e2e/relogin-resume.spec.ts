import { test, expect } from '@playwright/test'

// PI-241/242 회귀: 케이스 있는 고객이 재로그인하면 온보딩이 아닌 상태 페이지로 복귀.
// (수정 전: 항상 /customer/onboarding으로 가 중복 케이스 생성 위험)
const BASE = '/ARK_Onboarding'
const MASTER_CODE = '000000'

test('PI-241: 케이스 보유 고객 재로그인 → 상태 페이지 복귀(온보딩 아님)', async ({ browser }) => {
  const email = `e2e-relogin-${Date.now()}@example.com`

  // ── 1차 세션: 온보딩 완주로 케이스 생성 ──
  const ctx1 = await browser.newContext()
  const page = await ctx1.newPage()
  await page.goto(`${BASE}/`)
  await page.getByPlaceholder('example@company.com').fill(email)
  await page.getByText('개인정보 수집 및 이용').click()
  await page.getByRole('button', { name: /인증코드 받기/ }).click()
  await page.getByPlaceholder('6자리 코드').fill(MASTER_CODE)
  await page.getByRole('button', { name: '확인' }).click()
  await expect(page).toHaveURL(/\/customer\/onboarding/, { timeout: 15_000 })

  await page.getByPlaceholder('예: 주식회사 센트비').fill('E2E 재로그인법인')
  await page.getByPlaceholder('홍길동').fill('김담당')
  await page.getByPlaceholder('대리, 과장 등').fill('과장')
  await page.getByPlaceholder('+82-10-0000-0000').fill('+82-10-1234-5678')
  await page.getByPlaceholder('example@company.com').fill(email)
  await page.locator('div', { has: page.getByText('송금 출발 국가') }).last()
    .getByRole('button', { name: '한국', exact: true }).click()
  await page.locator('div', { has: page.getByText('송금 도착 국가') }).last()
    .getByRole('button', { name: '미국', exact: true }).click()
  await page.getByRole('button', { name: /다음/ }).click()
  await page.getByText('법인 사업자').click()
  await page.getByRole('button', { name: '한국', exact: true }).click()
  await page.getByPlaceholder('0').fill('10000000')
  await page.locator('select').last().selectOption('search')
  await page.getByText('개인정보 수집 및 이용').click()
  await page.getByRole('button', { name: /제출하기/ }).click()
  await expect(page).toHaveURL(/\/customer\/case\/review\/first/, { timeout: 15_000 })
  await page.getByRole('button', { name: '확인하고 계속하기' }).click()
  await expect(page).toHaveURL(/\/customer\/case\/information/, { timeout: 15_000 })
  await ctx1.close()

  // ── 2차 세션(새 브라우저 컨텍스트 = 재로그인): 같은 이메일 → 상태 페이지 복귀 ──
  const ctx2 = await browser.newContext()
  const page2 = await ctx2.newPage()
  await page2.goto(`${BASE}/`)
  await page2.getByPlaceholder('example@company.com').fill(email)
  await page2.getByText('개인정보 수집 및 이용').click()
  await page2.getByRole('button', { name: /인증코드 받기/ }).click()
  await page2.getByPlaceholder('6자리 코드').fill(MASTER_CODE)
  await page2.getByRole('button', { name: '확인' }).click()

  // 온보딩이 아니라 케이스 상태 페이지로 가야 함
  await expect(page2).toHaveURL(/\/customer\/case(\?|$|\/)/, { timeout: 15_000 })
  await expect(page2).not.toHaveURL(/\/customer\/onboarding/)
  // 상태 페이지가 백엔드 하이드레이션으로 실제 렌더돼야 함("케이스를 찾을 수 없습니다" 아님) — PI-241 2차
  await expect(page2.getByText('진행 현황')).toBeVisible({ timeout: 15_000 })
  await expect(page2.getByText('케이스를 찾을 수 없습니다')).toHaveCount(0)

  // PI-243: 서류 업로드 탭 클릭 → 쿼리파라미터 URL로 이동(404 아님)
  await page2.getByRole('button', { name: '서류 업로드' }).click()
  await expect(page2).toHaveURL(/\/customer\/case\/documents\/?\?id=/, { timeout: 15_000 })
  await expect(page2.getByText('This page could not be found')).toHaveCount(0)
  await ctx2.close()
})
