---
name: new-portal
description: Use ao criar um projeto React NOVO que vai consumir o Design System Orion (@design-systems-orion — tokens/ui/blocks) desde o início, com Next.js App Router ou Vite, Tailwind v4, tema por data-brand e adaptadores locais. Não use para migrar telas de um portal já existente (use orion-design-system-adoption).
---

# Criar portal novo consumindo o Orion

Se `docs/adoption/consumer-setup.md` existir no repositório atual, leia-o — é o manual canônico
de instalação. Fora desse contexto, consulte o manual em `portais-orion/design-systems-orion` no
GitHub do grupo. O portal vive em repositório separado; nunca crie um produto novo dentro do
repositório do design system.

## Sequência

1. **Confirmar fronteira e scaffold**: o portal vive em repo próprio. Escolha Next.js com App
   Router ou Vite e gere o scaffold TypeScript + Tailwind v4 CSS-first, conforme o manual; não
   crie `tailwind.config.ts` (Tailwind v4 é CSS-first).
2. **Escolher e instalar**: `tokens` é obrigatório; adicione `ui` para primitives e `blocks` para
   composições. `blocks` traz `ui` como dependency, mas todos os peers dos packages envolvidos
   continuam obrigatórios. Siga a receita do manual para o gerenciador de pacotes escolhido. Não
   use `.npmrc`, token ou scopes legados — os packages são públicos no npm.
3. **Tokens, tema e Tailwind**: no CSS global, importe Tailwind, o CSS base do design system e o
   tema; acrescente somente os `@source` dos packages escolhidos, relativos ao próprio CSS e
   apontando para `dist`. Aplique o mesmo valor de marca no CSS importado e em `data-brand` do
   `<html>` — o tema nunca é passado como prop. No Vite, configure também `@tailwindcss/vite`.
4. **Next.js**: `transpilePackages` não costuma ser necessário, já que o pacote npm entrega ESM
   compilado em `dist`. Só adicione diante de um erro específico, documentando o motivo.
5. **Adaptadores locais**: crie em `components/orion/*` somente os adaptadores dos packages
   escolhidos, reexportando apenas o que o portal usa. As telas importam esses adaptadores, nunca
   os subpaths do design system diretamente — isso isola o portal de mudanças de API internas.
6. **Smoke page**: renderize uma página pequena com um componente de cada package escolhido (ex:
   `Button` de `ui`, `PageHeader` de `blocks`), confirmando no navegador que tokens, tema e
   classes foram carregados corretamente.
7. **Validar**: execute `typecheck`, `build` e o servidor de desenvolvimento do portal.

## Convenções que o portal herda

- Domínio (rotas, APIs, permissões, entidades) não pertence ao design system — vive só no
  portal.
- Um gap genérico do Orion (algo que faltaria em qualquer consumidor) vai para o backlog do
  design system; nunca vira fork ou patch local. Uma necessidade específica de domínio permanece
  no consumidor.
- Antes de escrever markup próprio para uma tela nova, procure blocks compatíveis (`page-header`,
  `data-table`, `list-page-layout`, `empty-state`, ...) nos exports públicos do Orion.
