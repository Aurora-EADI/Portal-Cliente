---
name: orion-design-system-adoption
description: Use para migrar gradualmente uma tela de uma aplicação React existente (Next.js ou Vite) de shadcn/Radix, MUI, Chakra ou biblioteca interna para o Design System Orion (@design-systems-orion), preservando contratos de negócio, APIs, permissões e layout. Não use para redesign completo, migração em massa de uma vez, ou mudança simultânea de auth/permissões/backend/UI.
---

# Adoção gradual do Design System Orion

Migre uma fatia visual por vez. Se `docs/adoption/consumer-setup.md` existir no repositório atual,
leia-o primeiro — ele é o manual canônico de instalação (packages, peers, CSS, temas, exports
públicos). Fora desse contexto, consulte o manual em
`portais-orion/design-systems-orion` no GitHub do grupo.

## Escopo

Use em uma aplicação React existente (Next.js ou Vite) que vai substituir gradualmente
shadcn/Radix, MUI, Chakra ou uma biblioteca interna pelo Orion. Não use para redesign, migração
em massa, fluxo crítico sem ambiente real de validação, ou mudança simultânea de auth, permissões,
backend e UI — isso mistura riscos que devem ser isolados.

## Contrato invariável

Troque somente visual e composição. Preserve hooks, contratos de API, autenticação, permissões,
rotas, dados, validações, eventos e ações. A biblioteca anterior pode coexistir com o Orion até
não restar consumidor.

## Sequência operacional

1. Identifique stack, package manager, raiz do app, React/React DOM, Tailwind e scripts reais do
   `package.json`. Não presuma nada que não esteja lá.
2. Rode como baseline os gates existentes e capture (screenshot ou descrição) a tela alvo antes de
   mexer.
3. Inventarie os imports da biblioteca anterior na tela alvo e classifique cada item como
   primitive, block ou componente de domínio.
4. Preencha a matriz comportamento atual → subpath público Orion → adaptação necessária (ver
   tabela abaixo).
5. Escolha os packages necessários (`tokens` é obrigatório; `ui` para primitives; `blocks` para
   composições) e configure peers, tokens, tema e `@source` conforme o manual. Os `@source` são
   relativos ao CSS e apontam para `dist`; no Vite, configure também `@tailwindcss/vite`.
6. Crie adaptadores neutros em `components/orion/*` e migre uma única fatia de baixo risco.
7. Valide estados, eventos, acessibilidade, build e comportamento visual — compare com o baseline.
8. Procure consumidores restantes da biblioteca anterior antes de desinstalá-la.

## Matriz mínima de equivalência

Compare comportamento, estados, teclado e eventos — semelhança de nome ou aparência visual não
basta para considerar dois componentes equivalentes.

| Padrão comum em outras libs | Subpath Orion preferido | Conferir/adaptar |
| --- | --- | --- |
| header de página | `blocks/page-header` | título, ações e hierarquia |
| tabela/listagem | `blocks/data-table` | loading, vazio, ordenação e paginação |
| busca | `blocks/search-bar` | valor, mudança e limpeza |
| feedback vazio/erro | `blocks/empty-state` / `blocks/error-state` | mensagem e ação |
| botão/badge | `ui/button` / `ui/badge` | variantes, disabled e eventos |
| tabs | `ui/tabs` | seleção, foco e teclado |

Hooks, formatters, autorização, integrações e componentes de domínio permanecem no consumidor —
esta skill nunca migra lógica de negócio, só a camada visual.

## Adaptadores locais

Centralize os subpaths públicos usados e eventuais pequenas diferenças de API num único lugar:

```ts
// components/orion/ui.ts
export { Badge } from "@design-systems-orion/ui/badge";
export { Button } from "@design-systems-orion/ui/button";

// components/orion/blocks.ts
export { DataTable } from "@design-systems-orion/blocks/data-table";
export { PageHeader } from "@design-systems-orion/blocks/page-header";
```

Crie somente os adaptadores necessários à fatia em migração. Eles não copiam código do Orion, não
escondem regra de negócio e não substituem hooks ou services do próprio produto.

## Gates proporcionais ao consumidor

Leia o `package.json` do app antes de rodar qualquer comando. Para cada script realmente
declarado entre `typecheck`, `check`, `lint`, `test` e `build`, rode o mesmo comando antes e
depois da migração, usando o runner correto para o gerenciador de pacotes e a topologia do
repositório (npm/pnpm/yarn, standalone ou workspace). Não presuma `typecheck` ou `test` — se não
existirem, registre a cobertura ausente em vez de inventar um comando. Um build de produção
precisa passar para considerar a fatia pronta.

Suba o script de desenvolvimento existente com o mesmo runner e valide no navegador: loading,
vazio, erro, busca, foco, teclado e ações. Compare com a captura de baseline e confirme que
nenhum contrato de negócio mudou.

## Coexistência, remoção e rollback

Mantenha as duas bibliotecas enquanto houver imports, adaptadores, stories ou testes
consumidores da anterior. Desinstale-a somente após busca vazia, gates recuperados e smoke test.
Se a fatia falhar, reverta apenas os commits dela — não altere domínio para contornar uma
incompatibilidade visual. Uma limitação genérica do Orion (não específica deste consumidor)
pertence ao backlog do design system, nunca a um fork ou patch local.

## Checklist

- [ ] stack, package manager, scripts e baseline registrados
- [ ] imports classificados e matriz de comportamento preenchida
- [ ] packages seletivos e todos os peers correspondentes instalados
- [ ] tokens, tema, `data-brand` e `@source` para `dist` conferidos
- [ ] uma fatia de baixo risco migrada por adaptadores `components/orion/*`
- [ ] hooks, APIs, permissões, rotas, validações e ações preservados
- [ ] gates existentes repetidos; cobertura ausente registrada; build aprovado
- [ ] estados e acessibilidade validados no navegador
- [ ] consumidores restantes buscados antes de desinstalar; rollback isolado possível
