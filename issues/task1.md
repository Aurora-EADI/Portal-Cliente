# OBJETIVO
Refatorar sistema de custos portuários para suportar diferentes tipos de cálculo por serviço.
Atualmente só aceita valor fixo. Preciso de: percentual sobre CIF, valor por container e por tonelada.

# ARQUIVOS ANEXADOS
- MaritimeSimulator.tsx, ServicesTab.tsx (frontend React)
- simulations.service.ts, services.service.ts, service-costs.service.ts (backend NestJS)
- Controllers correspondentes

# TIPOS DE CÁLCULO

1. **FIXED**: `rate`
   - Ex: R$ 500,00 fixo

2. **PERCENTAGE_CIF**: `(rate / 100) * cifBrl`
   - Ex: 0,35% do CIF = (0,35/100) × 100.000 = R$ 350

3. **PER_CONTAINER**: `rate * cntrCount`
   - Ex: R$ 350 × 5 containers = R$ 1.750

4. **PER_TONNE**: `rate * tonnes`
   - Ex: R$ 25 × 20 ton = R$ 500

# MUDANÇAS NECESSÁRIAS

## 1. Prisma Schema
```prisma
enum ServiceCalculationType {
  FIXED
  PERCENTAGE_CIF
  PER_CONTAINER
  PER_TONNE
}

model Service {
  // ... campos existentes
  calculationType   ServiceCalculationType @default(FIXED)
  formulaExpression String?
}

// ServiceCost.cost agora é TAXA (0.35 ou 350), não valor final
```

## 2. Backend

**calculation.service.ts** (novo):
- Método `calculateServiceCost()` com switch para cada tipo
- Validar dados obrigatórios por tipo
- Retornar valor calculado

**simulations.service.ts**:
- No `addService()`: buscar serviço → taxa vigente → calcular com CalculationService → salvar

**DTOs**:
- Adicionar `calculationType` e `formulaExpression` em CreateServiceDto

## 3. Frontend

**ServiceManagement.tsx** (novo):
- Lista: tabela com código, nome, tipo cálculo, taxa, status
- Form: dados básicos + 4 cards clicáveis para escolher tipo + campo taxa + preview ao vivo

**ServiceCostsHistory.tsx** (novo):
- Timeline de taxas com vigência
- Form para nova taxa (valor, data início, motivo)

**ServicesTab.tsx** (atualizar):
- Mostrar tipo de cálculo e fórmula
- Preview do valor calculado antes de adicionar

# FLUXO
1. Admin cadastra serviço → escolhe tipo → define taxa inicial
2. Admin atualiza taxa → antiga expira, nova entra em vigor
3. Usuário adiciona serviço na simulação → sistema calcula automaticamente

# REQUISITOS
- TypeScript estrito
- ServiceCost.cost = taxa (não valor final)
- Valor final calculado dinamicamente
- Validar campos por tipo (ex: PERCENTAGE_CIF precisa cifBrl)
- Simulações antigas intactas

# ENTREGÁVEIS
1. Migration Prisma
2. CalculationService completo
3. Services/Simulations services atualizados
4. ServiceManagement + ServiceCostsHistory components
5. ServicesTab atualizado
6. DTOs e tipos TS

Comece pela migration e CalculationService.