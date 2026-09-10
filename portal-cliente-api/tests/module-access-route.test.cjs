require('reflect-metadata');
require('ts-node/register');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { PATH_METADATA, METHOD_METADATA, GUARDS_METADATA } = require('@nestjs/common/constants');
const { RequestMethod } = require('@nestjs/common');
const { UserModuleAccessController } = require('../src/user-module-access/user-module-access.controller');
const { JwtAuthGuard } = require('../src/common/guards/jwt-auth.guard');
const { RolesGuard } = require('../src/common/guards/roles.guard');

test('module access GET supports the frontend URL and the existing API URL', () => {
  const controllerPath = Reflect.getMetadata(PATH_METADATA, UserModuleAccessController);
  const handler = UserModuleAccessController.prototype.getUserModules;
  const paths = [Reflect.getMetadata(PATH_METADATA, handler)].flat();
  const urls = paths.map(path => `/api/${controllerPath}/${path.replace(':userId', 'test-user')}`);
  assert.ok(urls.includes('/api/user-module-access/user/test-user/modules'));
  assert.ok(urls.includes('/api/user-module-access/test-user'));
  assert.equal(Reflect.getMetadata(METHOD_METADATA, handler), RequestMethod.GET);
  const guards = Reflect.getMetadata(GUARDS_METADATA, UserModuleAccessController);
  assert.ok(guards.includes(JwtAuthGuard));
  assert.ok(guards.includes(RolesGuard));
});
