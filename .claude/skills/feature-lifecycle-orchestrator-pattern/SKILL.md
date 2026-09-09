---
name: feature-lifecycle-orchestrator-pattern
description: Use ao estruturar como um agente principal orquestra múltiplos especialistas de camada (domínio, dados, backend, frontend, review, QA) para implementar uma feature ponta a ponta num monorepo. Padrão arquitetural de orquestração multi-agente, não um catálogo de agentes específicos de um produto.
---

# Padrão de orquestração de ciclo de vida de feature

Um padrão observado num monorepo do grupo para coordenar múltiplos especialistas de IA (agentes
de papel fixo, um por camada) na implementação de uma feature completa. Esta skill descreve o
PADRÃO — cada projeto que a adote define seus próprios especialistas concretos; nenhum nome de
agente específico de produto pertence aqui.

## Por que separar em especialistas com contexto isolado

Um agente de review, por exemplo, não deve herdar o raciocínio de quem escreveu o código — senão
perde a isenção que faz o review valer a pena. Passos que envolvem julgamento próprio (domínio,
implementação, review, QA) se beneficiam de rodar com contexto isolado de quem executou os passos
anteriores. Passos que são checklists determinísticas (não papéis) não precisam desse isolamento
— podem ser uma skill/procedimento comum, invocado inline.

## Estrutura recomendada

1. **Especialistas de papel fixo, um por camada** — cada um documentado em um arquivo Markdown
   puro (sem sintaxe proprietária de nenhum agente específico), para que qualquer agente de IA
   consiga lê-lo e segui-lo como instrução de papel, não só uma ferramenta específica.
2. **Wrapper fino por agente de IA usado**, se a ferramenta suportar subagentes com contexto
   isolado — o wrapper aponta para o arquivo de instrução comum e só adiciona a restrição de
   ferramentas apropriada ao papel (ex: um especialista de review deveria ser só-leitura). O
   wrapper nunca duplica o conteúdo normativo — mudar uma regra do especialista significa editar
   um único arquivo, nunca dois lugares.
3. **Em qualquer agente sem mecanismo de subagente isolado**, o mesmo arquivo de instrução é lido
   e seguido inline, na mesma ordem canônica — o padrão não depende de uma ferramenta específica.

## Ordem canônica de execução (E2E) — genérica

A ordem abaixo é a forma observada de sequenciar uma feature ponta a ponta; adapte os nomes de
camada ao que o projeto realmente tem:

1. **Domínio** — validar estados, fluxos e invariantes de produto antes de qualquer código.
2. **Dados** — mudança de schema, se houver (ver `prisma-schema-change` quando aplicável). Gate
   de mudança destrutiva antes de prosseguir.
3. **Permissões/catálogo** — registrar o que a feature expõe, se o projeto tiver um catálogo de
   permissões (ver `permission-catalog-pattern`).
4. **Backend** — implementação, com testes em paralelo ou antes (TDD).
5. **Frontend** — implementação, com testes em paralelo ou antes; se o projeto usa um design
   system compartilhado, valide a conformidade antes do review.
6. **Passos condicionais** — observabilidade, integrações externas, auditoria: só quando o
   escopo da feature realmente os exige, não em toda feature.
7. **Code review** — avaliação somente-leitura em dois eixos (conformidade com padrões do
   projeto / fidelidade ao que foi pedido), antes de considerar a feature pronta.
8. **QA e verificação final** — lint, typecheck, build, e qualquer checagem de drift, antes de
   push/deploy (ver `pre-deploy-check`). Se algo falhar, o papel de QA reporta qual camada deve
   corrigir — ele mesmo não edita código de outras camadas.

## O que fica fora deste padrão

A lista concreta de especialistas de um projeto (seus nomes, seus arquivos, quais camadas
condicionais ele usa) é decisão de cada projeto — documentada no próprio projeto, não nesta
skill. O que esta skill fixa é a forma (orquestrador + especialistas de papel fixo com wrapper
fino + ordem canônica), não o conteúdo de cada especialista.
