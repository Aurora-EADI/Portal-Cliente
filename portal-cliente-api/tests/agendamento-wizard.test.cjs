require('dotenv/config');
require('reflect-metadata');
require('ts-node/register');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { AgendamentoService } = require('../src/agendamento/agendamento.service');

// O formulário do wizard é o caminho que o front usa quando não há DI escolhida
// da lista. Ele existia nas Route Handlers do Next (handleNewFormPost) e não
// tinha equivalente no Nest — o POST caía no caminho de diId e falhava. O que
// se testa aqui é o que aquele fluxo garantia sobre quem pode agendar o quê.

function prismaFake(overrides = {}) {
  return {
    agendamento: {
      findMany: async () => [],
      create: async ({ data }) => ({ id: 'ag-1', ...data }),
    },
    diAverbada: { findMany: async () => [] },
    transportadoraConta: { findUnique: async () => ({ nome: 'Transp XYZ' }) },
    cliente: {
      findFirst: async () => ({ id: 'cli-1', nome: 'ACME', cnpj: '12345678000100' }),
      findMany: async () => [{ id: 'cli-1' }],
      findUnique: async () => ({ cnpj: '12345678000100', email: 'a@b.c', telefone: '9999' }),
    },
    despachante: { findUnique: async () => ({ codDespachante: 'D001' }) },
    procuracao: { findUnique: async () => null },
    averbacaoProcesso: { findFirst: async () => null },
    motorista: { findMany: async () => [], create: async ({ data }) => ({ id: 'mot-1', ...data }) },
    veiculo: { findFirst: async () => null, create: async ({ data }) => ({ id: 'vei-1', ...data }) },
    ...overrides,
  };
}

function servicoCom(prisma, ativa = false) {
  process.env.AVERBACAO_ATIVA = ativa ? 'true' : 'false';
  return new AgendamentoService(prisma);
}

const TRANSPORTADORA = { role: 'TRANSPORTADORA', transportadoraContaId: 'tc-1' };
const CLIENTE = { role: 'CLIENTE', clienteId: 'cli-1' };
const DESPACHANTE = { role: 'DESPACHANTE', despachanteId: 'desp-1' };

const formBase = {
  operacao: 'Importação',
  subOperacao: 'Marítimo',
  dataAgendamento: '2026-09-20',
  inicio: '08:00',
  cpfMotorista: '111.222.333-44',
  nomeMotorista: 'João',
  placaVeiculo: 'ABC 1D23',
  tipoVeiculo: 'CAMINHAO',
  empresa: 'ACME',
};

test('wizard: payload sem diId não cai mais no caminho da DI', async () => {
  let criado;
  const service = servicoCom(
    prismaFake({
      agendamento: {
        findMany: async () => [],
        create: async ({ data }) => { criado = data; return { id: 'ag-1', ...data }; },
      },
    }),
  );

  const r = await service.createAgendamento(CLIENTE, { ...formBase });
  assert.equal(r.id, 'ag-1');
  assert.ok(criado.protocolo.startsWith('AG-'), 'protocolo do formulário é AG-');
  assert.equal(criado.data, '2026-09-20');
  assert.equal(criado.horario, '08:00');
});

test('wizard: listas do formulário viram texto na coluna', async () => {
  let criado;
  const service = servicoCom(
    prismaFake({
      agendamento: {
        findMany: async () => [],
        create: async ({ data }) => { criado = data; return { id: 'ag-1', ...data }; },
      },
    }),
  );

  await service.createAgendamento(CLIENTE, {
    ...formBase,
    di: ['24/000111-1', '24/000222-2'],
    awbMawb: ['AWB1', 'AWB2'],
    dta: [],
  });

  assert.equal(criado.diNumero, '24/000111-1, 24/000222-2');
  assert.equal(criado.awbMawb, 'AWB1, AWB2');
  assert.equal(criado.dta, null);
});

test('wizard: mesmo motorista pode ser agendado de novo no mesmo horário', async () => {
  const service = servicoCom(
    prismaFake({
      agendamento: {
        findMany: async () => [{ cpfMotorista: '11122233344' }],
        create: async ({ data }) => ({ id: 'ag-2', ...data }),
      },
    }),
  );

  const r = await service.createAgendamento(CLIENTE, { ...formBase });
  assert.equal(r.id, 'ag-2');
});

test('wizard: transportadora não agenda DI que não lhe foi atribuída', async () => {
  const service = servicoCom(
    prismaFake({
      diAverbada: { findMany: async () => [] },
      agendamento: {
        findMany: async () => [],
        create: async () => { throw new Error('Agendou DI não atribuída'); },
      },
    }),
  );

  await assert.rejects(
    () => service.createAgendamento(TRANSPORTADORA, { ...formBase, di: ['24/000999-9'] }),
    /não atribuída\(s\) a esta transportadora/,
  );
});

test('wizard: transportadora agenda a DI que lhe foi atribuída', async () => {
  let criado;
  const service = servicoCom(
    prismaFake({
      diAverbada: {
        findMany: async () => [
          { documentoSaida: '24/000111-1', nLote: 'L1', cnpjCliente: '12345678000100', atribuicoes: [{ container: '' }] },
        ],
      },
      agendamento: {
        findMany: async () => [],
        create: async ({ data }) => { criado = data; return { id: 'ag-1', ...data }; },
      },
    }),
  );

  const r = await service.createAgendamento(TRANSPORTADORA, { ...formBase, di: ['24/000111-1'] });
  assert.equal(r.id, 'ag-1');
  assert.equal(criado.transportadoraContaId, 'tc-1');
});

test('wizard: atribuição por container não libera outro container', async () => {
  const service = servicoCom(
    prismaFake({
      diAverbada: {
        findMany: async () => [
          { documentoSaida: '24/000111-1', nLote: 'L1', cnpjCliente: null, atribuicoes: [{ container: 'CAAU9572120' }] },
        ],
      },
      agendamento: {
        findMany: async () => [],
        create: async () => { throw new Error('Agendou container alheio'); },
      },
    }),
  );

  await assert.rejects(
    () => service.createAgendamento(TRANSPORTADORA, {
      ...formBase,
      di: ['24/000111-1'],
      container: 'ONEU2459171',
    }),
    /não foi atribuído a esta transportadora/,
  );
});

test('wizard: transportadora sem conta vinculada não agenda', async () => {
  const service = servicoCom(prismaFake());
  await assert.rejects(
    () => service.createAgendamento({ role: 'TRANSPORTADORA', transportadoraContaId: null }, { ...formBase }),
    /Conta de transportadora não vinculada/,
  );
});

test('wizard: a trava de procuração vale também neste caminho', async () => {
  const service = servicoCom(
    prismaFake({
      // A carteira precisa alcançar o cliente para a procuração ser a pergunta
      // seguinte. Sem esta DI, a recusa viria antes, por falta de vínculo — que
      // é o que o teste abaixo cobre.
      diAverbada: { findMany: async () => [{ cnpjCliente: '12345678000100' }] },
      procuracao: { findUnique: async () => null },
      agendamento: {
        findMany: async () => [],
        create: async () => { throw new Error('Agendou sem procuração'); },
      },
    }),
    true,
  );

  await assert.rejects(
    () => service.createAgendamento(DESPACHANTE, { ...formBase }),
    /procuração não enviada/,
  );
});

test('wizard: despachante sem o cliente na carteira não agenda por ele', async () => {
  const service = servicoCom(
    prismaFake({
      // Nenhuma DI averbada liga este despachante a cliente algum.
      diAverbada: { findMany: async () => [] },
      agendamento: {
        findMany: async () => [],
        create: async () => { throw new Error('Agendou para cliente alheio'); },
      },
    }),
    true,
  );

  await assert.rejects(
    () => service.createAgendamento(DESPACHANTE, { ...formBase }),
    /Sem permissão para agendar para este cliente/,
  );
});

test('wizard: o gate de averbação vale também neste caminho', async () => {
  const service = servicoCom(
    prismaFake({
      averbacaoProcesso: {
        findFirst: async () => ({ status: 'EM_ANALISE', protocolo: 'AVB-0042' }),
      },
      agendamento: {
        findMany: async () => [],
        create: async () => { throw new Error('Agendou com documentação pendente'); },
      },
    }),
    true,
  );

  await assert.rejects(
    () => service.createAgendamento(CLIENTE, { ...formBase, di: ['24/000111-1'] }),
    /AVB-0042/,
  );
});

test('caminho da DI segue recusando transportadora, como no fluxo legado', async () => {
  const service = servicoCom(prismaFake());
  await assert.rejects(
    () => service.createAgendamento(TRANSPORTADORA, { diId: 'di-1' }),
    /não disponível para transportadoras/i,
  );
});
