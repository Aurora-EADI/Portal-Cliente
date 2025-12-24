import { PrismaClient, UserRole } from '@prisma/client-postgres';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Verificar se já existe um usuário admin
  const existingAdmin = await prisma.user.findFirst({
    where: {
      email: 'admin@aurora.com.br',
    },
  });

  if (existingAdmin) {
    console.log('⚠️  Usuario admin ja existe. Pulando seed...');
    console.log(`🆔 ID: ${existingAdmin.id}`);
    console.log(`👤 Nome: ${existingAdmin.name}`);
    console.log(`🎭 Role: ${existingAdmin.role}`);
    return;
  }

  console.log('🧹 Limpando dados existentes...');

  // Limpeza de dados
  await prisma.activityPermission.deleteMany();
  await prisma.userActivityAccess.deleteMany();
  await prisma.userModuleAccess.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.module.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.user.deleteMany();

  // ============================================
  // 1. CRIAR ADMIN AURORA
  // ============================================
  const adminPassword = await bcrypt.hash('aurora@2025', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Admin Aurora',
      email: 'admin@aurora.com.br',
      password: adminPassword,
      role: UserRole.ADMIN,
    },
  });

  console.log('✔️ Admin Aurora criado com sucesso.');

  // ============================================
  // 2. CRIAR PERMISSÕES TÉCNICAS
  // ============================================
  const pPermManageUsers = await prisma.permission.create({
    data: {
      key: 'PERM_MANAGE_USERS',
      description: 'Gerenciar usuários e acessos',
      category: 'PERMISSIONS',
    },
  });

  const pPermManageModules = await prisma.permission.create({
    data: {
      key: 'PERM_MANAGE_MODULES',
      description: 'Gerenciar módulos do sistema',
      category: 'PERMISSIONS',
    },
  });

  console.log('✔️ Permissões técnicas criadas.');

  // ============================================
  // 3. CRIAR MÓDULO DE PERMISSÕES
  // ============================================
  const modPermissoes = await prisma.module.create({
    data: {
      name: 'Permissões',
      description: 'Gestão de acessos e permissões',
      route: '/permissoes',
      icon: 'Shield',
      active: true,
    },
  });

  console.log('✔️ Módulo de Permissões criado.');

  // ============================================
  // 4. CRIAR ATIVIDADES OBRIGATÓRIAS
  // ============================================
  const actPermUsers = await prisma.activity.create({
    data: {
      name: 'Gerenciar Usuários',
      description: 'Gerenciar usuários e seus acessos aos módulos',
      moduleId: modPermissoes.id,
      isMandatory: true,
      permissions: {
        create: { permissionId: pPermManageUsers.id },
      },
    },
  });

  const actPermModules = await prisma.activity.create({
    data: {
      name: 'Gerenciar Módulos',
      description: 'Criar e gerenciar módulos do sistema',
      moduleId: modPermissoes.id,
      isMandatory: true,
      permissions: {
        create: { permissionId: pPermManageModules.id },
      },
    },
  });

  console.log('✔️ Atividades obrigatórias criadas.');

  // ============================================
  // 5. ATRIBUIR MÓDULO AO ADMIN
  // ============================================
  await prisma.userModuleAccess.create({
    data: {
      userId: admin.id,
      moduleId: modPermissoes.id,
      isEnabled: true,
    },
  });

  console.log('✔️ Módulo de Permissões atribuído ao Admin Aurora.');

  // ============================================
  // 6. LOG FINAL
  // ============================================
  console.log('\n✅ Seed concluído com sucesso!');
  console.log('🎉 Usuario admin criado com sucesso!');
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
USUÁRIO ADMINISTRADOR CRIADO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📧 Email: admin@aurora.com.br
🔑 Senha: aurora@2025
👤 Nome: Admin Aurora
🛡️  Role: ADMIN

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MÓDULO E PERMISSÕES ATRIBUÍDAS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 Módulo: Permissões
📝 Descrição: Gestão de acessos e permissões

Atividades Obrigatórias:
  ✓ Gerenciar Usuários (PERM_MANAGE_USERS)
  ✓ Gerenciar Módulos (PERM_MANAGE_MODULES)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });