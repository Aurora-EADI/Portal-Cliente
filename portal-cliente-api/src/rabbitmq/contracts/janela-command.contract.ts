import { z } from 'zod';

export const JANELA_COMMAND_REQUESTED = 'janela.command.requested' as const;

const criarPayload = z.object({
  op: z.literal('janela.criar'),
  janela: z.object({
    descricao: z.string().trim().min(1),
    horaInicio: z.string().trim().min(1),
    horaFim: z.string().trim().min(1),
    intervaloMinutos: z.number().int().positive().safe().optional(),
    vagasSimultaneas: z.number().int().positive().safe().optional(),
  }).strict(),
}).strict();

const atualizarPayload = z.object({
  op: z.literal('janela.atualizar'),
  id: z.uuid(),
  patch: z.object({
    descricao: z.string().trim().min(1).optional(),
    horaInicio: z.string().trim().min(1).optional(),
    horaFim: z.string().trim().min(1).optional(),
    intervaloMinutos: z.number().int().positive().safe().optional(),
    vagasSimultaneas: z.number().int().positive().safe().optional(),
    ativo: z.boolean().optional(),
  }).strict(),
}).strict();

const removerPayload = z.object({
  op: z.literal('janela.remover'),
  id: z.uuid(),
}).strict();

const payloadSchema = z.discriminatedUnion('op', [criarPayload, atualizarPayload, removerPayload]);

const commandSchema = z.object({
  eventId: z.uuid(),
  eventType: z.literal(JANELA_COMMAND_REQUESTED),
  version: z.literal(1),
  occurredAt: z.iso.datetime(),
  source: z.literal('portal-aurora'),
  correlationId: z.uuid(),
  payload: payloadSchema,
}).strict();

export type JanelaCommand = z.infer<typeof commandSchema> & { commandId: string };
export type JanelaCommandPayload = z.infer<typeof payloadSchema>;

export function parseJanelaCommand(input: unknown): JanelaCommand {
  try {
    const parsed = commandSchema.parse(input);
    return { ...parsed, commandId: parsed.eventId };
  } catch {
    throw new Error('JANELA_COMMAND_INVALID');
  }
}
