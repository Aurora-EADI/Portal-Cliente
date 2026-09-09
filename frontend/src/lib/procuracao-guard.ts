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
    select: { status: true, validade: true },
  });

  if (procuracao && procuracaoVigente(procuracao)) return null;

  // Vencida tem mensagem própria: mandar "aprove a procuração" para algo que
  // já foi aprovado e caducou levaria a pessoa a reenviar o mesmo documento.
  const vencida =
    procuracao?.status === ProcuracaoStatus.APROVADA && !!procuracao.validade;

  return NextResponse.json(
    {
      message: vencida
        ? 'Operação bloqueada — a procuração deste cliente venceu. Envie uma procuração vigente e aguarde a aprovação da equipe da Aurora.'
        : 'Operação bloqueada — procuração ' +
          (procuracao ? descrever(procuracao.status) : 'não enviada') +
          '. Para realizar esta operação em nome deste cliente, é necessário possuir uma procuração válida e aprovada pela equipe da Aurora.',
      procuracaoStatus: vencida ? 'VENCIDA' : (procuracao?.status ?? null),
    },
    { status: 403 },
  );
}

/** Hoje à meia-noite: a procuração vale o dia inteiro do vencimento. */
function inicioDeHoje(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Espelha `procuracaoVigente` do portal-cliente-api. Os dois runtimes leem o
 * mesmo banco e precisam concordar: se divergirem, a tela mostra liberado e a
 * API recusa, ou pior, o contrário.
 */
export function procuracaoVigente(p: {
  status: ProcuracaoStatus;
  validade: Date | null;
}): boolean {
  if (p.status !== ProcuracaoStatus.APROVADA) return false;
  if (!p.validade) return true;
  return p.validade >= inicioDeHoje();
}

function descrever(status: ProcuracaoStatus): string {
  switch (status) {
    case ProcuracaoStatus.PENDENTE_ENVIO:
      return 'pendente de envio';
    case ProcuracaoStatus.EM_ANALISE:
      return 'em análise';
    case ProcuracaoStatus.REPROVADA:
      return 'reprovada';
    case ProcuracaoStatus.REVOGADA:
      return 'revogada';
    default:
      return 'não aprovada';
  }
}
