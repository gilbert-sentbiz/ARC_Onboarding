import { test, expect } from '@playwright/test'

// PI-234 회귀: 2차 폼 날짜 필드 클릭 시 데이트피커(showPicker)가 열려야 한다.
// (수정 전: opacity-0 date input이 클릭으로 안 열림 — onClick showPicker 없음)
const BASE = '/ARK_Onboarding'
const MASTER_CODE = '000000'

test('PI-234: 2차 폼 날짜 필드 클릭 시 데이트피커가 열린다(showPicker 호출)', async ({ page }) => {
  const email = `e2e-date-${Date.now()}@example.com`

  // OTP 로그인
  await page.goto(`${BASE}/`)
  await page.getByPlaceholder('example@company.com').fill(email)
  await page.getByText('개인정보 수집 및 이용').click()
  await page.getByRole('button', { name: /인증코드 받기/ }).click()
  await page.getByPlaceholder('6자리 코드').fill(MASTER_CODE)
  await page.getByRole('button', { name: '확인' }).click()
  await expect(page).toHaveURL(/\/customer\/onboarding/, { timeout: 15_000 })

  // 온보딩 step 0
  await page.getByPlaceholder('예: 주식회사 센트비').fill('E2E 날짜법인')
  await page.getByPlaceholder('홍길동').fill('김담당')
  await page.getByPlaceholder('대리, 과장 등').fill('과장')
  await page.getByPlaceholder('+82-10-0000-0000').fill('+82-10-1234-5678')
  await page.getByPlaceholder('example@company.com').fill(email)
  await page.locator('div', { has: page.getByText('송금 출발 국가') }).last()
    .getByRole('button', { name: '한국', exact: true }).click()
  await page.locator('div', { has: page.getByText('송금 도착 국가') }).last()
    .getByRole('button', { name: '미국', exact: true }).click()
  await page.getByRole('button', { name: /다음/ }).click()

  // 온보딩 step 1 (CORP)
  await page.getByText('법인 사업자').click()
  await page.getByRole('button', { name: '한국', exact: true }).click()
  await page.getByPlaceholder('0').fill('10000000')
  await page.locator('select').last().selectOption('search')
  await page.getByText('개인정보 수집 및 이용').click()
  await page.getByRole('button', { name: /제출하기/ }).click()

  // review/first → 2차 폼(corp_s1: 설립일자 date 필드 포함)
  await expect(page).toHaveURL(/\/customer\/case\/review\/first/, { timeout: 15_000 })
  await page.getByRole('button', { name: '확인하고 계속하기' }).click()
  await expect(page).toHaveURL(/\/customer\/case\/information/, { timeout: 15_000 })

  // 날짜 필드에만 showPicker 스파이 설치 (프로토타입 전역 오염 방지)
  const dateInput = page.locator('input[type="date"]').first()
  await expect(dateInput).toBeVisible({ timeout: 10_000 })
  await dateInput.evaluate((el: HTMLInputElement) => {
    const w = window as unknown as { __showPickerCalls: number }
    w.__showPickerCalls = 0
    const orig = el.showPicker?.bind(el)
    el.showPicker = () => {
      w.__showPickerCalls++
      try { orig?.() } catch { /* 유저제스처/보안 제약 무시 */ }
    }
  })

  // 날짜 필드 클릭 → onClick 핸들러가 showPicker 호출해야 함
  await dateInput.click()

  const calls = await page.evaluate(() => (window as unknown as { __showPickerCalls: number }).__showPickerCalls)
  expect(calls, '날짜 필드 클릭 시 showPicker가 호출되어야 함').toBeGreaterThan(0)
})
