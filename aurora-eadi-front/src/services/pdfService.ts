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

// ── Checkbox helper ──────────────────────────────────────────────────────────
function drawCheckbox(
  doc: jsPDF,
  x: number,
  y: number,
  status: string | undefined,
  size = 4,
) {
  if (status === 'C') {
    doc.setFillColor(220, 252, 231);
    doc.rect(x, y, size, size, 'F');
    doc.setDrawColor(180, 220, 180);
    doc.rect(x, y, size, size);
    doc.setFontSize(5.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(22, 163, 74);
    doc.text('C', x + size / 2, y + size - 0.8, { align: 'center' });
  } else if (status === 'NC') {
    doc.setFillColor(254, 226, 226);
    doc.rect(x, y, size, size, 'F');
    doc.setDrawColor(220, 180, 180);
    doc.rect(x, y, size, size);
    doc.setFontSize(4); doc.setFont('helvetica', 'bold'); doc.setTextColor(220, 38, 38);
    doc.text('NC', x + size / 2, y + size - 0.8, { align: 'center' });
  } else if (status === 'NA') {
    doc.setFillColor(240, 240, 240);
    doc.rect(x, y, size, size, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.rect(x, y, size, size);
    doc.setFontSize(4); doc.setFont('helvetica', 'normal'); doc.setTextColor(130, 130, 130);
    doc.text('NA', x + size / 2, y + size - 0.8, { align: 'center' });
  } else {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(80, 80, 80);
    doc.rect(x, y, size, size);
  }
  doc.setDrawColor(0, 0, 0);
  doc.setTextColor(0, 0, 0);
}

// ── Inspeção 7/17 PDF (replica do formulário físico) ─────────────────────────
export const exportInspecao717ToPDF = async (inspection: Inspection) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const W = doc.internal.pageSize.getWidth();   // 210
  const H = doc.internal.pageSize.getHeight();  // 297
  const mX = 8;
  const cW = W - mX * 2;                        // conteúdo width ~194

  // dados 7/17
  const grp17 = (inspection.inspecao717 ?? []).find(g => g.tipo === 'veiculo_17');
  const grp7  = (inspection.inspecao717 ?? []).find(g => g.tipo === 'container_7');
  const hdr   = inspection.inspecao717Header;

  const itemMap17: Record<number, string | undefined> = {};
  (grp17?.itens ?? []).forEach(it => { itemMap17[it.numero] = it.status; });
  const itemMap7: Record<number, string | undefined> = {};
  (grp7?.itens ?? []).forEach(it => { itemMap7[it.numero] = it.status; });

  // helper: border box (draws outer page border)
  const borderColor: [number, number, number] = [60, 60, 60];

  // ── Borda externa ──
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.4);
  doc.rect(mX - 1, 5, cW + 2, H - 10);

  // ── Cabeçalho ──
  const hdrY = 6;
  // logo box
  doc.setDrawColor(...borderColor);
  doc.rect(mX - 1, hdrY, 33, 18);
  try {
    doc.addImage('/logo-aurora.png', 'PNG', mX + 1, hdrY + 2, 28, 12);
  } catch {
    doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(0);
    doc.text('AURORA EADI\nManaus', mX + 2, hdrY + 7);
  }

  // título centro
  doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(0);
  doc.text('INSPEÇÕES DOS 07 E 17 PONTOS - OEA', W / 2, hdrY + 8, { align: 'center' });
  doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  doc.text('(Operador Econômico Autorizado)', W / 2, hdrY + 13, { align: 'center' });

  // Nº box (direita)
  const numStr = `Nº ${inspection.id.slice(-6).toUpperCase()}`;
  doc.setDrawColor(...borderColor);
  doc.rect(W - mX - 26, hdrY, 26, 10);
  doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(0);
  doc.text(numStr, W - mX - 13, hdrY + 7, { align: 'center' });

  // linha divisória header
  doc.setLineWidth(0.3);
  doc.line(mX - 1, hdrY + 18, W - mX + 1, hdrY + 18);

  // ── Faixa "REGISTRAMOS..." ──
  let y = hdrY + 18;
  doc.setFontSize(6.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(0);
  doc.text(
    'REGISTRAMOS A CHEGADA A ESTE EADI DO VEÍCULO/CONTAINER CUJOS DADOS SE SEGUEM:',
    W / 2, y + 4, { align: 'center' },
  );
  doc.line(mX - 1, y + 7, W - mX + 1, y + 7);
  y += 7;

  // helper: field row with label + value underlined
  const drawField = (lbl: string, val: string, fx: number, fy: number, fw: number, fontSize = 7) => {
    doc.setFontSize(6); doc.setFont('helvetica', 'bold'); doc.setTextColor(0);
    doc.text(lbl, fx + 0.5, fy + 3.5);
    doc.setFontSize(fontSize); doc.setFont('helvetica', 'normal');
    doc.text(val, fx + doc.getTextWidth(lbl) + 2, fy + 3.5, { maxWidth: fw - doc.getTextWidth(lbl) - 2 });
  };

  const rowH = 7;

  // ── Linha DATA E HORA + TIPO ──
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.2);
  doc.line(mX - 1, y + rowH, W - mX + 1, y + rowH);
  // vertical split
  const splitX = mX - 1 + cW * 0.42;
  doc.line(splitX, y, splitX, y + rowH);

  const dataStr = new Date(inspection.dataHora).toLocaleString('pt-BR');
  drawField('DATA E HORA:', dataStr, mX, y, cW * 0.42);

  // TIPO checkboxes
  const tipoX = splitX + 2;
  doc.setFontSize(6); doc.setFont('helvetica', 'bold'); doc.setTextColor(0);
  doc.text('TIPO:', tipoX, y + 3.5);

  const tipoOp = (inspection.tipoOperacao ?? '').toLowerCase();
  const isEntrada = tipoOp.includes('entrada') || tipoOp.includes('importa');
  const isSaida   = tipoOp.includes('saida') || tipoOp.includes('exporta');
  const isImport  = tipoOp.includes('importa');
  const isExport  = tipoOp.includes('exporta');
  const isCntr    = (inspection.containerType ?? '').toLowerCase().includes('container');
  const is20      = (inspection.containerType ?? '').includes('20');
  const is40      = (inspection.containerType ?? '').includes('40');

  const drawInlineCheck = (lbl: string, checked: boolean, cx: number, cy: number) => {
    const s = 2.5;
    const p = 0.4;
    doc.setFillColor(checked ? 220 : 255, checked ? 252 : 255, checked ? 220 : 255);
    doc.setDrawColor(80); doc.setLineWidth(0.2);
    doc.rect(cx, cy, s, s, checked ? 'FD' : 'S');
    if (checked) {
      doc.setDrawColor(22, 163, 74); doc.setLineWidth(0.5);
      doc.line(cx + p, cy + p, cx + s - p, cy + s - p);
      doc.line(cx + s - p, cy + p, cx + p, cy + s - p);
      doc.setLineWidth(0.2);
    }
    doc.setFontSize(5.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(0);
    doc.text(lbl, cx + s + 0.7, cy + s - 0.3);
  };

  let cx = tipoX + 10;
  drawInlineCheck('ENTRADA',   isEntrada, cx, y + 1.5); cx += 18;
  drawInlineCheck('IMPORTAÇÃO', isImport, cx, y + 1.5); cx += 20;
  drawInlineCheck('CARRETA',  false, cx, y + 1.5); cx += 14;
  drawInlineCheck('CONTAINER', isCntr, cx, y + 1.5); cx += 18;
  drawInlineCheck('20', is20, cx, y + 1.5); cx += 8;
  drawInlineCheck('40', is40, cx, y + 1.5);

  cx = tipoX + 10;
  drawInlineCheck('SAÍDA',    isSaida, cx, y + 4.5); cx += 18;
  drawInlineCheck('EXPORTAÇÃO', isExport, cx, y + 4.5); cx += 20;
  drawInlineCheck('BAÚ', false, cx, y + 4.5); cx += 14;
  drawInlineCheck('OUTROS', false, cx, y + 4.5);

  y += rowH;

  // ── TRANSPORTADOR ──
  doc.line(mX - 1, y + rowH, W - mX + 1, y + rowH);
  drawField('TRANSPORTADOR:', inspection.transportadora ?? '—', mX, y, cW);
  y += rowH;

  // ── MOTORISTA + RG ──
  doc.line(mX - 1, y + rowH, W - mX + 1, y + rowH);
  doc.line(splitX, y, splitX, y + rowH);
  drawField('MOTORISTA:', inspection.motorista ?? '—', mX, y, cW * 0.42);
  drawField('RG:', '—', splitX + 2, y, cW * 0.58 - 2);
  y += rowH;

  // ── PLACAS ──
  doc.line(mX - 1, y + rowH, W - mX + 1, y + rowH);
  const p3 = cW / 3;
  doc.line(mX - 1 + p3, y, mX - 1 + p3, y + rowH);
  doc.line(mX - 1 + p3 * 2, y, mX - 1 + p3 * 2, y + rowH);
  drawField('PLACAS: CAVALO', inspection.placaCavalo ?? '—', mX, y, p3);
  drawField('BAÚ:', inspection.placaPrancha ?? '—', mX - 1 + p3 + 1, y, p3);
  drawField('CONTAINER:', inspection.containerNumero ?? '—', mX - 1 + p3 * 2 + 1, y, p3);
  y += rowH;

  // ── DOCUMENTO + LACRE ──
  doc.line(mX - 1, y + rowH, W - mX + 1, y + rowH);
  doc.line(splitX, y, splitX, y + rowH);
  drawField('ACOBERTADO PELO DOCUMENTO:', '—', mX, y, cW * 0.42);
  drawField('LACRE:', inspection.lacre ?? '—', splitX + 2, y, cW * 0.58 - 2);
  y += rowH;

  // ── ENTRADA SIAUM + PESO ──
  doc.line(mX - 1, y + rowH, W - mX + 1, y + rowH);
  doc.line(splitX, y, splitX, y + rowH);
  drawField('ENTRADA SIAUM:', '—', mX, y, cW * 0.42);
  drawField('PESO:', '—', splitX + 2, y, cW * 0.58 - 2);
  y += rowH;

  // ── Legenda ──
  doc.setFontSize(6); doc.setFont('helvetica', 'bold'); doc.setTextColor(0);
  doc.text('LEGENDA: C - CONFORME / NC - NÃO CONFORME / NA - NÃO SE APLICA', W / 2, y + 3.5, { align: 'center' });
  doc.line(mX - 1, y + 6, W - mX + 1, y + 6);
  y += 6;

  // ─────────────────────────────────────────────────────────────────────────────
  // ── Seção 17 pontos ──
  // ─────────────────────────────────────────────────────────────────────────────
  doc.setFontSize(8.5); doc.setFont('helvetica', 'italic'); doc.setTextColor(0);
  doc.text('A inspeção de dezessete pontos para veículos de carga compreende:', W / 2, y + 5, { align: 'center' });
  y += 7;

  // ── Caminhão: frame Figma 174 × 52 mm ──────────────────────────────────────
  // x, y = mm a partir do canto superior-esquerdo da imagem
  // Valores negativos = fora da imagem (acima ou à esquerda)
  // checkPos: 'above' | 'below' | 'left' | 'right' — onde o checkbox fica em relação ao texto
  const imgX17 = mX + 10;
  const imgW17 = cW - 20;  // 174mm
  const imgH17 = 52;
  const imgY17 = y + 14;   // espaço para labels que ficam acima da imagem

  type Label17 = { num: number; text: string; x: number; y: number; checkPos?: 'above' | 'below' | 'left' | 'right' };

  const labels17: Label17[] = [
    { num: 1,  text: '',  x:  10,  y: 38,  checkPos: 'above' },
    { num: 2,  text: '',  x:  22,  y: 44,  checkPos: 'above' },
    { num: 3,  text: '',  x:  38,  y: 52,  checkPos: 'above' },
    { num: 4,  text: '',  x:  56,  y: 46,  checkPos: 'above' },
    { num: 5,  text: '',  x:  72,  y: 50,  checkPos: 'above' },
    { num: 6,  text: '',  x:  17,  y: 9,  checkPos: 'above' },
    { num: 7,  text: '',  x:  96,  y: 45,  checkPos: 'above' },
    { num: 8,  text: '',  x:  116,  y: 58,  checkPos: 'above' },
    { num: 9,  text: '',  x:  118,  y: 46,  checkPos: 'above' },
    { num: 10, text: '',  x:  45,  y: 7,  checkPos: 'above' },
    { num: 11, text: '',  x:  143,  y: 38,  checkPos: 'above' },
    { num: 12, text: '',  x:  154,  y: 8,  checkPos: 'left'  },
    { num: 13, text: '',  x:  138,  y: 9,  checkPos: 'left'  },
    { num: 14, text: '',  x:  100,  y: 7,  checkPos: 'above'  },
    { num: 15, text: '',  x:  76,  y: 4,  checkPos: 'above'  },
    { num: 16, text: '',  x:  120,  y: 9,  checkPos: 'above'  },
    { num: 17, text: '',  x: 160, y: 35, checkPos: 'above' },
  ];

  const cbSize = 3.2;
  const lineH  = 3.5;

  // 1. Imagem primeiro — labels ficam por cima
  const truckUrl = await loadImageAsDataUrl('/caminhao.png');
  if (truckUrl) {
    doc.addImage(truckUrl, 'PNG', imgX17, imgY17, imgW17, imgH17);
  } else {
    doc.setFillColor(240, 240, 240);
    doc.rect(imgX17, imgY17, imgW17, imgH17, 'F');
    doc.setFontSize(8); doc.setTextColor(150);
    doc.text('[Imagem do caminhão]', imgX17 + imgW17 / 2, imgY17 + imgH17 / 2, { align: 'center' });
  }

  // 2. Labels e checkboxes por cima da imagem
  labels17.forEach(({ num, text, x, y: ly, checkPos = 'above' }) => {
    const px = imgX17 + x;
    const py = imgY17 + ly;
    const lines = text.split('\n');
    const textH = lines.length * lineH;

    doc.setFontSize(5); doc.setFont('helvetica', 'normal'); doc.setTextColor(0);

    if (checkPos === 'above') {
      drawCheckbox(doc, px, py - textH - cbSize - 1, itemMap17[num], cbSize);
      lines.forEach((line, i) => doc.text(line, px, py - textH + i * lineH));
    } else if (checkPos === 'below') {
      lines.forEach((line, i) => doc.text(line, px, py + i * lineH));
      drawCheckbox(doc, px, py + textH + 0.5, itemMap17[num], cbSize);
    } else if (checkPos === 'right') {
      lines.forEach((line, i) => doc.text(line, px, py + i * lineH));
      drawCheckbox(doc, px + 20, py, itemMap17[num], cbSize);
    } else {
      // left: checkbox à esquerda do texto
      drawCheckbox(doc, px, py, itemMap17[num], cbSize);
      lines.forEach((line, i) => doc.text(line, px + cbSize + 1, py + i * lineH + cbSize - 1));
    }
  });

  y = imgY17 + imgH17 + 6;

  // Descrição NC veículo
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.2);
  doc.line(mX - 1, y, W - mX + 1, y);
  doc.setFontSize(6.5); doc.setFont('helvetica', 'italic'); doc.setTextColor(0);
  doc.text('Descrição de não conformidade:', mX, y + 4);
  const ncV = grp17?.descricaoNaoConformidade ?? '';
  doc.setFont('helvetica', 'normal');
  doc.text(ncV, mX + 52, y + 4, { maxWidth: cW - 52 });
  doc.line(mX + 52, y + 5, W - mX, y + 5);
  y += 8;

  // ─────────────────────────────────────────────────────────────────────────────
  // ── Seção 7 pontos ──
  // ─────────────────────────────────────────────────────────────────────────────
  doc.setLineWidth(0.3);
  doc.line(mX - 1, y, W - mX + 1, y);
  doc.setFontSize(8.5); doc.setFont('helvetica', 'italic'); doc.setTextColor(0);
  doc.text('A inspeção de sete pontos para container de carga compreende:', W / 2, y + 5, { align: 'center' });
  y += 7;

  // ── Container: frame Figma 164 × 38 mm ──────────────────────────────────────
  // x, y = mm a partir do canto superior-esquerdo da imagem
  // Valores negativos = fora da imagem (acima ou à esquerda)
  // checkPos: 'above' | 'below' | 'left' | 'right'
  const imgX7 = mX + 15;
  const imgW7 = cW - 30;  // 164mm
  const imgH7 = 38;
  const imgY7 = y + 10;

  type Label7 = { num: number; text: string; x: number; y: number; checkPos?: 'above' | 'below' | 'left' | 'right' };

  const labels7: Label7[] = [
    { num: 1, text: '',  x:  44, y: 38, checkPos: 'right' },
    { num: 2, text: '', x:  132, y: 25, checkPos: 'right' },
    { num: 3, text: '',  x: 110, y: 1, checkPos: 'right'  },
    { num: 4, text: '',  x: 19, y: 18, checkPos: 'below' },
    { num: 5, text: '',  x:  18, y: 2, checkPos: 'left'  },
    { num: 6, text: '',  x:  50, y: 6, checkPos: 'right' },
    { num: 7, text: '',  x:  100, y: 36, checkPos: 'right' },
  ];

  // 1. Imagem primeiro — labels ficam por cima
  const cntImgUrl = await loadImageAsDataUrl('/Container.png');
  if (cntImgUrl) {
    doc.addImage(cntImgUrl, 'PNG', imgX7, imgY7, imgW7, imgH7);
  } else {
    doc.setFillColor(240, 240, 240);
    doc.rect(imgX7, imgY7, imgW7, imgH7, 'F');
    doc.setFontSize(8); doc.setTextColor(150);
    doc.text('[Imagem do container]', imgX7 + imgW7 / 2, imgY7 + imgH7 / 2, { align: 'center' });
  }

  // 2. Labels e checkboxes por cima da imagem
  labels7.forEach(({ num, text, x, y: ly, checkPos = 'above' }) => {
    const px = imgX7 + x;
    const py = imgY7 + ly;
    const lines = text.split('\n');
    const textH = lines.length * lineH;

    doc.setFontSize(5); doc.setFont('helvetica', 'normal'); doc.setTextColor(0);

    if (checkPos === 'above') {
      drawCheckbox(doc, px, py - textH - cbSize - 1, itemMap7[num], cbSize);
      lines.forEach((line, i) => doc.text(line, px, py - textH + i * lineH));
    } else if (checkPos === 'below') {
      lines.forEach((line, i) => doc.text(line, px, py + i * lineH));
      drawCheckbox(doc, px, py + textH + 0.5, itemMap7[num], cbSize);
    } else if (checkPos === 'right') {
      lines.forEach((line, i) => doc.text(line, px, py + i * lineH));
      drawCheckbox(doc, px + 20, py, itemMap7[num], cbSize);
    } else {
      // left: checkbox à esquerda do texto
      drawCheckbox(doc, px, py, itemMap7[num], cbSize);
      lines.forEach((line, i) => doc.text(line, px + cbSize + 1, py + i * lineH + cbSize - 1));
    }
  });

  y = imgY7 + imgH7 + 6;

  // Refrigerado + Ventilador
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.2);
  doc.line(mX - 1, y, W - mX + 1, y);
  y += 1;
  const refrigY = y + 4;
  doc.setFontSize(6.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(0);
  doc.text('Container refrigerado?', mX, refrigY);
  const refrigX = mX + 35;
  drawInlineCheckBig(doc, 'SIM', hdr?.containerRefrigerado === true,  refrigX,     refrigY - 3.5);
  drawInlineCheckBig(doc, 'NÃO', hdr?.containerRefrigerado === false, refrigX + 14, refrigY - 3.5);

  const ventX = W / 2 + 5;
  doc.text('CARCAÇA DO VENTILADOR OK?', ventX, refrigY);
  drawInlineCheckBig(doc, 'SIM', hdr?.carcacaVentiladorOk === true,  ventX + 50,    refrigY - 3.5);
  drawInlineCheckBig(doc, 'NÃO', hdr?.carcacaVentiladorOk === false, ventX + 64, refrigY - 3.5);
  y += 7;

  // Descrição NC container
  doc.setLineWidth(0.2);
  doc.line(mX - 1, y, W - mX + 1, y);
  doc.setFontSize(6.5); doc.setFont('helvetica', 'italic'); doc.setTextColor(0);
  doc.text('Descrição de não conformidade:', mX, y + 4);
  const ncC = grp7?.descricaoNaoConformidade ?? '';
  doc.setFont('helvetica', 'normal');
  doc.text(ncC, mX + 52, y + 4, { maxWidth: cW - 52 });
  doc.line(mX + 52, y + 5, W - mX, y + 5);
  y += 8;

  // ── VTT + Observação ──
  doc.setLineWidth(0.3);
  doc.line(mX - 1, y, W - mX + 1, y);

  const vttX = W / 2;
  doc.line(vttX, y, vttX, y + 30);

  // Observação (esquerda)
  doc.setFontSize(6.5); doc.setFont('helvetica', 'italic'); doc.setTextColor(0);
  doc.text('Observação:', mX, y + 4);
  const obsVal = hdr?.observacao717 ?? '';
  doc.setFont('helvetica', 'normal');
  doc.text(obsVal, mX, y + 9, { maxWidth: vttX - mX - 5 });

  // VTT tabela (direita)
  doc.setFontSize(6.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(0);
  doc.text('VERIFICAÇÃO DE LACRE - VTT', W / 2 + (W / 2 - mX) / 2, y + 4, { align: 'center' });
  doc.line(vttX, y + 6, W - mX + 1, y + 6);

  const vttItems = [
    'V - VISUALIZAÇÃO MECANISMO',
    'V - VERIFICAR NUMERAÇÃO',
    'T - TRACIONAR E PUXAR',
    'T - TORCER E GIRAR',
  ];
  vttItems.forEach((item, i) => {
    const iy = y + 8 + i * 5.5;
    doc.setFontSize(6); doc.setFont('helvetica', 'normal'); doc.setTextColor(0);
    doc.text(item, vttX + 2, iy + 3);
    doc.setDrawColor(80); doc.setLineWidth(0.2);
    doc.rect(W - mX - 5, iy, 4, 4);
    if (i < vttItems.length - 1) doc.line(vttX, iy + 5.5, W - mX + 1, iy + 5.5);
  });

  y += 30;

  // ── Assinaturas ──
  doc.setDrawColor(...borderColor);
  doc.setLineWidth(0.3);
  doc.line(mX - 1, y, W - mX + 1, y);
  doc.line(W / 2, y, W / 2, y + 12);

  doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(0);
  doc.text('TRANSPORTADOR', W / 4 + mX / 2, y + 8, { align: 'center' });
  doc.text('AURORA EADI', W / 2 + (W / 2 - mX) / 2, y + 8, { align: 'center' });
  y += 12;

  // ── Rodapé ──
  doc.setLineWidth(0.3);
  doc.line(mX - 1, y, W - mX + 1, y);
  doc.setFontSize(6); doc.setFont('helvetica', 'bold'); doc.setTextColor(0);
  // doc.text(
  //   'CASO HAJA VIOLAÇÃO NA UNIDADE DE CARGA INSPECIONADA, COMUNICAR AO CHEFE IMEDIATO OU AUTORIDADE COMPETENTE',
  //   W / 2, y + 4, { align: 'center' },
  // );
  doc.line(mX - 1, y + 7, W - mX + 1, y + 7);

  doc.save(`Inspecao717_${inspection.containerNumero}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`);
};

function drawInlineCheckBig(doc: jsPDF, lbl: string, checked: boolean, x: number, y: number) {
  const s = 3.5;
  const p = 0.5;
  doc.setFillColor(checked ? 220 : 255, checked ? 252 : 255, checked ? 220 : 255);
  doc.setDrawColor(80); doc.setLineWidth(0.2);
  doc.rect(x, y, s, s, checked ? 'FD' : 'S');
  if (checked) {
    doc.setDrawColor(22, 163, 74); doc.setLineWidth(0.7);
    doc.line(x + p, y + p, x + s - p, y + s - p);
    doc.line(x + s - p, y + p, x + p, y + s - p);
    doc.setLineWidth(0.2);
  }
  doc.setFontSize(6); doc.setFont('helvetica', 'normal'); doc.setTextColor(0);
  doc.text(lbl, x + s + 1, y + s - 0.5);
}

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

  // ── Fotos da Inspeção ──
  const photoGap = 4;
  const colW = (pageWidth - mX * 2 - photoGap) / 2; // ~93mm — igual largura das tabelas
  const photoH = 65;                                  // altura fixa, 4:3 landscape
  const photoRX = mX + colW + photoGap;

  type PhotoItem = { label: string; url: string };

  const renderPhotoGrid = async (items: PhotoItem[], startY: number): Promise<number> => {
    if (items.length === 0) return startY;
    let cy = startY;
    const cellH = 5 + photoH;
    for (let i = 0; i < items.length; i += 2) {
      if (cy + cellH > pageHeight - 15) { doc.addPage(); cy = 15; }
      for (let col = 0; col < 2; col++) {
        const item = items[i + col];
        if (!item) break;
        const x = col === 0 ? mX : photoRX;
        if (item.label) {
          doc.setFontSize(6.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...darkGray);
          doc.text(item.label, x, cy + 4, { maxWidth: colW });
        }
        doc.setDrawColor(200, 200, 200);
        doc.rect(x, cy + 5, colW, photoH);
        try {
          const dataUrl = await loadImageAsDataUrl(item.url);
          if (dataUrl) doc.addImage(dataUrl, 'JPEG', x, cy + 5, colW, photoH);
        } catch { /* skip */ }
      }
      cy += cellH + photoGap;
    }
    return cy;
  };

  const allFotos = inspection.fotos ?? [];
  const hasAnyPhoto =
    allFotos.some((f) => f.url) ||
    lados.some((side) => (side.itens ?? []).some((item) => (item.fotos ?? []).some((f) => f.url)));

  if (hasAnyPhoto) {
    y += 2;
    if (y + 20 > pageHeight - 15) { doc.addPage(); y = 15; }
    doc.setFontSize(8); doc.setTextColor(...orange); doc.setFont('helvetica', 'bold');
    doc.text('FOTOS DA INSPEÇÃO', mX, y);
    y += 5;

    for (const side of lados) {
      const items: PhotoItem[] = [];
      for (const f of allFotos.filter((f) => f.sideLabel === side.lado && !f.itemId && f.url)) {
        items.push({ label: 'Foto do Lado', url: f.url! });
      }
      for (const item of (side.itens ?? []).filter((item) => (item.fotos ?? []).some((f) => f.url))) {
        const label = `${item.nome}${item.posicao ? ` (${item.posicao})` : ''}${
          item.avarias?.length ? ' | ' + item.avarias.join(', ') : ''
        }`;
        for (const f of (item.fotos ?? []).filter((f) => f.url)) {
          items.push({ label, url: f.url! });
        }
      }
      if (items.length === 0) continue;

      if (y + 12 > pageHeight - 15) { doc.addPage(); y = 15; }
      doc.setFillColor(...darkGray);
      doc.rect(mX, y, pageWidth - mX * 2, 7, 'F');
      doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
      doc.text(side.lado, mX + 2, y + 5);
      y += 9;

      y = await renderPhotoGrid(items, y);
    }

    const generalItems: PhotoItem[] = allFotos
      .filter((f) => !f.sideLabel && !f.itemId && f.url)
      .map((f) => ({ label: '', url: f.url! }));
    if (generalItems.length > 0) {
      if (y + 12 > pageHeight - 15) { doc.addPage(); y = 15; }
      doc.setFillColor(100, 100, 100);
      doc.rect(mX, y, pageWidth - mX * 2, 7, 'F');
      doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
      doc.text('FOTOS GERAIS', mX + 2, y + 5);
      y += 9;
      y = await renderPhotoGrid(generalItems, y);
    }
  }

  // ── Inspeção 7/17 ──
  const grupos717 = inspection.inspecao717 ?? [];
  if (grupos717.length > 0) {
    y += 2;
    if (y + 20 > pageHeight - 15) { doc.addPage(); y = 15; }

    doc.setFontSize(8); doc.setTextColor(...orange); doc.setFont('helvetica', 'bold');
    doc.text('INSPEÇÃO 7/17 (OEA)', mX, y);
    y += 4;

    const GROUP_LABEL_717: Record<string, string> = {
      veiculo_17: '17 Pontos — Veículo de Carga',
      container_7: '7 Pontos — Container',
    };
    const STATUS_SHORT: Record<string, string> = { C: 'C', NC: 'NC', NA: 'NA' };
    const fullW = pageWidth - mX * 2;

    const headStyles717 = { fillColor: darkGray, textColor: [255, 255, 255] as [number,number,number], fontSize: 7, fontStyle: 'bold' as const, cellPadding: 1.2 };

    const didParsePaired = (data: any) => {
      if (data.section === 'body' && (data.column.index === 1 || data.column.index === 3)) {
        const v = String(data.cell.raw ?? '');
        if (v === 'C')  { data.cell.styles.textColor = [22, 163, 74]; data.cell.styles.fontStyle = 'bold'; }
        else if (v === 'NC') { data.cell.styles.textColor = [220, 38, 38]; data.cell.styles.fontStyle = 'bold'; }
        else data.cell.styles.textColor = [120, 120, 120];
      }
    };

    const pairedColStyles = {
      0: { cellWidth: fullW * 0.40 },
      1: { cellWidth: fullW * 0.10, halign: 'center' as const },
      2: { cellWidth: fullW * 0.40 },
      3: { cellWidth: fullW * 0.10, halign: 'center' as const },
    };

    const buildPairedRows = (group: typeof grupos717[number]) => {
      const rows: string[][] = [];
      for (let i = 0; i < group.itens.length; i += 2) {
        const a = group.itens[i];
        const b = group.itens[i + 1];
        rows.push([
          `${a.numero}. ${a.nome}${a.observacao ? ` — ${a.observacao}` : ''}`,
          STATUS_SHORT[a.status ?? ''] ?? '—',
          b ? `${b.numero}. ${b.nome}${b.observacao ? ` — ${b.observacao}` : ''}` : '',
          b ? (STATUS_SHORT[b.status ?? ''] ?? '—') : '',
        ]);
      }
      return rows;
    };

    for (const group of grupos717) {
      if (y + 20 > pageHeight - 15) { doc.addPage(); y = 15; }

      autoTable(doc, {
        startY: y,
        head: [
          [{ content: `${GROUP_LABEL_717[group.tipo] ?? group.tipo}  [${group.concluido ? '✓' : '…'}]`, colSpan: 4, styles: { halign: 'left' as const } }],
          ['Item', 'St.', 'Item', 'St.'],
        ],
        body: buildPairedRows(group),
        headStyles: headStyles717,
        alternateRowStyles: { fillColor: lightGray },
        margin: { left: mX, right: mX },
        styles: { fontSize: 7, cellPadding: 1 },
        columnStyles: pairedColStyles,
        didParseCell: didParsePaired,
      });
      y = (doc as any).lastAutoTable?.finalY ?? y;

      if (group.descricaoNaoConformidade) {
        y += 2;
        doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(220, 38, 38);
        doc.text(`${GROUP_LABEL_717[group.tipo]} — NC:`, mX, y + 3);
        doc.setFont('helvetica', 'normal'); doc.setTextColor(...darkGray);
        doc.text(group.descricaoNaoConformidade, mX + 48, y + 3, { maxWidth: fullW - 51 });
        y += 7;
      }
      y += 2;
    }

    const h717 = inspection.inspecao717Header;
    if (h717) {
      const headerFields: string[] = [];
      if (h717.containerRefrigerado !== undefined)
        headerFields.push(`Container Refrigerado: ${h717.containerRefrigerado ? 'Sim' : 'Não'}`);
      if (h717.carcacaVentiladorOk !== undefined)
        headerFields.push(`Carcaça Ventilador OK: ${h717.carcacaVentiladorOk ? 'Sim' : 'Não'}`);
      if (h717.observacao717)
        headerFields.push(`Obs.: ${h717.observacao717}`);
      if (headerFields.length > 0) {
        doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(110, 110, 110);
        doc.text(headerFields.join('   |   '), mX, y + 3);
        y += 6;
      }
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


const normalizeText = (value: string | undefined | null): string =>
  (value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const isGrisServiceName = (value: string | undefined | null): boolean =>
  normalizeText(value).includes('gris');

const isExcluded = (name: string | undefined): boolean => {
  if (!name) return false;
  const normalized = normalizeText(name);
  return normalized.includes('transporte') && normalized.includes('dta');
};

const isStorage = (name: string | undefined): boolean => {
  if (!name) return false;
  const normalized = normalizeText(name);
  return normalized.includes('armazenagem');
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
    ? ((simulation.storageCost || 0) / simulation.cifBrl) * 100 / Math.max(1, simulation.auroraPeriods || 1)
    : 0;

  const services = [...(simulation.services || [])].sort((a, b) => 
    (a.service?.name || '').localeCompare(b.service?.name || '')
  );
  
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
      'Armazenagem',
      `${formatNumberBR(storageRate, 2)}% sobre CIF`,
      formatCurrency(simulation.storageCost)
    ]] : []),
    ...eligibleServices.map((s: any) => {
      const sName = s.service?.name || s.serviceName || '';
      const displayName = isStorage(sName) ? 'Armazenagem' : (s.service?.name || 'Serviço');
      return [
        displayName,
        getServiceDetail(s),
        formatCurrency(s.appliedCost || 0)
      ];
    })
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
  const minBilling = Number(simulation.minBillingValue ?? 350);
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
  const periodsNum = Math.max(1, Number(simulation.auroraPeriods || 1));
  
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
    finalCost: (() => {
      const base = getServiceFinalCost(s, calcData);
      const sName = s.serviceName || s.service?.name || '';
      return (isGrisServiceName(sName) || isStorage(sName)) ? base * periodsNum : base;
    })(),
  }));

  const visibleServices = servicesWithCost.filter((row: any) => Number(row.finalCost) > 0);

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

  const tableData = eligibleServices.map(({ s, finalCost }: any) => {
    const sName = s.serviceName || s.service?.name || '';
    const displayName = isStorage(sName) ? 'Armazenagem' : (s.serviceName || 'Serviço');
    return [
      displayName,
      getServiceDetail(s),
      formatCurrency(finalCost)
    ];
  });

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
  const minBillingPerCntr = Number(simulation.minBillingValue ?? 5500);
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
