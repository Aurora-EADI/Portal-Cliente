require('reflect-metadata');
require('ts-node/register');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const { parseTransportadorasReplicar } = require('../src/rabbitmq/contracts/transportadoras-replicar.contract');
const { parseJanelaCommand } = require('../src/rabbitmq/contracts/janela-command.contract');

const baseEvt = {
  eventId: '7b907bc4-0364-4b4b-8bd4-5e17ee3aa0d9',
  version: 1,
  occurredAt: '2026-09-29T12:00:00.000Z',
  source: 'portal-aurora',
  correlationId: null,
};

// ── transportadoras.replicar ──────────────────────────────────────────
const transp = {
  ...baseEvt,
  eventType: 'transportadoras.replicar',
  payload: { items: [{ cod_transp: '123', nomefantasia: 'Trans X', razaosocial: null, cnpj_cpf: '11222333000181', emails: null, telefones_contato: null }] },
};

test('transportadoras: accepts a valid batch', () => {
  const p = parseTransportadorasReplicar(transp);
  assert.equal(p.payload.items.length, 1);
});

test('transportadoras: accepts empty batch', () => {
  assert.deepEqual(parseTransportadorasReplicar({ ...transp, payload: { items: [] } }).payload.items, []);
});

test('transportadoras: rejects extra key in item (strict)', () => {
  assert.throws(() => parseTransportadorasReplicar({ ...transp, payload: { items: [{ ...transp.payload.items[0], x: 1 }] } }));
});

// ── janela.command.requested ──────────────────────────────────────────
const baseCmd = {
  eventId: '550e8400-e29b-41d4-a716-446655440000',
  version: 1,
  occurredAt: '2026-09-29T12:00:00.000Z',
  source: 'portal-aurora',
  correlationId: 'a3bb189e-8bf9-3888-9912-ace4e6543002',
  eventType: 'janela.command.requested',
};

test('janela: accepts criar', () => {
  const p = parseJanelaCommand({ ...baseCmd, payload: { op: 'janela.criar', janela: { descricao: 'Manhã', horaInicio: '08:00', horaFim: '12:00' } } });
  assert.equal(p.payload.op, 'janela.criar');
  assert.equal(p.commandId, baseCmd.eventId);
});

test('janela: accepts atualizar with partial patch', () => {
  const p = parseJanelaCommand({ ...baseCmd, payload: { op: 'janela.atualizar', id: '550e8400-e29b-41d4-a716-446655440000', patch: { vagasSimultaneas: 5 } } });
  assert.equal(p.payload.patch.vagasSimultaneas, 5);
});

test('janela: accepts remover', () => {
  const p = parseJanelaCommand({ ...baseCmd, payload: { op: 'janela.remover', id: '550e8400-e29b-41d4-a716-446655440000' } });
  assert.equal(p.payload.op, 'janela.remover');
});

test('janela: rejects criar without descricao', () => {
  assert.throws(() => parseJanelaCommand({ ...baseCmd, payload: { op: 'janela.criar', janela: { horaInicio: '08:00', horaFim: '12:00' } } }), /JANELA_COMMAND_INVALID/);
});

test('janela: rejects unknown op', () => {
  assert.throws(() => parseJanelaCommand({ ...baseCmd, payload: { op: 'janela.duplicar', id: '550e8400-e29b-41d4-a716-446655440000' } }), /JANELA_COMMAND_INVALID/);
});

test('janela: rejects extra key in patch (strict)', () => {
  assert.throws(() => parseJanelaCommand({ ...baseCmd, payload: { op: 'janela.atualizar', id: '550e8400-e29b-41d4-a716-446655440000', patch: { foo: 1 } } }), /JANELA_COMMAND_INVALID/);
});
