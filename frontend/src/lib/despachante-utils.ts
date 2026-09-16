import { prisma } from './prisma';

export async function getDespachanteClienteIds(despachanteId: string): Promise<string[]> {
  const despachante = await prisma.despachante.findUnique({
    where: { id: despachanteId },
    select: { codDespachante: true },
  });
  if (!despachante) return [];

  const disAverbadas = await prisma.diAverbada.findMany({
    where: { codDespachante: despachante.codDespachante, cnpjCliente: { not: null } },
    select: { cnpjCliente: true },
    distinct: ['cnpjCliente'],
  });

  const cnpjs = disAverbadas.map(d => d.cnpjCliente).filter(Boolean) as string[];
  if (!cnpjs.length) return [];

  const clientes = await prisma.cliente.findMany({
    where: { cnpj: { in: cnpjs } },
    select: { id: true },
  });

  return clientes.map(c => c.id);
}
