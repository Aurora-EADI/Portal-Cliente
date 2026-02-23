import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function debugUserPermissions(userEmail: string) {
  console.log(`\nðŸ” DiagnÃ³stico de PermissÃµes para: ${userEmail}\n`);

  // 1. Buscar usuÃ¡rio
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  if (!user) {
    console.error(`âŒ UsuÃ¡rio nÃ£o encontrado: ${userEmail}`);
    return;
  }

  console.log("âœ… UsuÃ¡rio encontrado:");
  console.log(`   ID: ${user.id}`);
  console.log(`   Nome: ${user.name}`);
  console.log(`   Role: ${user.role}\n`);

  // 2. Buscar mÃ³dulo Documentos
  const docModule = await prisma.module.findFirst({
    where: { route: "/documentos" },
    include: {
      activities: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });

  if (!docModule) {
    console.error("âŒ MÃ³dulo /documentos nÃ£o encontrado");
    return;
  }

  console.log("ðŸ“¦ MÃ³dulo Documentos:");
  console.log(`   ID: ${docModule.id}`);
  console.log(`   Nome: ${docModule.name}`);
  console.log(`   Ativo: ${docModule.active}`);
  console.log(`   Total de atividades: ${docModule.activities.length}\n`);

  // 3. Verificar acesso do usuÃ¡rio ao mÃ³dulo
  const userModuleAccess = await prisma.userModuleAccess.findUnique({
    where: {
      userId_moduleId: {
        userId: user.id,
        moduleId: docModule.id,
      },
    },
  });

  console.log("ðŸ” Acesso ao MÃ³dulo:");
  if (userModuleAccess) {
    console.log(`   âœ… Tem acesso (ID: ${userModuleAccess.id})`);
    console.log(`   Habilitado: ${userModuleAccess.isEnabled}`);
  } else {
    console.log("   âŒ SEM acesso ao mÃ³dulo");
  }
  console.log("");

  // 4. Listar atividades e verificar acesso
  console.log("ðŸ“‹ Atividades do mÃ³dulo:\n");
  for (const activity of docModule.activities) {
    console.log(`   Atividade: ${activity.name} (ID: ${activity.id})`);
    console.log(`   ObrigatÃ³ria: ${activity.isMandatory}`);
    console.log(
      `   PermissÃµes: ${activity.permissions.map((p) => p.permission.key).join(", ")}`,
    );

    if (userModuleAccess) {
      const activityAccess = await prisma.userActivityAccess.findFirst({
        where: {
          userModuleAccessId: userModuleAccess.id,
          activityId: activity.id,
        },
      });

      if (activityAccess) {
        console.log(
          `   âœ… Acesso Ã  atividade: ${activityAccess.isEnabled ? "HABILITADO" : "DESABILITADO"}`,
        );
      } else {
        console.log(`   âŒ SEM acesso Ã  atividade`);
      }
    }
    console.log("");
  }

  // 5. Verificar permissÃ£o DOC_VIEW especificamente
  console.log("ðŸŽ¯ PermissÃ£o DOC_VIEW:");
  const docViewPermission = await prisma.permission.findUnique({
    where: { key: "DOC_VIEW" },
    include: {
      activities: {
        include: {
          activity: true,
        },
      },
    },
  });

  if (docViewPermission) {
    console.log(`   âœ… PermissÃ£o existe (ID: ${docViewPermission.id})`);
    console.log(`   DescriÃ§Ã£o: ${docViewPermission.description}`);
    console.log(`   Vinculada Ã s atividades:`);
    for (const ap of docViewPermission.activities) {
      console.log(`      - ${ap.activity.name} (ID: ${ap.activity.id})`);
    }
  } else {
    console.log("   âŒ PermissÃ£o DOC_VIEW nÃ£o encontrada no banco");
  }
}

// Executar diagnÃ³stico
const userEmail = process.argv[2] || "admin@example.com";

debugUserPermissions(userEmail)
  .catch(console.error)
  .finally(() => prisma.$disconnect());

