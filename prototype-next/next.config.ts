import type { NextConfig } from 'next'

// PI-229: 빌드 타겟 토글.
// - 기본(정적): GitHub Pages 배포용 — output:'export' + basePath '/ARK_Onboarding'
// - DOCKER_BUILD=1: 로컬 풀스택 docker용 — standalone 서버 모드(런타임 API 호출), basePath 유지
const isDocker = process.env.DOCKER_BUILD === '1'

const nextConfig: NextConfig = {
  output: isDocker ? 'standalone' : 'export',
  basePath: '/ARK_Onboarding',
  assetPrefix: '/ARK_Onboarding',
  trailingSlash: true,
  images: { unoptimized: true },
}

export default nextConfig
