import { DI, Motorista, Veiculo, Agendamento, JanelaAtendimento } from '@/types/agendamento';

export const INITIAL_DIS: DI[] = [
  { id: 'di-1', numeroDI: '26/0894321-4', cliente: 'Global Importações e Logística Ltda', container: 'TGBU5819320', tipoContainer: "40' High Cube (HC)", status: 'liberada', pesoBruto: 24350, mercadoria: 'Inversores Solares e Placas de Silício', transportadora: 'TransÁguia Logística' },
  { id: 'di-2', numeroDI: '26/1102943-8', cliente: 'Tecnologia Avançada Brasil S.A.', container: 'MSCU8942315', tipoContainer: "40' Dry Van (DV)", status: 'liberada', pesoBruto: 18400, mercadoria: 'Componentes e Circuitos Eletrônicos', transportadora: 'Express Multimodal' },
  { id: 'di-3', numeroDI: '26/0743219-5', cliente: 'Siderúrgica Rio Grande Ltda', container: 'CMAU1049382', tipoContainer: "20' Heavy Tested (HT)", status: 'liberada', pesoBruto: 28120, mercadoria: 'Bobinas de Aço Galvanizado', transportadora: 'Rápido Paulista' },
  { id: 'di-4', numeroDI: '26/0951347-2', cliente: 'AgroComercial Sul-Sudeste', container: 'SUDU4538291', tipoContainer: "40' Reefer (RF)", status: 'bloqueada', pesoBruto: 21900, mercadoria: 'Frutas Congeladas para Exportação', transportadora: 'FrigoCargo Trans' },
  { id: 'di-5', numeroDI: '26/1230491-0', cliente: 'Indústria Química Catarinense Ltda', container: 'OOCU7738102', tipoContainer: "20' Tank (TK)", status: 'liberada', pesoBruto: 15600, mercadoria: 'Matéria-prima de Polímeros', transportadora: 'BioQuim Transporte' },
  { id: 'di-6', numeroDI: '26/0543210-9', cliente: 'AutoParts Importadora S/A', container: 'NYKU4829104', tipoContainer: "40' High Cube (HC)", status: 'bloqueada', pesoBruto: 26800, mercadoria: 'Pára-brisas e Peças de Reposição', transportadora: 'TransÁguia Logística' },
  { id: 'di-7', numeroDI: '26/1435210-2', cliente: 'Amazon Moto Peças S.A.', container: 'HERO4921038', tipoContainer: "40' High Cube (HC)", status: 'liberada', pesoBruto: 22100, mercadoria: 'Chassis de Aço e Quadros Moto', transportadora: 'TransÁguia Logística' },
  { id: 'di-8', numeroDI: '26/1529430-5', cliente: 'Philco-Semp Electronics Ltda', container: 'PANS3829014', tipoContainer: "40' Dry Van (DV)", status: 'liberada', pesoBruto: 17200, mercadoria: 'Módulos LCD, Placas e displays', transportadora: 'Express Multimodal' },
  { id: 'di-9', numeroDI: '26/0695123-1', cliente: 'FarmaNorte Medicamentos Ltda', container: 'COSU2903841', tipoContainer: "20' Reefer (RF)", status: 'liberada', pesoBruto: 14800, mercadoria: 'Insumos Ativos e Fármacos Químicos', transportadora: 'BioQuim Transporte' },
  { id: 'di-10', numeroDI: '26/1601243-7', cliente: 'Manaus Duas Rodas Montadora', container: 'CMAU1928374', tipoContainer: "40' High Cube (HC)", status: 'liberada', pesoBruto: 25900, mercadoria: 'Pneus e Amortecedores Aro 17', transportadora: 'Rápido Paulista' },
  { id: 'di-11', numeroDI: '26/1710382-3', cliente: 'Global Importações e Logística Ltda', container: 'GLDU7291048', tipoContainer: "40' Dry Van (DV)", status: 'liberada', pesoBruto: 19800, mercadoria: 'Equipamentos de Automação Industrial', transportadora: 'Express Multimodal' },
  { id: 'di-12', numeroDI: '26/1823041-6', cliente: 'Global Importações e Logística Ltda', container: 'TCKU3847291', tipoContainer: "20' Standard (GP)", status: 'liberada', pesoBruto: 12400, mercadoria: 'Ferramentas de Precisão CNC', transportadora: 'TransÁguia Logística' },
  { id: 'di-13', numeroDI: '26/1934102-9', cliente: 'Global Importações e Logística Ltda', container: 'MSDU9184037', tipoContainer: "40' High Cube (HC)", status: 'liberada', pesoBruto: 21600, mercadoria: 'Sistemas de Refrigeração Industrial', transportadora: 'Rápido Paulista' },
  { id: 'di-14', numeroDI: '26/2041293-1', cliente: 'Tecnologia Avançada Brasil S.A.', container: 'APZU4018273', tipoContainer: "40' Dry Van (DV)", status: 'liberada', pesoBruto: 16300, mercadoria: 'Servidores e Equipamentos de Rede', transportadora: 'Express Multimodal' },
  { id: 'di-15', numeroDI: '26/2103847-5', cliente: 'Tecnologia Avançada Brasil S.A.', container: 'HLCU8291047', tipoContainer: "20' Standard (GP)", status: 'liberada', pesoBruto: 9800, mercadoria: 'Câmeras e Sensores de Segurança', transportadora: 'TransÁguia Logística' },
  { id: 'di-16', numeroDI: '26/2219034-8', cliente: 'Siderúrgica Rio Grande Ltda', container: 'TRHU5039182', tipoContainer: "40' Open Top (OT)", status: 'liberada', pesoBruto: 29400, mercadoria: 'Perfis de Aço Estrutural', transportadora: 'Rápido Paulista' },
  { id: 'di-17', numeroDI: '26/2348012-2', cliente: 'Siderúrgica Rio Grande Ltda', container: 'MSCU3748201', tipoContainer: "20' Heavy Tested (HT)", status: 'liberada', pesoBruto: 27100, mercadoria: 'Chapas de Aço Inoxidável', transportadora: 'BioQuim Transporte' },
  { id: 'di-18', numeroDI: '26/2401938-7', cliente: 'AgroComercial Sul-Sudeste', container: 'SUDU1029384', tipoContainer: "40' Reefer (RF)", status: 'liberada', pesoBruto: 18700, mercadoria: 'Sementes Certificadas para Plantio', transportadora: 'FrigoCargo Trans' },
  { id: 'di-19', numeroDI: '26/2512047-0', cliente: 'Indústria Química Catarinense Ltda', container: 'OOCU4829103', tipoContainer: "20' Tank (TK)", status: 'liberada', pesoBruto: 16900, mercadoria: 'Solventes Industriais Certificados', transportadora: 'BioQuim Transporte' },
  { id: 'di-20', numeroDI: '26/2634109-4', cliente: 'AutoParts Importadora S/A', container: 'NYKU7291038', tipoContainer: "40' High Cube (HC)", status: 'liberada', pesoBruto: 23500, mercadoria: 'Motores e Câmbios Remanufaturados', transportadora: 'TransÁguia Logística' },
  { id: 'di-21', numeroDI: '26/2748302-6', cliente: 'AutoParts Importadora S/A', container: 'TCKU9018273', tipoContainer: "40' Dry Van (DV)", status: 'liberada', pesoBruto: 20100, mercadoria: 'Suspensões e Sistemas de Freio', transportadora: 'Express Multimodal' },
];

export const INITIAL_VEICULOS: Veiculo[] = [
  { id: 'veic-1', placa: 'PHO2H54', modelo: 'Volvo FH 540', tipo: 'Cavalo Mecânico + Carreta' },
  { id: 'veic-2', placa: 'OAS4J89', modelo: 'Scania R450', tipo: 'Bi-trem Porta-Container' },
  { id: 'veic-3', placa: 'JXY1A23', modelo: 'Mercedes-Benz Actros', tipo: 'Carreta de 3 Eixos' },
];

export const INITIAL_MOTORISTAS: Motorista[] = [
  { id: 'mot-1', nome: 'Raimundo Nonato da Silva', cpf: '403.921.843-12', cnh: '9081234710', telefone: '(92) 98412-4012' },
  { id: 'mot-2', nome: 'Sebastião Souza Costa', cpf: '381.042.941-88', cnh: '8491028471', telefone: '(92) 99124-5231' },
  { id: 'mot-3', nome: 'André de Oliveira Santos', cpf: '219.832.409-54', cnh: '7730912456', telefone: '(92) 98115-3209' },
];

export const DEFAULT_JANELAS_ATENDIMENTO: JanelaAtendimento[] = [
  { id: 'janela-1', descricao: 'Agendamento DTA', horaInicio: '08:00', horaFim: '12:00', intervaloMinutos: 60, vagasSimultaneas: 5 },
  { id: 'janela-2', descricao: 'Agendamento FCL', horaInicio: '13:00', horaFim: '17:00', intervaloMinutos: 60, vagasSimultaneas: 3 },
];

export const TIME_SLOTS: string[] = ['08:00','09:00','10:00','11:00','13:00','14:00','15:00','16:00','17:00'];

export const getInitialAgendamentos = (): Agendamento[] => [
  {
    id: 'book-1', diId: 'di-1', diNumero: '26/0894321-4', diCliente: 'Global Importações e Logística Ltda',
    container: 'TGBU5819320',
    motorista: { id: 'mot-1', nome: 'Raimundo Nonato da Silva', cpf: '403.921.843-12', cnh: '9081234710', telefone: '(92) 98412-4012' },
    veiculo: { id: 'veic-1', placa: 'PHO2H54', modelo: 'Volvo FH 540', tipo: 'Cavalo Mecânico + Carreta' },
    data: '2026-06-01', horario: '10:00 (Agendamento DTA)', protocolo: 'FCL-20260601-089432-A1B2',
    status: 'ATIVO' as const, criadoEm: '2026-05-29T10:00:00Z',
  },
];

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
