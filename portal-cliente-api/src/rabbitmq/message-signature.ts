import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Assinatura HMAC das mensagens cross-portal (Portal do Cliente ↔ Aurora).
 *
 * Antes a confiança entre os portais repousava só nas ACLs do broker e no
 * literal `source` do envelope — qualquer um com permissão de publish na
 * exchange forjava um evento válido. A assinatura amarra o conteúdo a um
 * segredo que só os dois portais conhecem (RABBITMQ_SIGNING_SECRET, o MESMO
 * valor nos dois lados).
 *
 * Desenho:
 *  - Assina-se e verifica-se sobre os BYTES do corpo, no publish e no consume
 *    centrais. O retry republica pelo mesmo publish, que re-assina sobre os
 *    bytes reais — sem dependência de preservar o header pelos saltos.
 *  - Inerte sem o segredo: sem RABBITMQ_SIGNING_SECRET não assina nem verifica.
 *  - Rollout em duas etapas: com o segredo mas sem RABBITMQ_SIGNING_ENFORCE,
 *    verifica mas só loga quando falha (transição). Com enforce, descarta.
 */
export const SIGNATURE_HEADER_NAME = 'x-signature';

export type VerifyResult = 'ok' | 'unsigned' | 'bad-signature';

function signingSecret(): string | undefined {
  const value = process.env.RABBITMQ_SIGNING_SECRET;
  return value && value.length > 0 ? value : undefined;
}

export function signingEnforced(): boolean {
  return process.env.RABBITMQ_SIGNING_ENFORCE === 'true';
}

/** HMAC-SHA256 hex do corpo, ou undefined quando a assinatura está desligada. */
export function signMessage(content: Buffer): string | undefined {
  const key = signingSecret();
  if (!key) return undefined;
  return createHmac('sha256', key).update(content).digest('hex');
}

/**
 * `unsigned` = assinatura desligada; o chamador segue como antes.
 * `bad-signature` = segredo ligado e a assinatura não bate (ou falta).
 * `ok` = confere.
 */
export function verifyMessage(content: Buffer, signature: unknown): VerifyResult {
  const key = signingSecret();
  if (!key) return 'unsigned';

  const expected = createHmac('sha256', key).update(content).digest('hex');
  if (typeof signature !== 'string') return 'bad-signature';

  const received = Buffer.from(signature, 'utf8');
  const expectedBuf = Buffer.from(expected, 'utf8');
  if (received.length !== expectedBuf.length) {
    timingSafeEqual(expectedBuf, expectedBuf);
    return 'bad-signature';
  }
  return timingSafeEqual(received, expectedBuf) ? 'ok' : 'bad-signature';
}
