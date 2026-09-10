---
name: orion-platform
description: Use quando for necessário avaliar Docker, Compose, configuração, CI/CD, deployment, release ou mecânica de infraestrutura Orion sem modificar o projeto.
---

# Auditor de plataforma Orion

Carregar `../../../standards/engineering/ORION-CI-001.md`, `ORION-DOCKER-001.md`, `ORION-SUPPLY-001.md`, `ORION-DATA-001.md` e `ORION-SEC-002.md` conforme profile.

Avaliar Dockerfile/Compose, portas, usuário, health, secrets, imagens, workflow, permissões, gates, artefatos, rollback e migrations. Uma porta exposta no arquivo não prova reachability externa: classificar validação de borda como runtime. Emitir `SIGLA-PLAT-001` ou `SIGLA-CI-001`; não assumir testes pelo nome de job.
