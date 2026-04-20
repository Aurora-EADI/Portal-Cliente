import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixDocPermissions(userEmail: string) {
  console.log(
    `\nðŸ”§ Corrigindo permissões de Documentos para: ${userEmail}\n`,
  );

  // 1. Buscar usuário
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  });

  if (!user) {
    console.error(`âŒ Usuário não encontrado: ${userEmail}`);
    return;
  }

  console.log(`✅ Usuário: ${user.name}`);

  // 2. Buscar módulo Documentos
  const docModule = await prisma.module.findFirst({
    where: { route: "/documentos" },
    include: {
      activities: true,
    },
  });

  if (!docModule) {
    console.error("âŒ Módulo /documentos não encontrado");
    return;
  }

  console.log(`✅ Módulo: ${docModule.name} (ID: ${docModule.id})\n`);

  // 3. Buscar ou criar acesso ao módulo
  let userModuleAccess = await prisma.userModuleAccess.findUnique({
    where: {
      userId_moduleId: {
        userId: user.id,
        moduleId: docModule.id,
      },
    },
  });

  if (!userModuleAccess) {
    console.log("ðŸ“ Criando acesso ao módulo...");
    userModuleAccess = await prisma.userModuleAccess.create({
      data: {
        userId: user.id,
        moduleId: docModule.id,
        isEnabled: true,
      },
    });
    console.log(`✅ Acesso ao módulo criado (ID: ${userModuleAccess.id})\n`);
  } else {
    console.log(`✅ Acesso ao módulo já existe (ID: ${userModuleAccess.id})`);
    if (!userModuleAccess.isEnabled) {
      await prisma.userModuleAccess.update({
        where: { id: userModuleAccess.id },
        data: { isEnabled: true },
      });
      console.log("✅ Módulo habilitado\n");
    } else {
      console.log("");
    }
  }

  // 4. Sincronizar atividades obrigatórias
  console.log("ðŸ“‹ Sincronizando atividades obrigatórias...");
  const mandatoryActivities = docModule.activities.filter((a) => a.isMandatory);

  for (const activity of mandatoryActivities) {
    const existing = await prisma.userActivityAccess.findFirst({
      where: {
        userModuleAccessId: userModuleAccess.id,
        activityId: activity.id,
      },
    });

    if (!existing) {
      await prisma.userActivityAccess.create({
        data: {
          userModuleAccessId: userModuleAccess.id,
          activityId: activity.id,
          isEnabled: true,
        },
      });
      console.log(`   ✅ Atividade obrigatória criada: ${activity.name}`);
    } else {
      console.log(`   â­ï¸  Atividade obrigatória já existe: ${activity.name}`);
    }
  }

  // 5. Habilitar atividade "Visualizar Dashboard Documentos" (DOC_VIEW)
  console.log("\nðŸŽ¯ Habilitando atividade DOC_VIEW...");
  const docViewActivity = docModule.activities.find(
    (a) => a.name === "Visualizar Dashboard Documentos",
  );

  if (docViewActivity) {
    const existing = await prisma.userActivityAccess.findFirst({
      where: {
        userModuleAccessId: userModuleAccess.id,
        activityId: docViewActivity.id,
      },
    });

    if (existing) {
      if (!existing.isEnabled) {
        await prisma.userActivityAccess.update({
          where: { id: existing.id },
          data: { isEnabled: true },
        });
        console.log(`   ✅ Atividade DOC_VIEW atualizada para habilitada`);
      } else {
        console.log(`   â­ï¸  Atividade DOC_VIEW já está habilitada`);
      }
    } else {
      await prisma.userActivityAccess.create({
        data: {
          userModuleAccessId: userModuleAccess.id,
          activityId: docViewActivity.id,
          isEnabled: true,
        },
      });
      console.log(`   ✅ Atividade DOC_VIEW criada e habilitada`);
    }
  } else {
    console.log(
      '   âš ï¸  Atividade "Visualizar Dashboard Documentos" não encontrada',
    );
  }

  console.log("\n✅ Correção concluída!\n");
  console.log(
    "ðŸ”„ Limpe o cache do navegador (sessionStorage) e faça login novamente.\n",
  );
}

// Executar correção
const userEmail = process.argv[2] || "admin@aurora.com.br";

fixDocPermissions(userEmail)
  .catch(console.error)
  .finally(() => prisma.$disconnect());
