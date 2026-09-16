/**
 * Cria a trilha inicial das procurações que existiam antes de haver histórico.
 *
 * Reconstrói o que dá para reconstruir a partir do estado atual: um ENVIO com o
 * arquivo vigente e, se já houve decisão, a entrada correspondente. Não inventa
 * o que se perdeu — envios anteriores ao atual tiveram o PDF apagado do MinIO
 * pelo comportamento antigo e não voltam.
 *
 * Idempotente: pula procuração que já tenha qualquer entrada.
 *
 *   node prisma/backfill-procuracao-historico.mjs
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DECISAO = {
  APROVADA: 'APROVACAO',
  REPROVADA: 'REJEICAO',
  REVOGADA: 'REVOGACAO',
};

const procuracoes = await prisma.procuracao.findMany({
  where: { historico: { none: {} } },
  select: {
    id: true,
    status: true,
    arquivoKey: true,
    arquivoNome: true,
    arquivoTamanho: true,
    validade: true,
    motivoRecusa: true,
    analisadoPor: true,
    analisadoEm: true,
    enviadoEm: true,
    createdAt: true,
    enviadoPor: { select: { id: true, name: true, email: true } },
  },
});

let criadas = 0;

for (const p of procuracoes) {
  const entradas = [];

  if (p.arquivoKey) {
    entradas.push({
      procuracaoId: p.id,
      acao: 'ENVIO',
      autorNome: p.enviadoPor?.name ?? p.enviadoPor?.email ?? 'Despachante',
      autorUserId: p.enviadoPor?.id ?? null,
      arquivoKey: p.arquivoKey,
      arquivoNome: p.arquivoNome,
      arquivoTamanho: p.arquivoTamanho,
      validade: p.validade,
      criadoEm: p.enviadoEm ?? p.createdAt,
    });
  }

  const acao = DECISAO[p.status];
  if (acao && p.analisadoEm) {
    entradas.push({
      procuracaoId: p.id,
      acao,
      autorNome: p.analisadoPor ?? 'Equipe Aurora',
      motivo: p.motivoRecusa,
      arquivoKey: p.arquivoKey,
      arquivoNome: p.arquivoNome,
      arquivoTamanho: p.arquivoTamanho,
      validade: p.validade,
      criadoEm: p.analisadoEm,
    });
  }

  if (entradas.length) {
    await prisma.procuracaoHistorico.createMany({ data: entradas });
    criadas += entradas.length;
  }
}

console.log(
  `${procuracoes.length} procuração(ões) sem trilha; ${criadas} entrada(s) criada(s).`,
);
await prisma.$disconnect();
