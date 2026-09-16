'use client';

import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  // Sem configuração, Better Auth usa /api/auth, que é roteado pelo mesmo
  // hostname para o NestJS. Ambientes locais cross-origin podem informar a
  // URL completa via NEXT_PUBLIC_AUTH_URL.
  baseURL: process.env.NEXT_PUBLIC_AUTH_URL || undefined,
});
