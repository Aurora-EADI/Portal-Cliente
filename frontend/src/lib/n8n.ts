import axios from 'axios';

interface AgendamentoWhatsappPayload {
  protocolo: string;
  data: string;
  horario: string;
  operacao?: string | null;
  placaVeiculo?: string | null;
  transportadora?: string | null;
  whatsapp: string;
}

export function notifyAgendamentoWhatsapp(payload: AgendamentoWhatsappPayload) {
  const url = process.env.AURORA_RELAY_URL;
  if (!url) return;

  axios.post(url, payload, {
    headers: { 'x-relay-secret': process.env.AURORA_RELAY_SECRET || '' },
    timeout: 5000,
  }).then(() => {
    console.log(`[aurora-relay] Webhook agendamento ${payload.protocolo} enviado`);
  }).catch((err: any) => {
    console.error('[aurora-relay] Webhook error:', err?.message ?? err);
  });
}
