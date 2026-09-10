require('reflect-metadata');
require('ts-node/register');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Test } = require('@nestjs/testing');
const { ConfigModule } = require('@nestjs/config');
const { JwtService } = require('@nestjs/jwt');

// Import before configuration loads, matching application startup order.
delete process.env.JWT_SECRET;
const { AuthModule } = require('../src/auth/auth.module');
const jwtModule = Reflect.getMetadata('imports', AuthModule)[0];

test('JWT signs and verifies using configuration loaded after module import', async () => {
  const module = await Test.createTestingModule({
    imports: [ConfigModule.forRoot({
      isGlobal: true, ignoreEnvFile: true,
      load: [() => ({ JWT_SECRET: 'test-only-secret-not-for-deployment', JWT_EXPIRES_IN: '2h' })],
    }), jwtModule],
  }).compile();
  try {
    const jwt = module.get(JwtService);
    const token = await jwt.signAsync({ sub: 'test-user' });
    const payload = await jwt.verifyAsync(token);
    assert.equal(payload.sub, 'test-user');
    assert.equal(payload.exp - payload.iat, 7200);
  } finally {
    await module.close();
  }
});

test('missing JWT secret prevents startup with a clear configuration error', async () => {
  let module;
  try {
    await assert.rejects(async () => {
      module = await Test.createTestingModule({
        imports: [ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }), jwtModule],
      }).compile();
    }, /JWT_SECRET/);
  } finally {
    if (module) await module.close();
  }
});
