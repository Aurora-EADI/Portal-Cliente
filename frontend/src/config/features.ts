/**
 * Chaves de funcionalidade do portal.
 *
 * Averbação Aduaneira (processos + procurações) ainda não entrou em operação.
 * Enquanto estiver desligada, o módulo não aparece na navegação, as rotas
 * respondem 404 e o agendamento volta a valer só pela regra legada do Portal
 * Aurora — que é como a main operava antes de 7d59329.
 *
 * O default é desligado de propósito: quem esquecer de definir a env não liga a
 * feature por acidente.
 *
 * NEXT_PUBLIC_* é inlinado no build do Next, então a imagem de produção precisa
 * receber o valor como build arg — env só de runtime não chega no bundle.
 */
export const AVERBACAO_ATIVA = process.env.NEXT_PUBLIC_AVERBACAO_ATIVA === 'true';
