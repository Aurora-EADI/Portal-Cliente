---
name: nestjs-prisma-patterns
description: Use ao criar ou alterar um módulo, endpoint ou regra de negócio num backend NestJS + Prisma do grupo Orion. Cobre estrutura de módulo, convenções de DTO/validação e o checklist de padrões que um code review deve cobrir neste stack.
---

# Padrões de backend NestJS + Prisma

Convenções observadas em múltiplos backends NestJS + Prisma do grupo (portal-supertrans,
Portal-Aurora, Portal_Fornecedor). Não redefine a arquitetura de um projeto específico — cada
projeto mantém sua própria documentação de arquitetura (tipicamente `docs/technical/backend.md`
ou equivalente); leia-a antes de codar.

## Estrutura de módulo

```
src/<feature>/
  <feature>.module.ts
  <feature>.controller.ts
  <feature>.service.ts
  <feature>.repository.ts
  dto/
    create-<feature>.dto.ts
    update-<feature>.dto.ts
    query-<feature>.dto.ts
```

## Adicionar um endpoint novo

1. Gerar módulo/controller/service com o CLI do Nest (`nest g module/controller/service`).
2. Adicionar DTOs em `dto/` com decorators de validação (`class-validator`).
3. Aplicar o guard de autenticação apropriado (`@UseGuards(JwtAuthGuard)` ou equivalente) em
   rotas protegidas.
4. Adicionar decorators de Swagger/OpenAPI se o projeto os usa (`@ApiTags`, `@ApiOperation`,
   `@ApiResponse`).
5. Registrar o módulo no módulo raiz da aplicação.

## Regras gerais

- Nunca receber `Prisma.<Model>CreateInput`/`UpdateInput` diretamente num controller — sempre um
  DTO validado.
- Rotas de API em kebab-case; se o projeto usa idioma diferente do inglês nas rotas de frontend,
  mantenha as rotas de API consistentes com a convenção já estabelecida no projeto.
- Se a feature exigir lançamento gradual, use o padrão de feature flags do projeto (ver
  `feature-flags-growthbook-pattern` quando aplicável) em vez de comentar/descomentar código.
- Escreva os testes de service/controller antes ou junto da implementação, não depois.

## O que revisar num code review deste stack

Ao revisar um diff neste stack (como eixo "Standards" de qualquer mecanismo de code review em
uso — genérico ou específico do grupo), verifique:

- [ ] Design System: se o projeto usa o Design System Orion, a tela segue
  `orion-design-system-guardian`? Nenhuma `<table>` ou layout ad-hoc?
- [ ] Permissões: rotas/ações novas registradas no catálogo de permissões do projeto e
  protegidas com o guard/decorator correspondente?
- [ ] DTOs: validação presente, nenhum tipo do Prisma vazando para o controller?
- [ ] Testes presentes cobrindo happy path e os principais caminhos de erro?

## Verificação antes de considerar pronto

Rode o comando de teste do workspace/pacote do backend (varia por projeto — verifique
`package.json`) e confirme que a suíte passa antes de finalizar.
