import { z } from 'zod';

export const AGENDAMENTO_CANCEL_REQUESTED = 'agendamento.cancel.requested' as const;
export const AGENDAMENTO_COMMAND_COMPLETED = 'agendamento.command-completed' as const;

const actorSchema = z.object({
  id: z.string().trim().min(1),
  role: z.enum(['ADMIN', 'EMPLOYEE']),
}).strict();

const commandPayloadSchema = z.object({
  agendamentoId: z.uuid(),
  expectedAggregateVersion: z.number().int().nonnegative().safe(),
  actor: actorSchema,
}).strict();

const commandSchema = z.object({
  eventId: z.uuid(),
  eventType: z.literal(AGENDAMENTO_CANCEL_REQUESTED),
  version: z.literal(1),
  occurredAt: z.iso.datetime(),
  source: z.literal('portal-aurora'),
  correlationId: z.uuid(),
  payload: commandPayloadSchema,
}).strict();

const commandCompletedPayloadSchema = z.object({
  commandId: z.uuid(),
  commandType: z.literal(AGENDAMENTO_CANCEL_REQUESTED),
  agendamentoId: z.uuid(),
  outcome: z.literal('ALREADY_SATISFIED'),
  currentAggregateVersion: z.number().int().nonnegative().safe(),
  currentStatus: z.literal('CANCELADO'),
}).strict();

const commandCompletedSchema = z.object({
  eventId: z.uuid(),
  eventType: z.literal(AGENDAMENTO_COMMAND_COMPLETED),
  version: z.literal(1),
  occurredAt: z.iso.datetime(),
  source: z.literal('portal-cliente'),
  correlationId: z.uuid(),
  causationId: z.uuid(),
  payload: commandCompletedPayloadSchema,
}).strict();

export type AgendamentoCancelRequestedCommand = z.infer<typeof commandSchema> & { commandId: string };
export type AgendamentoCommandCompletedEvent = z.infer<typeof commandCompletedSchema>;

export function parseAgendamentoCancelRequested(input: unknown): AgendamentoCancelRequestedCommand {
  try {
    const parsed = commandSchema.parse(input);
    return { ...parsed, commandId: parsed.eventId };
  } catch {
    throw new Error('AGENDAMENTO_COMMAND_INVALID');
  }
}

export function parseAgendamentoCommandCompleted(input: unknown): AgendamentoCommandCompletedEvent {
  try {
    return commandCompletedSchema.parse(input);
  } catch {
    throw new Error('AGENDAMENTO_COMMAND_COMPLETED_INVALID');
  }
}
