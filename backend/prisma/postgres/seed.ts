import { PrismaClient, UserRole, CompanyStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('ðŸŒ± Iniciando seed do banco de dados...');

  // ============================================
  // 0. GARANTIR EMPRESA AURORA EADI
  // ============================================
  console.log('ðŸ¢ Verificando/Criando empresa Aurora EADI...');

  const company = await prisma.company.upsert({
    where: {
      cnpj: '04694548000210'
    },
    update: {}, // MantÃ©m dados existentes se jÃ¡ houver
    create: {
      cnpj: '04694548000210',
      fantasyName: 'Aurora EADI',
      socialReason: 'Aurora da AmazÃ´nia Terminais e ServiÃ§os LTDA',
      zipCode: '69075840',
      address: 'Rua Ministro JoÃ£o GonÃ§alves de AraÃºjo',
      number: '472',
      complement: 'Parte E',
      neighborhood: 'Distrito Industrial',
      city: 'Manaus',
      state: 'AM',
      phone: '3614-8800',
      status: CompanyStatus.ACTIVE,
    },
  });

  console.log(`âœ”ï¸ Empresa ${company.fantasyName} garantida (ID: ${company.id})`);

  // Verificar se jÃ¡ existe um usuÃ¡rio admin
  const existingAdmin = await prisma.user.findFirst({
    where: {
      email: 'admin@aurora.com.br',
    },
  });

  if (existingAdmin) {
    console.log('âš ï¸  Usuario admin ja existe. Atualizando vÃ­nculo com a empresa...');

    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: {
        companyId: company.id
      }
    });

    console.log('âœ”ï¸ VÃ­nculo atualizado com sucesso.');
    console.log(`ðŸ†” ID: ${existingAdmin.id}`);
    console.log(`ðŸ‘¤ Nome: ${existingAdmin.name}`);
    console.log(`ðŸŽ­ Role: ${existingAdmin.role}`);
    console.log(`ðŸ¢ Empresa ID: ${company.id}`);
    return;
  }

  console.log('ðŸ§¹ Limpando dados existentes...');

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
      companyId: company.id, // Vincula Ã  empresa criada
    },
  });

  console.log('âœ”ï¸ Admin Aurora criado com sucesso.');

  // ============================================
  // 2. CRIAR PERMISSÃ•ES TÃ‰CNICAS
  // ============================================
  const pPermManageUsers = await prisma.permission.create({
    data: {
      key: 'PERM_MANAGE_USERS',
      description: 'Gerenciar usuÃ¡rios e acessos',
      category: 'PERMISSIONS',
    },
  });

  const pPermManageModules = await prisma.permission.create({
    data: {
      key: 'PERM_MANAGE_MODULES',
      description: 'Gerenciar mÃ³dulos do sistema',
      category: 'PERMISSIONS',
    },
  });

  console.log('âœ”ï¸ PermissÃµes tÃ©cnicas criadas.');

  // ============================================
  // 3. CRIAR MÃ“DULO DE PERMISSÃ•ES
  // ============================================
  const modPermissoes = await prisma.module.create({
    data: {
      name: 'PermissÃµes',
      description: 'GestÃ£o de acessos e permissÃµes',
      route: '/permissoes',
      icon: 'Shield',
      active: true,
    },
  });

  console.log('âœ”ï¸ MÃ³dulo de PermissÃµes criado.');

  // ============================================
  // 4. CRIAR ATIVIDADES OBRIGATÃ“RIAS
  // ============================================
  const actPermUsers = await prisma.activity.create({
    data: {
      name: 'Gerenciar UsuÃ¡rios',
      description: 'Gerenciar usuÃ¡rios e seus acessos aos mÃ³dulos',
      moduleId: modPermissoes.id,
      isMandatory: true,
      permissions: {
        create: { permissionId: pPermManageUsers.id },
      },
    },
  });

  const actPermModules = await prisma.activity.create({
    data: {
      name: 'Gerenciar MÃ³dulos',
      description: 'Criar e gerenciar mÃ³dulos do sistema',
      moduleId: modPermissoes.id,
      isMandatory: true,
      permissions: {
        create: { permissionId: pPermManageModules.id },
      },
    },
  });

  console.log('âœ”ï¸ Atividades obrigatÃ³rias criadas.');

  // ============================================
  // 5. ATRIBUIR MÃ“DULO AO ADMIN
  // ============================================
  await prisma.userModuleAccess.create({
    data: {
      userId: admin.id,
      moduleId: modPermissoes.id,
      isEnabled: true,
    },
  });

  console.log('âœ”ï¸ MÃ³dulo de PermissÃµes atribuÃ­do ao Admin Aurora.');

  // ============================================
  // 6. LOG FINAL
  // ============================================
  console.log('\nâœ… Seed concluÃ­do com sucesso!');
  console.log('ðŸŽ‰ Usuario admin criado com sucesso!');
  console.log(`
â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
USUÃRIO ADMINISTRADOR CRIADO:
â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”

ðŸ“§ Email: admin@aurora.com.br
ðŸ”‘ Senha: aurora@2025
ðŸ‘¤ Nome: Admin Aurora
ðŸ›¡ï¸  Role: ADMIN
ðŸ¢ Empresa: Aurora EADI

â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
MÃ“DULO E PERMISSÃ•ES ATRIBUÃDAS:
â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”

ðŸ“¦ MÃ³dulo: PermissÃµes
ðŸ“ DescriÃ§Ã£o: GestÃ£o de acessos e permissÃµes

Atividades ObrigatÃ³rias:
  âœ“ Gerenciar UsuÃ¡rios (PERM_MANAGE_USERS)
  âœ“ Gerenciar MÃ³dulos (PERM_MANAGE_MODULES)

â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”â”
`);
}

main()
  .catch((e) => {
    console.error('âŒ Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
