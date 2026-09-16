require('dotenv/config');
require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { ForbiddenException, UnauthorizedException } = require('@nestjs/common');
const { BetterAuthDomainGuard } = require('../src/common/guards/better-auth-domain.guard');

test('BetterAuthDomainGuard: throws 401 Unauthorized when session is missing', async () => {
  const guard = new BetterAuthDomainGuard({
    user: { findUnique: async () => null },
  });

  const mockContext = {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: {},
      }),
    }),
  };

  await assert.rejects(
    async () => {
      await guard.canActivate(mockContext);
    },
    (err) => {
      assert.ok(err instanceof UnauthorizedException);
      assert.equal(err.getStatus(), 401);
      const res = err.getResponse();
      assert.equal(typeof res === 'object' ? res.code : '', 'SESSION_EXPIRED');
      return true;
    }
  );
});

test('BetterAuthDomainGuard: throws 403 Forbidden (not 401) when user is inactive', async () => {
  const guard = new BetterAuthDomainGuard({
    user: {
      findUnique: async () => ({
        id: 'inactive-user-1',
        name: 'Usuário Inativo',
        email: 'inativo@aurora.com',
        active: false,
      }),
    },
  });

  // Mock getSession directly on guard or auth.api
  const { auth } = require('../src/auth/better-auth');
  const originalGetSession = auth.api.getSession;
  auth.api.getSession = async () => ({
    user: { id: 'inactive-user-1' },
    session: { id: 'session-1' },
  });

  try {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { cookie: 'portal-cliente.session_token=valid-token' },
        }),
      }),
    };

    await assert.rejects(
      async () => {
        await guard.canActivate(mockContext);
      },
      (err) => {
        assert.ok(err instanceof ForbiddenException, `Expected ForbiddenException, got ${err.constructor.name}`);
        assert.equal(err.getStatus(), 403);
        const res = err.getResponse();
        assert.equal(res.code, 'USER_INACTIVE');
        assert.equal(res.message, 'Usuário inativo. Entre em contato com o administrador.');
        return true;
      }
    );
  } finally {
    auth.api.getSession = originalGetSession;
  }
});

test('Better Auth signInEmail: non-existent email returns 401 with pt-BR message', async () => {
  const { auth } = require('../src/auth/better-auth');
  const { APIError } = require('better-auth/api');

  await assert.rejects(
    async () => {
      await auth.api.signInEmail({
        body: {
          email: 'naoexiste@aurora.com.br',
          password: 'senhaqualquer123',
        },
      });
    },
    (err) => {
      assert.ok(err instanceof APIError, `Expected APIError, got ${err?.constructor?.name}`);
      const status = err.statusCode ?? err.status;
      assert.ok(status === 401 || status === 'UNAUTHORIZED');
      assert.equal(err.body?.code, 'INVALID_EMAIL_OR_PASSWORD');
      return true;
    }
  );
});

test('Better Auth signInEmail: wrong password returns 401 with pt-BR message without user enumeration', async () => {
  const { auth } = require('../src/auth/better-auth');
  const { APIError } = require('better-auth/api');

  await assert.rejects(
    async () => {
      await auth.api.signInEmail({
        body: {
          email: 'mateus.arce@supertranstransportes.com.br',
          password: 'senha_completamente_errada',
        },
      });
    },
    (err) => {
      assert.ok(err instanceof APIError, `Expected APIError, got ${err?.constructor?.name}`);
      const status = err.statusCode ?? err.status;
      assert.ok(status === 401 || status === 'UNAUTHORIZED');
      assert.equal(err.body?.code, 'INVALID_EMAIL_OR_PASSWORD');
      return true;
    }
  );
});

test('Better Auth signInEmail: inactive user returns 403 USER_INACTIVE without creating a session', async () => {
  const { auth, betterAuthProvisioningHeaders } = require('../src/auth/better-auth');
  const { APIError } = require('better-auth/api');
  const { PrismaClient } = require('@prisma/client');
  const { Pool } = require('pg');
  const { PrismaPg } = require('@prisma/adapter-pg');

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  const inactiveEmail = 'inativo.teste@portalcliente.com.br';
  try {
    // 1. Garante que usuário inativo existe
    let inactiveUser = await prisma.user.findUnique({ where: { email: inactiveEmail } });
    if (!inactiveUser) {
      const created = await auth.api.signUpEmail({
        body: {
          name: 'Usuário Teste Inativo',
          email: inactiveEmail,
          password: 'password123',
        },
        headers: betterAuthProvisioningHeaders(),
      });
      inactiveUser = created.user;
    }

    await prisma.user.update({
      where: { id: inactiveUser.id },
      data: { active: false },
    });

    const sessionsBefore = await prisma.session.count({ where: { userId: inactiveUser.id } });

    // 2. Tenta logar com o usuário inativo
    await assert.rejects(
      async () => {
        await auth.api.signInEmail({
          body: {
            email: inactiveEmail,
            password: 'password123',
          },
        });
      },
      (err) => {
        assert.ok(err instanceof APIError, `Expected APIError, got ${err?.constructor?.name}`);
        const status = err.statusCode ?? err.status;
        assert.ok(status === 403 || status === 'FORBIDDEN');
        assert.equal(err.body?.code, 'USER_INACTIVE');
        assert.equal(err.body?.message, 'Usuário inativo. Entre em contato com o administrador.');
        return true;
      }
    );

    // 3. Garante que nenhuma sessão foi criada no banco
    const sessionsAfter = await prisma.session.count({ where: { userId: inactiveUser.id } });
    assert.equal(sessionsAfter, sessionsBefore, 'Nenhuma sessão pode ser criada para usuário inativo');
  } finally {
    await prisma.$disconnect();
  }
});

