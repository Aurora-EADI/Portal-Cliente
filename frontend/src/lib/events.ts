import { EventEmitter } from 'events';

// Pub/sub interno em memoria - funciona porque as rotas SSE e as rotas que
// gravam Agendamento/DiAverbada rodam no mesmo processo Node (runtime = 'nodejs').
// So funciona com 1 instancia/1 container.
//
// Cache em globalThis (mesmo padrao do lib/prisma.ts) pra sobreviver ao
// hot-reload do "next dev", que re-executa modulos e quebraria o singleton.

const globalForEvents = globalThis as unknown as {
  agendamentoEvents?: EventEmitter;
  disAverbadaEvents?: EventEmitter;
};

export const agendamentoEvents = globalForEvents.agendamentoEvents ?? new EventEmitter();
export const disAverbadaEvents = globalForEvents.disAverbadaEvents ?? new EventEmitter();

agendamentoEvents.setMaxListeners(0);
disAverbadaEvents.setMaxListeners(0);

if (process.env.NODE_ENV !== 'production') {
  globalForEvents.agendamentoEvents = agendamentoEvents;
  globalForEvents.disAverbadaEvents = disAverbadaEvents;
}
