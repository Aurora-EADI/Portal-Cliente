import { PrismaClient, UserRole, CompanyStatus } from '@prisma/client';
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

  // Módulo (usaremos o ID 1 como padrão se o provider permitir, senão será autoincrement)
  const modLogistica = await prisma.module.upsert({
    where: { name: 'Logística & Operações' },
    update: {},
    create: { name: 'Logística & Operações', description: 'Gestão de frotas' },
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
  
  // HABILITA o acesso ao Módulo de Logística para o Usuário LIBERADO
  await prisma.userModuleAccess.upsert({
    where: {
      userId_moduleId: {
        userId: userLiberado.id,
        moduleId: modLogistica.id,
      },
    },
    update: { isEnabled: true },
    create: {
      userId: userLiberado.id,
      moduleId: modLogistica.id,
      isEnabled: true, // Acesso concedido!
    },
  });

  console.log('\n🔍 VERIFICANDO DADOS CRIADOS:');
console.log('User Liberado ID:', userLiberado.id);
console.log('Módulo Logística ID:', modLogistica.id);

// Verificar se o acesso foi criado
const accessCheck = await prisma.userModuleAccess.findUnique({
  where: {
    userId_moduleId: {
      userId: userLiberado.id,
      moduleId: modLogistica.id,
    },
  },
  include: {
    module: {
      include: {
        activities: {
          include: {
            permissions: {
              include: { permission: true }
            }
          }
        }
      }
    }
  }
});

  // O userBloqueado (employee@docflow.com) FICA SEM o registro UserModuleAccess,
  // resultando em isEnabled: false (ou acesso inexistente), que é o comportamento
  // que o PermissionsGuard irá bloquear.
  console.log('UserModuleAccess criado:', JSON.stringify(accessCheck, null, 2));
  console.log('✔️ Permissão de Módulo concedida ao Usuário Liberado.');

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