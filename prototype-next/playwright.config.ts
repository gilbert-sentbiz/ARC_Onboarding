import { defineConfig, devices } from '@playwright/test'

// PI-230: 로컬 풀스택(docker compose up) 위에서 도는 e2e 1패스.
// 프론트 http://localhost:3000/ARK_Onboarding/ , 백엔드 http://localhost:8080.
const FRONT = process.env.E2E_FRONT_URL ?? 'http://localhost:3000'
const API = process.env.E2E_API_URL ?? 'http://localhost:8080'

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: false,
  reporter: [['list']],
  use: {
    baseURL: FRONT,
    trace: 'off',
    // API 골든패스 테스트에서 사용
    extraHTTPHeaders: {},
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  metadata: { apiBaseURL: API },
})
