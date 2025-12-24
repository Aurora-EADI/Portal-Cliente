/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  images: {
    domains: ['172.20.210.81'], // Adicione o IP da sua VM
  },

  // Corrige o warning de allowedDevOrigins
  allowedDevOrigins: ['172.20.210.81'],

  // Otimizações para reduzir uso de memória
  experimental: {
    workerThreads: false,
    cpus: 1,
  },

  // Configurações do Webpack para desenvolvimento
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Reduz uso de memória no watch mode
      config.watchOptions = {
        poll: 1000, // Usa polling em vez de eventos do filesystem
        aggregateTimeout: 300,
        ignored: ['**/node_modules', '**/.git', '**/.next'],
      }
      
      // Desabilita cache em desenvolvimento para economizar memória
      config.cache = false
    }
    
    return config
  },

  // Desabilita telemetria do Next.js
  telemetry: {
    enabled: false,
  },
}

module.exports = nextConfig