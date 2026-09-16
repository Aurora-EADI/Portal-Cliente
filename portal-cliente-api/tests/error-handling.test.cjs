require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { HttpStatus, BadRequestException, UnauthorizedException, ForbiddenException, NotFoundException, ConflictException } = require('@nestjs/common');
const { GlobalExceptionFilter } = require('../src/common/filters/global-exception.filter');
const { Prisma } = require('@prisma/client');

function createMockHost() {
  let responseData = null;
  let responseStatus = null;

  const res = {
    status(s) {
      responseStatus = s;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
  };

  const req = {
    method: 'POST',
    url: '/api/test/resource',
    query: { token: 'secret-token-123' },
    body: {
      password: 'super-secret-password',
      cpf: '12345678901',
      name: 'Teste',
    },
    headers: {
      authorization: 'Bearer secret-jwt-token',
      cookie: 'portal-cliente.session_token=secret-cookie-val',
      'x-api-key': 'secret-api-key',
    },
  };

  const host = {
    switchToHttp() {
      return {
        getResponse: () => res,
        getRequest: () => req,
      };
    },
  };

  return {
    host,
    getResponse: () => ({ status: responseStatus, data: responseData }),
  };
}

test('GlobalExceptionFilter: maps Prisma P2002 to 409 Conflict with pt-BR message and code RESOURCE_CONFLICT', () => {
  const filter = new GlobalExceptionFilter();
  const { host, getResponse } = createMockHost();

  const prismaError = new Prisma.PrismaClientKnownRequestError(
    'Unique constraint failed on the fields: (`email`)',
    {
      code: 'P2002',
      clientVersion: '7.10.0',
      meta: { target: ['email'] },
    }
  );

  filter.catch(prismaError, host);
  const { status, data } = getResponse();

  assert.equal(status, HttpStatus.CONFLICT);
  assert.equal(data.statusCode, 409);
  assert.equal(data.code, 'RESOURCE_CONFLICT');
  assert.equal(data.message, 'Já existe um registro com esses dados.');
  assert.equal(typeof data.timestamp, 'string');
});

test('GlobalExceptionFilter: maps Prisma P2025 to 404 Not Found with pt-BR message and code RESOURCE_NOT_FOUND', () => {
  const filter = new GlobalExceptionFilter();
  const { host, getResponse } = createMockHost();

  const prismaError = new Prisma.PrismaClientKnownRequestError(
    'An operation failed because it depends on one or more records that were required but not found.',
    {
      code: 'P2025',
      clientVersion: '7.10.0',
    }
  );

  filter.catch(prismaError, host);
  const { status, data } = getResponse();

  assert.equal(status, HttpStatus.NOT_FOUND);
  assert.equal(data.statusCode, 404);
  assert.equal(data.code, 'RESOURCE_NOT_FOUND');
  assert.equal(data.message, 'Registro não encontrado.');
});

test('GlobalExceptionFilter: maps Prisma P2003 to 409 Conflict with pt-BR message and code FOREIGN_KEY_CONFLICT', () => {
  const filter = new GlobalExceptionFilter();
  const { host, getResponse } = createMockHost();

  const prismaError = new Prisma.PrismaClientKnownRequestError(
    'Foreign key constraint failed on the field: (`clienteId`)',
    {
      code: 'P2003',
      clientVersion: '7.10.0',
      meta: { field_name: 'clienteId' },
    }
  );

  filter.catch(prismaError, host);
  const { status, data } = getResponse();

  assert.equal(status, HttpStatus.CONFLICT);
  assert.equal(data.statusCode, 409);
  assert.equal(data.code, 'FOREIGN_KEY_CONFLICT');
  assert.equal(data.message, 'Operação não permitida: registro vinculado a outros dados.');
});

test('GlobalExceptionFilter: maps Prisma P2021 or unexpected database error to 500 INTERNAL_ERROR without leaking schema or table name', () => {
  const filter = new GlobalExceptionFilter();
  const { host, getResponse } = createMockHost();

  const prismaError = new Prisma.PrismaClientKnownRequestError(
    'The table public.users does not exist in the current database.',
    {
      code: 'P2021',
      clientVersion: '7.10.0',
      meta: { table: 'public.users' },
    }
  );

  filter.catch(prismaError, host);
  const { status, data } = getResponse();

  assert.equal(status, HttpStatus.INTERNAL_SERVER_ERROR);
  assert.equal(data.statusCode, 500);
  assert.equal(data.code, 'INTERNAL_ERROR');
  assert.equal(data.message, 'Ocorreu um erro interno. Tente novamente mais tarde.');

  // Confirma que nenhum detalhe técnico vazou para o cliente
  const jsonString = JSON.stringify(data);
  assert.ok(!jsonString.includes('public.users'));
  assert.ok(!jsonString.includes('P2021'));
  assert.ok(!jsonString.includes('PrismaClientKnownRequestError'));
});

test('GlobalExceptionFilter: maps ValidationPipe error (400) with code VALIDATION_ERROR and friendly message', () => {
  const filter = new GlobalExceptionFilter();
  const { host, getResponse } = createMockHost();

  const validationError = new BadRequestException({
    message: ['email must be an email', 'password is too short'],
    error: 'Bad Request',
    statusCode: 400,
  });

  filter.catch(validationError, host);
  const { status, data } = getResponse();

  assert.equal(status, HttpStatus.BAD_REQUEST);
  assert.equal(data.statusCode, 400);
  assert.equal(data.code, 'VALIDATION_ERROR');
  assert.equal(data.message, 'Verifique os dados informados.');
});

test('GlobalExceptionFilter: preserves intentional HttpExceptions (401, 403, 404, 409)', () => {
  const filter = new GlobalExceptionFilter();

  // 401
  const { host: h401, getResponse: r401 } = createMockHost();
  filter.catch(new UnauthorizedException('Sua sessão expirou. Entre novamente.'), h401);
  assert.equal(r401().status, 401);
  assert.equal(r401().data.code, 'UNAUTHORIZED');
  assert.equal(r401().data.message, 'Sua sessão expirou. Entre novamente.');

  // 403 custom code USER_INACTIVE
  const { host: h403, getResponse: r403 } = createMockHost();
  filter.catch(new ForbiddenException({
    code: 'USER_INACTIVE',
    message: 'Usuário inativo. Entre em contato com o administrador.',
  }), h403);
  assert.equal(r403().status, 403);
  assert.equal(r403().data.code, 'USER_INACTIVE');
  assert.equal(r403().data.message, 'Usuário inativo. Entre em contato com o administrador.');

  // 404
  const { host: h404, getResponse: r404 } = createMockHost();
  filter.catch(new NotFoundException('Registro não encontrado.'), h404);
  assert.equal(r404().status, 404);
  assert.equal(r404().data.code, 'RESOURCE_NOT_FOUND');
  assert.equal(r404().data.message, 'Registro não encontrado.');

  // 409
  const { host: h409, getResponse: r409 } = createMockHost();
  filter.catch(new ConflictException('Não foi possível concluir a operação devido a um conflito de dados.'), h409);
  assert.equal(r409().status, 409);
  assert.equal(r409().data.code, 'RESOURCE_CONFLICT');
  assert.equal(r409().data.message, 'Não foi possível concluir a operação devido a um conflito de dados.');
});

test('GlobalExceptionFilter: safe logging does not log request body, tokens, cookies or sensitive headers', () => {
  const logged = [];
  const originalError = console.error;
  console.error = (...args) => logged.push(args.join(' '));

  try {
    const filter = new GlobalExceptionFilter();
    const { host } = createMockHost();

    filter.catch(new Error('Falha inesperada no banco'), host);

    const logOutput = logged.join('\n');
    assert.ok(!logOutput.includes('super-secret-password'), 'Log cannot contain body password');
    assert.ok(!logOutput.includes('secret-jwt-token'), 'Log cannot contain auth token');
    assert.ok(!logOutput.includes('secret-cookie-val'), 'Log cannot contain cookie value');
    assert.ok(!logOutput.includes('secret-api-key'), 'Log cannot contain api key');
    assert.ok(!logOutput.includes('secret-token-123'), 'Log cannot contain query tokens');
  } finally {
    console.error = originalError;
  }
});
