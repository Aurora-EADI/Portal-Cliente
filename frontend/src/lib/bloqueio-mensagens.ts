/**
 * Textos dos bloqueios que impedem agendar uma DI.
 *
 * Ficam aqui porque duas telas mostram a mesma trava — o painel
 * ("Minhas DIs e Agendamentos") e a lista de DIs & Containers. Duplicar o texto
 * faria uma delas envelhecer sem ninguém notar.
 *
 * Dizer só "bloqueado" faria o despachante abrir chamado; dizer em que pé está
 * a pendência diz o que fazer.
 */

export const MENSAGEM_PROCURACAO: Record<string, string> = {
  SEM: 'Operação bloqueada — não há procuração para este importador. Para operar em nome dele, envie uma procuração e aguarde a aprovação da equipe da Aurora.',
  PENDENTE_ENVIO:
    'Operação bloqueada — procuração pendente de envio. Anexe o documento assinado.',
  EM_ANALISE:
    'Operação bloqueada — procuração em análise pela equipe da Aurora.',
  REPROVADA:
    'Operação bloqueada — procuração reprovada. Veja o motivo e reenvie o documento.',
};

export const MENSAGEM_AVERBACAO: Record<string, string> = {
  RASCUNHO:
    'Averbação pendente — o processo foi aberto mas os documentos ainda não foram enviados.',
  EM_ANALISE:
    'Averbação pendente — os documentos estão em análise pela equipe da Aurora.',
  PENDENTE_CORRECAO:
    'Averbação pendente — há documento rejeitado. Veja o motivo e reenvie.',
};
