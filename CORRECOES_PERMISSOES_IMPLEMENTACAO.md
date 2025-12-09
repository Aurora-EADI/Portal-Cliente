# Sistema de Controle de Acesso por Permissões - Implementação

## Resumo das Alterações

O sistema agora possui controle granular de acesso baseado em permissões específicas. Isso permite que administradores controlem não apenas o acesso a módulos, mas também a funcionalidades específicas dentro desses módulos.

## Arquivos Modificados

### 1. **Frontend**

#### `aurora-eadi-front/src/config/navigation.ts`
- ✅ Adicionado campo `requiredPermissions?: string[]` à interface `NavItem`
- ✅ Configuradas permissões para as rotas de faturamento:
  - `/faturamento` requer `FAT_VIEW_DET`
  - `/faturamento/cutoff` requer `FAT_VIEW_CUTOFF`

#### `aurora-eadi-front/src/services/modules/modules.service.ts`
- ✅ Atualizada interface `Activity` para incluir:
  - `isActive: boolean` - indica se a atividade está ativa para o usuário
  - `permissions?: string[]` - array de chaves de permissão

#### `aurora-eadi-front/src/hooks/useNavigationWithPermissions.ts` (NOVO)
- ✅ Hook que filtra itens de navegação baseado nas permissões do usuário
- ✅ Verifica se o usuário possui TODAS as permissões necessárias para cada rota
- ✅ Durante carregamento, mostra apenas itens sem requisitos de permissão

#### `aurora-eadi-front/src/components/layout/Sidebar.tsx`
- ✅ Atualizado para usar `useNavigationWithPermissions()` em vez de `getNavigationByPath()`
- ✅ Agora o sidebar mostra apenas rotas que o usuário tem permissão para acessar

## Como Funciona

### 1. **Fluxo de Verificação de Permissões**

```
1. Usuário faz login
2. Backend retorna módulos, atividades e permissões do usuário
3. Frontend armazena permissões no localStorage via AuthContext
4. Sidebar busca navegação filtrada via useNavigationWithPermissions
5. Hook verifica permissões e retorna apenas rotas permitidas
```

### 2. **Exemplo de Configuração de Rota**

```typescript
{
  label: 'Faturamento Detalhado',
  icon: FileBarChart,
  path: '/faturamento',
  requiredPermissions: ['FAT_VIEW_DET'], // Requer esta permissão
}
```

### 3. **Como Adicionar Controle de Permissão em Novas Rotas**

#### Passo 1: Adicionar permissão ao item de navegação

Em `aurora-eadi-front/src/config/navigation.ts`:

```typescript
{
  label: 'Nova Funcionalidade',
  icon: Settings,
  path: '/nova-funcionalidade',
  requiredPermissions: ['NOVA_FUNC_VIEW'], // Permissão necessária
}
```

#### Passo 2: Criar a permissão no banco de dados

Via Prisma Studio ou SQL:

```sql
-- 1. Criar a permissão
INSERT INTO "Permission" (key, name, description)
VALUES ('NOVA_FUNC_VIEW', 'Visualizar Nova Funcionalidade', 'Permite visualizar a nova funcionalidade');

-- 2. Vincular permissão a uma atividade
INSERT INTO "ActivityPermission" (activityId, permissionId)
VALUES (1, (SELECT id FROM "Permission" WHERE key = 'NOVA_FUNC_VIEW'));
```

### 4. **Protegendo Componentes Internos da Página**

Use o `PermissionGuard` para condicionar renderização de componentes:

```tsx
import { PermissionGuard } from '@/components/guards/PermissionGuard';

function FaturamentoPage() {
  return (
    <div>
      <h1>Faturamento</h1>

      {/* Só mostra botão se tiver permissão */}
      <PermissionGuard
        moduleRoute="/faturamento"
        permissionKey="FAT_EXPORT_EXCEL"
        fallback={<p className="text-sm text-gray-500">Você não tem permissão para exportar</p>}
      >
        <ExportButton />
      </PermissionGuard>
    </div>
  );
}
```

### 5. **Protegendo Páginas Completas**

Use o `RouteGuard` para proteger acesso ao módulo inteiro:

```tsx
import { RouteGuard } from '@/components/guards/RouteGuard';

export default function FaturamentoPage() {
  return (
    <RouteGuard route="/faturamento">
      {/* Conteúdo da página */}
      <div>
        <h1>Página de Faturamento</h1>
      </div>
    </RouteGuard>
  );
}
```

### 6. **Verificação Programática de Permissões**

Use o hook `usePermission` para lógica condicional:

```tsx
import { usePermission } from '@/hooks/usePermission';

function MyComponent() {
  const { hasPermission, isLoading } = usePermission('/faturamento', 'FAT_VIEW_CUTOFF');

  if (isLoading) return <Spinner />;

  return (
    <div>
      {hasPermission ? (
        <button>Acessar CutOff</button>
      ) : (
        <p>Sem permissão</p>
      )}
    </div>
  );
}
```

## Estrutura de Permissões no Backend

O backend já retorna as permissões no formato correto:

```typescript
// Resposta de GET /api/user-module-access/:userId
{
  user: { ... },
  modules: [
    {
      id: 1,
      name: "Faturamento",
      route: "/faturamento",
      isEnabled: true,
      activities: [
        {
          id: 1,
          name: "Visualizar Faturamento Detalhado",
          isActive: true,
          permissions: ["FAT_VIEW_DET", "FAT_EXPORT_EXCEL"] // Array de chaves
        },
        {
          id: 2,
          name: "Visualizar CutOff",
          isActive: false, // Usuário não tem acesso
          permissions: ["FAT_VIEW_CUTOFF"]
        }
      ]
    }
  ]
}
```

## Testando o Sistema

### 1. **Verificar permissões no navegador**

```javascript
// Console do navegador
const permissions = JSON.parse(localStorage.getItem('user_permissions'));
console.log(permissions);
```

### 2. **Simular usuário sem permissão**

- Acesse Prisma Studio (`npm run studio` no backend)
- Desabilite uma atividade específica em `UserActivityAccess`
- Faça logout e login novamente
- Verifique se o item sumiu do sidebar

### 3. **Verificar comportamento do sidebar**

- Com permissão `FAT_VIEW_DET`: Rota "/faturamento" aparece
- Sem permissão `FAT_VIEW_DET`: Rota "/faturamento" NÃO aparece
- Com permissão `FAT_VIEW_CUTOFF`: Rota "/faturamento/cutoff" aparece
- Sem permissão: Rota não aparece

## Próximos Passos Sugeridos

1. ✅ Adicionar permissões para outras rotas (documentos, permissões)
2. ✅ Proteger páginas com `RouteGuard`
3. ✅ Proteger componentes internos com `PermissionGuard`
4. ✅ Criar seeds no backend com permissões pré-configuradas
5. ✅ Adicionar testes unitários para hooks de permissão

## Dependências

### Hooks Utilizados
- `useNavigationWithPermissions` - Filtra navegação por permissões
- `usePermission` - Verifica permissão específica
- `useModuleAccess` - Verifica acesso ao módulo
- `useAuthContext` - Acessa dados do usuário autenticado

### Componentes Utilizados
- `RouteGuard` - Protege rotas de módulos
- `PermissionGuard` - Protege componentes individuais

### Serviços
- `modulesService.getAll()` - Busca módulos e permissões do usuário
- Backend retorna dados via `/api/user-module-access/:userId`

## Troubleshooting

### Problema: Sidebar não atualiza após mudança de permissões
**Solução:** Faça logout e login novamente ou force refresh das permissões:
```typescript
const { refreshPermissions } = useAuthContext();
await refreshPermissions();
```

### Problema: Rota aparece no sidebar mas página retorna 403
**Solução:** Certifique-se de que a página também usa `RouteGuard` ou middleware de proteção

### Problema: Permissões não carregam
**Solução:** Verifique se o backend está retornando `permissions` como array de strings na atividade

## Conclusão

O sistema agora possui controle granular de acesso em três níveis:
1. **Módulo** - Usuário tem acesso ao módulo inteiro?
2. **Atividade** - Usuário tem acesso a esta funcionalidade?
3. **Permissão** - Usuário tem permissão técnica específica?

Isso permite que administradores configurem acesso detalhado para cada usuário no sistema.
