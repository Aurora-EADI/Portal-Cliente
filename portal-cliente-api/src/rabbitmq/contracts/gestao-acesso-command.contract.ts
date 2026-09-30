import { z } from 'zod';

export const GESTAO_ACESSO_COMMAND_REQUESTED = 'gestao-acesso.command.requested' as const;

const conviteRevogarPayload = z.object({
  op: z.literal('convite.revogar'),
  conviteId: z.string().trim().min(1),
}).strict();

const userSetActivePayload = z.object({
  op: z.literal('user.set-active'),
  userId: z.string().trim().min(1),
  active: z.boolean(),
}).strict();

const payloadSchema = z.discriminatedUnion('op', [
  conviteRevogarPayload,
  userSetActivePayload,
]);

const commandSchema = z.object({
  eventId: z.uuid(),
  eventType: z.literal(GESTAO_ACESSO_COMMAND_REQUESTED),
  version: z.literal(1),
  occurredAt: z.iso.datetime(),
  source: z.literal('portal-aurora'),
  correlationId: z.uuid(),
  payload: payloadSchema,
}).strict();

export type GestaoAcessoCommand = z.infer<typeof commandSchema> & { commandId: string };
export type GestaoAcessoCommandPayload = z.infer<typeof payloadSchema>;

export function parseGestaoAcessoCommand(input: unknown): GestaoAcessoCommand {
  try {
    const parsed = commandSchema.parse(input);
    return { ...parsed, commandId: parsed.eventId };
  } catch {
    throw new Error('GESTAO_ACESSO_COMMAND_INVALID');
  }
}
