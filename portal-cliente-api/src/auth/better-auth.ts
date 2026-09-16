import { prismaAdapter } from '@better-auth/prisma-adapter';
import { betterAuth } from 'better-auth';
import type { BetterAuthPlugin } from 'better-auth/types';
import { APIError } from 'better-auth/api';
import { i18n } from '@better-auth/i18n';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { sendBetterAuthEmail } from './better-auth-email';

export const BETTER_AUTH_PROVISIONING_HEADER = 'x-better-auth-provisioning-secret';

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} não configurado`);
  return value;
}

function listEnv(name: string, fallback: string): string[] {
  return (process.env[name] || fallback)
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

const authPool = new Pool({ connectionString: requiredEnv('DATABASE_URL') });
const authPrisma = new PrismaClient({ adapter: new PrismaPg(authPool) });
const provisioningSecret = requiredEnv('BETTER_AUTH_PROVISIONING_SECRET');

export const auth = betterAuth({
  basePath: '/api/auth',
  database: prismaAdapter(authPrisma, {
    provider: 'postgresql',
    transaction: true,
  }),
  secret: requiredEnv('BETTER_AUTH_SECRET'),
  // BETTER_AUTH_URL é a origem pública; o caminho é definido acima para não
  // produzir /api/auth/api/auth ao montar os endpoints.
  baseURL: process.env.BETTER_AUTH_URL?.trim(),
  trustedOrigins: listEnv(
    'BETTER_AUTH_TRUSTED_ORIGINS',
    process.env.FRONTEND_URL || 'http://localhost:3000',
  ),
  plugins: [
    i18n({
      defaultLocale: 'pt',
      translations: {
        pt: {
          INVALID_EMAIL_OR_PASSWORD: 'E-mail ou senha incorretos.',
          USER_NOT_FOUND: 'E-mail ou senha incorretos.',
          INVALID_EMAIL: 'Verifique os dados informados.',
          PASSWORD_TOO_SHORT: 'A senha deve ter pelo menos 8 caracteres.',
          PASSWORD_TOO_LONG: 'A senha é muito longa.',
          EMAIL_NOT_VERIFIED: 'E-mail não verificado.',
          FAILED_TO_CREATE_SESSION: 'Serviço temporariamente indisponível. Tente novamente mais tarde.',
          USER_INACTIVE: 'Usuário inativo. Entre em contato com o administrador.',
        },
        en: {
          INVALID_EMAIL_OR_PASSWORD: 'E-mail ou senha incorretos.',
          USER_NOT_FOUND: 'E-mail ou senha incorretos.',
          INVALID_EMAIL: 'Verifique os dados informados.',
          PASSWORD_TOO_SHORT: 'A senha deve ter pelo menos 8 caracteres.',
          PASSWORD_TOO_LONG: 'A senha é muito longa.',
          EMAIL_NOT_VERIFIED: 'E-mail não verificado.',
          FAILED_TO_CREATE_SESSION: 'Serviço temporariamente indisponível. Tente novamente mais tarde.',
          USER_INACTIVE: 'Usuário inativo. Entre em contato com o administrador.',
        },
      },
    }) as unknown as BetterAuthPlugin,
  ],
  emailAndPassword: {
    enabled: true,
    // Signup só é permitido pelo fluxo server-side de convite. O hook abaixo
    // bloqueia chamadas públicas mesmo quando o endpoint padrão existe.
    disableSignUp: false,
    requireEmailVerification: false,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: false,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, token }) => {
      await sendBetterAuthEmail({
        to: user.email,
        name: user.name,
        token,
        kind: 'password-reset',
      });
    },
  },
  session: {
    expiresIn: 7 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
    cookieCache: { enabled: false },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (_user, context) => {
          const suppliedSecret = context?.headers?.get(BETTER_AUTH_PROVISIONING_HEADER);
          if (suppliedSecret !== provisioningSecret) {
            throw APIError.from('FORBIDDEN', {
              code: 'INVITE_REQUIRED',
              message: 'Cadastro disponível somente mediante convite.',
            });
          }
        },
      },
    },
    session: {
      create: {
        before: async (session) => {
          const user = await authPrisma.user.findUnique({
            where: { id: session.userId },
            select: { active: true },
          });

          if (!user || !user.active) {
            throw APIError.from('FORBIDDEN', {
              code: 'USER_INACTIVE',
              message: 'Usuário inativo. Entre em contato com o administrador.',
            });
          }
        },
      },
    },
  },
  advanced: {
    cookiePrefix: 'portal-cliente',
    useSecureCookies: process.env.NODE_ENV === 'production',
  },
});

export function betterAuthProvisioningHeaders(): Headers {
  return new Headers({
    [BETTER_AUTH_PROVISIONING_HEADER]: provisioningSecret,
  });
}

export async function disconnectBetterAuthDatabase(): Promise<void> {
  await authPrisma.$disconnect();
  await authPool.end();
}
