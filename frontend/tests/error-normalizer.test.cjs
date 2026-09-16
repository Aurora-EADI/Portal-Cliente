const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  getUserFriendlyError,
  normalizeAuthError,
  APP_ERROR_MESSAGES,
  APP_ERROR_CODES,
} = require('../src/lib/error-message-common.cjs');

test('normalizeAuthError: maps INVALID_EMAIL_OR_PASSWORD or 401 to pt-BR message', () => {
  const err = normalizeAuthError({
    status: 401,
    statusText: 'Unauthorized',
    message: 'Invalid email or password',
    code: 'INVALID_EMAIL_OR_PASSWORD',
  });

  assert.equal(err.status, 401);
  assert.equal(err.code, 'INVALID_CREDENTIALS');
  assert.equal(err.message, 'E-mail ou senha incorretos.');
});

test('normalizeAuthError: maps USER_INACTIVE or 403 to pt-BR message', () => {
  const err = normalizeAuthError({
    status: 403,
    statusText: 'Forbidden',
    message: 'User inactive',
    code: 'USER_INACTIVE',
  });

  assert.equal(err.status, 403);
  assert.equal(err.code, 'USER_INACTIVE');
  assert.equal(err.message, 'Usuário inativo. Entre em contato com o administrador.');
});

test('normalizeAuthError: maps HTTP 500 or server error to friendly pt-BR without leaking technical details', () => {
  const err = normalizeAuthError({
    status: 500,
    statusText: 'Internal Server Error',
    message: 'PrismaClientKnownRequestError: The table public.users does not exist',
  });

  assert.equal(err.status, 500);
  assert.equal(err.code, 'INTERNAL_ERROR');
  assert.equal(err.message, 'Serviço temporariamente indisponível. Tente novamente mais tarde.');
  assert.ok(!err.message.includes('Prisma'));
  assert.ok(!err.message.includes('Internal Server Error'));
  assert.ok(!err.message.includes('public.users'));
});

test('getUserFriendlyError: maps application codes with highest priority', () => {
  assert.equal(
    getUserFriendlyError({ response: { data: { code: APP_ERROR_CODES.INVALID_CREDENTIALS } } }),
    APP_ERROR_MESSAGES.INVALID_CREDENTIALS
  );
  assert.equal(
    getUserFriendlyError({ response: { data: { code: APP_ERROR_CODES.USER_INACTIVE } } }),
    APP_ERROR_MESSAGES.USER_INACTIVE
  );
  assert.equal(
    getUserFriendlyError({ response: { data: { code: APP_ERROR_CODES.RESOURCE_NOT_FOUND } } }),
    APP_ERROR_MESSAGES.RESOURCE_NOT_FOUND
  );
  assert.equal(
    getUserFriendlyError({ response: { data: { code: APP_ERROR_CODES.RESOURCE_CONFLICT } } }),
    APP_ERROR_MESSAGES.RESOURCE_CONFLICT
  );
  assert.equal(
    getUserFriendlyError({ response: { data: { code: APP_ERROR_CODES.VALIDATION_ERROR } } }),
    APP_ERROR_MESSAGES.VALIDATION_ERROR
  );
});

test('getUserFriendlyError: maps standard HTTP status codes', () => {
  assert.equal(
    getUserFriendlyError({ response: { status: 400 } }),
    'Verifique os dados informados.'
  );
  assert.equal(
    getUserFriendlyError({ response: { status: 401 } }),
    'Sua sessão expirou. Entre novamente.'
  );
  assert.equal(
    getUserFriendlyError({ response: { status: 403 } }),
    'Você não tem permissão para realizar esta ação.'
  );
  assert.equal(
    getUserFriendlyError({ response: { status: 404 } }),
    'Registro não encontrado.'
  );
  assert.equal(
    getUserFriendlyError({ response: { status: 409 } }),
    'Não foi possível concluir a operação devido a um conflito de dados.'
  );
  assert.equal(
    getUserFriendlyError({ response: { status: 429 } }),
    'Muitas tentativas. Aguarde um momento e tente novamente.'
  );
  assert.equal(
    getUserFriendlyError({ response: { status: 500 } }),
    'Ocorreu um erro interno. Tente novamente mais tarde.'
  );
});

test('getUserFriendlyError: handles network errors and unavailable backend', () => {
  assert.equal(
    getUserFriendlyError(new Error('Network Error')),
    'Serviço temporariamente indisponível. Tente novamente mais tarde.'
  );
  assert.equal(
    getUserFriendlyError({ code: 'ECONNREFUSED' }),
    'Serviço temporariamente indisponível. Tente novamente mais tarde.'
  );
  assert.equal(
    getUserFriendlyError({ message: 'Failed to fetch' }),
    'Serviço temporariamente indisponível. Tente novamente mais tarde.'
  );
});

test('getUserFriendlyError: NEVER leaks technical or English strings to the UI', () => {
  const forbiddenSubstrings = [
    'Internal Server Error',
    'Invalid email or password',
    'Unauthorized',
    'Forbidden',
    'Not Found',
    'Bad Request',
    'Prisma',
    'P2021',
    'P2002',
    'P2025',
    'SQL',
    'column',
    'relation',
  ];

  const uglyErrors = [
    new Error('PrismaClientKnownRequestError: P2021: The table public.users does not exist in the current database.'),
    new Error('Internal Server Error'),
    new Error('Unauthorized: Session token missing'),
    new Error('Forbidden: Access denied to route'),
    { response: { status: 500, data: { message: 'Invalid `prisma.user.findFirst()` invocation' } } },
    { response: { status: 401, data: { message: 'Invalid email or password' } } },
  ];

  for (const err of uglyErrors) {
    const message = getUserFriendlyError(err);
    for (const forbidden of forbiddenSubstrings) {
      assert.ok(
        !message.toLowerCase().includes(forbidden.toLowerCase()),
        `Leaked forbidden substring "${forbidden}" in message: "${message}"`
      );
    }
  }
});
