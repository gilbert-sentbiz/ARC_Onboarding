import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/ARC_Onboarding',
  assetPrefix: '/ARC_Onboarding',
  trailingSlash: true,
  images: { unoptimized: true },
}

export default nextConfig
