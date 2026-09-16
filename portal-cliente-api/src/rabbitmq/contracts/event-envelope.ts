import { z } from 'zod';

export const EVENT_TYPES = {
  DIS_AVERBADA_CREATED: 'dis.averbada.created',
  AGENDAMENTO_STATUS_CHANGED: 'agendamento.status-changed',
} as const;

const envelopeSchema = z.object({
  eventId: z.uuid(),
  eventType: z.string(),
  version: z.literal(1),
  occurredAt: z.iso.datetime(),
  source: z.string().min(1),
  correlationId: z.uuid().nullable(),
  payload: z.unknown(),
});

const disAverbadaPayloadSchema = z.object({
  // Contrato Aurora v1: chave autoritativa já existente no Portal Cliente.
  // Nunca derivar de diId ou numeroDI.
  nLote: z.string().trim().min(1),
  diId: z.string().trim().min(1),
  numeroDI: z.string().trim().min(1),
  cpfMotorista: z.string().trim().min(1),
  placaVeiculo: z.string().trim().min(1),
  dtAverbacao: z.iso.datetime(),
  idContainers: z.array(z.string().trim().min(1)),
});

export const disAverbadaCreatedSchema = envelopeSchema.extend({
  eventType: z.literal(EVENT_TYPES.DIS_AVERBADA_CREATED),
  payload: disAverbadaPayloadSchema,
});

export type EventEnvelope<TPayload> = z.infer<typeof envelopeSchema> & {
  payload: TPayload;
};
export type DisAverbadaCreatedEvent = z.infer<typeof disAverbadaCreatedSchema>;

export function parseDisAverbadaCreated(input: unknown): DisAverbadaCreatedEvent {
  return disAverbadaCreatedSchema.parse(input);
}
