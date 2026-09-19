require('reflect-metadata');
require('ts-node/register');
const { test } = require('node:test');
const assert = require('node:assert/strict');

const { resolveOutboxRoute } = require('../src/rabbitmq/publishers/outbox-routing');

const exchanges = {
  eventsExchange: 'portal.integration.events',
  commandsExchange: 'portal.integration.commands',
};

test('routes command to commands exchange and results to events exchange', () => {
  assert.deepEqual(resolveOutboxRoute('agendamento.cancel.requested', exchanges), {
    exchange: exchanges.commandsExchange,
    routingKey: 'agendamento.cancel.requested',
  });
  for (const eventType of ['agendamento.status-changed', 'agendamento.command-rejected', 'agendamento.command-completed', 'dis.averbada.created']) {
    assert.deepEqual(resolveOutboxRoute(eventType, exchanges), {
      exchange: exchanges.eventsExchange,
      routingKey: eventType,
    });
  }
});

test('fails closed for unknown event types', () => {
  assert.throws(() => resolveOutboxRoute('unknown.event', exchanges), /OUTBOX_ROUTE_UNMAPPED/);
});
