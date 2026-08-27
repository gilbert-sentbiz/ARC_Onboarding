import { test, expect } from '@playwright/test'

// PI-255: 2차 폼 숫자 입력(실소유자 수·공동대표 수·지분율 등)에 음수 입력 차단.
// 공동대표 수(qe_corp_rep_count) number 필드에 음수를 입력해도 부호가 제거되는지 확인.
const BASE = '/ARK_Onboarding'
const MASTER_CODE = '000000'

test('PI-255: 2차 폼 숫자 필드에 음수 입력 불가(부호 제거)', async ({ page }) => {
  const email = `e2e-bonum-${Date.now()}@example.com`

  await page.goto(`${BASE}/`)
  await page.getByPlaceholder('example@company.com').fill(email)
  await page.getByText('개인정보 수집 및 이용').click()
  await page.getByRole('button', { name: /인증코드 받기/ }).click()
  await page.getByPlaceholder('6자리 코드').fill(MASTER_CODE)
  await page.getByRole('button', { name: '확인' }).click()
  await expect(page).toHaveURL(/\/customer\/onboarding/, { timeout: 15_000 })

  // 온보딩 step 0
  await page.getByPlaceholder('예: 주식회사 센트비').fill('E2E 음수법인')
  await page.getByPlaceholder('홍길동').fill('김담당')
  await page.getByPlaceholder('대리, 과장 등').fill('과장')
  await page.getByPlaceholder('+82-10-0000-0000').fill('+82-10-1234-5678')
  await page.getByPlaceholder('example@company.com').fill(email)
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

  // review/first → 2차 폼(corp_s1)
  await expect(page).toHaveURL(/\/customer\/case\/review\/first/, { timeout: 15_000 })
  await page.getByRole('button', { name: '확인하고 계속하기' }).click()
  await expect(page).toHaveURL(/\/customer\/case\/information/, { timeout: 15_000 })

  // 공동대표 선택 → 공동대표 인원 수(number) 필드 노출
  await page.getByText('공동대표', { exact: true }).click()
  const numberInput = page.locator('input[type="number"]').first()
  await expect(numberInput).toBeVisible({ timeout: 10_000 })

  // 음수 입력(fill: onChange 경유) → 부호 제거되어 양수만 남음
  await numberInput.fill('-50')
  await expect(numberInput).toHaveValue('50')

  // 키 입력(pressSequentially: keydown 경유) '-'는 차단
  await numberInput.fill('')
  await numberInput.pressSequentially('-7')
  await expect(numberInput).toHaveValue('7')

  // min=0 속성으로 스피너 하한 보장
  await expect(numberInput).toHaveAttribute('min', '0')
})
