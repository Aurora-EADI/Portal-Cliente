import { z } from 'zod';

export const AVERBACAO_COMMAND_REQUESTED = 'averbacao.command.requested' as const;

const documentoAprovarPayload = z.object({
  op: z.literal('documento.aprovar'),
  documentoId: z.uuid(),
  analisadoPor: z.string().trim().min(1),
}).strict();

const documentoRejeitarPayload = z.object({
  op: z.literal('documento.rejeitar'),
  documentoId: z.uuid(),
  analisadoPor: z.string().trim().min(1),
  motivo: z.string().trim().min(1),
}).strict();

const processoDevolverPayload = z.object({
  op: z.literal('processo.devolver'),
  processoId: z.uuid(),
  devolvidoPor: z.string().trim().min(1),
  motivo: z.string().trim().min(1),
}).strict();

const payloadSchema = z.discriminatedUnion('op', [
  documentoAprovarPayload,
  documentoRejeitarPayload,
  processoDevolverPayload,
]);

const commandSchema = z.object({
  eventId: z.uuid(),
  eventType: z.literal(AVERBACAO_COMMAND_REQUESTED),
  version: z.literal(1),
  occurredAt: z.iso.datetime(),
  source: z.literal('portal-aurora'),
  correlationId: z.uuid(),
  payload: payloadSchema,
}).strict();

export type AverbacaoCommand = z.infer<typeof commandSchema> & { commandId: string };
export type AverbacaoCommandPayload = z.infer<typeof payloadSchema>;

export function parseAverbacaoCommand(input: unknown): AverbacaoCommand {
  try {
    const parsed = commandSchema.parse(input);
    return { ...parsed, commandId: parsed.eventId };
  } catch {
    throw new Error('AVERBACAO_COMMAND_INVALID');
  }
}
