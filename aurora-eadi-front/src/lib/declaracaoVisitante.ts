import jsPDF from 'jspdf';
import { PreRegistroVisitante } from '@/types/visitantes';

const v = (val?: string | null) => val?.trim() || '';

const getBase64FromUrl = (url: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.setAttribute('crossOrigin', 'anonymous');
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = url;
  });

export async function gerarDeclaracaoVisitante(
  visitante: PreRegistroVisitante,
): Promise<void> {
  const doc = new jsPDF('p', 'mm', 'a4');
  const W = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentW = W - margin * 2;
  let y = 15;

  // ── Cabeçalho ──────────────────────────────────────────────
  try {
    const logo = await getBase64FromUrl('/logo-aurora.png');
    doc.addImage(logo, 'PNG', margin, y, 38, 13);
  } catch {
    // logo indisponível — continua sem ela
  }

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text('FR-AU-ADM 07.002-06 - REV.00 - DATA: 26/02/2026', W - margin, y + 4, {
    align: 'right',
  });

  y += 18;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, W - margin, y);
  y += 8;

  // ── Título ─────────────────────────────────────────────────
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  const titulo =
    'DECLARAÇÃO DE RESIDÊNCIA E TERMO DE AUTORIZAÇÃO DE IMAGEM E USO DE DADOS';
  const tituloLines = doc.splitTextToSize(titulo, contentW);
  doc.text(tituloLines, W / 2, y, { align: 'center' });
  y += tituloLines.length * 6 + 6;

  doc.line(margin, y, W - margin, y);
  y += 10;

  // ── Seção 1: Declaração de Residência ──────────────────────
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('DECLARAÇÃO DE RESIDÊNCIA', margin, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 40);

  const enderecoCompleto = [
    v(visitante.endereco),
    visitante.numero ? `nº ${visitante.numero}` : '',
    visitante.bairro ? `bairro ${visitante.bairro}` : '',
  ]
    .filter(Boolean)
    .join(', ');

  const declaracaoTexto = [
    `Eu, ${v(visitante.nome)}, portador(a) do RG ${v(visitante.rg) || '_______________'}, inscrito(s) no CPF ${v(visitante.cpf)},`,
    '',
    'DECLARO para os devidos fins de comprovação de residência, sob as penas da',
    'Lei (art. 2º da Lei 7.115/83), que sou residente e domiciliado(a) na',
    `${enderecoCompleto || '_______________________________________________'},`,
    `CEP ${v(visitante.cep) || '__________'}, na cidade de ${v(visitante.cidade) || '_______________'}, no estado de ${v(visitante.estado) || '__'}.`,
    '',
    `Declaro que exerço a função de: ${v(visitante.funcao) || '___________________________'}`,
    `Telefone: ${v(visitante.telefone) || '___________________________'}`,
  ];

  declaracaoTexto.forEach((linha) => {
    const wrapped = doc.splitTextToSize(linha, contentW);
    doc.text(wrapped, margin, y);
    y += wrapped.length * 6;
  });

  y += 6;
  doc.line(margin, y, W - margin, y);
  y += 10;

  // ── Seção 2: Termo de Autorização ──────────────────────────
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('TERMO DE AUTORIZAÇÃO DE IMAGEM E USO DE DADOS', margin, y);
  y += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const termoTexto = [
    `Eu, ${v(visitante.nome)}, inscrito(s) no CPF ${v(visitante.cpf)}, AUTORIZO a Aurora EADI —`,
    'Aurora da Amazônia Terminais e Serviços LTDA, a capturar e utilizar minha imagem e',
    'dados pessoais para fins de controle de acesso e segurança das instalações, bem como',
    'para atendimento às exigências legais e regulatórias aplicáveis à operação da EADI.',
    '',
    'Declaro estar ciente de que os dados serão tratados em conformidade com a Lei Geral',
    'de Proteção de Dados (Lei nº 13.709/2018 — LGPD), sendo utilizados exclusivamente',
    'para as finalidades acima descritas e pelo prazo necessário ao cumprimento dessas',
    'finalidades ou obrigação legal.',
  ];

  termoTexto.forEach((linha) => {
    const wrapped = doc.splitTextToSize(linha, contentW);
    doc.text(wrapped, margin, y);
    y += wrapped.length * 6;
  });

  // ── Assinatura ─────────────────────────────────────────────
  y += 12;
  const assinaturaX = margin + contentW * 0.1;
  const assinaturaW = contentW * 0.55;

  doc.line(assinaturaX, y, assinaturaX + assinaturaW, y);
  y += 5;
  doc.setFontSize(9);
  doc.text(v(visitante.nome) || 'Assinatura do Declarante', assinaturaX, y);

  y += 10;
  doc.text('Manaus, _____ de _____________________ de _________', margin, y);

  doc.save(`declaracao_${v(visitante.cpf).replace(/\D/g, '')}.pdf`);
}
