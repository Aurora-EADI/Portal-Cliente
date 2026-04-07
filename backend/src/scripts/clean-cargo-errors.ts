import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Iniciando limpeza de erros nos cargos ---');

  const affected = await prisma.warehouseCargo.findMany({
    where: {
      documentNumber: {
        contains: '## Error Type',
      },
    },
  });

  console.log(`Encontrados ${affected.length} registros com erro no documentNumber.`);

  if (affected.length > 0) {
    const result = await prisma.warehouseCargo.updateMany({
      where: {
        documentNumber: {
          contains: '## Error Type',
        },
      },
      data: {
        documentNumber: null,
      },
    });
    console.log(`Sucesso: ${result.count} registros limpos.`);
  }

  console.log('--- Limpeza concluída ---');
}

main()
  .catch((e) => {
    console.error('Erro ao executar limpeza:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
