require('reflect-metadata');
require('ts-node/register');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MotoristasService } = require('../src/motoristas/motoristas.service');
const { VeiculosService } = require('../src/veiculos/veiculos.service');

// O despachante não é dono de carga: o cadastro dele precisa de dono próprio,
// senão fica órfão e aparece para todos os despachantes.

const DESPACHANTE = { role: 'DESPACHANTE', despachanteId: 'desp-1', clienteId: null, transportadoraContaId: null };

function prismaGravando(model) {
  const chamadas = {};
  return {
    chamadas,
    prisma: {
      [model]: {
        findMany: async (args) => { chamadas.findMany = args; return []; },
        findFirst: async (args) => { chamadas.findFirst = args; return null; },
        create: async (args) => { chamadas.create = args; return { id: 'novo', ...args.data }; },
      },
    },
  };
}

test('motoristas: despachante lista só os próprios', async () => {
  const { prisma, chamadas } = prismaGravando('motorista');
  await new MotoristasService(prisma).findAll(DESPACHANTE);
  assert.equal(chamadas.findMany.where.despachanteId, 'desp-1');
});

test('motoristas: despachante vira dono do que cadastra', async () => {
  const { prisma, chamadas } = prismaGravando('motorista');
  await new MotoristasService(prisma).create(DESPACHANTE, {
    nome: 'Fulano de Tal', cpf: '111.111.111-11', cnh: '12345678901', telefone: '(92) 99999-9999',
  });
  assert.equal(chamadas.create.data.despachanteId, 'desp-1');
  assert.equal(chamadas.create.data.clienteId, null);
});

test('motoristas: despachante sem vínculo não vê cadastro alheio', async () => {
  const { prisma, chamadas } = prismaGravando('motorista');
  await new MotoristasService(prisma).findAll({ ...DESPACHANTE, despachanteId: null });
  assert.equal(chamadas.findMany.where.despachanteId, '__sem_vinculo__');
});

test('veiculos: despachante lista e cadastra só os próprios', async () => {
  const { prisma, chamadas } = prismaGravando('veiculo');
  const service = new VeiculosService(prisma);
  await service.findAll(DESPACHANTE);
  await service.create(DESPACHANTE, { placa: 'abc 1d23', modelo: 'Scania', tipo: 'Truck 3/4' });
  assert.equal(chamadas.findMany.where.despachanteId, 'desp-1');
  assert.equal(chamadas.create.data.despachanteId, 'desp-1');
  assert.equal(chamadas.create.data.placa, 'ABC1D23');
});
