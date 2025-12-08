import { PrismaClient, UserRole, CompanyStatus } from '@prisma/client-postgres';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const CLEAR_PASSWORD = '123456';

async function main() {
  console.log('Iniciando seed do banco de dados...');

  // Limpeza de dados (CUIDADO: remove tudo das tabelas abaixo!)
  await prisma.activityPermission.deleteMany();
  await prisma.userActivityAccess.deleteMany();
  await prisma.userModuleAccess.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.module.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.document.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  const passwordHash = await bcrypt.hash(CLEAR_PASSWORD, 10);

  // ============================================
  // 1. DADOS BASE (Empresas e Usuários)
  // ============================================
  
  // 1.1 ADMIN
  const admin = await prisma.user.create({
    data: {
      name: 'Admin Master',
      email: 'admin@docflow.com',
      password: passwordHash,
      role: UserRole.ADMIN,
    },
  });

  // 1.2 EMPRESA ATIVA + SUPPLIER
  const demoCompany = await prisma.company.create({
    data: {
      cnpj: '12345678000199',
      fantasyName: 'Tech Solutions Ltda',
      socialReason: 'Tech Solutions Comércio e Serviços Ltda',
      zipCode: '69000000',
      address: 'Av. Torquato Tapajós',
      number: '123',
      neighborhood: 'Flores',
      city: 'Manaus',
      state: 'AM',
      phone: '92999999999',
      status: CompanyStatus.ACTIVE,
    },
  });

  await prisma.user.create({
    data: {
      name: 'João Silva',
      email: 'joao@tech.com',
      password: passwordHash,
      role: UserRole.SUPPLIER,
      companyId: demoCompany.id,
    },
  });

  // 1.3 EMPRESA PENDENTE + SUPPLIER
  const pendingCompany = await prisma.company.create({
    data: {
      cnpj: '98765432000110',
      fantasyName: 'Inovação Brasil',
      socialReason: 'Inovação Brasil Tecnologia Ltda',
      zipCode: '69050000',
      address: 'Rua das Américas',
      number: '789',
      neighborhood: 'Adrianópolis',
      city: 'Manaus',
      state: 'AM',
      phone: '92988888888',
      status: CompanyStatus.PENDING,
    },
  });

  await prisma.user.create({
    data: {
      name: 'Maria Santos',
      email: 'maria@inovacao.com',
      password: passwordHash,
      role: UserRole.SUPPLIER,
      companyId: pendingCompany.id,
    },
  });
  
  // ============================================
  // 2. USUÁRIOS PARA O TESTE DE PERMISSÃO
  // ============================================

  // User_BLOQUEADO: employee@docflow.com
  const userBloqueado = await prisma.user.create({
    data: {
      name: 'Employee Bloqueado',
      email: 'employee@docflow.com', // Usaremos este email para o teste de acesso negado
      password: passwordHash,
      role: UserRole.EMPLOYEE,
      // Não tem companyId, mas poderia ter. O importante é não ter o UserModuleAccess.
    },
  });
  
  // User_LIBERADO: Novo funcionário da Tech Solutions
  const userLiberado = await prisma.user.create({
    data: {
      name: 'Employee Liberado',
      email: 'test_liberado@tech.com', // Usaremos este email para o teste de acesso permitido
      password: passwordHash,
      role: UserRole.EMPLOYEE,
      companyId: demoCompany.id,
    },
  });
  
  console.log('\n✔️ Dados iniciais criados.');

  // ============================================
  // 3. ESTRUTURA RBAC
  // ============================================

  // Permissão Técnica
  const pViewFleet = await prisma.permission.upsert({
    where: { key: 'LOG_VIEW_FLEET' },
    update: {},
    create: { key: 'LOG_VIEW_FLEET', description: 'Ver frota', category: 'LOGISTICS' },
  });

  // ============================================
  // MÓDULOS COM ROTAS E ÍCONES
  // ============================================
  const modLogistica = await prisma.module.upsert({
    where: { name: 'Logística' },
    update: {
      route: '/logistics',
      icon: 'Truck',
      description: 'Gestão de frota, rotas e entregas',
    },
    create: {
      name: 'Logística',
      description: 'Gestão de frota, rotas e entregas',
      route: '/logistics',
      icon: 'Truck',
      active: true,
    },
  });

  const modFaturamento = await prisma.module.upsert({
    where: { name: 'Faturamento' },
    update: {
      route: '/faturamento',
      icon: 'ShoppingCart',
      description: 'Gestão de faturas e pagamentos',
    },
    create: {
      name: 'Faturamento',
      description: 'Gestão de faturas e pagamentos',
      route: '/faturamento',
      icon: 'ShoppingCart',
      active: true,
    },
  });

  const modDocumentos = await prisma.module.upsert({
    where: { name: 'Gestão de Documentos' },
    update: {
      route: '/documentos',
      icon: 'FileText',
      description: 'Controle de documentos',
    },
    create: {
      name: 'Gestão de Documentos',
      description: 'Controle de documentos',
      route: '/documentos',
      icon: 'FileText',
      active: true,
    },
  });

  const modPermissoes = await prisma.module.upsert({
    where: { name: 'Permissões' },
    update: {
      route: '/permissoes',
      icon: 'Shield',
      description: 'Gestão de acessos e permissões',
    },
    create: {
      name: 'Permissões',
      description: 'Gestão de acessos e permissões',
      route: '/permissoes',
      icon: 'Shield',
      active: true,
    },
  });

  // Atividade e Vínculo (Mantendo o Módulo)
  await prisma.activity.upsert({
    where: { moduleId_name: { moduleId: modLogistica.id, name: 'Visualizar Frota' } },
    update: {},
    create: {
      name: 'Visualizar Frota',
      moduleId: modLogistica.id,
      isMandatory: true,
      permissions: {
        create: { permissionId: pViewFleet.id }
      }
    }
  });
  
  console.log('✔️ Estrutura RBAC (Módulo/Permissão) criada.');

  // ============================================
  // 4. CONCESSÃO DE ACESSO PARA O TESTE
  // ============================================

  // Lista de todos os módulos
  const allModules = [modLogistica, modFaturamento, modDocumentos, modPermissoes];

  // ADMIN: Libera acesso a TODOS os módulos
  for (const module of allModules) {
    await prisma.userModuleAccess.upsert({
      where: {
        userId_moduleId: {
          userId: admin.id,
          moduleId: module.id,
        },
      },
      update: { isEnabled: true },
      create: {
        userId: admin.id,
        moduleId: module.id,
        isEnabled: true,
      },
    });
  }

  // USER LIBERADO: Libera acesso a TODOS os módulos
  for (const module of allModules) {
    await prisma.userModuleAccess.upsert({
      where: {
        userId_moduleId: {
          userId: userLiberado.id,
          moduleId: module.id,
        },
      },
      update: { isEnabled: true },
      create: {
        userId: userLiberado.id,
        moduleId: module.id,
        isEnabled: true,
      },
    });
  }

  console.log('\n🔍 VERIFICANDO DADOS CRIADOS:');
  console.log('Admin ID:', admin.id);
  console.log('User Liberado ID:', userLiberado.id);
  console.log('Módulos criados:', allModules.length);

  // Verificar acessos do Admin
  const adminAccesses = await prisma.userModuleAccess.count({
    where: { userId: admin.id },
  });

  // Verificar acessos do User Liberado
  const userAccesses = await prisma.userModuleAccess.count({
    where: { userId: userLiberado.id },
  });

  console.log('Acessos do Admin:', adminAccesses);
  console.log('Acessos do User Liberado:', userAccesses);

  // O userBloqueado (employee@docflow.com) FICA SEM o registro UserModuleAccess,
  // resultando em isEnabled: false (ou acesso inexistente), que é o comportamento
  // que o PermissionsGuard irá bloquear.
  console.log('✔️ Permissões de Módulos concedidas ao Admin e ao Usuário Liberado.');

  // ============================================
  // 5. LOG FINAL
  // ============================================
  console.log('\n Seed concluído com sucesso!');
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Usuários e Senha de Teste:
Senha Única: ${CLEAR_PASSWORD}
----------------------------------
Admin: admin@docflow.com

Bloqueado (Teste): employee@docflow.com
Liberado (Teste): test_liberado@tech.com

Supplier Ativo: joao@tech.com
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}

main()
  .catch((e) => {
    console.error('Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });