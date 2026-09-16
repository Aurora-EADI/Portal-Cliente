---
name: audit-orion-codebase
description: Use quando for necessário auditar um repositório Orion de forma read-only, selecionar auditores especializados, consolidar findings e gerar artefatos em pt-BR.
---

# Auditoria Orion de código

Orquestradora. Não contém regras técnicas: carregar `../../../standards/machine-readable/`, documentação correspondente em `../../../standards/engineering/`, `../../../standards/finding-schema.md`, `../../../standards/scoring.md` e `../../../standards/report-html.md`.

## Fluxo

1. Discover: confirmar target read-only; registrar `git status --porcelain` como estado inicial (deve permanecer idêntico ao final).
2. Detect stack: identificar linguagem, framework, gerenciador de pacote e presença de UI cliente.
3. Determine profile: mapear para um profile em `../../../standards/reference-architecture/profiles/` (`web-portal`, `backend-api`, `integration-service`, `worker`, `mobile-app`, `static-tool`).
4. Load applicable Standards: carregar somente as regras de `../../../standards/engineering/` e `../../../standards/machine-readable/` cujo `applies_when` combina com o profile/stack detectados.
5. Select auditors: usar a Tabela de Dispatch abaixo para escolher, dentre os 7 auditores canônicos — `orion-architecture`, `orion-quality`, `orion-security`, `orion-observability`, `orion-platform`, `orion-frontend`, `orion-engineering-experience` — quais rodam para o profile detectado. Nunca executar um auditor cegamente só porque existe.
6. Run auditors: cada auditor selecionado roda com as Standards carregadas no passo 4; um auditor não aplicável ao profile é marcado `N/A`, não `RUN` com resultado vazio.
7. Normalize: unificar formato de finding conforme `../../../standards/finding-schema.md`.
8. Validate evidence: todo finding cita `arquivo:linha`; nenhum valor de segredo é copiado.
9. Deduplicate: mesma causa raiz detectada por mais de um auditor gera um único finding principal; auditores adicionais entram em `relatedFindingIds`/referência, nunca um novo finding.
10. Score: aplicar `../../../standards/scoring.md`.
11. Generate report: renderizar JSON, Markdown e HTML pt-BR a partir do mesmo conjunto normalizado, conforme `../../../standards/report-html.md`.

## Tabela de Dispatch (profile → auditores)

Um profile determina quais dos 7 auditores executam. "Sempre" roda incondicionalmente; "quando aplicável" depende de stack detectada (ex.: existe fila → observability cobre idempotência/DLQ; existe Dockerfile/CI → platform cobre isso; existe UI cliente → frontend roda).

| Profile | architecture | quality | security | observability | platform | frontend | engineering-experience |
|---|---|---|---|---|---|---|---|
| `web-portal` | sempre | sempre | sempre | sempre | sempre | sempre | sempre |
| `backend-api` | sempre | sempre | sempre | sempre | sempre | **N/A** | sempre |
| `integration-service` | sempre | sempre | sempre | sempre | sempre | **N/A** | sempre |
| `worker` | sempre | sempre | sempre | sempre | sempre | **N/A** | sempre |
| `mobile-app` | sempre | sempre | sempre | quando aplicável | quando aplicável | sempre | sempre |
| `static-tool` | quando aplicável | sempre | sempre | quando aplicável | quando aplicável (CI) | sempre | sempre |

Regra geral: `orion-frontend` só roda quando o target tem UI cliente (nunca em `backend-api`, `integration-service` ou `worker` puros). `orion-observability` e `orion-platform` rodam sempre que há sinal de infraestrutura/deploy correspondente (Dockerfile, Compose, CI, fila, worker) mesmo em profiles onde não são "sempre". Um auditor marcado `N/A` para o profile é registrado como `N/A` na saída, nunca omitido silenciosamente.

## Contrato

Finding usa ID independente por execução: `<SIGLA>-<CATEGORIA>-<NNN>`, nunca reutilizando um Finding ID de auditoria histórica anterior. Inclui `standardId` (aponta para um Standard `ORION-*` existente, ou `null`), `severity` (`CRITICAL|HIGH|MEDIUM|LOW|OPPORTUNITY`), `priority` (`P0`–`P4`), `effort` (`XS|S|M|L|XL`), `confidence`, `classification` e `evidence`. Nunca expor valor de segredo. `Standard ID != Finding ID` sempre — ver `../../../standards/finding-schema.md`.

## Read-only

Esta skill é read-only por padrão. Nunca: alterar código do target; corrigir automaticamente; instalar dependência no target; alterar Docker/Compose/CI/config do target; fazer migration; fazer commit no target. Artefatos de saída (JSON/MD/HTML) são escritos fora do target, salvo configuração explícita em contrário.

## Fallback

Sem subagentes nativos disponíveis no runtime, executar os papéis aplicáveis (conforme Tabela de Dispatch) sequencialmente dentro da mesma sessão, preservando o mesmo contrato de finding e a mesma tabela de dispatch. Documentar no relatório que a execução foi sequencial, não paralela.
