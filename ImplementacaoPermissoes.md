# Implementação de Permissões Granulares

Este documento explica como implementar permissões específicas para features dentro dos módulos do Portal Aurora.

## Arquitetura do Sistema de Permissões (RBAC)

O Portal Aurora usa um sistema de 3 camadas hierárquicas:

```
📦 Módulo (ex: Faturamento)
  └── 🎯 Atividade (ex: Visualizar Faturamento Detalhado)
       └── 🔑 Permissão (ex: FAT_VIEW_DET)
```

### 1. **Módulos** - Macro-agrupamentos
- Exemplo: `Faturamento`, `Logística`, `Permissões`
- Define áreas grandes do sistema
- Usuário precisa ter acesso ao módulo para ver qualquer feature dentro dele

### 2. **Atividades** - Features específicas
- Exemplo: `Visualizar Faturamento Detalhado`, `Gerar Relatório Cut-Off`
- Agrupa funcionalidades relacionadas
- Usuário pode ter acesso ao módulo, mas não a todas as atividades

### 3. **Permissões** - Chaves técnicas
- Exemplo: `FAT_VIEW_DET`, `FAT_VIEW_CUTOFF`
- Usadas no código para verificar acesso
- Uma atividade pode ter várias permissões associadas

## Fluxo Completo: Criando uma Nova Feature

Vamos usar seu exemplo: **Relatório Cut-Off** no módulo Faturamento.

### Passo 1: Criar a Permissão Técnica

**Onde:** Tabela `Permission` no banco de dados

**Estrutura:**
```typescript
interface Permission {
  id: number;
  key: string;           // Chave única (ex: FAT_VIEW_CUTOFF)
  description: string;   // Descrição legível
  category: string;      // Categoria (FATURAMENTO, LOGISTICS, etc)
}
```

**Exemplo de criação no seed (`backend/prisma/postgres/seed.ts`):**

```typescript
// Criar permissão técnica
const permFatViewCutoff = await prisma.permission.upsert({
  where: { key: 'FAT_VIEW_CUTOFF' },
  update: {},
  create: {
    key: 'FAT_VIEW_CUTOFF',
    description: 'Visualizar relatório de Cut-Off',
    category: 'FATURAMENTO',
  },
});

const permFatViewDet = await prisma.permission.upsert({
  where: { key: 'FAT_VIEW_DET' },
  update: {},
  create: {
    key: 'FAT_VIEW_DET',
    description: 'Visualizar faturamento detalhado',
    category: 'FATURAMENTO',
  },
});
```

**Ou via API (endpoint futuro):**
```bash
POST /api/permissions
{
  "key": "FAT_VIEW_CUTOFF",
  "description": "Visualizar relatório de Cut-Off",
  "category": "FATURAMENTO"
}
```

### Passo 2: Criar a Atividade

**Onde:** Tabela `Activity` no banco de dados

**Estrutura:**
```typescript
interface Activity {
  id: number;
  name: string;          // Nome da funcionalidade
  description?: string;  // Descrição opcional
  moduleId: number;      // ID do módulo (Faturamento)
  isMandatory: boolean;  // Se é obrigatória ao habilitar o módulo
}
```

**Exemplo no seed:**

```typescript
// Buscar o módulo de Faturamento
const modFaturamento = await prisma.module.findUnique({
  where: { name: 'Faturamento' },
});

// Criar atividade
const actRelatorioCutoff = await prisma.activity.upsert({
  where: {
    moduleId_name: {
      moduleId: modFaturamento.id,
      name: 'Gerar Relatório Cut-Off',
    },
  },
  update: {},
  create: {
    name: 'Gerar Relatório Cut-Off',
    description: 'Permite gerar e exportar relatórios de cut-off',
    moduleId: modFaturamento.id,
    isMandatory: false, // Não obrigatória por padrão
  },
});
```

### Passo 3: Vincular Permissão à Atividade

**Onde:** Tabela `ActivityPermission` (tabela de relacionamento N-N)

**Estrutura:**
```typescript
interface ActivityPermission {
  id: number;
  activityId: number;    // ID da atividade
  permissionId: number;  // ID da permissão
}
```

**Exemplo no seed:**

```typescript
// Vincular permissão à atividade
await prisma.activityPermission.upsert({
  where: {
    activityId_permissionId: {
      activityId: actRelatorioCutoff.id,
      permissionId: permFatViewCutoff.id,
    },
  },
  update: {},
  create: {
    activityId: actRelatorioCutoff.id,
    permissionId: permFatViewCutoff.id,
  },
});
```

**Ou criar tudo de uma vez:**

```typescript
const actRelatorioCutoff = await prisma.activity.create({
  data: {
    name: 'Gerar Relatório Cut-Off',
    moduleId: modFaturamento.id,
    isMandatory: false,
    permissions: {
      create: {
        permissionId: permFatViewCutoff.id,
      },
    },
  },
});
```

### Passo 4: Interface Admin - Gerenciar Acessos

**Como o admin libera para um usuário:**

1. **Admin acessa a página de Gestão de Usuários** (`/permissoes/usuario`)

2. **Seleciona um usuário** (ex: João Silva - `joao@tech.com`)

3. **Vê os módulos disponíveis** com toggle ON/OFF:
   ```
   ✅ Faturamento (HABILITADO)
      ├── ✅ Visualizar Dashboard (obrigatória, sempre ativa)
      ├── ✅ Visualizar Faturamento Detalhado
      └── ❌ Gerar Relatório Cut-Off (DESABILITADO)
   ```

4. **Admin ativa a atividade** "Gerar Relatório Cut-Off"

5. **Backend cria registro em `UserActivityAccess`**:
   ```typescript
   {
     userModuleAccessId: 123,  // ID do acesso ao módulo
     activityId: 45,            // ID da atividade "Gerar Relatório Cut-Off"
     isEnabled: true            // Liberado
   }
   ```

### Passo 5: Proteger a Feature no Frontend

**Opção 1: Esconder botão/componente baseado na permissão**

```typescript
import { useAuthContext } from '@/context/AuthContext';
import { useModuleAccess } from '@/hooks/useModuleAccess';

export function FaturamentoPage() {
  const { currentUser } = useAuthContext();
  const { module } = useModuleAccess('/faturamento');

  // Verificar se o usuário tem a permissão FAT_VIEW_CUTOFF
  const hasPermissionCutoff = module?.activities?.some(
    (activity) =>
      activity.isActive &&
      activity.permissions?.includes('FAT_VIEW_CUTOFF')
  );

  return (
    <div>
      <h1>Faturamento</h1>

      {/* Botão só aparece se tiver permissão */}
      {hasPermissionCutoff && (
        <button onClick={handleGerarCutoff}>
          Gerar Relatório Cut-Off
        </button>
      )}
    </div>
  );
}
```

**Opção 2: Criar Hook Reutilizável**

```typescript
// hooks/usePermission.ts
import { useModuleAccess } from './useModuleAccess';

export function usePermission(moduleRoute: string, permissionKey: string) {
  const { module, isLoading } = useModuleAccess(moduleRoute);

  const hasPermission = module?.activities?.some(
    (activity) =>
      activity.isActive &&
      activity.permissions?.includes(permissionKey)
  );

  return { hasPermission, isLoading };
}

// Uso no componente:
export function FaturamentoPage() {
  const { hasPermission } = usePermission('/faturamento', 'FAT_VIEW_CUTOFF');

  return (
    <div>
      {hasPermission && <CutoffReportButton />}
    </div>
  );
}
```

**Opção 3: Componente de Proteção de Permissão**

```typescript
// components/guards/PermissionGuard.tsx
export function PermissionGuard({
  moduleRoute,
  permissionKey,
  fallback = null,
  children
}) {
  const { hasPermission, isLoading } = usePermission(moduleRoute, permissionKey);

  if (isLoading) return <Spinner />;
  if (!hasPermission) return fallback;

  return <>{children}</>;
}

// Uso:
<PermissionGuard
  moduleRoute="/faturamento"
  permissionKey="FAT_VIEW_CUTOFF"
  fallback={<p>Você não tem acesso a esta funcionalidade</p>}
>
  <CutoffReportButton />
</PermissionGuard>
```

### Passo 6: Proteger Rotas Específicas (Sub-rotas)

Se a feature tiver uma página dedicada (ex: `/faturamento/cutoff`):

```typescript
// app/faturamento/cutoff/page.tsx
import { PermissionGuard } from '@/components/guards/PermissionGuard';

export default function CutoffPage() {
  return (
    <RouteGuard route="/faturamento">
      <PermissionGuard
        moduleRoute="/faturamento"
        permissionKey="FAT_VIEW_CUTOFF"
        fallback={<AcessoNegadoPage />}
      >
        <Layout>
          <CutoffDashboard />
        </Layout>
      </PermissionGuard>
    </RouteGuard>
  );
}
```

### Passo 7: Proteger no Backend (API)

**Criar decorator customizado de permissão:**

```typescript
// backend/src/common/decorators/permissions.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata('permissions', permissions);
```

**Criar guard de permissão:**

```typescript
// backend/src/common/guards/permissions.guard.ts
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler(),
    );

    if (!requiredPermissions) return true;

    const request = context.switchToHttp().getRequest();
    const userId = request.user.id;

    // Buscar permissões do usuário no banco
    const userPermissions = await this.getUserPermissions(userId);

    // Verificar se tem todas as permissões necessárias
    return requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );
  }

  private async getUserPermissions(userId: string): Promise<string[]> {
    const userAccess = await this.prisma.userModuleAccess.findMany({
      where: {
        userId,
        isEnabled: true,
      },
      include: {
        activityAccess: {
          where: { isEnabled: true },
          include: {
            activity: {
              include: {
                permissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    // Extrair todas as permissões
    const permissions = userAccess.flatMap((moduleAccess) =>
      moduleAccess.activityAccess.flatMap((activityAccess) =>
        activityAccess.activity.permissions.map((ap) => ap.permission.key),
      ),
    );

    return [...new Set(permissions)]; // Remove duplicatas
  }
}
```

**Usar no controller:**

```typescript
// backend/src/faturamento/faturamento.controller.ts
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../common/guards/permissions.guard';

@Controller('faturamento')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FaturamentoController {

  // Endpoint protegido pela permissão FAT_VIEW_CUTOFF
  @Get('cutoff')
  @RequirePermissions('FAT_VIEW_CUTOFF')
  async getCutoffReport() {
    return this.faturamentoService.generateCutoffReport();
  }

  // Endpoint com múltiplas permissões (precisa de TODAS)
  @Post('cutoff/export')
  @RequirePermissions('FAT_VIEW_CUTOFF', 'FAT_EXPORT_CUTOFF')
  async exportCutoff() {
    return this.faturamentoService.exportCutoff();
  }
}
```

## Fluxo Completo de Verificação

Quando um usuário tenta acessar uma feature protegida:

```
1. Usuário clica em "Gerar Cut-Off"
   ↓
2. Frontend verifica permissão usando usePermission('FAT_VIEW_CUTOFF')
   ↓
3. Hook busca módulos do usuário via API
   ↓
4. Verifica se a atividade está ativa E contém a permissão
   ↓
5. Se SIM → Mostra botão/componente
   Se NÃO → Esconde ou mostra mensagem de acesso negado
   ↓
6. Ao fazer requisição à API (POST /faturamento/cutoff)
   ↓
7. Backend valida JWT (JwtAuthGuard)
   ↓
8. Backend valida permissão (PermissionsGuard)
   ↓
9. Busca permissões do usuário no banco
   ↓
10. Compara com @RequirePermissions('FAT_VIEW_CUTOFF')
   ↓
11. Se SIM → Executa a lógica
    Se NÃO → Retorna 403 Forbidden
```

## Estrutura de Dados no Banco

### Exemplo: Módulo Faturamento com 2 Atividades

**Tabela `Module`:**
```sql
id | name        | route       | icon
1  | Faturamento | /faturamento | ShoppingCart
```

**Tabela `Activity`:**
```sql
id | name                          | moduleId | isMandatory
1  | Visualizar Dashboard          | 1        | true
2  | Visualizar Faturamento Det.   | 1        | false
3  | Gerar Relatório Cut-Off       | 1        | false
```

**Tabela `Permission`:**
```sql
id | key              | description                   | category
1  | FAT_VIEW_DASH    | Ver dashboard faturamento     | FATURAMENTO
2  | FAT_VIEW_DET     | Ver faturamento detalhado     | FATURAMENTO
3  | FAT_VIEW_CUTOFF  | Visualizar relatório Cut-Off  | FATURAMENTO
```

**Tabela `ActivityPermission`:**
```sql
id | activityId | permissionId
1  | 1          | 1
2  | 2          | 2
3  | 3          | 3
```

**Tabela `UserModuleAccess` (usuário João tem acesso ao módulo):**
```sql
id  | userId | moduleId | isEnabled
123 | abc123 | 1        | true
```

**Tabela `UserActivityAccess` (João só tem acesso a 2 das 3 atividades):**
```sql
id | userModuleAccessId | activityId | isEnabled
1  | 123                | 1          | true   (Dashboard - obrigatória)
2  | 123                | 2          | true   (Faturamento Detalhado)
3  | 123                | 3          | false  (Cut-Off - BLOQUEADO)
```

**Resultado:**
- João pode acessar `/faturamento` (tem módulo habilitado)
- João vê o Dashboard (atividade obrigatória)
- João vê o Faturamento Detalhado (liberado)
- João NÃO vê o botão "Gerar Cut-Off" (bloqueado)

## Convenção de Nomenclatura de Permissões

Use o padrão: `{MÓDULO}_{AÇÃO}_{RECURSO}`

### Exemplos:

**Faturamento:**
- `FAT_VIEW_DASH` - Visualizar dashboard
- `FAT_VIEW_DET` - Visualizar detalhado
- `FAT_VIEW_CUTOFF` - Visualizar cut-off
- `FAT_EXPORT_CUTOFF` - Exportar cut-off
- `FAT_EDIT_INVOICE` - Editar fatura
- `FAT_DELETE_INVOICE` - Deletar fatura

**Logística:**
- `LOG_VIEW_FLEET` - Visualizar frota
- `LOG_EDIT_VEHICLE` - Editar veículo
- `LOG_CREATE_ROUTE` - Criar rota

**Permissões (módulo de admin):**
- `PERM_MANAGE_USERS` - Gerenciar usuários
- `PERM_MANAGE_MODULES` - Gerenciar módulos
- `PERM_MANAGE_ACTIVITIES` - Gerenciar atividades

**Documentos:**
- `DOC_VIEW_ALL` - Ver todos documentos
- `DOC_UPLOAD` - Fazer upload
- `DOC_APPROVE` - Aprovar documentos
- `DOC_DELETE` - Deletar documentos

## Atividades Obrigatórias vs Opcionais

### `isMandatory: true`
- Atividades que sempre são concedidas quando o módulo é habilitado
- Exemplo: Visualizar Dashboard (funcionalidade base)
- Admin NÃO pode desabilitar individualmente
- Criadas automaticamente ao habilitar o módulo

### `isMandatory: false`
- Atividades que precisam ser explicitamente liberadas
- Exemplo: Gerar Relatórios, Exportar Dados
- Admin pode ativar/desativar por usuário
- Permite controle granular de features

## Endpoints de API Necessários

Para que o admin gerencie permissões pela interface:

### 1. Listar Permissões Disponíveis
```
GET /api/permissions
GET /api/permissions?category=FATURAMENTO
```

### 2. Criar Permissão
```
POST /api/permissions
{
  "key": "FAT_VIEW_CUTOFF",
  "description": "Visualizar Cut-Off",
  "category": "FATURAMENTO"
}
```

### 3. Criar Atividade
```
POST /api/activities
{
  "name": "Gerar Relatório Cut-Off",
  "moduleId": 1,
  "isMandatory": false,
  "permissionIds": [3]
}
```

### 4. Atribuir Permissão a Atividade
```
POST /api/activities/:activityId/permissions/:permissionId
```

### 5. Habilitar/Desabilitar Atividade para Usuário
```
PUT /api/user-activity-access/:userId/toggle/:activityId
{
  "isEnabled": true
}
```

### 6. Buscar Permissões do Usuário (para frontend)
```
GET /api/user-module-access/:userId
```
Retorna:
```json
{
  "modules": [
    {
      "id": 1,
      "name": "Faturamento",
      "isEnabled": true,
      "activities": [
        {
          "id": 3,
          "name": "Gerar Relatório Cut-Off",
          "isActive": true,
          "permissions": ["FAT_VIEW_CUTOFF"]
        }
      ]
    }
  ]
}
```

## Checklist: Adicionando Nova Feature com Permissão

- [ ] 1. **Definir a chave da permissão** (ex: `FAT_VIEW_CUTOFF`)
- [ ] 2. **Criar registro na tabela `Permission`** (via seed ou API)
- [ ] 3. **Criar atividade na tabela `Activity`** vinculada ao módulo correto
- [ ] 4. **Vincular permissão à atividade** na tabela `ActivityPermission`
- [ ] 5. **Executar migration** (se criou via seed: `npm run prisma:seed`)
- [ ] 6. **Proteger a feature no frontend** (usar hook `usePermission`)
- [ ] 7. **Proteger endpoint no backend** (usar `@RequirePermissions`)
- [ ] 8. **Testar fluxo completo:**
   - Admin habilita a atividade para um usuário
   - Usuário vê a feature no frontend
   - Usuário consegue usar a API
   - Usuário sem permissão NÃO vê a feature
   - API bloqueia usuário sem permissão (403)

## Exemplo Prático Completo: Feature "Exportar Cut-Off"

### 1. Criar Permissão (Backend - Seed)

```typescript
const permFatExportCutoff = await prisma.permission.create({
  data: {
    key: 'FAT_EXPORT_CUTOFF',
    description: 'Exportar relatório de Cut-Off para Excel',
    category: 'FATURAMENTO',
  },
});
```

### 2. Criar Atividade (Backend - Seed)

```typescript
await prisma.activity.create({
  data: {
    name: 'Exportar Relatório Cut-Off',
    moduleId: modFaturamento.id,
    isMandatory: false,
    permissions: {
      create: {
        permissionId: permFatExportCutoff.id,
      },
    },
  },
});
```

### 3. Proteger no Frontend

```typescript
// pages/faturamento/cutoff/page.tsx
export default function CutoffPage() {
  const { hasPermission: canExport } = usePermission(
    '/faturamento',
    'FAT_EXPORT_CUTOFF'
  );

  return (
    <div>
      <h1>Relatório Cut-Off</h1>
      <DataTable data={cutoffData} />

      {canExport && (
        <button onClick={handleExport}>
          <Download /> Exportar para Excel
        </button>
      )}
    </div>
  );
}
```

### 4. Proteger no Backend

```typescript
// backend/src/faturamento/faturamento.controller.ts
@Post('cutoff/export')
@RequirePermissions('FAT_EXPORT_CUTOFF')
async exportCutoff(@Request() req) {
  const userId = req.user.id;
  return this.faturamentoService.exportCutoffToExcel(userId);
}
```

### 5. Admin Libera para Usuário

1. Admin acessa `/permissoes/usuario`
2. Busca usuário "João Silva"
3. Expande módulo "Faturamento"
4. Ativa checkbox "Exportar Relatório Cut-Off"
5. Sistema cria registro `UserActivityAccess` com `isEnabled: true`

### 6. Usuário Usa a Feature

1. João acessa `/faturamento/cutoff`
2. Vê o botão "Exportar para Excel" (porque tem permissão)
3. Clica no botão
4. Frontend faz `POST /api/faturamento/cutoff/export`
5. Backend valida permissão e gera o arquivo
6. João faz download do Excel

## Considerações de Performance

### Cache de Permissões

Para evitar consultar o banco a cada verificação:

```typescript
// Frontend - Cache com React Query
const { data: userPermissions } = useQuery(
  ['user-permissions', userId],
  () => modulesService.getAll(userId),
  {
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  }
);
```

### Invalidar Cache

Quando admin altera permissões:

```typescript
queryClient.invalidateQueries(['user-permissions', userId]);
```

## Resumo

O sistema de permissões granulares do Portal Aurora permite:

✅ **Controle fino** de acesso a features específicas
✅ **Hierarquia clara** (Módulo → Atividade → Permissão)
✅ **Segurança dupla** (frontend + backend)
✅ **Flexibilidade** para adicionar novas features sem quebrar código existente
✅ **Interface admin** para gerenciar acessos sem tocar no código
✅ **Performance** com cache e consultas otimizadas

Cada nova feature que o time desenvolver pode ter sua própria permissão, permitindo que o admin controle exatamente quem pode usar cada funcionalidade do sistema.
