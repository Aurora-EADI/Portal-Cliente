import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixDocPermissions(userEmail: string) {
  console.log(`\nðŸ”§ Corrigindo permissÃµes de Documentos para: ${userEmail}\n`);

  // 1. Buscar usuÃ¡rio
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  });

  if (!user) {
    console.error(`âŒ UsuÃ¡rio nÃ£o encontrado: ${userEmail}`);
    return;
  }

  console.log(`âœ… UsuÃ¡rio: ${user.name}`);

  // 2. Buscar mÃ³dulo Documentos
  const docModule = await prisma.module.findFirst({
    where: { route: "/documentos" },
    include: {
      activities: true,
    },
  });

  if (!docModule) {
    console.error("âŒ MÃ³dulo /documentos nÃ£o encontrado");
    return;
  }

  console.log(`âœ… MÃ³dulo: ${docModule.name} (ID: ${docModule.id})\n`);

  // 3. Buscar ou criar acesso ao mÃ³dulo
  let userModuleAccess = await prisma.userModuleAccess.findUnique({
    where: {
      userId_moduleId: {
        userId: user.id,
        moduleId: docModule.id,
      },
    },
  });

  if (!userModuleAccess) {
    console.log("ðŸ“ Criando acesso ao mÃ³dulo...");
    userModuleAccess = await prisma.userModuleAccess.create({
      data: {
        userId: user.id,
        moduleId: docModule.id,
        isEnabled: true,
      },
    });
    console.log(`âœ… Acesso ao mÃ³dulo criado (ID: ${userModuleAccess.id})\n`);
  } else {
    console.log(`âœ… Acesso ao mÃ³dulo jÃ¡ existe (ID: ${userModuleAccess.id})`);
    if (!userModuleAccess.isEnabled) {
      await prisma.userModuleAccess.update({
        where: { id: userModuleAccess.id },
        data: { isEnabled: true },
      });
      console.log("âœ… MÃ³dulo habilitado\n");
    } else {
      console.log("");
    }
  }

  // 4. Sincronizar atividades obrigatÃ³rias
  console.log("ðŸ“‹ Sincronizando atividades obrigatÃ³rias...");
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
      console.log(`   âœ… Atividade obrigatÃ³ria criada: ${activity.name}`);
    } else {
      console.log(`   â­ï¸  Atividade obrigatÃ³ria jÃ¡ existe: ${activity.name}`);
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
        console.log(`   âœ… Atividade DOC_VIEW atualizada para habilitada`);
      } else {
        console.log(`   â­ï¸  Atividade DOC_VIEW jÃ¡ estÃ¡ habilitada`);
      }
    } else {
      await prisma.userActivityAccess.create({
        data: {
          userModuleAccessId: userModuleAccess.id,
          activityId: docViewActivity.id,
          isEnabled: true,
        },
      });
      console.log(`   âœ… Atividade DOC_VIEW criada e habilitada`);
    }
  } else {
    console.log(
      '   âš ï¸  Atividade "Visualizar Dashboard Documentos" nÃ£o encontrada',
    );
  }

  console.log("\nâœ… CorreÃ§Ã£o concluÃ­da!\n");
  console.log(
    "ðŸ”„ Limpe o cache do navegador (sessionStorage) e faÃ§a login novamente.\n",
  );
}

// Executar correÃ§Ã£o
const userEmail = process.argv[2] || "admin@aurora.com.br";

fixDocPermissions(userEmail)
  .catch(console.error)
  .finally(() => prisma.$disconnect());

