require('reflect-metadata');
require('ts-node/register');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { DisService, containersAtribuidos } = require('../src/dis/dis.service');

// A transportadora enxerga a DI pela atribuição, mas a atribuição pode ser de
// um container só. A lista não pode mostrar os outros containers da DI.

test('containersAtribuidos: atribuição de um container mostra só ele', () => {
  assert.equal(
    containersAtribuidos('TCKU 767967-7 / TRLU 757868-3', ['TCKU 767967-7']),
    'TCKU 767967-7',
  );
});

test('containersAtribuidos: atribuição sem container vale pela DI inteira', () => {
  assert.equal(
    containersAtribuidos('TCKU 767967-7 / TRLU 757868-3', ['']),
    'TCKU 767967-7 / TRLU 757868-3',
  );
});

test('containersAtribuidos: container que não está mais na DI não aparece', () => {
  assert.equal(containersAtribuidos('TCKU 767967-7', ['XXXU 000000-0']), null);
});

const TRANSPORTADORA = { role: 'TRANSPORTADORA', transportadoraContaId: 'tc-1' };

function diRow(overrides = {}) {
  return {
    id: 'di-1',
    nLote: 'L1',
    numeroDI: '26/0874627-5',
    documentoSaida: null,
    cliente: 'AXSUN',
    containers: 'TCKU 767967-7 / TRLU 757868-3',
    status: 'AVERBADA',
    nConhecimento: null,
    dta: null,
    modalidade: null,
    cnpjCliente: '12345678000100',
    codDespachante: 'D001',
    despachante: 'FK',
    localizacao: null,
    averbadoEm: null,
    ...overrides,
  };
}

test('findAll: transportadora recebe só o container atribuído', async () => {
  const service = new DisService({
    diAverbada: {
      findMany: async () => [diRow({ atribuicoes: [{ container: 'TCKU 767967-7' }] })],
    },
  });

  const dis = await service.findAll(TRANSPORTADORA);
  assert.equal(dis.length, 1);
  assert.equal(dis[0].container, 'TCKU 767967-7');
});

test('findAll: DI sem nenhum container visível sai da lista', async () => {
  const service = new DisService({
    diAverbada: {
      findMany: async () => [diRow({ atribuicoes: [{ container: 'XXXU 000000-0' }] })],
    },
  });

  assert.deepEqual(await service.findAll(TRANSPORTADORA), []);
});
