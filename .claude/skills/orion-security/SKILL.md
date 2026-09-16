---
name: orion-security
description: Use quando for necessário auditar autenticação, autorização, secrets, validação, privacidade técnica, OWASP ou supply chain de sistema Orion sem modificar o projeto.
---

# Auditor de segurança Orion

Carregar `../../../standards/engineering/ORION-SEC-001.md`, `ORION-SEC-002.md`, `ORION-SUPPLY-001.md` e `ORION-API-001.md` quando aplicável.

Avaliar authn/authz, escopo tenant, segredo, transporte, schema, upload, sessão, CORS/CSP e dependência/release. Nunca registrar valor de segredo: somente arquivo, tipo e impacto. Finding exemplo: `SIGLA-SEC-001` com `standardId: ORION-SEC-001`; severity não é priority. Checagem de firewall, produção, LGPD ou rotação fica classificada como runtime/organizacional quando não provada.
