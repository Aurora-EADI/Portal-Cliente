---
name: nextjs-app-router-patterns
description: Use ao criar ou alterar uma página/tela num portal Next.js (App Router) do grupo Orion. Cobre convenções de Server Component, registro de rota espelhado front/back, guards de permissão e integração com feature flags.
---

# Padrões de frontend Next.js App Router

Convenções observadas em portais Next.js 15+ do grupo. Não define o Design System (ver
`orion-design-system-guardian` quando o projeto usa o Orion) nem a estrutura de módulo de
backend (ver `nestjs-prisma-patterns`) — cobre especificamente a camada de página/rota.

## Server Component por padrão

Server Component é o padrão. Adicione `'use client'` só quando a tela realmente precisar de
estado interativo, hooks de cliente ou handlers de evento. Uma página inteira marcada como client
component "por garantia" perde os benefícios de streaming e bundle menor do App Router sem
necessidade real.

## Registro de rota espelhado frontend/backend

Em mais de um portal do grupo, uma rota nova precisa ser registrada em dois lugares: a
configuração de navegação/rotas do frontend E o registry de rotas disponíveis do backend (usado
para checagem de permissão). Ao adicionar uma página nova, verifique se o projeto tem esse
padrão de registro espelhado — um dos dois lados esquecido é uma causa comum de "a rota existe
mas o menu não mostra" ou "o menu mostra mas a API rejeita".

## Guards de permissão

Use o hook/mecanismo de permissões do projeto (tipicamente algo como `usePermissions()`) para
exibir ou ocultar botões e seções restritas — não confie apenas no bloqueio do backend para
esconder UI que o usuário não deveria ver.

## Feature flags

Se a tela estiver atrás de um rollout gradual, use o hook de feature flag do projeto (ver
`feature-flags-growthbook-pattern` quando o projeto usa GrowthBook) em vez de comentar/descomentar
código ou usar uma variável de ambiente estática.

## Padrão de página/sub-página

Ao adicionar um módulo novo:
1. Página de seleção/entrada do módulo, delegando a um componente de apresentação.
2. Sub-páginas funcionais dentro da rota do módulo.
3. Navegação registrada na configuração de navegação do projeto.
4. Rota registrada no registry de rotas (frontend e, se existir, backend).
5. Guard de permissão aplicado se a rota exigir uma permissão específica.

## Testes

Escreva testes de hook/estado (Vitest, Jest, ou o runner do projeto) antes ou junto da
implementação — cobrindo loading, sucesso, erro, renderização condicional por feature flag, e
validação de formulário.

## Verificação antes de considerar pronto

Rode o build de produção do frontend (não apenas o modo dev) — um erro de tipo pode passar
despercebido em `next dev` mas quebrar `next build`.
