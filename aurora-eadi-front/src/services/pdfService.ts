import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AirSimulation } from '@/types/air-simulation';
import { Simulation } from '@/types/simulation';
import { ProcessoImportacao } from '@/types/dtaMaritime';
import { Inspection } from '@/services/inspections/inspections.service';
import { formatCurrency, formatNumberBR, formatDateBR, formatPercent } from '@/lib/utils';
import { calculateServiceCost } from '@/lib/calculations';
import { ServiceCalculationType, ServiceCostType } from '@/types';

const AURORA_LOGO_URL = '/logo-aurora.png';

/** Carrega uma URL de imagem externa e retorna data URL via canvas */
async function loadImageAsDataUrl(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 400;
        canvas.height = img.naturalHeight || 400;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(null); return; }
        ctx.drawImage(img, 0, 0);
        try {
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        } catch {
          resolve(null); // canvas tainted por CORS
        }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    } catch {
      resolve(null);
    }
  });
}

/** Converte uma string SVG para PNG data URL via canvas (necessário para jsPDF) */
async function svgToPngDataUrl(svgString: string, width = 400, height = 150): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(null); return; }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
      img.src = url;
    } catch {
      resolve(null);
    }
  });
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendente',
  in_progress: 'Em Andamento',
  completed: 'Concluída',
};

export const exportInspecaoToPDF = async (inspection: Inspection) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const mX = 10;

  const orange = [245, 130, 32] as [number, number, number];
  const darkGray = [51, 51, 51] as [number, number, number];
  const lightGray = [245, 247, 250] as [number, number, number];

  // ── Cabeçalho ──
  doc.setFillColor(...orange);
  doc.rect(0, 0, pageWidth, 28, 'F');

  try {
    doc.addImage(AURORA_LOGO_URL, 'PNG', mX, 7, 35, 12);
  } catch {
    doc.setFontSize(14); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold');
    doc.text('AURORA EADI', mX, 19);
  }

  doc.setFontSize(13); doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold');
  doc.text('VISTORIA DE CONTAINER', pageWidth - mX, 12, { align: 'right' });
  doc.setFontSize(8); doc.setFont('helvetica', 'normal');
  doc.text(
    `Container: ${inspection.containerNumero}  |  ${STATUS_LABEL[inspection.inspectionStatus] ?? inspection.inspectionStatus}  |  Emitido: ${new Date().toLocaleDateString('pt-BR')}`,
    pageWidth - mX, 20, { align: 'right' },
  );

  // ── Card de informações — 4 colunas, label+valor ──
  const COLS = 4;
  const ROW_H = 10;   // altura de cada linha de campos (label + valor)
  const PAD = 3;
  const fieldW = (pageWidth - mX * 2) / COLS;

  const fieldGroups: [string, string][][] = [
    [
      ['Container Nº', inspection.containerNumero],
      ['Tipo Container', inspection.containerType],
      ['Tipo Operação', inspection.tipoOperacao],
      ['Status Container', inspection.statusContainer],
    ],
    [
      ['Origem', inspection.origem || '—'],
      ['Destino', inspection.destino || '—'],
      ['Transportadora', inspection.transportadora || '—'],
      ['Condição', inspection.condicaoContainer || '—'],
    ],
    [
      ['Motorista', inspection.motorista],
      ['CPF', inspection.cpf],
      ['Placa Cavalo', inspection.placaCavalo],
      ['Placa Prancha', inspection.placaPrancha || '—'],
    ],
    [
      ['Data / Hora', new Date(inspection.dataHora).toLocaleString('pt-BR')],
      ['Inspetor', inspection.user?.name ?? '—'],
      ['Lacre', inspection.lacre || '—'],
      ['Armazenagem', inspection.localizacaoArmazenagem || '—'],
    ],
  ];

  const numRows = fieldGroups.length + (inspection.observacaoGeral ? 1 : 0);
  const cardH = numRows * ROW_H + PAD * 2;
  const cardY = 31;

  // Fundo do card
  doc.setFillColor(...lightGray);
  doc.roundedRect(mX, cardY, pageWidth - mX * 2, cardH, 2, 2, 'F');

  // Linhas divisórias horizontais entre grupos
  doc.setDrawColor(210, 213, 218);
  doc.setLineWidth(0.2);
  for (let r = 1; r < fieldGroups.length; r++) {
    const lineY = cardY + PAD + r * ROW_H - 1;
    doc.line(mX + PAD, lineY, pageWidth - mX - PAD, lineY);
  }

  // Renderizar campos
  fieldGroups.forEach((row, rowIdx) => {
    row.forEach(([label, value], colIdx) => {
      const fx = mX + colIdx * fieldW + PAD;
      const fy = cardY + PAD + rowIdx * ROW_H + 3;
      doc.setFontSize(6); doc.setFont('helvetica', 'normal'); doc.setTextColor(130, 130, 130);
      doc.text(label.toUpperCase(), fx, fy);
      doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...darkGray);
      doc.text(value, fx, fy + 4.5, { maxWidth: fieldW - PAD * 2 });
    });
  });

  // Observação geral (linha completa, se existir)
  if (inspection.observacaoGeral) {
    const obsRowY = cardY + PAD + fieldGroups.length * ROW_H + 3;
    doc.setFontSize(6); doc.setFont('helvetica', 'normal'); doc.setTextColor(130, 130, 130);
    doc.text('OBSERVAÇÃO GERAL', mX + PAD, obsRowY);
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...darkGray);
    doc.text(inspection.observacaoGeral, mX + PAD, obsRowY + 4.5, { maxWidth: pageWidth - mX * 2 - PAD * 2 });
  }

  let y = cardY + cardH + 2;

  // ── Legenda de avarias ──
  doc.setFontSize(6.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(110, 110, 110);
  doc.text('Legenda: AM=Amassado  |  QB=Quebrado  |  ST=Sujo  |  FU=Furado  |  CT=Cortado  |  FA=Faltando  |  CO=Corroído', mX, y + 3);
  y += 7;

  // ── Checklist 2×2 (lados lado a lado) ──
  const lados = inspection.lados ?? [];
  const tW = (pageWidth - mX * 2 - 4) / 2; // largura de cada mini-tabela
  const rX = mX + tW + 4;                  // X da coluna direita

  const buildSideRows = (side: typeof lados[number]) =>
    (side.itens ?? []).map((item) => {
      const avarias = (item.avarias ?? []).join(', ');
      const status = item.status ? item.status.toUpperCase() : '—';
      return [
        `${item.nome}${item.posicao ? ` (${item.posicao})` : ''}`,
        status,
        avarias || '—',
        item.observacao || '',
      ];
    });

  const sideHead = (side: typeof lados[number]) => [[
    `${side.lado}${side.inspecionado ? '' : '  ✗'}`,
    'Status', 'Avarias', 'Obs.',
  ]];

  const sideColStyles = {
    0: { cellWidth: tW * 0.44 },
    1: { cellWidth: tW * 0.16, halign: 'center' as const },
    2: { cellWidth: tW * 0.25 },
  };

  const didParseCell = (data: any) => {
    if (data.section === 'body' && data.column.index === 1) {
      const v = String(data.cell.raw ?? '');
      if (v === 'OK') data.cell.styles.textColor = [22, 163, 74];
      else if (v === 'NOK') { data.cell.styles.textColor = [220, 38, 38]; data.cell.styles.fontStyle = 'bold'; }
    }
  };

  const sidePairs: [typeof lados[number] | undefined, typeof lados[number] | undefined][] = [
    [lados[0], lados[1]],
    [lados[2], lados[3]],
  ];

  for (const [left, right] of sidePairs) {
    const pairStartY = y;

    if (left) {
      autoTable(doc, {
        startY: pairStartY,
        head: sideHead(left),
        body: buildSideRows(left),
        headStyles: { fillColor: orange, textColor: [255, 255, 255], fontSize: 7, fontStyle: 'bold', cellPadding: 1.2 },
        alternateRowStyles: { fillColor: lightGray },
        margin: { left: mX, right: pageWidth - mX - tW },
        styles: { fontSize: 7, cellPadding: 1 },
        columnStyles: sideColStyles,
        didParseCell,
      });
    }
    const leftEnd = (doc as any).lastAutoTable?.finalY ?? pairStartY;

    if (right) {
      autoTable(doc, {
        startY: pairStartY,
        head: sideHead(right),
        body: buildSideRows(right),
        headStyles: { fillColor: orange, textColor: [255, 255, 255], fontSize: 7, fontStyle: 'bold', cellPadding: 1.2 },
        alternateRowStyles: { fillColor: lightGray },
        margin: { left: rX, right: mX },
        styles: { fontSize: 7, cellPadding: 1 },
        columnStyles: sideColStyles,
        didParseCell,
      });
    }
    const rightEnd = (doc as any).lastAutoTable?.finalY ?? pairStartY;

    y = Math.max(leftEnd, rightEnd) + 3;
  }

  // ── Fotos das Avarias ──
  const itensComFoto = lados.flatMap((side) =>
    (side.itens ?? [])
      .filter((item) => item.fotos && item.fotos.length > 0)
      .map((item) => ({ ...item, lado: side.lado })),
  );

  if (itensComFoto.length > 0) {
    y += 2;
    if (y + 20 > pageHeight - 15) { doc.addPage(); y = 15; }

    doc.setFontSize(8); doc.setTextColor(...orange); doc.setFont('helvetica', 'bold');
    doc.text('FOTOS DAS AVARIAS', mX, y);
    y += 5;

    const photoSize = 55;
    const photoGap = 4;
    const photosPerRow = 3;

    for (const item of itensComFoto) {
      const validFotos = item.fotos!.filter((f) => f.url);
      if (validFotos.length === 0) continue;

      if (y + 14 + photoSize > pageHeight - 15) { doc.addPage(); y = 15; }

      doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...darkGray);
      const caption = `${item.lado} — ${item.nome}${item.posicao ? ` (${item.posicao})` : ''}${item.avarias?.length ? ' | ' + item.avarias.join(', ') : ''}`;
      doc.text(caption, mX, y);
      y += 4;

      let photoX = mX;
      let colIndex = 0;

      for (const foto of validFotos) {
        if (colIndex > 0 && colIndex % photosPerRow === 0) {
          y += photoSize + photoGap;
          photoX = mX;
          if (y + photoSize > pageHeight - 15) { doc.addPage(); y = 15; }
        }
        try {
          const dataUrl = await loadImageAsDataUrl(foto.url!);
          if (dataUrl) doc.addImage(dataUrl, 'JPEG', photoX, y, photoSize, photoSize);
        } catch { /* skip */ }
        doc.setDrawColor(200, 200, 200);
        doc.rect(photoX, y, photoSize, photoSize);
        photoX += photoSize + photoGap;
        colIndex++;
      }
      y += photoSize + photoGap + 5;
    }
  }

  // ── Assinatura ──
  if (inspection.assinatura) {
    const signatureDate = new Date(inspection.updatedAt).toLocaleString('pt-BR');
    if (y + 50 > pageHeight - 10) { doc.addPage(); y = 15; }

    y += 3;
    doc.setFontSize(8); doc.setTextColor(...orange); doc.setFont('helvetica', 'bold');
    doc.text('ASSINATURA DO MOTORISTA', mX, y);
    y += 4;
    doc.setFontSize(7.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...darkGray);
    doc.text(`Data da assinatura: ${signatureDate}`, mX, y);
    y += 3;

    const sigWidth = 90;
    const sigHeight = 35;
    doc.setDrawColor(200, 200, 200); doc.setFillColor(250, 250, 250);
    doc.roundedRect(mX, y, sigWidth, sigHeight, 2, 2, 'FD');

    const pngDataUrl = await svgToPngDataUrl(inspection.assinatura, 540, 210);
    if (pngDataUrl) {
      doc.addImage(pngDataUrl, 'PNG', mX + 2, y + 2, sigWidth - 4, sigHeight - 4);
    } else {
      doc.setFontSize(8); doc.setTextColor(150, 150, 150);
      doc.text('[Assinatura não pôde ser renderizada]', mX + 4, y + sigHeight / 2);
    }
  }

  doc.save(`Inspecao_${inspection.containerNumero}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`);
};

const getServiceDetail = (service: any): string => {
  if (service.customReason && service.customReason !== '-') {
    return service.customReason;
  }

  const rate = service.originalCost || 0;
  const calcType = service.service?.calculationType || service.calculationType;

  switch (calcType) {
    case ServiceCalculationType.PERCENTAGE_CIF:
      return `${formatNumberBR(rate, 2)}% sobre CIF`;
    case ServiceCalculationType.PER_KG:
      return `${formatCurrency(rate)} por KG`;
    case ServiceCalculationType.PER_TONNE:
      return `${formatCurrency(rate)} por Ton/M³`;
    case ServiceCalculationType.PER_CONTAINER:
      return `${formatCurrency(rate)} por CNTR`;
    case ServiceCalculationType.FIXED:
      return `${formatCurrency(rate)}`;
    default:
      return '-';
  }
};

const getServiceFinalCost = (
  service: any,
  calcData: { cifBrl: number; tonnes: number; cntrCount: number }
): number => {
  const costType = service.costType;
  const originalCost = Number(service.originalCost || 0);
  const appliedCost = Number(service.appliedCost || 0);
  const calcType = service.service?.calculationType || service.calculationType;

  if (costType === ServiceCostType.DEFAULT) {
    return calculateServiceCost(originalCost, calcType, calcData as any);
  }

  return appliedCost;
};



export const exportDtaProcessoToPDF = async (processo: ProcessoImportacao) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  const auroraOrange = [245, 130, 32];
  const auroraDarkGray = [51, 51, 51];
  const auroraLightGray = [245, 247, 250];

  // ── Cabeçalho ──
  doc.setFillColor(auroraOrange[0], auroraOrange[1], auroraOrange[2]);
  doc.rect(0, 0, pageWidth, 45, 'F');

  try {
    doc.addImage(AURORA_LOGO_URL, 'PNG', 15, 15, 45, 15);
  } catch {
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('AURORA EADI', 15, 25);
  }

  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('DTA Marítimo', pageWidth - 15, 15, { align: 'right' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`DTA: ${processo.dta}`, pageWidth - 15, 23, { align: 'right' });
  doc.text(`Emitido em: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - 15, 30, { align: 'right' });

  // ── Informações Gerais ──
  doc.setFontSize(12);
  doc.setTextColor(auroraOrange[0], auroraOrange[1], auroraOrange[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMAÇÕES GERAIS', 15, 60);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(auroraDarkGray[0], auroraDarkGray[1], auroraDarkGray[2]);

  const col1X = 15;
  const col2X = pageWidth / 2 + 10;
  let y = 68;

  doc.text(`Empresa: ${processo.empresa || '—'}`, col1X, y);
  doc.text(`Porto: ${processo.porto || '—'}`, col2X, y);
  y += 7;
  doc.text(`Navio: ${processo.navio || '—'}`, col1X, y);
  doc.text(`Transportador: ${processo.transportador || '—'}`, col2X, y);
  y += 7;
  doc.text(`Comissária: ${processo.comissaria || '—'}`, col1X, y);

  // ── Datas ──
  y += 14;
  doc.setFontSize(12);
  doc.setTextColor(auroraOrange[0], auroraOrange[1], auroraOrange[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('DATAS', 15, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(auroraDarkGray[0], auroraDarkGray[1], auroraDarkGray[2]);
  y += 8;

  doc.text(`Registro DTA: ${formatDateBR(processo.ataDta) || '—'}`, col1X, y);
  doc.text(`ATA MAO: ${formatDateBR(processo.ataMao) || '—'}`, col2X, y);
  y += 7;
  doc.text(`Chegada EADI: ${formatDateBR(processo.ataEadi) || '—'}`, col1X, y);
  doc.text(`Conclusão: ${formatDateBR(processo.conclusao) || '—'}`, col2X, y);

  // ── H/HBLs ──
  const bls = processo.bls ?? [];
  y += 14;
  doc.setFontSize(12);
  doc.setTextColor(auroraOrange[0], auroraOrange[1], auroraOrange[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(`H/HBL (${bls.length})`, 15, y);

  autoTable(doc, {
    startY: y + 4,
    head: [['#', 'Número H/HBL']],
    body: bls.length
      ? bls.map((bl, i) => [String(i + 1), bl.numero])
      : [['—', 'Nenhum H/HBL cadastrado']],
    headStyles: { fillColor: auroraOrange as any, textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: auroraLightGray as any },
    columnStyles: { 0: { cellWidth: 15 } },
    margin: { left: 15, right: 15 },
    styles: { fontSize: 9 },
  });

  // ── Containers ──
  const containers = processo.containers ?? [];
  const containersY = (doc as any).lastAutoTable.finalY + 10;

  doc.setFontSize(12);
  doc.setTextColor(auroraOrange[0], auroraOrange[1], auroraOrange[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(`CONTAINERS (${containers.length})`, 15, containersY);

  autoTable(doc, {
    startY: containersY + 4,
    head: [['#', 'Número do Container', 'Tipo']],
    body: containers.length
      ? containers.map((c, i) => [String(i + 1), c.number, c.tipo])
      : [['—', 'Nenhum container cadastrado', '']],
    headStyles: { fillColor: auroraOrange as any, textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: auroraLightGray as any },
    columnStyles: { 0: { cellWidth: 15 }, 2: { cellWidth: 25 } },
    margin: { left: 15, right: 15 },
    styles: { fontSize: 9 },
  });

  doc.save(`DTA_${processo.dta.replace(/\//g, '-')}.pdf`);
};

export const exportAirSimulationToPDF = async (simulation: AirSimulation) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Cores Aurora (Laranja e Cinza Profundo)
  const auroraOrange = [245, 130, 32];
  const auroraDarkGray = [51, 51, 51];
  const auroraLightGray = [245, 247, 250];
  
  // Cabeçalho - Faixa Laranja
  doc.setFillColor(auroraOrange[0], auroraOrange[1], auroraOrange[2]);
  doc.rect(0, 0, pageWidth, 45, 'F');

  // Adicionar Logo via URL
  try {
    // Tamanho reduzido mantendo a proporção horizontal
    doc.addImage(AURORA_LOGO_URL, 'PNG', 15, 15, 45, 15);
  } catch (e) {
    console.error('Erro ao adicionar logo ao PDF', e);
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('AURORA EADI', 15, 25);
  }

  // Título e Informações Gerais dentro da faixa (Lado direito)
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('Simulação de Custo Aéreo', pageWidth - 15, 15, { align: 'right' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Doc: ${simulation.displayNumber}`, pageWidth - 15, 22, { align: 'right' });
  doc.text(`Data: ${formatDateBR(simulation.createdAt)}`, pageWidth - 15, 28, { align: 'right' });

  // Seção 1: Dados do Cliente
  doc.setFontSize(12);
  doc.setTextColor(auroraOrange[0], auroraOrange[1], auroraOrange[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('DADOS DO CLIENTE', 15, 60);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(auroraDarkGray[0], auroraDarkGray[1], auroraDarkGray[2]);
  doc.text(`Cliente: ${simulation.customer?.name || 'Não informado'}`, 15, 68);
  doc.text(`CNPJ: ${simulation.customer?.document || 'Não informado'}`, 15, 73);

  // Seção 2: Dados da Carga
  doc.setFontSize(12);
  doc.setTextColor(auroraOrange[0], auroraOrange[1], auroraOrange[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('DADOS DA CARGA', 15, 85);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(auroraDarkGray[0], auroraDarkGray[1], auroraDarkGray[2]);
  const cargaY = 93;
  doc.text(`Valor CIF (USD): $ ${formatNumberBR(simulation.cifUsd)}`, 15, cargaY);
  doc.text(`Taxa do Dólar: R$ ${formatNumberBR(simulation.dollarRate)}`, 15, cargaY + 5);
  doc.text(`Valor CIF (R$): ${formatCurrency(simulation.cifBrl)}`, 15, cargaY + 10);
  
  const col2X = pageWidth / 2 + 10;
  doc.text(`Peso Bruto: ${formatNumberBR(simulation.weightKg)} kg`, col2X, cargaY);
  doc.text(`Volume: ${formatNumberBR(simulation.volumeM3)} m³`, col2X, cargaY + 5);
  doc.text(`Períodos Aurora (10 dias cada): ${simulation.auroraPeriods || 1}`, 15, cargaY + 15);
  doc.text(`Períodos Vinci (2 dias cada): ${simulation.vinciPeriods || 1}`, col2X, cargaY + 10);

  // Seção 3: Tabela de Serviços
  const storageRate = simulation.cifBrl > 0 
    ? ((simulation.storageCost || 0) / simulation.cifBrl) * 100 
    : 0;

  const services = [...(simulation.services || [])].sort((a, b) => 
    (a.service?.name || '').localeCompare(b.service?.name || '')
  );

  const isExcluded = (name: string | undefined): boolean => {
    if (!name) return false;
    const normalized = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
    return normalized.includes('transporte') && normalized.includes('dta');
  };

  const isStorage = (name: string | undefined): boolean => {
    if (!name) return false;
    const normalized = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
    return normalized.includes('armazenagem');
  };

  const eligibleServices = services.filter((s: any) => {
    const sName = s.service?.name || s.serviceName || '';
    return !isExcluded(sName) && !isStorage(sName);
  });

  const excludedServices = services.filter((s: any) => {
    const sName = s.service?.name || s.serviceName || '';
    return isExcluded(sName);
  });

  const eligibleServicesTotal = eligibleServices.reduce((sum: number, s: any) => sum + Number(s.appliedCost || 0), 0);
  const excludedServicesTotal = excludedServices.reduce((sum: number, s: any) => sum + Number(s.appliedCost || 0), 0);

  const tableData = [
    ...(simulation.storageCost ? [[
      'Armazenagem Aurora',
      `${formatNumberBR(storageRate, 2)}% sobre CIF`,
      formatCurrency(simulation.storageCost)
    ]] : []),
    ...eligibleServices.map((s: any) => [
      s.service?.name || 'Serviço',
      getServiceDetail(s),
      formatCurrency(s.appliedCost || 0)
    ])
  ];

  autoTable(doc, {
    startY: 115,
    head: [['Descrição do Serviço', 'Taxa/Valor', 'Valor']],
    body: tableData,
    headStyles: { 
      fillColor: auroraOrange as any,
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: { fillColor: auroraLightGray as any },
    margin: { left: 15, right: 15 },
    styles: { fontSize: 9 }
  });

  // Seção 4: Resumo da Simulação
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  
  doc.setFontSize(12);
  doc.setTextColor(auroraOrange[0], auroraOrange[1], auroraOrange[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMO DA SIMULAÇÃO', 15, finalY);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(auroraDarkGray[0], auroraDarkGray[1], auroraDarkGray[2]);
  
  const labelX = 15;
  const valueX = pageWidth - 15;
  let currentY = finalY + 10;

  // Subtotal Serviços (Aéreo exclui armazenagem no subtotal da tela)
  doc.text('Subtotal Serviços:', labelX, currentY);
  doc.text(formatCurrency(eligibleServicesTotal), valueX, currentY, { align: 'right' });

  // Armazenagem Aurora
  if (simulation.storageCost && simulation.storageCost > 0) {
    currentY += 7;
    doc.text('Armazenagem Aurora:', labelX, currentY);
    doc.text(formatCurrency(simulation.storageCost), valueX, currentY, { align: 'right' });
  }

  // Transporte DTA
  excludedServices.forEach(s => {
    currentY += 7;
    doc.text(`${s.service?.name || 'Transporte DTA'}:`, labelX, currentY);
    doc.text(formatCurrency(s.appliedCost || 0), valueX, currentY, { align: 'right' });
  });

  // Capatazia
  currentY += 7;
  doc.text('Capatazia:', labelX, currentY);
  doc.text(formatCurrency(simulation.capataziaCost || 0), valueX, currentY, { align: 'right' });

  // Armazenagem Aurora
  // Armazenagem Aurora - Removido daqui e passado para a tabela
  // if (simulation.storageCost && Number(simulation.storageCost) > 0) { ... }

  // Desconto
  if (simulation.discount && simulation.discount > 0) {
    currentY += 7;
    doc.text('Desconto Especial:', labelX, currentY);
    doc.setTextColor(200, 0, 0);
    doc.text(`- ${formatCurrency(simulation.discount)}`, valueX, currentY, { align: 'right' });
    doc.setTextColor(auroraDarkGray[0], auroraDarkGray[1], auroraDarkGray[2]);
  }

  const storageVal = Number(simulation.storageCost || 0);
  const baseForMinBilling = eligibleServicesTotal + storageVal + Number(simulation.capataziaCost || 0);
  const minBilling = Number(simulation.minBillingValue || 350);
  const diff = (baseForMinBilling < minBilling) ? minBilling - baseForMinBilling : 0;
  if (diff > 0) {
    currentY += 7;
    doc.text('Ajuste p/ Faturamento Mínimo:', labelX, currentY);
    doc.setTextColor(auroraOrange[0], auroraOrange[1], auroraOrange[2]);
    doc.text(formatCurrency(diff), valueX, currentY, { align: 'right' });
    doc.setTextColor(auroraDarkGray[0], auroraDarkGray[1], auroraDarkGray[2]);
  }

  // Total Geral
  const totalY = currentY + 15;
  doc.setDrawColor(auroraOrange[0], auroraOrange[1], auroraOrange[2]);
  doc.setLineWidth(1);
  doc.line(15, totalY - 9, pageWidth - 15, totalY - 9);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(auroraOrange[0], auroraOrange[1], auroraOrange[2]);
  doc.text('VALOR TOTAL DA SIMULAÇÃO:', 15, totalY);
  
  const discountVal = Number(simulation.discount || 0);
  const capataziaVal = Number(simulation.capataziaCost || 0);
  const totalGeneral = eligibleServicesTotal + storageVal + capataziaVal + diff + excludedServicesTotal - discountVal;
  doc.text(formatCurrency(totalGeneral), pageWidth - 15, totalY, { align: 'right' });

  // Seção 5: Comparativo de Mercado (Aurora vs Vinci)
  const comparisonY = totalY + 20;

  const getVinciStorageRate = (periods: number) => {
    if (periods <= 1) return 0.75;
    if (periods === 2) return 1.50;
    if (periods === 3) return 2.25;
    if (periods === 4) return 4.50;
    return 6.75; // 5 or more
  };

  const vinciStorageRate = getVinciStorageRate(simulation.vinciPeriods || 1);
  const vinciStorageCost = (Number(simulation.cifBrl) || 0) * (vinciStorageRate / 100);
  const capatazia = Number(simulation.capataziaCost) || 0;

  // Cálculo da Capatazia Vinci
  // 0,2598 por quilograma Cobrança mínima de R$ 55,61
  const vinciCapataziaCalc = (Number(simulation.weightKg) || 0) * 0.2598;
  const vinciCapatazia = Math.max(vinciCapataziaCalc, 55.61);
  
  // Cálculo da economia: Total Vinci (Armazenagem + Capatazia) vs Total Geral Aurora
  const vinciTotalEstimated = vinciStorageCost + vinciCapatazia;
  const auroraTotalGeneral = Number(simulation.totalGeneral) || 0;
  const savings = vinciTotalEstimated - auroraTotalGeneral;

  // Só exibe se a Aurora for mais barata (savings > 0)
  if (savings > 0) {
    doc.setFontSize(12);
    doc.setTextColor(auroraOrange[0], auroraOrange[1], auroraOrange[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('COMPARATIVO DE MERCADO', 15, comparisonY);

    const comparisonTableData = [
      ['Armazenagem', `${formatNumberBR(vinciStorageRate, 2)}% - ${formatCurrency(vinciStorageCost)}`],
      ['Capatazia (Tarifário VINCI - Base: Peso)', formatCurrency(vinciCapatazia)],
      ['TOTAL ESTIMADO (Vinci)', formatCurrency(vinciTotalEstimated)],
    ];

    autoTable(doc, {
      startY: comparisonY + 5,
      head: [['Descrição do Custo', '']],
      body: comparisonTableData,
      headStyles: { 
        fillColor: auroraDarkGray as any,
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
        1: { textColor: [100, 100, 100], fontStyle: 'bold', halign: 'right' }
      },
      alternateRowStyles: { fillColor: auroraLightGray as any },
      margin: { left: 15, right: 15 },
      styles: { fontSize: 9 }
    });

    const economyY = (doc as any).lastAutoTable.finalY + 12;
    doc.setFillColor(232, 245, 233); // Verde claro
    doc.rect(15, economyY - 6, pageWidth - 30, 10, 'F');
    doc.setFontSize(11);
    doc.setTextColor(46, 125, 50); // Verde escuro
    doc.setFont('helvetica', 'bold');
    doc.text(`ECONOMIA ESTIMADA COM A AURORA: ${formatCurrency(savings)}`, pageWidth / 2, economyY + 1, { align: 'center' });
  }

  // Rodapé
  //doc.setFontSize(8);
  //doc.setTextColor(150, 150, 150);
  //doc.text('Este documento é uma simulação sujeito a alterações.', pageWidth / 2, 285, { align: 'center' });
  //doc.text('Aurora EADI Manaus - Todos os direitos reservados.', pageWidth / 2, 290, { align: 'center' });

  // Salvar o arquivo
  doc.save(`Simulacao_Aurora_${simulation.displayNumber}.pdf`);
};

export const exportMaritimeSimulationToPDF = async (simulation: Simulation) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Cores Aurora (Laranja e Cinza Profundo)
  const auroraOrange = [245, 130, 32];
  const auroraDarkGray = [51, 51, 51];
  const auroraLightGray = [245, 247, 250];
  
  // Cabeçalho - Faixa Laranja
  doc.setFillColor(auroraOrange[0], auroraOrange[1], auroraOrange[2]);
  doc.rect(0, 0, pageWidth, 45, 'F');

  // Adicionar Logo via URL
  try {
    doc.addImage(AURORA_LOGO_URL, 'PNG', 15, 15, 45, 15);
  } catch (e) {
    console.error('Erro ao adicionar logo ao PDF', e);
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('AURORA EADI', 15, 25);
  }

  // Título e Informações Gerais dentro da faixa (Lado direito)
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('Proposta comercial', pageWidth - 15, 15, { align: 'right' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Doc: ${simulation.displayNumber}`, pageWidth - 15, 22, { align: 'right' });
  doc.text(`Data: ${formatDateBR(simulation.createdAt)}`, pageWidth - 15, 28, { align: 'right' });

  // Seção 1: Dados do Cliente
  doc.setFontSize(12);
  doc.setTextColor(auroraOrange[0], auroraOrange[1], auroraOrange[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('DADOS DO CLIENTE', 15, 60);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(auroraDarkGray[0], auroraDarkGray[1], auroraDarkGray[2]);
  doc.text(`Cliente: ${simulation.customer?.name || 'Não informado'}`, 15, 68);
  doc.text(`CNPJ: ${simulation.customer?.document || 'Não informado'}`, 15, 73);

  // Seção 2: Dados da Carga
  doc.setFontSize(12);
  doc.setTextColor(auroraOrange[0], auroraOrange[1], auroraOrange[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('DADOS DA CARGA', 15, 85);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(auroraDarkGray[0], auroraDarkGray[1], auroraDarkGray[2]);
  const cargaY = 93;
  doc.text(`Valor CIF (USD): $ ${formatNumberBR(simulation.cifUsd)}`, 15, cargaY);
  doc.text(`Taxa do Dólar: R$ ${formatNumberBR(simulation.dollarRate)}`, 15, cargaY + 5);
  doc.text(`Valor CIF (R$): ${formatCurrency(simulation.cifBrl)}`, 15, cargaY + 10);
  doc.text(`Períodos Aurora (10 dias cada): ${simulation.auroraPeriods || 1}`, 15, cargaY + 15);
  
  const col2X = pageWidth / 2 + 10;
  if (simulation.tonnes && Number(simulation.tonnes) > 0) {
    doc.text(`Tonelagem: ${formatNumberBR(simulation.tonnes, 3)} t`, col2X, cargaY);
  }
  doc.text(`Quantidade CNTR: ${simulation.cntrCount || 0}`, col2X, cargaY + 5);
  doc.text(`Tipo CNTR: ${simulation.cntrType || '-'}`, col2X, cargaY + 10);

  // Seção 3: Tabela de Serviços
  const services = [...(simulation.services || [])]
    .sort((a, b) => (a.serviceName || '').localeCompare(b.serviceName || ''));

  const calcData = {
    cifBrl: Number(simulation.cifBrl || 0),
    tonnes: Number(simulation.tonnes || 0),
    cntrCount: Number(simulation.cntrCount || 0),
  };

  const servicesWithCost = services.map((s: any) => ({
    s,
    finalCost: getServiceFinalCost(s, calcData),
  }));

  const visibleServices = servicesWithCost.filter((row: any) => Number(row.finalCost) > 0);

  const isExcluded = (name: string | undefined): boolean => {
    if (!name) return false;
    const normalized = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
    return normalized.includes('transporte') && normalized.includes('dta');
  };

  const isStorage = (name: string | undefined): boolean => {
    if (!name) return false;
    const normalized = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
    return normalized.includes('armazenagem');
  };

  const eligibleServices = visibleServices.filter(({ s }: any) => {
    const sName = s.serviceName || s.service?.name || '';
    return !isExcluded(sName);
  });

  const excludedServices = visibleServices.filter(({ s }: any) => {
    const sName = s.serviceName || s.service?.name || '';
    return isExcluded(sName);
  });

  const storageServices = eligibleServices.filter(({ s }: any) => {
    const sName = s.serviceName || s.service?.name || '';
    return isStorage(sName);
  });

  const eligibleServicesOnly = eligibleServices.filter(({ s }: any) => {
    const sName = s.serviceName || s.service?.name || '';
    return !isStorage(sName);
  });

  const eligibleServicesTotal = eligibleServices.reduce((sum: number, row: any) => sum + row.finalCost, 0);
  const excludedServicesTotal = excludedServices.reduce((sum: number, row: any) => sum + row.finalCost, 0);

  const tableData = eligibleServices.map(({ s, finalCost }: any) => [
    s.serviceName || 'Serviço',
    getServiceDetail(s),
    formatCurrency(finalCost)
  ]);

  autoTable(doc, {
    startY: 115,
    head: [['Descrição do Serviço', 'Base de Cálculo', 'Valor']],
    body: tableData,
    headStyles: { 
      fillColor: auroraOrange as any,
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: { fillColor: auroraLightGray as any },
    margin: { left: 15, right: 15 },
    styles: { fontSize: 9 }
  });

  // Seção 4: Resumo da Simulação
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  
  doc.setFontSize(12);
  doc.setTextColor(auroraOrange[0], auroraOrange[1], auroraOrange[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMO DA SIMULAÇÃO', 15, finalY);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(auroraDarkGray[0], auroraDarkGray[1], auroraDarkGray[2]);
  
  const labelX = 15;
  const valueX = pageWidth - 15;
  let currentY = finalY + 10;

  // Subtotal Serviços
  doc.text('Subtotal Serviços:', labelX, currentY);
  doc.text(formatCurrency(eligibleServicesTotal), valueX, currentY, { align: 'right' });

  // Transporte DTA
  excludedServices.forEach(({ s, finalCost }) => {
    currentY += 7;
    doc.text(`${s.serviceName || 'Transporte DTA'}:`, labelX, currentY);
    doc.text(formatCurrency(finalCost), valueX, currentY, { align: 'right' });
  });

  // Desconto
  if (simulation.discount && simulation.discount > 0) {
    currentY += 7;
    doc.text('Desconto Especial:', labelX, currentY);
    doc.setTextColor(200, 0, 0);
    doc.text(`- ${formatCurrency(simulation.discount)}`, valueX, currentY, { align: 'right' });
    doc.setTextColor(auroraDarkGray[0], auroraDarkGray[1], auroraDarkGray[2]);
  }

  const baseForMinBilling = eligibleServicesTotal; 
  const cntrCount = Number(simulation.cntrCount || 0);
  const minBillingPerCntr = Number(simulation.minBillingValue || 5500);
  const totalMinThreshold = minBillingPerCntr * cntrCount;

  const diff = (cntrCount > 0 && baseForMinBilling < totalMinThreshold)
    ? totalMinThreshold - baseForMinBilling
    : 0;

  if (diff > 0) {
    currentY += 7;
    doc.text('Diferença para Faturamento Mínimo:', labelX, currentY);
    doc.setTextColor(auroraOrange[0], auroraOrange[1], auroraOrange[2]);
    doc.text(formatCurrency(diff), valueX, currentY, { align: 'right' });
    doc.setTextColor(auroraDarkGray[0], auroraDarkGray[1], auroraDarkGray[2]);
  }

  // Total Geral
  const totalY = currentY + 15;
  doc.setDrawColor(auroraOrange[0], auroraOrange[1], auroraOrange[2]);
  doc.setLineWidth(1);
  doc.line(15, totalY - 9, pageWidth - 15, totalY - 9);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(auroraOrange[0], auroraOrange[1], auroraOrange[2]);
  doc.text('VALOR TOTAL DA PROPOSTA:', 15, totalY);
  const discountValue = Number(simulation.discount || 0);
  const totalGeneral = eligibleServicesTotal + diff + excludedServicesTotal - discountValue;
  doc.text(formatCurrency(totalGeneral), pageWidth - 15, totalY, { align: 'right' });

  // Aurora Storage Item in Summary
  // Aurora Storage Item in Summary - Removido daqui e passado para a tabela

  // Salvar o arquivo
  doc.save(`Simulacao_Aurora_${simulation.displayNumber}.pdf`);
};
