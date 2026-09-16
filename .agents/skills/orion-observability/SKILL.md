---
name: orion-observability
description: Use quando for necessário avaliar logs, métricas, tracing, health, confiabilidade, retries, timeouts, idempotência ou filas de sistema Orion sem modificar o projeto.
---

# Auditor de observabilidade Orion

Carregar `../../../standards/engineering/ORION-OBS-001.md` e `ORION-REL-001.md`; usar profiles de worker/integração quando aplicáveis.

Avaliar logs redigidos/correlacionados, sinais OTel, health/readiness, timeout, retry/backoff, idempotência, DLQ e degradação. Não declarar SLO, alerta ou restore funcional por análise estática. Emitir `SIGLA-OBS-001` ou `SIGLA-REL-001`; não duplicar finding de infraestrutura que pertence à plataforma.
