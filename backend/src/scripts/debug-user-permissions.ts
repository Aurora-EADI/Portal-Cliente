import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function debugUserPermissions(userEmail: string) {
  console.log(`\nðŸ” Diagnóstico de Permissões para: ${userEmail}\n`);

  // 1. Buscar usuário
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
    console.error(`âŒ Usuário não encontrado: ${userEmail}`);
    return;
  }

  console.log("✅ Usuário encontrado:");
  console.log(`   ID: ${user.id}`);
  console.log(`   Nome: ${user.name}`);
  console.log(`   Role: ${user.role}\n`);

  // 2. Buscar módulo Documentos
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
    console.error("âŒ Módulo /documentos não encontrado");
    return;
  }

  console.log("📦 Módulo Documentos:");
  console.log(`   ID: ${docModule.id}`);
  console.log(`   Nome: ${docModule.name}`);
  console.log(`   Ativo: ${docModule.active}`);
  console.log(`   Total de atividades: ${docModule.activities.length}\n`);

  // 3. Verificar acesso do usuário ao módulo
  const userModuleAccess = await prisma.userModuleAccess.findUnique({
    where: {
      userId_moduleId: {
        userId: user.id,
        moduleId: docModule.id,
      },
    },
  });

  console.log("ðŸ” Acesso ao Módulo:");
  if (userModuleAccess) {
    console.log(`   ✅ Tem acesso (ID: ${userModuleAccess.id})`);
    console.log(`   Habilitado: ${userModuleAccess.isEnabled}`);
  } else {
    console.log("   âŒ SEM acesso ao módulo");
  }
  console.log("");

  // 4. Listar atividades e verificar acesso
  console.log("ðŸ“‹ Atividades do módulo:\n");
  for (const activity of docModule.activities) {
    console.log(`   Atividade: ${activity.name} (ID: ${activity.id})`);
    console.log(`   Obrigatória: ${activity.isMandatory}`);
    console.log(
      `   Permissões: ${activity.permissions.map((p) => p.permission.key).join(", ")}`,
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
          `   ✅ Acesso à atividade: ${activityAccess.isEnabled ? "HABILITADO" : "DESABILITADO"}`,
        );
      } else {
        console.log(`   âŒ SEM acesso à atividade`);
      }
    }
    console.log("");
  }

  // 5. Verificar permissão DOC_VIEW especificamente
  console.log("ðŸŽ¯ Permissão DOC_VIEW:");
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
    console.log(`   ✅ Permissão existe (ID: ${docViewPermission.id})`);
    console.log(`   Descrição: ${docViewPermission.description}`);
    console.log(`   Vinculada às atividades:`);
    for (const ap of docViewPermission.activities) {
      console.log(`      - ${ap.activity.name} (ID: ${ap.activity.id})`);
    }
  } else {
    console.log("   âŒ Permissão DOC_VIEW não encontrada no banco");
  }
}

// Executar diagnóstico
const userEmail = process.argv[2] || "admin@example.com";

debugUserPermissions(userEmail)
  .catch(console.error)
  .finally(() => prisma.$disconnect());

