require('ts-node/register');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const {
  FirstAdminBootstrapService,
  FirstAdminAlreadyExistsError,
} = require('../src/auth/first-admin-bootstrap.service');
const { runFirstAdminBootstrap } = require('../src/scripts/bootstrap-first-admin');

function createPrisma({ count = 0, updateError } = {}) {
  const updates = [];
  return {
    updates,
    user: {
      count: async () => count,
      update: async (input) => {
        updates.push(input);
        if (updateError) throw updateError;
        return {
          email: 'admin@portalcliente.com.br',
          role: input.data.role,
          active: input.data.active,
        };
      },
    },
  };
}

function createAuth({ provisionError } = {}) {
  const provisioned = [];
  const removed = [];
  return {
    provisioned,
    removed,
    auth: {
      provisionCredential: async (input) => {
        provisioned.push(input);
        if (provisionError) throw provisionError;
        return { id: 'new-admin-id' };
      },
      removeCredential: async (id) => {
        removed.push(id);
      },
    },
  };
}

test('FirstAdminBootstrapService: creates ADMIN when the users table is empty', async () => {
  const prisma = createPrisma();
  const authState = createAuth();
  const service = new FirstAdminBootstrapService(prisma, authState.auth);

  const result = await service.bootstrap({
    name: '  Administrador Principal  ',
    email: '  ADMIN@PortalCliente.com.br ',
    password: 'senha-de-teste-segura',
  });

  assert.deepEqual(authState.provisioned, [{
    name: 'ADMINISTRADOR PRINCIPAL',
    email: 'admin@portalcliente.com.br',
    password: 'senha-de-teste-segura',
  }]);
  assert.deepEqual(prisma.updates, [{
    where: { id: 'new-admin-id' },
    data: { role: 'ADMIN', active: true },
    select: { email: true, role: true, active: true },
  }]);
  assert.deepEqual(result, {
    email: 'admin@portalcliente.com.br',
    role: 'ADMIN',
    active: true,
  });
});

test('FirstAdminBootstrapService: refuses without provisioning when any user exists', async () => {
  const prisma = createPrisma({ count: 1 });
  const authState = createAuth();
  const service = new FirstAdminBootstrapService(prisma, authState.auth);

  await assert.rejects(
    service.bootstrap({ name: 'Admin', email: 'admin@example.com', password: 'senha-de-teste-segura' }),
    FirstAdminAlreadyExistsError,
  );

  assert.deepEqual(authState.provisioned, []);
  assert.deepEqual(prisma.updates, []);
});

test('runFirstAdminBootstrap: exits non-zero without provisioning when any user exists', async () => {
  const prisma = createPrisma({ count: 1 });
  const authState = createAuth();
  const service = new FirstAdminBootstrapService(prisma, authState.auth);
  const output = [];

  const exitCode = await runFirstAdminBootstrap({
    service,
    env: {
      BOOTSTRAP_ADMIN_NAME: 'Admin',
      BOOTSTRAP_ADMIN_EMAIL: 'admin@example.com',
      BOOTSTRAP_ADMIN_PASSWORD: 'senha-de-teste-segura',
    },
    writeStdout: (line) => output.push(['stdout', line]),
    writeStderr: (line) => output.push(['stderr', line]),
  });

  assert.equal(exitCode, 1);
  assert.deepEqual(authState.provisioned, []);
  assert.deepEqual(output, [['stderr', 'Falha ao criar o primeiro administrador.\n']]);
});

test('FirstAdminBootstrapService: removes the identity when promotion fails', async () => {
  const prisma = createPrisma({ updateError: new Error('falha no banco') });
  const authState = createAuth();
  const service = new FirstAdminBootstrapService(prisma, authState.auth);

  await assert.rejects(
    service.bootstrap({ name: 'Admin', email: 'admin@example.com', password: 'senha-de-teste-segura' }),
    /falha no banco/,
  );

  assert.deepEqual(authState.removed, ['new-admin-id']);
});

test('runFirstAdminBootstrap: writes no password or runtime secrets to output on failure', async () => {
  const password = 'senha-super-secreta';
  const runtimeSecret = 'provisioning-super-secreto';
  const output = [];
  const service = {
    bootstrap: async () => {
      throw new Error(`DATABASE_URL=postgres://user:${password}@host BETTER_AUTH_PROVISIONING_SECRET=${runtimeSecret}`);
    },
  };

  const exitCode = await runFirstAdminBootstrap({
    service,
    env: {
      BOOTSTRAP_ADMIN_NAME: 'Admin',
      BOOTSTRAP_ADMIN_EMAIL: 'admin@example.com',
      BOOTSTRAP_ADMIN_PASSWORD: password,
    },
    writeStdout: (line) => output.push(['stdout', line]),
    writeStderr: (line) => output.push(['stderr', line]),
  });

  assert.equal(exitCode, 1);
  assert.deepEqual(output, [['stderr', 'Falha ao criar o primeiro administrador.\n']]);
  assert.doesNotMatch(JSON.stringify(output), new RegExp(`${password}|${runtimeSecret}|DATABASE_URL|BETTER_AUTH_PROVISIONING_SECRET`));
});

test('runFirstAdminBootstrap: prints only the approved success confirmation', async () => {
  const output = [];
  const service = {
    bootstrap: async () => ({
      email: 'admin@portalcliente.com.br',
      role: 'ADMIN',
      active: true,
    }),
  };

  const exitCode = await runFirstAdminBootstrap({
    service,
    env: {
      BOOTSTRAP_ADMIN_NAME: 'Admin',
      BOOTSTRAP_ADMIN_EMAIL: 'admin@portalcliente.com.br',
      BOOTSTRAP_ADMIN_PASSWORD: 'senha-de-teste-segura',
    },
    writeStdout: (line) => output.push(['stdout', line]),
    writeStderr: (line) => output.push(['stderr', line]),
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(output, [[
    'stdout',
    'Primeiro administrador criado com sucesso.\nE-mail: admin@portalcliente.com.br\nRole: ADMIN\n',
  ]]);
});
