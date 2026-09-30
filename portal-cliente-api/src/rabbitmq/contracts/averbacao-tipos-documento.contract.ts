import { z } from 'zod';
import { Modalidade } from '@prisma/client';

export const AVERBACAO_TIPOS_DOCUMENTO_REPLICAR = 'averbacao.tipos-documento.replicar' as const;

const tipoSchema = z.object({
  auroraId: z.uuid(),
  modalidade: z.nativeEnum(Modalidade),
  descricao: z.string().trim().min(1),
  obrigatorio: z.boolean(),
  step: z.number().int().nonnegative().safe(),
  ativo: z.boolean(),
  ordem: z.number().int().nonnegative().safe(),
}).strict();

const eventSchema = z.object({
  eventId: z.uuid(),
  eventType: z.literal(AVERBACAO_TIPOS_DOCUMENTO_REPLICAR),
  version: z.literal(1),
  occurredAt: z.iso.datetime(),
  source: z.literal('portal-aurora'),
  correlationId: z.uuid().nullable(),
  payload: z.object({ tipos: z.array(tipoSchema) }).strict(),
}).strict();

export type AverbacaoTiposDocumentoReplicarEvent = z.infer<typeof eventSchema>;
export type TipoDocumentoReplicado = z.infer<typeof tipoSchema>;

export function parseAverbacaoTiposDocumentoReplicar(input: unknown): AverbacaoTiposDocumentoReplicarEvent {
  return eventSchema.parse(input);
}
