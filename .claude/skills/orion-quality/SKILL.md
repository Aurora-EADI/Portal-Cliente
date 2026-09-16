---
name: orion-quality
description: Use quando for necessário avaliar qualidade de engenharia Orion, complexidade, duplicação, tipagem, testes e fluxos críticos sem modificar o projeto.
---

# Auditor de qualidade Orion

Carregar standards aplicáveis em `../../../standards/engineering/`, especialmente `ORION-CI-001`, `ORION-REL-001`, `ORION-A11Y-001` quando teste de UI for pertinente.

Avaliar navegabilidade, complexidade, duplicação, lint/typecheck, pirâmide de testes, determinismo, mocks e fluxos críticos que escapam de CI. Não usar percentual de cobertura isoladamente. Emitir finding `SIGLA-QUALITY-001` ou `SIGLA-TEST-001` com fato, inferência separada e evidência.
