const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const vm = require('node:vm');

const UserRole = {
  ADMIN: 'ADMIN',
  SUPPLIER: 'SUPPLIER',
  EMPLOYEE: 'EMPLOYEE',
  CLIENTE: 'CLIENTE',
  DESPACHANTE: 'DESPACHANTE',
  TRANSPORTADORA: 'TRANSPORTADORA',
};

function renderHome(role) {
  const routes = [];
  const source = fs.readFileSync(path.join(__dirname, '../src/app/page.tsx'), 'utf8');
  const module = { exports: {} };

  vm.runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, {
    module,
    exports: module.exports,
    require(id) {
      if (id === 'react') return { useEffect: (effect) => effect() };
      if (id === 'react/jsx-runtime') return { jsx: () => null, jsxs: () => null };
      if (id === 'next/navigation') return { useRouter: () => ({ push: (route) => routes.push(route) }) };
      if (id === '@/context/AuthContext') return { useAuthContext: () => ({ currentUser: { role }, isLoading: false }) };
      if (id === '@/components/pages/Login') return { Login: () => null };
      if (id === '@/types') return { UserRole };
      throw new Error(`Unexpected dependency: ${id}`);
    },
  });

  module.exports.default();
  return routes;
}

function renderRouteGuard(role, route) {
  const source = fs.readFileSync(path.join(__dirname, '../src/components/guards/RouteGuard.tsx'), 'utf8');
  const module = { exports: {} };
  const Fragment = Symbol('Fragment');

  vm.runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, {
    module,
    exports: module.exports,
    require(id) {
      if (id === 'react') return { __esModule: true, default: {} };
      if (id === 'react/jsx-runtime') {
        return {
          Fragment,
          jsx: (type, props) => type === Fragment ? props.children : { type, props },
          jsxs: (type, props) => type === Fragment ? props.children : { type, props },
        };
      }
      if (id === 'next/navigation') return { useRouter: () => ({ push() {} }) };
      if (id === '@/hooks/useModuleAccess') return { useModuleAccess: () => ({ isLoading: false, hasAccess: false, error: null }) };
      if (id === '@/context/AuthContext') return { useAuthContext: () => ({ currentUser: { role } }) };
      if (id === '@/types') return { UserRole };
      if (id === 'lucide-react') return new Proxy({}, { get: () => () => null });
      if (id === '../ui/Logo') return { Logo: () => null };
      throw new Error(`Unexpected dependency: ${id}`);
    },
  });

  return module.exports.RouteGuard({ route, children: 'allowed' });
}

test('ADMIN post-login opens the administrative dashboard', () => {
  assert.deepEqual(renderHome(UserRole.ADMIN), ['/agendamento']);
});

test('external roles keep the agendamento flow after login', () => {
  for (const role of [UserRole.CLIENTE, UserRole.DESPACHANTE, UserRole.TRANSPORTADORA]) {
    assert.deepEqual(renderHome(role), ['/agendamento']);
  }
});

test('module-based roles keep the module selection flow after login', () => {
  for (const role of [UserRole.SUPPLIER, UserRole.EMPLOYEE]) {
    assert.deepEqual(renderHome(role), ['/modules']);
  }
});

test('ADMIN accesses agendamento without a module grant', () => {
  assert.equal(renderRouteGuard(UserRole.ADMIN, '/agendamento'), 'allowed');
});

test('external roles keep their existing access without a module grant', () => {
  for (const role of [UserRole.CLIENTE, UserRole.DESPACHANTE, UserRole.TRANSPORTADORA]) {
    assert.equal(renderRouteGuard(role, '/averbacao'), 'allowed');
  }
});
