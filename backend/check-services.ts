
import { PrismaClient } from '@prisma/client-postgres';

const prisma = new PrismaClient();

async function main() {
  const services = await prisma.service.findMany({
    include: {
      serviceCosts: {
        where: {
          OR: [
            { validUntil: null },
            { validUntil: { gte: new Date() } }
          ]
        },
        orderBy: { validFrom: 'desc' },
        take: 1
      }
    }
  });
  console.log(JSON.stringify(services, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
