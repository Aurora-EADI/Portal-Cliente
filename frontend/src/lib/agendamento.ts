import { JanelaAtendimento } from '@/types/agendamento';

export const TIME_SLOTS: string[] = ['08:00','09:00','10:00','11:00','13:00','14:00','15:00','16:00','17:00'];

export const gerarSlotsDeJanela = (janela: JanelaAtendimento) => {
  const slots: { horario: string; descricao: string; vagasTotais: number; janelaId: string }[] = [];
  const parseTimeToMinutes = (t: string): number => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const minutesToTimeStr = (n: number): string => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
  const startMin = parseTimeToMinutes(janela.horaInicio);
  const endMin = parseTimeToMinutes(janela.horaFim);
  const interval = janela.intervaloMinutos || 60;
  if (startMin >= endMin || interval <= 0) return slots;
  for (let cur = startMin; cur <= endMin; cur += interval) {
    slots.push({ horario: minutesToTimeStr(cur), descricao: janela.descricao, vagasTotais: janela.vagasSimultaneas, janelaId: janela.id });
  }
  return slots;
};

export const formatCPF = (value: string): string => {
  const d = value.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`;
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
};

export const formatPhone = (value: string): string => {
  const d = value.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0,2)}) ${d.slice(2)}`;
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
};

export const formatPlaca = (value: string): string => value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);

export const formatCNPJ = (value: string): string => {
  const d = value.replace(/\D/g, '').slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
};
