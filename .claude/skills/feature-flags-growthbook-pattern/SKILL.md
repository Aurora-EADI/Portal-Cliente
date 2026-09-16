---
name: feature-flags-growthbook-pattern
description: Use ao envelopar uma funcionalidade nova atrás de feature flag, criar um kill switch, ou planejar rollout gradual/dark launch num sistema que use GrowthBook (ou padrão equivalente de feature flags). Cobre nomenclatura, fallback seguro e ciclo de vida da flag.
---

# Padrão de feature flags (GrowthBook)

## Nomenclatura

kebab-case descritivo do que a flag controla, não do ticket/projeto que a criou — a flag deve
fazer sentido para quem lê o código meses depois, sem precisar consultar o ticket original.
Exemplos de forma (não de conteúdo específico): `<funcionalidade>-v2`,
`modulo-<nome>-<variante>`.

## Frontend

```tsx
'use client';
import { useFeatureFlag } from '@/hooks/use-feature-flag';

export function ExampleGatedComponent() {
  const isEnabled = useFeatureFlag('nome-da-flag');
  if (!isEnabled) return null; // ou fallback para o componente legado
  return <NewComponent />;
}
```

## Backend

```typescript
@Injectable()
export class ExampleService {
  constructor(private readonly featureFlags: FeatureFlagsService) {}

  async process(entityId: string, actor: { id: string; role?: string }) {
    const useNewEngine = this.featureFlags.isOn('nome-da-flag', {
      id: actor.id,
      role: actor.role,
    });
    return useNewEngine ? this.newFlow() : this.legacyFlow();
  }
}
```

## Regras obrigatórias

1. **Fallback seguro:** toda checagem de flag tem default `false` (ou o comportamento legado
   seguro) se o serviço de feature flags estiver indisponível — nunca deixe uma falha de rede do
   provedor de flags virar um `true` acidental.
2. **Targeting:** sempre repassar identificadores do usuário/ator (`userId`, `role`) para
   permitir testar com um subconjunto de usuários internos antes de liberar para todos.
3. **Ciclo de vida:** ao atingir 100% estável em produção por um período razoável, agende
   explicitamente a remoção da flag e do código legado que ela substituiu — uma flag que nunca é
   removida vira dívida técnica permanente e um ramo de código morto que ninguém testa mais.
