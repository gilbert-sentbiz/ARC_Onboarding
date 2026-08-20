import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/ARK_Onboarding',
  assetPrefix: '/ARK_Onboarding',
  trailingSlash: true,
  images: { unoptimized: true },
}

export default nextConfig
