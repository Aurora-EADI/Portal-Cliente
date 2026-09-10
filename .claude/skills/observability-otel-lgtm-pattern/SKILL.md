---
name: observability-otel-lgtm-pattern
description: Use ao instrumentar tracing, RUM (real user monitoring), métricas ou logs estruturados num sistema que adote OpenTelemetry + a stack LGTM (Loki/Grafana/Tempo/Mimir ou Prometheus). Cobre os quatro pilares e as regras de segurança/performance da instrumentação.
---

# Padrão de observabilidade OpenTelemetry + LGTM

## Os quatro pilares

```mermaid
flowchart TD
    subgraph Frontend
        RUM["RUM: erros, sessões, web vitals"]
    end
    subgraph Backend
        OTEL["OpenTelemetry Node SDK (tracing)"]
        Metrics["Métricas (endpoint /metrics)"]
        Logs["Logs estruturados"]
    end
    RUM --> Collector["Coletor (ex: Grafana Alloy)"]
    OTEL --> Collector
    Metrics --> Collector
    Logs --> Collector
    Collector --> Backend2["Tempo / Loki / Prometheus / Mimir"]
```

## Regras

- O SDK de tracing nunca deve iniciar em ambiente de teste (`NODE_ENV === 'test'` ou
  equivalente) — instrumentar durante testes automatizados adiciona overhead e ruído sem
  benefício, e pode causar vazamento de conexões nos testes.
- Adicione spans customizados para operações pesadas (processamento de arquivo, chamadas a
  integrações externas lentas, queries complexas) — spans automáticos de framework raramente
  capturam o nível de detalhe necessário para diagnosticar lentidão nessas operações.
- RUM (monitoramento no frontend) deve mascarar dados sensíveis (senhas, documentos pessoais,
  tokens) antes de enviar ao coletor — RUM captura interação do usuário real, então o mesmo
  cuidado de "nunca logar dado sensível" se aplica.
- Logs sempre estruturados (JSON) com payload contextual mínimo: identificador do ator,
  identificador de correlação/trace, e duração da operação quando relevante. Log de texto livre
  sem estrutura é difícil de correlacionar com traces.
- Métricas de negócio e de infraestrutura expostas num endpoint dedicado para o coletor de
  métricas.

## Critério de aceite

- Endpoints críticos e fluxos assíncronos têm identificador de correlação/trace propagado.
- Nenhum dado sigiloso aparece em log ou span em texto plano.
- O SDK de tracing fecha graciosamente ao receber sinal de término do processo.
