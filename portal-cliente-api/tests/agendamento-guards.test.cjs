require('dotenv/config');
require('reflect-metadata');
require('ts-node/register');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { AgendamentoService } = require('../src/agendamento/agendamento.service');

// As travas moravam nas Route Handlers do Next e vieram para o Nest junto com a
// consolidacao do Prisma no backend. O que se testa aqui e exatamente o que
// aquelas funcoes garantiam: quem faz POST direto na API nao escapa da regra.

const DI_LIBERADA = {
  id: 'di-1',
  numeroDI: '2400001',
  clienteId: 'cli-1',
  status: 'liberada',
};

function prismaFake(overrides = {}) {
  return {
    dI: { findUnique: async () => DI_LIBERADA },
    procuracao: { findUnique: async () => null },
    averbacaoProcesso: { findFirst: async () => null },
    agendamento: { create: async ({ data }) => ({ id: 'ag-1', ...data }) },
    slotReserva: { deleteMany: async () => ({ count: 0 }) },
    ...overrides,
  };
}

/** A flag e lida na construcao do servico, entao ela precisa vir antes. */
function servicoCom(prisma, ativa = true) {
  process.env.AVERBACAO_ATIVA = ativa ? 'true' : 'false';
  return new AgendamentoService(prisma);
}

const DESPACHANTE = { role: 'DESPACHANTE', despachanteId: 'desp-1' };
const CLIENTE = { role: 'CLIENTE', despachanteId: null };

const dadosAgendamento = {
  diId: 'di-1',
  motoristaId: 'mot-1',
  veiculoId: 'vei-1',
  data: '2026-09-20',
  horario: '08:00',
};

test('despachante sem procuracao nao agenda em nome do importador', async () => {
  const service = servicoCom(
    prismaFake({
      agendamento: {
        create: async () => {
          throw new Error('Agendou sem procuracao');
        },
      },
    }),
  );

  await assert.rejects(
    () => service.createAgendamento(DESPACHANTE, dadosAgendamento),
    /procuração não enviada/,
  );
});

test('procuracao vigente libera o agendamento', async () => {
  const service = servicoCom(
    prismaFake({
      procuracao: {
        findUnique: async () => ({ status: 'APROVADA', validade: null }),
      },
    }),
  );

  const agendamento = await service.createAgendamento(DESPACHANTE, dadosAgendamento);
  assert.equal(agendamento.id, 'ag-1');
});

test('procuracao vencida recebe mensagem propria, nao "envie uma procuracao"', async () => {
  const service = servicoCom(
    prismaFake({
      procuracao: {
        findUnique: async () => ({
          status: 'APROVADA',
          validade: new Date('2020-01-01'),
        }),
      },
    }),
  );

  await assert.rejects(
    () => service.createAgendamento(DESPACHANTE, dadosAgendamento),
    /venceu/,
  );
});

test('processo de averbacao nao liberado bloqueia qualquer perfil', async () => {
  const service = servicoCom(
    prismaFake({
      averbacaoProcesso: {
        findFirst: async () => ({ status: 'EM_ANALISE', protocolo: 'AVB-0007' }),
      },
      agendamento: {
        create: async () => {
          throw new Error('Agendou com documentacao pendente');
        },
      },
    }),
  );

  await assert.rejects(
    () => service.createAgendamento(CLIENTE, dadosAgendamento),
    /AVB-0007/,
  );
});

test('processo liberado para agendamento segue', async () => {
  const service = servicoCom(
    prismaFake({
      averbacaoProcesso: {
        findFirst: async () => ({
          status: 'LIBERADO_AGENDAMENTO',
          protocolo: 'AVB-0008',
        }),
      },
    }),
  );

  const agendamento = await service.createAgendamento(CLIENTE, dadosAgendamento);
  assert.equal(agendamento.id, 'ag-1');
});

test('DI sem processo documental continua pelo fluxo legado', async () => {
  const service = servicoCom(prismaFake());
  const agendamento = await service.createAgendamento(CLIENTE, dadosAgendamento);
  assert.equal(agendamento.id, 'ag-1');
});

test('com o modulo desligado nenhuma das duas travas consulta o banco', async () => {
  const service = servicoCom(
    prismaFake({
      procuracao: {
        findUnique: async () => {
          throw new Error('Consultou procuracao com o modulo desligado');
        },
      },
      averbacaoProcesso: {
        findFirst: async () => {
          throw new Error('Consultou averbacao com o modulo desligado');
        },
      },
    }),
    false,
  );

  const agendamento = await service.createAgendamento(DESPACHANTE, dadosAgendamento);
  assert.equal(agendamento.id, 'ag-1');
});

test('DI nao liberada continua barrada antes de qualquer trava', async () => {
  const service = servicoCom(
    prismaFake({
      dI: { findUnique: async () => ({ ...DI_LIBERADA, status: 'bloqueada' }) },
    }),
  );

  await assert.rejects(
    () => service.createAgendamento(CLIENTE, dadosAgendamento),
    /não está liberada/,
  );
});
