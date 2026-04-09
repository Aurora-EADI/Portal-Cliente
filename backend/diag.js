const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  console.log('--- START DIAGNOSTIC ---');
  try {
    const modules = await prisma.module.findMany({
        where: { active: true }
    });
    console.log('ACTIVE_MODULE_ROUTES:', modules.map(m => m.route));
    
    const targetModule = modules.find(m => m.route && m.route.toLowerCase().includes('armazem'));
    if (targetModule) {
        console.log('TARGET_MODULE_FOUND:', JSON.stringify(targetModule));
    } else {
        console.log('TARGET_MODULE_NOT_FOUND_BY_SEARCH');
    }

    const admin = await prisma.user.findFirst({ where: { email: 'admin@aurora.com.br' } });
    if (admin) {
        const access = await prisma.userModuleAccess.findMany({
            where: { userId: admin.id },
            include: { module: true }
        });
        console.log('ADMIN_ACCESS_LIST:', access.map(a => ({ 
            module: a.module.name, 
            route: a.module.route, 
            isEnabled: a.isEnabled 
        })));
    }
  } catch (e) {
    console.error('DIAGNOSTIC_ERROR:', e.message);
  }
  console.log('--- END DIAGNOSTIC ---');
}

check().finally(() => prisma.$disconnect());
