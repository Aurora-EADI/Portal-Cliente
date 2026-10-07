import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // Docker opts into standalone; local Windows builds avoid privileged symlinks.
  output: process.env.NEXT_STANDALONE === 'true' ? 'standalone' : undefined,
  outputFileTracingRoot: path.join(__dirname, '..'),
  reactStrictMode: true,

  // Permite acessar o dev server a partir dos hosts internos.
  allowedDevOrigins: ['172.20.210.81', '172.20.210.84'],

  // A seleção de módulos saiu. Favorito antigo cai em `/`: sem sessão é o
  // login, com sessão a própria página manda para o agendamento.
  async redirects() {
    return [{ source: '/modules', destination: '/', permanent: false }];
  },

  webpack: (config, { dev }) => {
    // Workaround para instabilidades de cache em alguns ambientes Windows/FS
    if (dev) {
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
