import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,

  images: {
    domains: ['172.20.210.81', '172.20.210.84'],
  },

  // Permite acessar o dev server a partir dos hosts internos.
  allowedDevOrigins: ['172.20.210.81', '172.20.210.84'],

  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
