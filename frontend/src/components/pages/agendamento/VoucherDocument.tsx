'use client';

import React from 'react';
import { CheckCircle } from 'lucide-react';
import { Agendamento } from '@/types/agendamento';

export function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

export function formatCnpj(value?: string | null) {
  if (!value) return value ?? undefined;
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 14) return value;
  return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

export function formatPhone(value?: string | null) {
  if (!value) return value ?? undefined;
  const digits = value.replace(/\D/g, '');
  if (digits.length === 11) return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  if (digits.length === 10) return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  return value;
}

export function SectionBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-4 sm:mx-8 mb-3 border border-zinc-300 rounded-md overflow-hidden">
      <div className="bg-zinc-100 px-3 py-1.5 border-b border-zinc-300">
        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">▸ {title}</p>
      </div>
      <div className="px-3 py-2.5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">{children}</div>
    </div>
  );
}

export function Row({ label, value, mono, full }: { label: string; value?: string | null; mono?: boolean; full?: boolean }) {
  if (!value) return null;
  return (
    <p className={`text-xs text-zinc-800 leading-relaxed ${full ? 'col-span-2' : ''}`}>
      <span className="font-bold text-zinc-500">{label}:</span>{' '}
      <span className={mono ? 'font-mono' : 'font-semibold'}>{value}</span>
    </p>
  );
}

export const VoucherDocument = React.forwardRef<HTMLDivElement, { booking: Agendamento }>(function VoucherDocument({ booking }, ref) {
  const join = (v?: string | string[]) => (v ? (Array.isArray(v) ? v.join(', ') : v) : undefined);
  const awb = join(booking.awbMawb);
  const dta = join(booking.dta);
  const hawb = join(booking.hawb);
  const di = join(booking.di);

  return (
    <div ref={ref} className="bg-white border border-zinc-300 overflow-hidden shadow-xl">
      {/* Cabeçalho */}
      <div className="px-4 sm:px-8 py-5 border-b-2 border-zinc-800 flex items-center justify-between flex-wrap gap-3">
        <img src="/logo-aurora.png" alt="Aurora" width={130} height={44} className="object-contain shrink-0" />
        <div className="text-right">
          <p className="text-base sm:text-lg font-black text-zinc-900 uppercase tracking-wide leading-tight">Ordem de Coleta Agendada</p>
          <p className="text-[11px] text-zinc-400">Portal do Cliente · Aurora EADI</p>
        </div>
      </div>

      {/* Barra Ticket / Agendado para */}
      <div className="px-4 sm:px-8 py-3 bg-zinc-900 flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-[10px] text-[#ED6A23] font-bold uppercase tracking-widest">Ticket</p>
          <p className="text-xl text-white font-mono font-black tracking-widest leading-none">{booking.protocolo}</p>
        </div>
        <p className="text-[11px] text-zinc-300 font-bold uppercase tracking-wider">
          Agendado para: <span className="text-white">{formatDate(booking.data)} {booking.horario}</span>
        </p>
      </div>

      {/* Status */}
      <div className="px-4 sm:px-8 py-3 bg-emerald-50 border-b border-emerald-100 flex items-center gap-3">
        <div className="w-7 h-7 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
        </div>
        <p className="text-xs font-bold text-emerald-800">Agendamento confirmado — registrado com sucesso no sistema.</p>
      </div>

      <div className="pt-4">
        <SectionBox title="Carga Agendada">
          <Row label="Data" value={formatDate(booking.data)} />
          <Row label="Horário" value={booking.horario} />
          <Row label="Operação" value={booking.operacao ?? undefined} />
          <Row label="SubOperação" value={booking.subOperacao ?? undefined} />
          <Row label="Prioridade" value={booking.prioridade ?? undefined} />
          <Row label="Carga Especial" value={booking.cargaEspecial ? 'Sim' : undefined} />
          <Row label="Serviços" value={booking.servicos?.length ? booking.servicos.join(', ') : undefined} full />
        </SectionBox>

        <SectionBox title="Documentos">
          <Row label="D.I" mono value={booking.diNumero || di} />
          <Row label="Container" mono value={booking.container ?? undefined} />
          <Row label="AWB / MAWB" mono value={awb} />
          <Row label="HAWB" mono value={hawb} />
          <Row label="DTA" mono value={dta} />
          <Row label="Nº Voo" mono value={booking.numeroVoo ?? undefined} />
          <Row label="Volumes" value={booking.volumes ?? undefined} />
          <Row label="Peso" value={booking.peso ?? undefined} />
        </SectionBox>

        <SectionBox title="Dados do Cliente">
          <Row label="Empresa" value={booking.empresa ?? undefined} full />
          <Row label="CNPJ" mono value={formatCnpj(booking.cnpjCliente)} />
          <Row label="Telefone" mono value={formatPhone(booking.telefoneCliente)} />
          <Row label="Endereço" value={booking.enderecoCliente ?? undefined} full />
          <Row label="Email" value={booking.emailCliente ?? undefined} full />
          <Row label="Consignatário" value={booking.consignatario ?? undefined} full />
        </SectionBox>

        <SectionBox title="Dados da Transportadora">
          <Row label="Transportadora" value={booking.transportadora ?? undefined} full />
          <Row label="CNPJ" mono value={formatCnpj(booking.cnpjTransportadora)} />
          <Row label="Telefone" mono value={formatPhone(booking.telefoneTransportadora)} />
          <Row label="Endereço" value={booking.enderecoTransportadora ?? undefined} full />
          <Row label="Email" value={booking.emailTransportadora ?? undefined} full />
        </SectionBox>

        <SectionBox title="Dados do Motorista e Veículo">
          <Row label="Motorista" value={booking.motorista?.nome} full />
          <Row label="CPF" mono value={booking.motorista?.cpf} />
          <Row label="CNH" mono value={booking.motorista?.cnh} />
          <Row label="Telefone" mono value={formatPhone(booking.motorista?.telefone)} />
          <Row label="Placa" mono value={booking.veiculo?.placa} />
          <Row label="Veículo" value={booking.veiculo?.tipo || booking.veiculo?.modelo} full />
        </SectionBox>

        {booking.observacao && (
          <SectionBox title="Informações Adicionais">
            <Row label="Observações" value={booking.observacao} full />
          </SectionBox>
        )}
      </div>

      <div className="px-4 sm:px-8 py-3 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between flex-wrap gap-1">
        <p className="text-[10px] text-zinc-400">Aurora EADI — Terminal de Cargas © {new Date().getFullYear()}. Todos os direitos reservados.</p>
        <p className="text-[10px] text-zinc-400">Emitido em {new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</p>
      </div>
    </div>
  );
});

export async function downloadVoucherPdf(el: HTMLDivElement, protocolo: string) {
  const html2canvas = (await import('html2canvas')).default;
  const { jsPDF } = await import('jspdf');
  await Promise.all(Array.from(el.querySelectorAll('img')).map(img =>
    img.complete ? Promise.resolve() : new Promise(resolve => { img.onload = resolve; img.onerror = resolve; })
  ));
  const origWidth = el.style.width;
  el.style.width = '800px';
  const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff', width: 800, useCORS: true });
  el.style.width = origWidth;
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const margin = 15;
  const pdfWidth = pdf.internal.pageSize.getWidth() - margin * 2;
  const imgHeight = (canvas.height * pdfWidth) / canvas.width;
  pdf.addImage(imgData, 'PNG', margin, margin, pdfWidth, imgHeight);
  pdf.save(`agendamento-${protocolo}.pdf`);
}
