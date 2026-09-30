import { z } from 'zod';

export const TRANSPORTADORAS_REPLICAR = 'transportadoras.replicar' as const;

const itemSchema = z.object({
  cod_transp: z.string().nullable(),
  nomefantasia: z.string().nullable(),
  razaosocial: z.string().nullable(),
  cnpj_cpf: z.string().nullable(),
  emails: z.string().nullable(),
  telefones_contato: z.string().nullable(),
}).strict();

const eventSchema = z.object({
  eventId: z.uuid(),
  eventType: z.literal(TRANSPORTADORAS_REPLICAR),
  version: z.literal(1),
  occurredAt: z.iso.datetime(),
  source: z.literal('portal-aurora'),
  correlationId: z.uuid().nullable(),
  payload: z.object({ items: z.array(itemSchema) }).strict(),
}).strict();

export type TransportadorasReplicarEvent = z.infer<typeof eventSchema>;
export type TransportadoraReplicada = z.infer<typeof itemSchema>;

export function parseTransportadorasReplicar(input: unknown): TransportadorasReplicarEvent {
  return eventSchema.parse(input);
}
