/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,

  images: {
    domains: ['172.20.210.81', '172.20.210.84'],
  },

  // Corrige o warning de allowedDevOrigins
  allowedDevOrigins: ['172.20.210.81', '172.20.210.84'],

  // Otimizações para reduzir uso de memória
  experimental: {
    workerThreads: false,
    cpus: 1,
  },

  // Configurações do Webpack para desenvolvimento
  webpack: (config: any, { dev, isServer }: { dev: boolean; isServer: boolean }) => {
    if (dev && !isServer) {
      // Reduz uso de memória no watch mode
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: ['**/node_modules', '**/.git', '**/.next'],
      }

      // Desabilita cache em desenvolvimento para economizar memória
      config.cache = false
    }

    return config
  },
}

export default nextConfig