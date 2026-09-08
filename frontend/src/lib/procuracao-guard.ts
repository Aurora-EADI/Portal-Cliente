import { NextResponse } from 'next/server';
import { ProcuracaoStatus } from '@prisma/client';
import { prisma } from './prisma';

/**
 * Trava de procuração no servidor.
 *
 * A tela já esconde o botão de agendar quando não há procuração aprovada, mas
 * isso é conveniência: quem impede de verdade é esta função. Sem ela, bastaria
 * um POST direto no endpoint para operar em nome de um importador que nunca
 * autorizou ninguém.
 *
 * Devolve a resposta de erro pronta, ou null quando pode seguir.
 */
export async function bloqueioPorProcuracao(
  despachanteId: string,
  clienteId: string,
): Promise<NextResponse | null> {
  const procuracao = await prisma.procuracao.findUnique({
    where: { despachanteId_clienteId: { despachanteId, clienteId } },
    select: { status: true },
  });

  if (procuracao?.status === ProcuracaoStatus.APROVADA) return null;

  return NextResponse.json(
    {
      message:
        'Operação bloqueada — procuração ' +
        (procuracao ? descrever(procuracao.status) : 'não enviada') +
        '. Para realizar esta operação em nome deste cliente, é necessário possuir uma procuração válida e aprovada pela equipe da Aurora.',
      procuracaoStatus: procuracao?.status ?? null,
    },
    { status: 403 },
  );
}

function descrever(status: ProcuracaoStatus): string {
  switch (status) {
    case ProcuracaoStatus.PENDENTE_ENVIO:
      return 'pendente de envio';
    case ProcuracaoStatus.EM_ANALISE:
      return 'em análise';
    case ProcuracaoStatus.REPROVADA:
      return 'reprovada';
    default:
      return 'não aprovada';
  }
}
