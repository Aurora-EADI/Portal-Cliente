import { NextResponse } from 'next/server';
import { AverbacaoProcessoStatus } from '@prisma/client';
import { prisma } from './prisma';

/**
 * Gate documental de agendamento.
 *
 * Regra deliberada: só bloqueia quando EXISTE processo de averbação para a DI
 * e ele ainda não foi liberado. DI sem processo segue livre.
 *
 * O motivo é que `dis_averbadas` só recebe DI que o Portal Aurora já averbou
 * pelo fluxo antigo (o flag sobre a DI do SIAUM). Exigir processo documental
 * para todas bloquearia de uma vez toda a operação existente — o fluxo novo
 * convive com o legado até substituí-lo.
 */

/** Processos que cobrem estas DIs, indexados por identificador. */
export async function statusAverbacaoPorDi(
  identificadores: { nLote: string | null; documentoSaida: string | null }[],
): Promise<Record<string, AverbacaoProcessoStatus>> {
  const lotes = identificadores
    .map((d) => d.nLote)
    .filter((v): v is string => Boolean(v));
  const documentos = identificadores
    .map((d) => d.documentoSaida)
    .filter((v): v is string => Boolean(v));

  if (!lotes.length && !documentos.length) return {};

  const processos = await prisma.averbacaoProcesso.findMany({
    where: {
      OR: [
        { nLote: { in: lotes } },
        { diDuimp: { in: documentos } },
      ],
    },
    select: { nLote: true, diDuimp: true, status: true, updatedAt: true },
    orderBy: { updatedAt: 'asc' },
  });

  // Indexa pelos dois identificadores; o processo mais recente prevalece,
  // porque a mesma DI pode ter um ciclo reaberto.
  const mapa: Record<string, AverbacaoProcessoStatus> = {};
  for (const p of processos) {
    if (p.nLote) mapa[p.nLote] = p.status;
    mapa[p.diDuimp] = p.status;
  }
  return mapa;
}

export function statusDaDi(
  mapa: Record<string, AverbacaoProcessoStatus>,
  di: { nLote: string | null; documentoSaida: string | null },
): AverbacaoProcessoStatus | null {
  if (di.nLote && mapa[di.nLote]) return mapa[di.nLote];
  if (di.documentoSaida && mapa[di.documentoSaida]) return mapa[di.documentoSaida];
  return null;
}

/**
 * Trava de servidor. Devolve a resposta de erro pronta, ou null para seguir.
 *
 * A tela já esconde o botão, mas isso é conveniência — sem esta checagem
 * bastaria um POST direto para agendar carga cuja documentação foi rejeitada.
 */
export async function bloqueioPorAverbacao(
  identificadores: string[],
): Promise<NextResponse | null> {
  const limpos = identificadores.filter(Boolean);
  if (!limpos.length) return null;

  const processo = await prisma.averbacaoProcesso.findFirst({
    where: {
      OR: [{ nLote: { in: limpos } }, { diDuimp: { in: limpos } }],
    },
    select: { status: true, protocolo: true },
    orderBy: { updatedAt: 'desc' },
  });

  // Sem processo documental, vale o fluxo legado.
  if (!processo) return null;
  if (processo.status === AverbacaoProcessoStatus.LIBERADO_AGENDAMENTO) {
    return null;
  }

  return NextResponse.json(
    {
      message: `Averbação pendente — o processo ${processo.protocolo} ainda não foi liberado para agendamento pela equipe da Aurora.`,
      averbacaoStatus: processo.status,
    },
    { status: 403 },
  );
}
