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

  // ============================================
  // PERMISSÕES TÉCNICAS
  // ============================================

  // Permissões de Logística
  const pViewFleet = await prisma.permission.upsert({
    where: { key: 'LOG_VIEW_FLEET' },
    update: {},
    create: { key: 'LOG_VIEW_FLEET', description: 'Ver frota', category: 'LOGISTICS' },
  });

  // Permissões de Faturamento
  const pFatViewDash = await prisma.permission.upsert({
    where: { key: 'FAT_VIEW_DASH' },
    update: {},
    create: {
      key: 'FAT_VIEW_DASH',
      description: 'Visualizar dashboard de faturamento',
      category: 'FATURAMENTO'
    },
  });

  const pFatViewDet = await prisma.permission.upsert({
    where: { key: 'FAT_VIEW_DET' },
    update: {},
    create: {
      key: 'FAT_VIEW_DET',
      description: 'Visualizar faturamento detalhado',
      category: 'FATURAMENTO'
    },
  });

  const pFatViewCutoff = await prisma.permission.upsert({
    where: { key: 'FAT_VIEW_CUTOFF' },
    update: {},
    create: {
      key: 'FAT_VIEW_CUTOFF',
      description: 'Visualizar relatório de Cut-Off',
      category: 'FATURAMENTO'
    },
  });

  const pFatExportCutoff = await prisma.permission.upsert({
    where: { key: 'FAT_EXPORT_CUTOFF' },
    update: {},
    create: {
      key: 'FAT_EXPORT_CUTOFF',
      description: 'Exportar relatório de Cut-Off para Excel',
      category: 'FATURAMENTO'
    },
  });

  // Permissões de Permissões (Admin)
  const pPermManageUsers = await prisma.permission.upsert({
    where: { key: 'PERM_MANAGE_USERS' },
    update: {},
    create: {
      key: 'PERM_MANAGE_USERS',
      description: 'Gerenciar usuários e acessos',
      category: 'PERMISSIONS'
    },
  });

  const pPermManageModules = await prisma.permission.upsert({
    where: { key: 'PERM_MANAGE_MODULES' },
    update: {},
    create: {
      key: 'PERM_MANAGE_MODULES',
      description: 'Gerenciar módulos do sistema',
      category: 'PERMISSIONS'
    },
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

  // ============================================
  // ATIVIDADES E VINCULAÇÃO COM PERMISSÕES
  // ============================================

  // Atividades de Logística
  const actViewFleet = await prisma.activity.upsert({
    where: { moduleId_name: { moduleId: modLogistica.id, name: 'Visualizar Frota' } },
    update: {},
    create: {
      name: 'Visualizar Frota',
      description: 'Visualizar informações da frota',
      moduleId: modLogistica.id,
      isMandatory: true,
      permissions: {
        create: { permissionId: pViewFleet.id }
      }
    }
  });

  // Atividades de Faturamento
  const actFatDashboard = await prisma.activity.upsert({
    where: { moduleId_name: { moduleId: modFaturamento.id, name: 'Visualizar Dashboard' } },
    update: {},
    create: {
      name: 'Visualizar Dashboard',
      description: 'Visualizar dashboard de faturamento',
      moduleId: modFaturamento.id,
      isMandatory: true,
      permissions: {
        create: { permissionId: pFatViewDash.id }
      }
    }
  });

  const actFatDetalhado = await prisma.activity.upsert({
    where: { moduleId_name: { moduleId: modFaturamento.id, name: 'Visualizar Faturamento Detalhado' } },
    update: {},
    create: {
      name: 'Visualizar Faturamento Detalhado',
      description: 'Acesso ao faturamento detalhado com todas as informações',
      moduleId: modFaturamento.id,
      isMandatory: false,
      permissions: {
        create: { permissionId: pFatViewDet.id }
      }
    }
  });

  const actFatCutoff = await prisma.activity.upsert({
    where: { moduleId_name: { moduleId: modFaturamento.id, name: 'Gerar Relatório Cut-Off' } },
    update: {},
    create: {
      name: 'Gerar Relatório Cut-Off',
      description: 'Visualizar e gerar relatórios de cut-off',
      moduleId: modFaturamento.id,
      isMandatory: false,
      permissions: {
        create: { permissionId: pFatViewCutoff.id }
      }
    }
  });

  const actFatExportCutoff = await prisma.activity.upsert({
    where: { moduleId_name: { moduleId: modFaturamento.id, name: 'Exportar Relatório Cut-Off' } },
    update: {},
    create: {
      name: 'Exportar Relatório Cut-Off',
      description: 'Exportar relatório de cut-off para Excel',
      moduleId: modFaturamento.id,
      isMandatory: false,
      permissions: {
        create: { permissionId: pFatExportCutoff.id }
      }
    }
  });

  // Atividades de Permissões (Admin)
  const actPermUsers = await prisma.activity.upsert({
    where: { moduleId_name: { moduleId: modPermissoes.id, name: 'Gerenciar Usuários' } },
    update: {},
    create: {
      name: 'Gerenciar Usuários',
      description: 'Gerenciar usuários e seus acessos aos módulos',
      moduleId: modPermissoes.id,
      isMandatory: true,
      permissions: {
        create: { permissionId: pPermManageUsers.id }
      }
    }
  });

  const actPermModules = await prisma.activity.upsert({
    where: { moduleId_name: { moduleId: modPermissoes.id, name: 'Gerenciar Módulos' } },
    update: {},
    create: {
      name: 'Gerenciar Módulos',
      description: 'Criar e gerenciar módulos do sistema',
      moduleId: modPermissoes.id,
      isMandatory: true,
      permissions: {
        create: { permissionId: pPermManageModules.id }
      }
    }
  });

  console.log('✔️ Estrutura RBAC (Módulos/Atividades/Permissões) criada.');

  // ============================================
  // 4. CONCESSÃO DE ACESSO PARA O TESTE
  // ============================================

  // Lista de todos os módulos
  const allModules = [modLogistica, modFaturamento, modDocumentos, modPermissoes];

  // ============================================
  // ADMIN: Libera acesso a TODOS os módulos e TODAS as atividades
  // ============================================
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

  // ============================================
  // USER LIBERADO: Libera acesso a TODOS os módulos
  // ============================================
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

  // ============================================
  // JOÃO (Supplier): Acesso APENAS ao Faturamento
  // Cenário de teste: Tem acesso ao módulo, mas NÃO a todas as atividades
  // ============================================

  // Busca o usuário João
  const joao = await prisma.user.findUnique({
    where: { email: 'joao@tech.com' },
  });

  if (joao) {
    // Libera o MÓDULO de Faturamento para João
    const joaoFaturamentoAccess = await prisma.userModuleAccess.upsert({
      where: {
        userId_moduleId: {
          userId: joao.id,
          moduleId: modFaturamento.id,
        },
      },
      update: { isEnabled: true },
      create: {
        userId: joao.id,
        moduleId: modFaturamento.id,
        isEnabled: true,
      },
    });

    // ✅ LIBERAR: Apenas Dashboard (obrigatória)
    // Dashboard já é criada automaticamente pelo toggleModule porque isMandatory = true

    // ❌ BLOQUEAR: Faturamento Detalhado (NÃO criar registro = bloqueado)
    // ❌ BLOQUEAR: Gerar Relatório Cut-Off (NÃO criar registro = bloqueado)
    // ❌ BLOQUEAR: Exportar Relatório Cut-Off (NÃO criar registro = bloqueado)

    // NOTA: Para liberar atividades opcionais posteriormente, use a rota:
    // PUT /api/user-activity-access/:userModuleAccessId/toggle/:activityId

    console.log('✔️ João liberado para: Faturamento > Dashboard (apenas obrigatória)');
    console.log('❌ João bloqueado para: Faturamento Detalhado, Cut-Off e Exportação');
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