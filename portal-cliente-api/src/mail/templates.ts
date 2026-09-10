import type { Mensagem } from './mail.service';

/**
 * Corpo dos emails do portal.
 *
 * Tudo que vem de fora (nome de cliente, motivo de rejeição escrito pelo
 * analista) passa por `esc` antes de entrar no HTML. Motivo é texto livre
 * digitado por gente: sem escape, um `<` no meio da frase quebra o layout — e
 * uma tag inteira viaja para a caixa do despachante.
 */
function esc(valor: string | null | undefined): string {
  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const PORTAL_URL = process.env.PORTAL_URL || 'https://portal.auroraeadi.com.br';

/** Laranja primary-500 do portal — mesma cor da interface. */
const LARANJA = '#f97316';

type Tom = 'aprovado' | 'rejeitado' | 'neutro';

const CORES: Record<Tom, string> = {
  aprovado: '#16a34a',
  rejeitado: '#dc2626',
  neutro: '#475569',
};

/**
 * Layout comum. Estilo fica inline de propósito: cliente de email (Outlook à
 * frente) ignora `<style>` em `<head>`, então classe e CSS externo não chegam.
 */
function layout(titulo: string, tom: Tom, blocos: string[]): string {
  return `
<div style="margin:0;padding:24px;background:#f8fafc;font-family:Segoe UI,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
    <div style="background:${LARANJA};padding:16px 24px;">
      <span style="color:#ffffff;font-size:16px;font-weight:600;">Aurora EADI — Portal do Cliente</span>
    </div>
    <div style="padding:24px;">
      <h1 style="margin:0 0 16px;font-size:20px;color:${CORES[tom]};">${esc(titulo)}</h1>
      ${blocos.join('\n      ')}
      <p style="margin:24px 0 0;">
        <a href="${esc(PORTAL_URL)}" style="display:inline-block;background:${LARANJA};color:#ffffff;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:600;">Abrir o portal</a>
      </p>
    </div>
    <div style="padding:16px 24px;background:#f1f5f9;color:#64748b;font-size:12px;">
      Mensagem automática do Portal do Cliente. Não responda a este email.
    </div>
  </div>
</div>`.trim();
}

function paragrafo(texto: string): string {
  return `<p style="margin:0 0 12px;font-size:14px;color:#334155;line-height:1.6;">${texto}</p>`;
}

/** Bloco destacado para o motivo — é a informação que faz a pessoa agir. */
function destaque(rotulo: string, conteudo: string): string {
  return `<div style="margin:0 0 12px;padding:12px 16px;background:#fff7ed;border-left:4px solid ${LARANJA};border-radius:4px;">
        <strong style="display:block;font-size:12px;color:#9a3412;text-transform:uppercase;letter-spacing:.04em;">${esc(rotulo)}</strong>
        <span style="font-size:14px;color:#334155;">${esc(conteudo)}</span>
      </div>`;
}

function linhas(itens: Array<[string, string | null | undefined]>): string {
  const visiveis = itens.filter(([, v]) => v);
  if (!visiveis.length) return '';
  return `<table style="width:100%;border-collapse:collapse;margin:0 0 16px;">
        ${visiveis
          .map(
            ([rotulo, valor]) =>
              `<tr>
          <td style="padding:6px 0;font-size:13px;color:#64748b;width:40%;">${esc(rotulo)}</td>
          <td style="padding:6px 0;font-size:13px;color:#0f172a;font-weight:600;">${esc(valor)}</td>
        </tr>`,
          )
          .join('\n        ')}
      </table>`;
}

// ── Procuração ──────────────────────────────────────────────────────

export interface DadosProcuracao {
  despachanteNome: string;
  clienteNome: string;
  /** Nulável no schema — `linhas` omite a linha quando não houver. */
  clienteCnpj?: string | null;
  status: 'APROVADA' | 'REPROVADA' | 'REVOGADA';
  motivo?: string | null;
  analisadoPor?: string | null;
}

export function procuracaoDecidida(
  d: DadosProcuracao,
): Omit<Mensagem, 'para'> {
  const aprovada = d.status === 'APROVADA';
  const revogada = d.status === 'REVOGADA';

  const titulo = aprovada
    ? 'Procuração aprovada'
    : revogada
      ? 'Procuração revogada'
      : 'Procuração reprovada';

  const tom: Tom = aprovada ? 'aprovado' : 'rejeitado';

  const chamada = aprovada
    ? `A procuração de <strong>${esc(d.despachanteNome)}</strong> para representar <strong>${esc(d.clienteNome)}</strong> foi aprovada. Já é possível abrir averbações para este importador.`
    : revogada
      ? `A procuração de <strong>${esc(d.despachanteNome)}</strong> para <strong>${esc(d.clienteNome)}</strong> foi revogada. Novas averbações para este importador estão bloqueadas.`
      : `A procuração de <strong>${esc(d.despachanteNome)}</strong> para <strong>${esc(d.clienteNome)}</strong> foi reprovada. Corrija o documento e envie novamente pelo portal.`;

  const blocos = [
    paragrafo(chamada),
    linhas([
      ['Importador', d.clienteNome],
      ['CNPJ', d.clienteCnpj],
      ['Despachante', d.despachanteNome],
      ['Analisado por', d.analisadoPor ?? 'Equipe Aurora'],
    ]),
    d.motivo ? destaque('Motivo', d.motivo) : '',
  ].filter(Boolean);

  const texto = [
    titulo,
    '',
    `Importador: ${d.clienteNome}${d.clienteCnpj ? ` (${d.clienteCnpj})` : ''}`,
    `Despachante: ${d.despachanteNome}`,
    `Analisado por: ${d.analisadoPor ?? 'Equipe Aurora'}`,
    d.motivo ? `Motivo: ${d.motivo}` : '',
    '',
    PORTAL_URL,
  ]
    .filter(Boolean)
    .join('\n');

  return {
    assunto: `[Aurora EADI] ${titulo} — ${d.clienteNome}`,
    html: layout(titulo, tom, blocos),
    texto,
  };
}

// ── Documento de averbação ──────────────────────────────────────────

export interface DadosDocumento {
  protocolo: string;
  tipoDescricao: string;
  clienteNome: string;
  aprovado: boolean;
  motivo?: string | null;
  analisadoPor?: string | null;
}

export function documentoDecidido(d: DadosDocumento): Omit<Mensagem, 'para'> {
  const titulo = d.aprovado ? 'Documento validado' : 'Documento rejeitado';
  const tom: Tom = d.aprovado ? 'aprovado' : 'rejeitado';

  const chamada = d.aprovado
    ? `O documento <strong>${esc(d.tipoDescricao)}</strong> do processo <strong>${esc(d.protocolo)}</strong> foi validado.`
    : `O documento <strong>${esc(d.tipoDescricao)}</strong> do processo <strong>${esc(d.protocolo)}</strong> foi rejeitado. Reenvie o arquivo corrigido pelo portal.`;

  const blocos = [
    paragrafo(chamada),
    linhas([
      ['Protocolo', d.protocolo],
      ['Importador', d.clienteNome],
      ['Documento', d.tipoDescricao],
      ['Analisado por', d.analisadoPor ?? 'Equipe Aurora'],
    ]),
    d.motivo ? destaque('Motivo da rejeição', d.motivo) : '',
  ].filter(Boolean);

  const texto = [
    titulo,
    '',
    `Protocolo: ${d.protocolo}`,
    `Importador: ${d.clienteNome}`,
    `Documento: ${d.tipoDescricao}`,
    `Analisado por: ${d.analisadoPor ?? 'Equipe Aurora'}`,
    d.motivo ? `Motivo: ${d.motivo}` : '',
    '',
    PORTAL_URL,
  ]
    .filter(Boolean)
    .join('\n');

  return {
    assunto: `[Aurora EADI] ${titulo} — ${d.protocolo}`,
    html: layout(titulo, tom, blocos),
    texto,
  };
}

// ── Liberação para agendamento ──────────────────────────────────────

export interface DadosLiberacao {
  protocolo: string;
  clienteNome: string;
  despachanteNome: string;
  nLote: string;
  diDuimp?: string | null;
  liberadoPor?: string | null;
}

export function processoLiberado(d: DadosLiberacao): Omit<Mensagem, 'para'> {
  const titulo = 'Processo liberado para agendamento';

  const blocos = [
    paragrafo(
      `O processo <strong>${esc(d.protocolo)}</strong> teve toda a documentação obrigatória validada e está liberado para agendamento.`,
    ),
    linhas([
      ['Protocolo', d.protocolo],
      ['Importador', d.clienteNome],
      ['Despachante', d.despachanteNome],
      ['DI/DUIMP', d.diDuimp],
      ['Lote SIAUM', d.nLote],
      ['Liberado por', d.liberadoPor ?? 'Equipe Aurora'],
    ]),
  ];

  const texto = [
    titulo,
    '',
    `Protocolo: ${d.protocolo}`,
    `Importador: ${d.clienteNome}`,
    `Despachante: ${d.despachanteNome}`,
    d.diDuimp ? `DI/DUIMP: ${d.diDuimp}` : '',
    `Lote SIAUM: ${d.nLote}`,
    `Liberado por: ${d.liberadoPor ?? 'Equipe Aurora'}`,
    '',
    PORTAL_URL,
  ]
    .filter(Boolean)
    .join('\n');

  return {
    assunto: `[Aurora EADI] ${titulo} — ${d.protocolo}`,
    html: layout(titulo, 'aprovado', blocos),
    texto,
  };
}
