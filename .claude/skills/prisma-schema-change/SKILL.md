---
name: prisma-schema-change
description: Use ao adicionar, remover, renomear ou alterar models, campos, relations, constraints, índices, enums ou migrations num schema Prisma. Aplica-se a qualquer sistema do grupo Orion que use Prisma.
---

## Fontes da verdade

- Arquitetura de dados do projeto: geralmente `docs/technical/database.md` ou equivalente — leia
  antes de qualquer alteração.
- Comandos disponíveis: geralmente `docs/technical/commands.md` ou o `package.json` do projeto.
- Regras de domínio relacionadas: consulte a documentação de domínio do projeto quando a mudança
  de schema representa comportamento de produto, não só estrutura técnica.

Esta skill define o procedimento de migração. Ela não redefine a arquitetura de dados nem a
semântica de produto de nenhum projeto específico.

## Gate de segurança

Antes de alterar o schema:

1. Leia a documentação de arquitetura de dados do projeto.
2. Inspecione o model Prisma existente e as migrations relacionadas.
3. Busque usos do model/campo afetado em todo o repositório.
4. Determine se a mudança é aditiva, destrutiva, ou exige migração de dados.
5. Não use `db push` como atalho para uma mudança que precisa ser representada em migration
   versionada.

## Procedimento

### 1. Classificar a mudança

Identifique o tipo:
- ADD
- REMOVE
- RENAME
- MUDANÇA DE TIPO
- MUDANÇA DE RELAÇÃO
- ÍNDICE / CONSTRAINT
- MUDANÇA DE ENUM
- MIGRAÇÃO DE DADOS

Isso determina a segurança e as implicações dos próximos passos.

### 2. Inspecionar impacto

Identifique o que é afetado: models Prisma, relations, repositories, DTOs, services, testes, e
contratos de frontend quando aplicável.

### 3. Modificar o schema Prisma

Faça a menor mudança de schema necessária. Preserve as convenções de nomenclatura e relação já
documentadas no projeto.

### 4. Determinar a estratégia de migração

Use o fluxo de migração documentado pelo projeto. Nunca improvise uma estratégia de migração. Se
o comando normal de migração de desenvolvimento não puder ser usado porque o ambiente é
não-interativo, use o procedimento não-interativo documentado pelo projeto — nunca substitua uma
migration versionada por `db push` silenciosamente.

### Mudanças destrutivas

Para renomeações, remoções, mudanças de tipo, campos obrigatórios adicionados a tabelas
existentes, ou reestruturação de relação:
- inspecione as implicações nos dados existentes;
- preserve dados explicitamente quando necessário;
- revise o SQL de migration gerado;
- não assuma que o Prisma inferiu corretamente uma renomeação;
- sinalize operações destrutivas antes de prosseguir — não prossiga silenciosamente.

### 5. Regenerar artefatos do Prisma

Regenere o Prisma Client usando o comando canônico do projeto. Não duplique a definição do
comando aqui — use o que o projeto já documenta.

### 6. Atualizar código afetado

Atualize repositories, DTOs, services, mappers, testes e tipos/contratos de frontend afetados.

## Verificação

Antes de considerar a tarefa concluída:
- a validação do schema Prisma passa;
- a geração do Prisma Client passa;
- existe uma migration versionada quando necessário;
- o SQL da migration foi revisado para operações destrutivas/inesperadas;
- não restam referências a campos renomeados/removidos;
- os type checks relevantes passam;
- os testes relevantes passam;
- o comportamento do banco corresponde à especificação de domínio aplicável.
