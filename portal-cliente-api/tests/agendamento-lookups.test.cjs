require('reflect-metadata');
require('ts-node/register');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { AgendamentoService } = require('../src/agendamento/agendamento.service');
const { AgendamentoController } = require('../src/agendamento/agendamento.controller');
const { PATH_METADATA } = require('@nestjs/common/constants');

test('both lookup routes are registered with external role restrictions', () => {
  for (const [method, route, roles] of [
    ['findAtribuicoes', 'atribuicoes', ['CLIENTE', 'DESPACHANTE']],
    ['findTransportadorasConta', 'transportadoras-conta', ['CLIENTE', 'DESPACHANTE', 'TRANSPORTADORA']],
  ]) {
    const handler = AgendamentoController.prototype[method];
    assert.ok(handler, `Missing ${route} handler`);
    assert.equal(Reflect.getMetadata(PATH_METADATA, handler), route);
    assert.deepEqual(Reflect.getMetadata('roles', handler), roles);
  }
});

test('client assignments are constrained by authenticated client CNPJ and optional lot', async () => {
  let query;
  const service = new AgendamentoService({
    cliente: { findUnique: async () => ({ cnpj: '12345678000100' }) },
    diTransportadoraAtribuicao: { findMany: async args => { query = args; return []; } },
  });
  await service.findAtribuicoes({ role: 'CLIENTE', clienteId: 'client-1' }, 'lot-1');
  assert.deepEqual(query.where, { nLote: 'lot-1', diAverbada: { cnpjCliente: '12345678000100' } });
  assert.deepEqual(query.include.transportadora.select, { id: true, nome: true, cnpj: true });
});

test('broker assignments are constrained by authenticated broker code', async () => {
  let query;
  const service = new AgendamentoService({
    despachante: { findUnique: async () => ({ codDespachante: 'broker-code' }) },
    diTransportadoraAtribuicao: { findMany: async args => { query = args; return []; } },
  });
  await service.findAtribuicoes({ role: 'DESPACHANTE', despachanteId: 'broker-1' });
  assert.deepEqual(query.where, { diAverbada: { codDespachante: 'broker-code' } });
});

test('missing ownership returns no assignments without querying all tenants', async () => {
  const service = new AgendamentoService({
    cliente: { findUnique: async () => null },
    diTransportadoraAtribuicao: { findMany: async () => { throw new Error('Unscoped query'); } },
  });
  assert.deepEqual(await service.findAtribuicoes({ role: 'CLIENTE', clienteId: 'missing' }), []);
  assert.deepEqual(await service.findAtribuicoes({ role: 'DESPACHANTE' }), []);
});

test('carrier accounts exclude inactive and empty CNPJ records', async () => {
  let query;
  const service = new AgendamentoService({
    transportadoraConta: { findMany: async args => { query = args; return []; } },
  });
  await service.findTransportadorasConta();
  assert.deepEqual(query, { where: { ativo: true, cnpj: { not: '' } }, orderBy: { nome: 'asc' } });
});
