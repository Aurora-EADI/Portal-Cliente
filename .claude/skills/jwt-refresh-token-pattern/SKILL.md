---
name: jwt-refresh-token-pattern
description: Use ao trabalhar com autenticação JWT access+refresh token via interceptors Axios num backend NestJS + frontend Next.js/React. Cobre três armadilhas conhecidas que quebram silenciosamente o fluxo de refresh automático.
---

# Padrão JWT access + refresh token (NestJS + Axios interceptors)

Três armadilhas conhecidas e recorrentes neste padrão, observadas em mais de um sistema do
grupo. Cada uma quebra o refresh automático de forma silenciosa — o sintoma aparece longe da
causa.

## 1. Sempre use a instância HTTP centralizada, nunca Axios cru

O fluxo de refresh de token é implementado via interceptors numa instância Axios centralizada
(tipicamente algo como um módulo `lib/api.ts`). Chamar `axios` diretamente, ou criar uma segunda
instância sem os interceptors, faz o token não ser anexado e o refresh automático não funcionar
para essa chamada — sem erro óbvio, só uma sessão que "às vezes" expira sem motivo aparente.

## 2. `mutateAsync` do TanStack Query exige try/catch no chamador

Hooks `useMutation` tratam erro via `onError`, mas quando se usa `mutateAsync` (em vez de
`mutate`), o erro também é relançado como rejeição de Promise. Se o chamador não tiver
`try/catch` ou `.catch()`, o Next.js (ou o error boundary do React) exibe um overlay de erro não
tratado — mesmo que o `onError` do hook já tenha lidado com o problema.

```tsx
try {
  await mutateAsync(payload);
} catch {
  // já tratado pelo onError do hook — o catch aqui só evita o erro
  // não capturado subir para o error boundary.
}
```

## 3. Guards de autenticação devem lançar a exceção HTTP correta, não `Error` genérico

No handler do guard de autenticação (ex: `handleRequest` de um `AuthGuard` do NestJS), lance a
exceção HTTP apropriada (`UnauthorizedException` do `@nestjs/common`, ou equivalente). Lançar um
`Error` genérico faz o framework tratar a falha como 500, não como 401/403 — e o interceptor de
refresh do frontend normalmente só reage a um código de status específico (401). Um guard que
lança `Error` genérico quebra o refresh automático de forma que só aparece em produção, sob a
condição exata de token expirado.

## Por que isso importa junto

As três armadilhas têm o mesmo formato: o mecanismo de refresh automático depende de um contrato
implícito (instância certa, propagação de erro, código de status certo) que não é imposto pelo
compilador — só por convenção. Ao revisar código que toca autenticação, verificar as três é mais
barato do que depurar uma sessão que expira de forma inconsistente em produção.
