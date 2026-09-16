---
name: mobile-security-baseline
description: Use ao lidar com autenticação, tokens, dados sensíveis ou logging num app Expo/React Native do grupo Orion. Checklist de segurança mobile básica que se aplica a qualquer app do grupo, independente do produto.
---

# Baseline de segurança mobile (Expo/React Native)

## Armazenamento

- Token e sessão sempre em armazenamento seguro nativo (Expo SecureStore ou equivalente), nunca
  em `AsyncStorage` — `AsyncStorage` não é criptografado no dispositivo.

## Variáveis de ambiente

- Nenhum segredo (senha, token, client secret, chave de API privada) em variáveis prefixadas
  para o bundle público (ex: `EXPO_PUBLIC_*`) — essas variáveis vão embutidas no bundle
  distribuído e são extraíveis por qualquer pessoa com o APK/IPA.
- Se uma integração exigir um segredo estático embutido no app, pare e documente o risco
  explicitamente — um aplicativo móvel não consegue proteger um segredo embutido nele, e essa é
  uma limitação a ser comunicada, não contornada silenciosamente.

## Rede

- HTTPS obrigatório. Não habilite tráfego HTTP em claro (cleartext) no Android sem autorização
  explícita e documentada — é uma configuração que enfraquece a postura de segurança do app
  inteiro, não só de uma chamada.

## Logging

- Nunca registrar em log headers de autenticação, cookies, senha ou token em texto plano — use
  uma função de redação (ex: `redactSensitive()`) antes de logar qualquer payload que possa
  conter dado sensível.

## Credenciais

- Nenhuma credencial real em código-fonte, testes, fixtures ou documentação — nem mesmo como
  "exemplo temporário".

## Checklist de revisão

- [ ] Token/sessão em SecureStore, não AsyncStorage
- [ ] Nenhum segredo em variável `*_PUBLIC_*` ou equivalente exposta ao bundle
- [ ] HTTPS obrigatório; cleartext Android não habilitado sem justificativa documentada
- [ ] Logs passam por redação antes de qualquer payload sensível
- [ ] Nenhuma credencial real em código/testes/fixtures/docs
