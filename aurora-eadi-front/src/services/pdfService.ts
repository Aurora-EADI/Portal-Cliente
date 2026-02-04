import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AirSimulation } from '@/types/air-simulation';
import { Simulation } from '@/types/simulation';
import { formatCurrency, formatNumberBR, formatDateBR } from '@/lib/utils';

const AURORA_LOGO_URL = '/logo-aurora.png';

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
  doc.text(`Documento: ${simulation.customer?.document || 'Não informado'}`, 15, 73);

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
  doc.text(`Períodos Aurora: ${simulation.auroraPeriods || 1}`, 15, cargaY + 15);
  doc.text(`Períodos Vinci: ${simulation.vinciPeriods || 1}`, col2X, cargaY + 10);

  // Seção 3: Tabela de Serviços
  const storageRate = simulation.cifBrl > 0 
    ? ((simulation.storageCost || 0) / simulation.cifBrl) * 100 
    : 0;

  const services = [...(simulation.services || [])].sort((a, b) => 
    (a.service?.name || '').localeCompare(b.service?.name || '')
  );

  const tableData = [
    ...services.map(s => [
      s.service?.name || 'Serviço',
      s.customReason || '-',
      formatCurrency(s.appliedCost || 0)
    ])
  ];

  autoTable(doc, {
    startY: 115,
    head: [['Descrição do Serviço', 'Observação / Base de Cálculo', 'Valor']],
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
  doc.text(formatCurrency(Number(simulation.totalServices || 0)), valueX, currentY, { align: 'right' });

  // Capatazia
  currentY += 7;
  doc.text('Capatazia:', labelX, currentY);
  doc.text(formatCurrency(simulation.capataziaCost || 0), valueX, currentY, { align: 'right' });

  // Armazenagem Aurora
  if (simulation.storageCost && Number(simulation.storageCost) > 0) {
    currentY += 7;
    doc.text(`Armazenagem Aurora (${simulation.auroraPeriods || 1} per.):`, labelX, currentY);
    doc.text(formatCurrency(simulation.storageCost), valueX, currentY, { align: 'right' });
  }

  // Desconto
  if (simulation.discount && simulation.discount > 0) {
    currentY += 7;
    doc.text('Desconto Especial:', labelX, currentY);
    doc.setTextColor(200, 0, 0);
    doc.text(`- ${formatCurrency(simulation.discount)}`, valueX, currentY, { align: 'right' });
    doc.setTextColor(auroraDarkGray[0], auroraDarkGray[1], auroraDarkGray[2]);
  }

  // Diferença Mínima (Ajuste Faturamento Mínimo)
  // Exclui Transporte DTA da base de faturamento mínimo usando lógica robusta
  const isExcluded = (name: string | undefined): boolean => {
    if (!name) return false;
    const normalized = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
    return normalized.includes('transporte') && normalized.includes('dta');
  };

  const eligibleServices = (simulation.services || []).filter(s => {
    const sName = s.service?.name || s.serviceName || '';
    return !isExcluded(sName);
  });
  
  const eligibleServicesTotal = eligibleServices.reduce((sum, s) => sum + Number(s.appliedCost || 0), 0);
  
  const baseForMinBilling = eligibleServicesTotal + Number(simulation.capataziaCost || 0);
  const minBilling = Number(simulation.minBillingValue || 350);
  if (baseForMinBilling < minBilling) {
    const diff = minBilling - baseForMinBilling;
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
  doc.text(formatCurrency(simulation.totalGeneral || 0), pageWidth - 15, totalY, { align: 'right' });

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
  // 0,2500 por quilograma Cobrança mínima de R$ 55,61
  const vinciCapataziaCalc = (Number(simulation.weightKg) || 0) * 0.25;
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
      ['Capatazia', formatCurrency(vinciCapatazia)],
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
  doc.text('Simulação de Custo EADI', pageWidth - 15, 15, { align: 'right' });
  
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
  doc.text(`Documento: ${simulation.customer?.document || 'Não informado'}`, 15, 73);

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
  doc.text(`Tonelagem: ${formatNumberBR(simulation.tonnes || 0, 3)} t`, col2X, cargaY);
  doc.text(`Quantidade CNTR: ${simulation.cntrCount || 0}`, col2X, cargaY + 5);
  doc.text(`Tipo CNTR: ${simulation.cntrType || '-'}`, col2X, cargaY + 10);
  doc.text(`Períodos Aurora: ${simulation.auroraPeriods || 1}`, 15, cargaY + 15);

  // Seção 3: Tabela de Serviços
  const storageRate = simulation.cifBrl > 0 
    ? ((simulation.storageCost || 0) / simulation.cifBrl) * 100 
    : 0;

  const services = [...(simulation.services || [])].sort((a, b) => 
    (a.serviceName || '').localeCompare(b.serviceName || '')
  );

  const tableData = [
    ...services.map(s => [
      s.serviceName || 'Serviço',
      s.customReason || '-',
      formatCurrency(s.appliedCost || 0)
    ])
  ];

  autoTable(doc, {
    startY: 115,
    head: [['Descrição do Serviço', 'Observação / Base de Cálculo', 'Valor']],
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
  doc.text(formatCurrency(Number(simulation.totalServices || 0)), valueX, currentY, { align: 'right' });

  // Desconto
  if (simulation.discount && simulation.discount > 0) {
    currentY += 7;
    doc.text('Desconto Especial:', labelX, currentY);
    doc.setTextColor(200, 0, 0);
    doc.text(`- ${formatCurrency(simulation.discount)}`, valueX, currentY, { align: 'right' });
    doc.setTextColor(auroraDarkGray[0], auroraDarkGray[1], auroraDarkGray[2]);
  }

  // Diferença Mínima (Ajuste Faturamento Mínimo)
  // Exclui Transporte DTA da base de faturamento mínimo usando lógica robusta
  const isExcluded = (name: string | undefined): boolean => {
    if (!name) return false;
    const normalized = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
    return normalized.includes('transporte') && normalized.includes('dta');
  };

  const eligibleServices = (simulation.services || []).filter(s => {
    const sName = s.serviceName || s.service?.name || '';
    return !isExcluded(sName);
  });
  
  const eligibleServicesTotal = eligibleServices.reduce((sum, s) => sum + Number(s.appliedCost || 0), 0);
  
  const baseForMinBilling = eligibleServicesTotal; 
  const cntrCount = Number(simulation.cntrCount || 0);
  const minBillingPerCntr = Number(simulation.minBillingValue || 5500);
  const totalMinThreshold = minBillingPerCntr * cntrCount;

  if (cntrCount > 0 && baseForMinBilling < totalMinThreshold) {
    const diff = totalMinThreshold - baseForMinBilling;
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
  doc.text(formatCurrency(simulation.totalGeneral || 0), pageWidth - 15, totalY, { align: 'right' });

  // Aurora Storage Item in Summary
  if (simulation.storageCost && Number(simulation.storageCost) > 0) {
    currentY += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(auroraDarkGray[0], auroraDarkGray[1], auroraDarkGray[2]);
    doc.text(`Armazenagem Aurora (${simulation.auroraPeriods || 1} per.):`, labelX, currentY);
    doc.text(formatCurrency(simulation.storageCost), valueX, currentY, { align: 'right' });
  }

  // Salvar o arquivo
  doc.save(`Simulacao_Aurora_${simulation.displayNumber}.pdf`);
};
