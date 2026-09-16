---
name: expo-react-native-patterns
description: Use ao trabalhar em qualquer app Expo/React Native do grupo Orion — convenções de qualidade de código, acessibilidade e testes observadas em mais de um app do grupo. Não cobre segurança (ver mobile-security-baseline) nem mutações críticas (ver idempotent-critical-mutation).
---

# Padrões de qualidade Expo/React Native

## Versão do Expo

O Expo muda comportamento significativamente entre versões major. Antes de escrever código
específico de Expo, confira a documentação da versão exata instalada no projeto (verifique
`package.json`) em vez de assumir comportamento de uma versão anterior.

## Gerenciador de pacotes e lint

O gerenciador de pacotes e a ferramenta de lint/formatação variam por projeto (pnpm vs. npm,
Biome vs. ESLint/Prettier) — detecte o que o projeto já usa (lockfile presente, config presente)
e siga essa escolha; não force uma preferência pessoal ou de outro projeto.

## TypeScript estrito

Sem `any` implícito. `@ts-ignore` só com uma justificativa técnica escrita no próprio arquivo,
explicando por que o erro de tipo é um falso positivo — nunca como forma de silenciar um erro
real sem investigar.

## Acessibilidade

- `accessibilityRole` e `accessibilityLabel` em todo controle interativo.
- Botões que só têm um símbolo (ex: `+`, `−`) precisam de `accessibilityLabel` descritivo — o
  símbolo sozinho não é acessível para leitor de tela.
- Estado nunca comunicado apenas por cor — sempre acompanhado de texto ou ícone com label.
- Área de toque mínima recomendada: 48px — abaixo disso, elementos de toque ficam difíceis de
  usar com precisão, especialmente em ambientes de uso rápido (chão de fábrica, totem, kiosk).
- Mensagens de erro legíveis, com `accessibilityRole="alert"` para serem anunciadas por leitor de
  tela automaticamente.

## Testes

- Teste comportamento observável (o que o usuário vê/faz), não detalhes de implementação interna.
- Se o projeto usa Testing Library para React Native em versão recente, `render`, `renderHook` e
  `fireEvent` são assíncronos — sempre use `await`. Confira a versão instalada antes de escrever
  testes síncronos que podem falhar de forma intermitente.
- Fixe a versão do preset de teste (ex: `jest-expo`) alinhada à versão do Expo do projeto —
  atualizar um sem o outro é uma causa comum de suíte quebrada sem relação com o código
  testado.
