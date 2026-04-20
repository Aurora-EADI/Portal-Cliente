import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Registrando módulo de Recepção...');

  // 1. Criar o Módulo
  const receptionModule = await prisma.module.upsert({
    where: { name: 'Recepção' },
    update: {
      route: '/recepcao',
      icon: 'Users',
      active: true,
      description: 'Gestão de contatos internos e ramais',
    },
    create: {
      name: 'Recepção',
      description: 'Gestão de contatos internos e ramais',
      route: '/recepcao',
      icon: 'Users',
      active: true,
    },
  });

  console.log(`✅ Módulo "Recepção" garantido (ID: ${receptionModule.id})`);

  // 2. Criar Permissão Técnica
  const permission = await prisma.permission.upsert({
    where: { key: 'RECEPTION_ACCESS' },
    update: {
      description: 'Acesso ao módulo de recepção e contatos',
      category: 'RECEPTION',
    },
    create: {
      key: 'RECEPTION_ACCESS',
      description: 'Acesso ao módulo de recepção e contatos',
      category: 'RECEPTION',
    },
  });

  console.log(`✅ Permissão "RECEPTION_ACCESS" garantida.`);

  // 3. Criar Atividade
  const activity = await prisma.activity.upsert({
    where: {
      moduleId_name: {
        moduleId: receptionModule.id,
        name: 'Acessar Recepção',
      },
    },
    update: {
      description: 'Permite visualizar e gerenciar contatos na recepção',
      isMandatory: true,
      route: '/recepcao',
    },
    create: {
      moduleId: receptionModule.id,
      name: 'Acessar Recepção',
      description: 'Permite visualizar e gerenciar contatos na recepção',
      isMandatory: true,
      route: '/recepcao',
    },
  });

  // Vincular permissão à atividade
  await prisma.activityPermission.upsert({
    where: {
      activityId_permissionId: {
        activityId: activity.id,
        permissionId: permission.id,
      },
    },
    update: {},
    create: {
      activityId: activity.id,
      permissionId: permission.id,
    },
  });

  console.log(`✅ Atividade "Acessar Recepção" configurada.`);

  // 4. Dar acesso ao Admin
  const admin = await prisma.user.findFirst({
    where: { email: 'admin@aurora.com.br' },
  });

  if (admin) {
    // Acesso ao Módulo
    const moduleAccess = await prisma.userModuleAccess.upsert({
      where: {
        userId_moduleId: {
          userId: admin.id,
          moduleId: receptionModule.id,
        },
      },
      update: { isEnabled: true },
      create: {
        userId: admin.id,
        moduleId: receptionModule.id,
        isEnabled: true,
      },
    });

    // Acesso à Atividade
    await prisma.userActivityAccess.upsert({
      where: {
        userModuleAccessId_activityId: {
          userModuleAccessId: moduleAccess.id,
          activityId: activity.id,
        },
      },
      update: { isEnabled: true },
      create: {
        userModuleAccessId: moduleAccess.id,
        activityId: activity.id,
        isEnabled: true,
      },
    });

    console.log(`✅ Acesso completo ao módulo "Recepção" concedido ao admin.`);
  }

  console.log('🎉 Operação concluída com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao registrar módulo:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
