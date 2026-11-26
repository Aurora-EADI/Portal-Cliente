require('dotenv/config');
require('reflect-metadata');
require('ts-node/register');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { PATH_METADATA } = require('@nestjs/common/constants');
const { AgendamentoService, TRANSPORTADORA_FORA_DO_SIAUM } = require('../src/agendamento/agendamento.service');
const { AgendamentoController } = require('../src/agendamento/agendamento.controller');

// "Meus transportadores": cliente e despachante não veem mais a lista SIAUM
// inteira. Buscam por CNPJ; achou na réplica, vinculam à própria empresa; não
// achou, a orientação é falar com o suporte da Aurora — nada é cadastrado aqui.

const CLIENTE = { id: 'u-1', role: 'CLIENTE', clienteId: 'c-1', despachanteId: null };
const DESPACHANTE = { id: 'u-2', role: 'DESPACHANTE', clienteId: null, despachanteId: 'd-1' };
const CNPJ = '12345678000199';
const CONTA = { id: 'tc-1', cnpj: CNPJ, nome: 'Transp XYZ', email: 't@x.com', telefone: null, whatsapp: null, codTransp: '77', ativo: true };

function prismaFake({ contas = [CONTA], vinculos = [] } = {}) {
  const criados = [];
  const prisma = {
    transportadoraConta: {
      findFirst: async ({ where }) => contas.find(c => c.cnpj === where.cnpj && (where.ativo === undefined || c.ativo === where.ativo)) ?? null,
      findUnique: async ({ where }) => contas.find(c => c.cnpj === where.cnpj) ?? null,
      create: async () => { throw new Error('não deve criar transportadora'); },
    },
    transportadoraVinculo: {
      findFirst: async ({ where }) => vinculos.find(v =>
        v.transportadoraContaId === where.transportadoraContaId &&
        (where.clienteId ? v.clienteId === where.clienteId : v.despachanteId === where.despachanteId)) ?? null,
      create: async ({ data }) => { const v = { id: `v-${criados.length + 1}`, ...data }; criados.push(v); vinculos.push(v); return v; },
      deleteMany: async ({ where }) => {
        const antes = vinculos.length;
        for (let i = vinculos.length - 1; i >= 0; i--) {
          const v = vinculos[i];
          const dono = where.clienteId ? v.clienteId === where.clienteId : v.despachanteId === where.despachanteId;
          if (dono && v.transportadoraContaId === where.transportadoraContaId) vinculos.splice(i, 1);
        }
        return { count: antes - vinculos.length };
      },
    },
  };
  return { prisma, criados, vinculos };
}

test('rotas de busca e vínculo são só de cliente e despachante', () => {
  for (const [method, route] of [
    ['buscarTransportadoraPorCnpj', 'transportadoras-conta/buscar'],
    ['vincularTransportadora', 'transportadoras-conta/vinculos'],
    ['desvincularTransportadora', 'transportadoras-conta/vinculos/:transportadoraContaId'],
  ]) {
    const handler = AgendamentoController.prototype[method];
    assert.ok(handler, `Missing ${route} handler`);
    assert.equal(Reflect.getMetadata(PATH_METADATA, handler), route);
    assert.deepEqual(Reflect.getMetadata('roles', handler), ['CLIENTE', 'DESPACHANTE']);
  }
});

test('busca: CNPJ na lista SIAUM devolve os dados e se já está vinculado', async () => {
  const { prisma } = prismaFake({ vinculos: [{ clienteId: 'c-1', transportadoraContaId: 'tc-1' }] });
  const service = new AgendamentoService(prisma);
  const r = await service.buscarTransportadoraPorCnpj(CLIENTE, '12.345.678/0001-99');
  assert.equal(r.encontrado, true);
  assert.equal(r.vinculado, true);
  assert.equal(r.transportadora.nome, 'Transp XYZ');
  const d = await service.buscarTransportadoraPorCnpj(DESPACHANTE, CNPJ);
  assert.equal(d.vinculado, false, 'vínculo do cliente não vale para o despachante');
});

test('busca: CNPJ fora do SIAUM orienta procurar o suporte da Aurora', async () => {
  const { prisma } = prismaFake({ contas: [] });
  const r = await new AgendamentoService(prisma).buscarTransportadoraPorCnpj(CLIENTE, CNPJ);
  assert.deepEqual(r, { encontrado: false, mensagem: TRANSPORTADORA_FORA_DO_SIAUM });
  assert.match(TRANSPORTADORA_FORA_DO_SIAUM, /suporte da Aurora/);
});

test('busca: CNPJ inválido é 400', async () => {
  const { prisma } = prismaFake();
  await assert.rejects(() => new AgendamentoService(prisma).buscarTransportadoraPorCnpj(CLIENTE, '123'), { status: 400 });
});

test('vincular: cria vínculo pela empresa do usuário e é idempotente', async () => {
  const { prisma, criados } = prismaFake();
  const service = new AgendamentoService(prisma);
  await service.vincularTransportadora(CLIENTE, CNPJ);
  await service.vincularTransportadora(CLIENTE, CNPJ);
  await service.vincularTransportadora(DESPACHANTE, CNPJ);
  assert.equal(criados.length, 2);
  assert.deepEqual(criados[0], { id: 'v-1', clienteId: 'c-1', transportadoraContaId: 'tc-1', criadoPorUserId: 'u-1' });
  assert.deepEqual(criados[1], { id: 'v-2', despachanteId: 'd-1', transportadoraContaId: 'tc-1', criadoPorUserId: 'u-2' });
});

test('vincular: CNPJ fora do SIAUM é 404 com a mensagem do suporte, sem cadastrar', async () => {
  const { prisma, criados } = prismaFake({ contas: [] });
  await assert.rejects(
    () => new AgendamentoService(prisma).vincularTransportadora(CLIENTE, CNPJ),
    (e) => e.status === 404 && e.message === TRANSPORTADORA_FORA_DO_SIAUM,
  );
  assert.equal(criados.length, 0);
});

test('vincular: usuário sem empresa é 403', async () => {
  const { prisma } = prismaFake();
  await assert.rejects(
    () => new AgendamentoService(prisma).vincularTransportadora({ id: 'u', role: 'CLIENTE', clienteId: null }, CNPJ),
    { status: 403 },
  );
});

test('desvincular: remove só o vínculo da própria empresa', async () => {
  const { prisma, vinculos } = prismaFake({
    vinculos: [
      { clienteId: 'c-1', transportadoraContaId: 'tc-1' },
      { despachanteId: 'd-1', transportadoraContaId: 'tc-1' },
    ],
  });
  const service = new AgendamentoService(prisma);
  await service.desvincularTransportadora(CLIENTE, 'tc-1');
  assert.deepEqual(vinculos, [{ despachanteId: 'd-1', transportadoraContaId: 'tc-1' }]);
  await assert.rejects(() => service.desvincularTransportadora(CLIENTE, 'tc-1'), { status: 404 });
});

function atribuicaoFake(opts) {
  const base = prismaFake(opts);
  let atribuicaoCriada;
  Object.assign(base.prisma, {
    cliente: { findUnique: async () => ({ cnpj: '11111111000111' }) },
    diAverbada: { findFirst: async () => ({ nLote: 'L1', containers: 'C1', documentoSaida: null, cliente: 'ACME' }) },
    diTransportadoraAtribuicao: {
      findFirst: async () => null,
      create: async ({ data }) => { atribuicaoCriada = data; return { id: 'a-1', ...data }; },
    },
    user: { findFirst: async () => ({ id: 'tu-1' }) }, // transportadora já tem acesso
  });
  return { ...base, get atribuicao() { return atribuicaoCriada; } };
}

test('atribuição: CNPJ fora do SIAUM é 404 e não cria transportadora', async () => {
  const fake = atribuicaoFake({ contas: [] });
  const service = new AgendamentoService(fake.prisma, { enviar: async () => {} });
  await assert.rejects(
    () => service.criarAtribuicao(CLIENTE, { nLote: 'L1', cnpj: CNPJ, nome: 'Nova' }),
    (e) => e.status === 404 && e.message === TRANSPORTADORA_FORA_DO_SIAUM,
  );
  assert.equal(fake.atribuicao, undefined);
});

test('atribuição: transportadora do SIAUM ainda não vinculada entra em meus transportadores', async () => {
  const fake = atribuicaoFake();
  const service = new AgendamentoService(fake.prisma, { enviar: async () => {} });
  const r = await service.criarAtribuicao(CLIENTE, { nLote: 'L1', cnpj: CNPJ });
  assert.equal(r.convite.status, 'has_access');
  assert.equal(fake.atribuicao.transportadoraContaId, 'tc-1');
  assert.deepEqual(fake.criados.map(v => v.clienteId), ['c-1']);
});
