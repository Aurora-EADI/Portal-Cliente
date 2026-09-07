import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

/**
 * Validação de arquivo enviado por usuário externo.
 *
 * O mimetype que chega no upload é declarado pelo cliente e não prova nada —
 * qualquer um renomeia .exe para .pdf. Por isso conferimos os magic bytes: os
 * primeiros bytes do conteúdo, que o formato define.
 *
 * Isto é defesa, não conveniência: este portal é exposto na internet.
 */

export const TAMANHO_MAXIMO_BYTES = 20 * 1024 * 1024;

/** "%PDF-" — todo PDF válido começa com esta assinatura. */
const ASSINATURA_PDF = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d]);

export function ehPdf(buffer: Buffer): boolean {
  return (
    buffer.length >= ASSINATURA_PDF.length &&
    buffer.subarray(0, ASSINATURA_PDF.length).equals(ASSINATURA_PDF)
  );
}

/**
 * Confere que o arquivo é mesmo um PDF e devolve uma key segura para o MinIO.
 *
 * O nome original nunca vira key: pode conter "../", separador de caminho,
 * caractere de controle, ou ter quilobytes. Guardamos o nome só como metadado,
 * para exibir.
 */
export function validarPdfEGerarKey(
  file: Express.Multer.File | undefined,
  prefixo: string,
): string {
  if (!file) {
    throw new BadRequestException('Nenhum arquivo enviado');
  }

  if (file.size === 0) {
    throw new BadRequestException('O arquivo está vazio');
  }

  if (file.size > TAMANHO_MAXIMO_BYTES) {
    throw new BadRequestException(
      `Arquivo maior que o limite de ${TAMANHO_MAXIMO_BYTES / (1024 * 1024)} MB`,
    );
  }

  if (!ehPdf(file.buffer)) {
    throw new BadRequestException(
      'O arquivo não é um PDF válido. Envie o documento em PDF.',
    );
  }

  return `${prefixo}/${randomUUID()}.pdf`;
}

const LIMITE_CONTROLE = 0x1f;
const DEL = 0x7f;

/**
 * Nome de exibição saneado: sem caminho, sem caractere de controle, curto.
 *
 * Filtra por codepoint em vez de regex de propósito — escrever a classe de
 * controle no fonte deixaria bytes invisíveis no arquivo.
 */
export function nomeExibicao(original: string): string {
  const semCaminho = original.split(/[\\/]/).pop() ?? 'documento.pdf';

  const limpo = Array.from(semCaminho)
    .filter((caractere) => {
      const codigo = caractere.codePointAt(0) ?? 0;
      return codigo > LIMITE_CONTROLE && codigo !== DEL;
    })
    .join('')
    .trim();

  return (limpo || 'documento.pdf').slice(0, 200);
}
