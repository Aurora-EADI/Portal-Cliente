require('reflect-metadata');
require('ts-node/register');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { rabbitMqConfig, RABBITMQ_DEFAULTS } = require('../src/rabbitmq/rabbitmq.config');
const { AgendamentoCancelConsumer } = require('../src/rabbitmq/consumers/agendamento-cancel.consumer');

function withEnv(name, value, callback) {
  const previous = process.env[name];
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
  try { return callback(); } finally {
    if (previous === undefined) delete process.env[name];
    else process.env[name] = previous;
  }
}

test('consumer flag is local and defaults disabled', () => {
  withEnv('AGENDAMENTO_COMMAND_RABBITMQ_CONSUMER_ENABLED', undefined, () => {
    assert.equal(rabbitMqConfig().agendamentoCommandConsumerEnabled, false);
  });
});

test('consumer flag enables only the Client command consumer', () => {
  const registrations = [];
  const rabbit = {
    topology: { ...RABBITMQ_DEFAULTS, agendamentoCommandConsumerEnabled: true },
    registerConsumer: (queue, handler) => registrations.push({ queue, handler }),
  };
  new AgendamentoCancelConsumer(rabbit, { process: async () => ({ duplicate: false }) }).register();
  assert.deepEqual(registrations.map(({ queue }) => queue), ['portal-cliente.agendamento.cancel.requested']);
});
