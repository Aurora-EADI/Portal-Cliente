---
name: pre-deploy-check
description: Use antes de fazer push para a branch principal ou disparar um deploy — verifica que o build que o CI vai rodar realmente vai passar, pegando erros de TypeScript antes de chegarem ao pipeline. Aplica-se a qualquer repositório do grupo com pipeline Docker + CI.
---

# Pre-Deploy Check

## Procedimento

1. Rodar type check.
2. Rodar testes.
3. Rodar build.
4. Validar drift de manifesto/configuração, se o projeto tiver essa checagem (ex: catálogo de
   permissões, dataset versionado).
5. Parar em qualquer falha — não prossiga para o próximo passo se um passo anterior falhou.

## Por que "o build passou" pode não provar nada

Em repositórios que usam um compilador que só transpila sem checar tipos (ex: builder SWC no
NestJS, configurado via `nest-cli.json` → `"builder": "swc"`), o comando de build do projeto
pode "passar" mesmo com erros de tipo — porque o builder nunca checou os tipos, só removeu as
anotações. Antes de confiar em "build passou" como sinal de tipo correto, verifique qual builder
o projeto usa:

- Se o builder faz type-check como parte da compilação (ex: `next build`, ou `tsc` puro), build
  passar é um sinal real.
- Se o builder só transpila (ex: SWC, esbuild em modo transpile-only, Babel), rode o type check
  separadamente (`tsc --noEmit`) — isso não faz parte do build e precisa ser um passo explícito.

Prefira a configuração de tsconfig usada para build de produção (ex: `tsconfig.build.json`) em
vez do tsconfig raiz ao rodar o type check isolado — o tsconfig raiz costuma incluir arquivos de
teste (`*.spec.ts`) que não fazem parte do que será de fato deployado, e cujos erros não
representam risco real de deploy.

## Erros comuns

| Engano | Realidade |
|---|---|
| "O build da API passou, então os tipos estão certos" | Se o builder é transpile-only (SWC, esbuild, Babel), isso não é verdade — rode o type check isolado. |
| "Rodei o typecheck da raiz do monorepo e confiei no resultado" | Pode estar checando `*.spec.ts` também, com falhas antigas não relacionadas ao código que você mudou — prefira o typecheck escopado ao pacote/app. |
| "`pnpm dev` / modo desenvolvimento rodando limpo prova que o build está limpo" | Modo dev geralmente não faz o mesmo passe completo de type-check que o build de produção faz. |
| "É uma mudança pequena, não precisa rodar tudo" | Uma mudança de duas linhas já causou incidente de produção em mais de um projeto do grupo — o tamanho do diff não prevê o risco. |
| No Windows, o build falha com erro de symlink (`EPERM`) | Symlink em `.next/standalone` exige privilégio elevado ou Developer Mode no Windows — não acontece no runner Linux do CI. Se o output já mostrou compilação bem-sucedida antes desse erro, o gate que importa já passou; o erro é do ambiente local, não do código. |

## Detectando automaticamente o builder do projeto

Antes de assumir qual comando rodar, verifique:
- `nest-cli.json` do projeto — campo `builder`, se presente, indica SWC ou o compilador padrão.
- Scripts em `package.json` — costuma haver um script de typecheck escopado, se o projeto já
  documentou esse gotcha.
