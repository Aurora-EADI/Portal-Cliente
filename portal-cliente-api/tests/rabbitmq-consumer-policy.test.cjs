require('reflect-metadata');
require('ts-node/register');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { DiAverbadaConsumer } = require('../src/rabbitmq/consumers/di-averbada.consumer');

const event = { eventId: '7b907bc4-0364-4b4b-8bd4-5e17ee3aa0d9', eventType: 'dis.averbada.created', version: 1, occurredAt: '2026-09-16T12:00:00.000Z', source: 'portal-aurora', correlationId: null, payload: { nLote: 'LOTE-1', diId: 'di-1', numeroDI: '26BR1', cpfMotorista: '123', placaVeiculo: 'ABC1D23', dtAverbacao: '2026-09-16T12:00:00.000Z', idContainers: [] } };
const message = (body, headers = {}) => ({ content: Buffer.from(JSON.stringify(body)), properties: { headers } });

test('invalid payload is confirmed to the DLQ before the original delivery is acknowledged', async () => {
  const calls = [];
  const rabbit = { topology: { maxRetries: 5, deadLetterExchange: 'dlx', retryExchange: 'retry' }, publish: async (...args) => calls.push(['publish', ...args]), ack: async () => calls.push(['ack']), registerConsumer() {} };
  const consumer = new DiAverbadaConsumer(rabbit, { process: async () => ({ duplicate: false }) });
  await consumer.handle(message({ ...event, payload: {} }));
  assert.equal(calls[0][1], 'dlx');
  assert.equal(calls[1][0], 'ack');
});

test('transient processing failure is published to retry queue and never nacks with requeue', async () => {
  const calls = [];
  const rabbit = { topology: { maxRetries: 5, deadLetterExchange: 'dlx', retryExchange: 'retry' }, publish: async (...args) => calls.push(['publish', ...args]), ack: async () => calls.push(['ack']), registerConsumer() {} };
  const consumer = new DiAverbadaConsumer(rabbit, { process: async () => { throw new Error('temporary'); } });
  await consumer.handle(message(event));
  assert.equal(calls[0][1], 'retry');
  assert.equal(calls[0][4].headers['x-retry-count'], 1);
  assert.equal(calls[1][0], 'ack');
});

test('fifth transient error is routed to the DLQ', async () => {
  const calls = [];
  const rabbit = { topology: { maxRetries: 5, deadLetterExchange: 'dlx', retryExchange: 'retry' }, publish: async (...args) => calls.push(['publish', ...args]), ack: async () => calls.push(['ack']), registerConsumer() {} };
  const consumer = new DiAverbadaConsumer(rabbit, { process: async () => { throw new Error('temporary'); } });
  await consumer.handle(message(event, { 'x-retry-count': 4 }));
  assert.equal(calls[0][1], 'dlx');
  assert.equal(calls[1][0], 'ack');
});
