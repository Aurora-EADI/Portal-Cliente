
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const services = await prisma.service.findMany();
    console.log('Total services:', services.length);

    services.forEach(s => {
        console.log(`- [${s.modal}] ${s.name} (Active: ${s.isActive}, Stripping: ${s.hasStripping})`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
