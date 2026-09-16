// Server Component de proposito: notFound() so devolve status 404 de verdade
// quando corre no servidor. Em 'use client' a tela de 404 aparece, mas a
// resposta sai 200. O corpo, que depende de useAuthContext, fica no
// AverbacaoRouteClient ao lado.
import { notFound } from 'next/navigation';
import { AVERBACAO_ATIVA } from '@/config/features';
import { AverbacaoRouteClient } from './AverbacaoRouteClient';

export default function AverbacaoRoute() {
  // Averbacao ainda nao entrou em operacao: para o produto a rota nao existe.
  if (!AVERBACAO_ATIVA) notFound();

  return <AverbacaoRouteClient />;
}
