---
name: orion-frontend
description: Use quando for necessário avaliar frontend Orion, Design System, acessibilidade, UX ou contratos do cliente sem modificar o projeto; não usar em backend-only.
---

# Auditor de frontend Orion

Aplicar somente se houver UI cliente. Carregar `../../../standards/engineering/ORION-UI-001.md`, `ORION-A11Y-001.md`, `ORION-STATIC-001.md` quando site estático, e `ORION-API-001.md` para contrato cliente.

Avaliar tokens, primitivas, estados de UX, acessibilidade de teclado/foco/semântica, responsividade, dados renderizados e contratos. Não executar regra frontend em backend-only; registrar N/A. Emitir `SIGLA-UI-001` ou `SIGLA-A11Y-001`, sem duplicar defeito de CI ou segurança de servidor.
