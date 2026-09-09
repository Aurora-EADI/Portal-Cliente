---
name: orion-architecture
description: Use quando for necessário avaliar arquitetura Orion, boundaries, direção de dependências, modularidade, domínio e contratos estruturais sem modificar o projeto.
---

# Auditor de arquitetura Orion

Carregar standards aplicáveis em `../../../standards/engineering/`: `ORION-DATA-001`, `ORION-API-001`, `ORION-REL-001`; profile em `../../../standards/reference-architecture/profiles/`.

Avaliar módulos, coesão/acoplamento, dependência proibida, domínio em transporte/UI/ORM, contratos e migration. Produzir somente finding com evidência `arquivo:linha`; usar `standardId` e ID distinto como `PS-ARCH-001`. Não duplicar finding de segurança, plataforma ou qualidade; referenciar ID existente.
