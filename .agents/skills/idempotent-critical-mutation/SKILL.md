---
name: idempotent-critical-mutation
description: Use ao implementar uma ação irreversível e crítica numa UI — aprovação de documento, baixa de estoque, faturamento, ou qualquer mutação financeira/operacional que não pode ser refeita sem consequência. Cobre como lidar com duplo toque, timeout e retry sem duplicar o efeito.
---

# Padrão de mutação crítica idempotente (UI)

Como lidar com uma ação de UI que dispara uma operação irreversível no backend, quando a rede
pode falhar, atrasar, ou o usuário pode tocar duas vezes por ansiedade/impaciência.

## Regras

1. **Sem retry automático em mutações críticas** (`retry: 0` na configuração da mutation) — um
   retry automático depois de uma operação irreversível pode duplicar o efeito (duas baixas, dois
   pagamentos, duas aprovações).
2. **Bloquear toques repetidos antes de chegar à rede** — desabilite o botão de confirmação
   assim que o primeiro toque for processado, antes mesmo da resposta do servidor chegar. Não
   confie só em debounce de rede.
3. **Timeout não é falha, é resultado desconhecido.** Trate timeout como um estado
   `unknown_result` distinto de `error` — a operação pode ter sido processada no servidor mesmo
   sem a resposta ter chegado ao cliente. Oriente o usuário a verificar o estado real (ex:
   recarregar a lista) em vez de simplesmente "tentar de novo", que arriscaria duplicar.
4. **Não permitir uma segunda tentativa sem que o usuário entenda o estado da primeira** — se a
   primeira tentativa terminou em `unknown_result`, a UI deve deixar isso explícito antes de
   permitir qualquer nova ação sobre o mesmo registro.
5. **Invalidar/atualizar a lista/cache somente após sucesso confirmado** — nunca otimisticamente
   para uma mutação irreversível (diferente de mutações reversíveis, onde update otimista é
   aceitável).
6. **Não inventar um header de idempotência sem que a API o documente e suporte de verdade** — um
   header de idempotência que o backend ignora silenciosamente dá falsa sensação de segurança.

## Exemplo ilustrativo

Uma tela de baixa de estoque (POST irreversível) implementou exatamente essas regras: mutation
com `retry: 0`, botão desabilitado no primeiro toque, timeout tratado como `unknown_result` com
orientação ao usuário em vez de erro genérico, e testes cobrindo especificamente o bloqueio de
envio duplicado. A lógica de negócio em si (o que significa "baixa de estoque") é específica
daquele produto — o padrão de como proteger a UI ao redor de uma mutação irreversível é o que
esta skill generaliza.

## Onde aplicar no grupo

Qualquer sistema do grupo com ações financeiras ou operacionais irreversíveis — aprovação de
documento, faturamento, baixa de estoque, confirmação de pagamento — se beneficia deste padrão.
