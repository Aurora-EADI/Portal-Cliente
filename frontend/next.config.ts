import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  transpilePackages: [
    '@design-systems-orion/tokens',
    '@design-systems-orion/ui',
    '@design-systems-orion/blocks',
  ],
  reactStrictMode: true,

  serverExternalPackages: ['@prisma/client', 'prisma'],

  images: {
    domains: ['172.20.210.81', '172.20.210.84'],
  },

  // Permite acessar o dev server a partir dos hosts internos.
  allowedDevOrigins: ['172.20.210.81', '172.20.210.84'],

  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  webpack: (config, { dev }) => {
    // Workaround para instabilidades de cache em alguns ambientes Windows/FS
    if (dev) {
      config.cache = false
    }
    return config
  },
}

export default nextConfig
