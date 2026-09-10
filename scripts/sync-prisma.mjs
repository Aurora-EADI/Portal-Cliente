#!/usr/bin/env node
// Mantem um unico schema Prisma entre os dois apps.
//
// A fonte de verdade e portal-cliente-api/prisma/schema.prisma. O frontend
// ainda fala com o banco direto pelas Route Handlers legadas, entao precisa de
// uma copia local para gerar o client. Os builds Docker usam contextos
// separados (./frontend e ./portal-cliente-api), por isso e copia verificada e
// nao symlink.
//
//   node scripts/sync-prisma.mjs           copia da fonte para o frontend
//   node scripts/sync-prisma.mjs --check   falha se estiverem divergentes (CI)

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = resolve(root, 'portal-cliente-api/prisma/schema.prisma');
const TARGET = resolve(root, 'frontend/prisma/schema.prisma');

const check = process.argv.includes('--check');

// Prisma 7 keeps datasource URLs in prisma.config.ts; frontend uses Prisma 6.
const source = readFileSync(SOURCE, 'utf8').replace(
  /(datasource db \{\s*provider\s*=\s*"postgresql")/,
  '$1\n  url = env("DATABASE_URL")\n  directUrl = env("DIRECT_URL")',
);
let target = null;
try {
  target = readFileSync(TARGET, 'utf8');
} catch (err) {
  if (err.code !== 'ENOENT') throw err;
}

if (source === target) {
  console.log('schema Prisma em sincronia');
  process.exit(0);
}

if (check) {
  console.error(
    'Schemas Prisma divergentes.\n' +
      `  fonte:  ${SOURCE}\n` +
      `  copia:  ${TARGET}\n` +
      'Edite apenas a fonte e rode: node scripts/sync-prisma.mjs',
  );
  process.exit(1);
}

writeFileSync(TARGET, source);
console.log(`schema copiado para ${TARGET}`);
