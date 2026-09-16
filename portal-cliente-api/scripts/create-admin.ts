import 'dotenv/config';
import { PrismaClient, UserRole } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { auth, betterAuthProvisioningHeaders } from '../src/auth/better-auth';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DEFAULT_DEV_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || 'mudar123';

async function ensureAdmin(name: string, email: string) {
  const existing = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  let userId: string;

  if (existing) {
    console.log(`Usuário ${email} já existe no banco (id: ${existing.id}). Atualizando role para ADMIN...`);
    userId = existing.id;
  } else {
    console.log(`Criando identidade Better Auth para ${email}...`);
    const result = await auth.api.signUpEmail({
      body: {
        name,
        email: email.toLowerCase(),
        password: DEFAULT_DEV_PASSWORD,
      },
      headers: betterAuthProvisioningHeaders(),
    });

    if (!result?.user) {
      throw new Error(`Falha ao criar usuário Better Auth para ${email}`);
    }
    userId = result.user.id;
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      name,
      role: UserRole.ADMIN,
      position: 'Administrador do Sistema',
      active: true,
      emailVerified: true,
    },
  });

  // Habilitar todos os módulos do sistema para o admin
  const modules = await prisma.module.findMany();
  for (const mod of modules) {
    await prisma.userModuleAccess.upsert({
      where: {
        userId_moduleId: { userId: user.id, moduleId: mod.id },
      },
      update: { isEnabled: true },
      create: {
        userId: user.id,
        moduleId: mod.id,
        isEnabled: true,
      },
    });
  }

  console.log(`\nSucesso! Perfil ADMIN configurado:`);
  console.log(`- ID: ${user.id}`);
  console.log(`- Nome: ${user.name}`);
  console.log(`- E-mail: ${user.email}`);
  console.log(`- Role: ${user.role}`);
  console.log(`- Ativo: ${user.active}`);
  console.log(`- Senha padrão (dev): ${DEFAULT_DEV_PASSWORD}`);
  console.log(`- Módulos vinculados: ${modules.length}`);
}

async function main() {
  const email = 'mateus.arce@supertranstransportes.com.br';
  const name = 'Mateus Arce';
  await ensureAdmin(name, email);
}

main()
  .catch((err) => {
    console.error('Erro ao criar admin:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

