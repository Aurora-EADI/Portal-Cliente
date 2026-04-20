# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

UnehfmgtyH8aDpvRGFjtbsiEWAUmp3xA

## Project Overview

Portal Aurora is a full-stack enterprise EADI (Estação Aduaneira de Interior) management system. It's a document management and billing portal with role-based access control, supplier onboarding, and Protheus ERP integration. The project uses a monorepo structure with separate Next.js frontend and NestJS backend, containerized via Docker.

## Technology Stack

### Frontend (aurora-eadi-front)
- **Framework**: Next.js 15.1.0 with App Router and React Server Components
- **UI**: Radix UI + shadcn/ui (New York variant), Tailwind CSS, Lucide icons
- **State**: React Context (auth, module access) + TanStack Query 5.90.11 (server state)
- **HTTP**: Axios with automatic token refresh interceptors
- **Data Tables**: Tabulator Tables 6.3.1, GridJS React

### Backend (backend)
- **Framework**: NestJS 11.0.1
- **Databases**:
  - PostgreSQL via Prisma 6.18.0 (primary)
  - SQL Server via mssql 12.2.0 (Protheus integration)
- **Auth**: JWT (access 1h + refresh 7d), Passport.js, bcrypt
- **Storage**: MinIO 8.0.6 (S3-compatible)
- **Docs**: Swagger at `/api/docs`

### Infrastructure
- Docker Compose for orchestration
- Traefik v3.1 reverse proxy
- Separate dev/prod configurations

## Development Commands

### Starting the Application

Use the PowerShell script at the root:
```powershell
.\scripts\start-dev.ps1
```

This starts all services via Docker Compose with hot reload enabled:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- Swagger Docs: http://localhost:5000/api/docs
- MinIO Console: http://localhost:9001
- PostgreSQL: localhost:5432
- Traefik Dashboard: http://localhost:8082

### Frontend Commands (aurora-eadi-front/)
```bash
npm run dev      # Start dev server on 0.0.0.0
npm run build    # Production build
npm run start    # Production server
npm run lint     # ESLint
```

### Backend Commands (backend/)
```bash
npm run dev                  # Development with watch mode
npm run build                # Compile TypeScript
npm run start:prod           # Production mode
npm run lint                 # ESLint with auto-fix

# Database
npm run prisma:generate:pg   # Generate Prisma client
npm run prisma:migrate:pg    # Run migrations
npm run prisma:seed          # Seed database
npm run studio               # Prisma Studio GUI

# Testing
npm run test                 # Run all tests
npm run test:watch           # Watch mode
npm run test:cov             # With coverage
npm run test:e2e             # E2E tests
```

### Docker Commands
```bash
# Development
docker compose -f docker-compose.dev.yml --env-file .env.dev up -d
docker compose -f docker-compose.dev.yml --env-file .env.dev logs -f
docker compose -f docker-compose.dev.yml --env-file .env.dev down

# Production

docker compose -f docker-compose.prod.yml --env-file .env.prod build --no-cache --progress=plain

docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
# Ou verificar logs em tempo real
docker compose -f docker-compose.prod.yml --env-file .env.prod up
# Verificar status dos containers
docker compose -f docker-compose.prod.yml ps
# Ver logs de um serviço específico
docker compose -f docker-compose.prod.yml logs -f frontend
docker compose -f docker-compose.prod.yml logs -f backend
```

Confirmado. O sql-proxy está unhealthy e o warning aparece toda vez — SQL_SERVER_HOST não está sendo carregado porque o --env-file .env.homolog não foi passado nos
  comandos.
                                                                                                                                                                      
  fica vazia e o socat inicia como tcp-connect::1433 (host em branco) — por isso fica unhealthy.                                                                         
  
  Fix — recriar o proxy com a variável correta:

  docker compose -f docker-compose.homolog.yml --env-file .env.homolog up -d sql-proxy

  Após o proxy ficar healthy, reinicie o backend para reconectar ao SQL Server:

  docker compose -f docker-compose.homolog.yml --env-file .env.homolog restart backend

## Architecture Patterns

## UI Styling Patterns

### Form Inputs
To maintain visual consistency across the portal, all form inputs (Input, Textarea, SelectTrigger) should use the following focus styling pattern:
```tsx
className="... border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none focus-visible:ring-0 focus-visible:ring-offset-0 transition"
```
For error states, use:
```tsx
className="... border-destructive ring-destructive/20 focus-visible:ring-0 focus-visible:ring-offset-0"
```

### Frontend Architecture

**App Router Structure**: Next.js 15 with file-based routing in [aurora-eadi-front/src/app/](aurora-eadi-front/src/app/)
- Each route folder contains `page.tsx` (route component) and optional `layout.tsx`
- Server components by default, use `'use client'` for client components

**Page Pattern (SelectionPage + Sub-páginas)**:

Todos os módulos seguem o padrão de **página raiz = apresentação** e **sub-páginas = funcionalidades**:

- **Página raiz** (`/modulo/page.tsx`): Renderiza um componente `XxxSelectionPage` — página de boas-vindas/apresentação do módulo
- **Sub-páginas** (`/modulo/sub-rota/page.tsx`): Renderizam os componentes funcionais reais, acessíveis via Sidebar

Estrutura de arquivos por módulo:
```
src/app/<modulo>/
  page.tsx                    → Renderiza <XxxSelectionPage />
  <sub-rota>/page.tsx         → Renderiza o componente funcional (com guards se necessário)

src/components/pages/<modulo>/
  XxxSelectionPage.tsx        → Componente de apresentação (template padrão)
  ComponenteFuncional.tsx     → Componente com a funcionalidade real
```

Template padrão do SelectionPage:
```tsx
'use client'
import React from 'react';

export function XxxSelectionPage() {
    return (
        <div className="bg-primary-50 border border-primary-100 rounded-xl p-8 shadow-sm">
            <h1 className="text-2xl font-bold text-primary-900 mb-6 flex items-center gap-3">
                Bem-vindo ao Módulo Xxx
            </h1>
            <div className="space-y-4 text-primary-800 text-lg leading-relaxed">
                <p>Descrição do módulo...</p>
                <p>Este espaço foi desenvolvido para...</p>
            </div>
        </div>
    );
}
```

Template padrão de sub-página:
```tsx
'use client';
import { Header } from '@/components/layout/Header';
import { Layout } from '@/components/layout/Layout';
import { ComponenteFuncional } from '@/components/pages/modulo/ComponenteFuncional';

export default function SubPage() {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />
      <Layout>
        <ComponenteFuncional />
      </Layout>
    </div>
  );
}
```

Sub-páginas com guards de permissão envolvem o conteúdo com `PermissionRouteGuard` ou `RoleGuard`:
```tsx
<PermissionRouteGuard moduleRoute="/modulo" requiredPermissions={['PERMISSION_KEY']}>
  <div className="h-screen flex flex-col overflow-hidden">
    <Header />
    <Layout><ComponenteFuncional /></Layout>
  </div>
</PermissionRouteGuard>
```

**Mapa de módulos e sub-rotas**:

| Módulo | Página raiz (SelectionPage) | Sub-páginas funcionais |
|--------|---------------------------|----------------------|
| `/ccte` | `CcteSelectionPage` | `/ccte/painel` (CcteDashboard) |
| `/comercial` | `ComercialSelectionPage` | `/comercial/simulador` (MaritimeSimulator), `/comercial/history` |
| `/faturamento` | `FaturamentoSelectionPage` | `/faturamento/detalhado` (FaturamentoPage + guard), `/faturamento/cutoff` |
| `/fornecedor` | `FornecedorSelectionPage` | `/fornecedor/lista` (SupplierList + guard) |
| `/aereo` | `AereoSelectionPage` | `/aereo/simulador` (AirSimulator), `/aereo/history` |
| `/servicos` | `ServicosSelectionPage` | `/servicos/lista` (ServiceList), `/servicos/cadastro` |
| `/cliente` | `ClienteSelectionPage` | `/cliente/lista` (CustomerList) |
| `/documentos` | `DocumentosSelectionPage` | `/documentos/gestao` (AdminDashboard + RoleGuard), `/documentos/empresa`, `/documentos/cadastrar` |
| `/dta` | `DtaSelectionPage` | `/dta/maritimo` (DtaMaritimoDashboard) |
| `/dashboard` | `DashboardSelectionPage` | `/dashboard/kanban` |
| `/simulacoes` | `SimulationsSelectionPage` | (links para sub-rotas de outros módulos) |
| `/permissoes` | `PermissoesDashboard` | `/permissoes/catalogo`, `/permissoes/atividades`, `/permissoes/usuario`, `/permissoes/gestao` |

**Navigation System (Sidebar)**:

A navegação é configurada em dois níveis — estático e dinâmico:

1. **Navegação estática** (fallback): Definida em `src/config/navigation/modules/<modulo>.ts`
   - Cada módulo exporta um `NavigationContext` com `basePath`, `items` e `allowedRoles`
   - Items compartilhados (cross-module) ficam em `src/config/navigation/shared.ts`
   - Para adicionar acesso a outro módulo na sidebar, inclua um `NavItem` apontando para a rota desejada

2. **Navegação dinâmica**: Gerada a partir do banco de dados via `buildNavigation.ts`
   - Construída a partir de `ModuleAccess.sharedItems` retornados pelo backend
   - Tem prioridade sobre a navegação estática quando o módulo tem sharedItems configurados
   - **Merge automático com static nav**: após construir os `children` a partir dos sharedItems, `buildNavigation.ts` também inclui filhos definidos no static nav (`staticGroupItem.children`) que ainda não estejam na lista. Isso garante que novas sub-rotas adicionadas ao arquivo `.ts` do módulo apareçam na sidebar sem exigir configuração manual no banco
   - Módulos sem sharedItems no banco usam o fallback estático integralmente
   - **Estrutura correta para grupos colapsáveis** no static nav: o item do grupo deve ter `isGroup: true` + `children: [...]`. Itens fora do grupo (ex: `CLIENTE_ITEM`) ficam no nível raiz do `items[]` — `buildNavigation.ts` os coleta via `extraItems` filtrando `!i.isGroup`

3. **Respeito a sub-páginas desabilitadas** (`sharedItems` + nav estática):
   - O editor de módulos armazena apenas as sub-páginas habilitadas em `ModuleAccess.sharedItems`
   - `useNavigationWithPermissions` aplica esse filtro mesmo para módulos `staticOnly: true`:
     - `sharedItems == null` → nunca configurado → exibe todos os itens estáticos
     - `sharedItems = []`   → todas desmarcadas → não exibe nenhuma sub-página
     - `sharedItems = [...]` → exibe apenas as rotas listadas no array
   - A filtragem ocorre pelo caminho (`path`) do item: só sub-páginas com `path.split('/').length > 2` são filtradas; itens raiz de módulo e Home passam livremente
   - **Nunca adicionar sub-página nova ao static nav sem registrar no banco** (via editor de módulos), caso contrário ela aparece para todos mesmo antes de ser habilitada

4. **Route Registry**: Lista centralizada de todas as rotas válidas
   - Frontend: `src/config/routes/registry.ts` (MODULE_ROUTES + SUB_ROUTES)
   - Backend: `backend/src/modules/available-routes.ts` (espelho para validação server-side)
   - **Ao criar nova rota, registrar em ambos os arquivos**

**Cross-module navigation** (acesso a outro módulo na sidebar):
```ts
// Em shared.ts — para items usados em múltiplos módulos
export const CLIENTE_ITEM = {
    label: 'Cliente',
    icon: List,
    path: '/cliente/lista',
    requiredPermissions: ['CAD_CLIENTE'],
};

// No módulo que precisa de acesso — importar e incluir nos items
import { HOME_ITEM, CLIENTE_ITEM } from '../shared';
items: [HOME_ITEM, /* items do módulo */, CLIENTE_ITEM],
```

**State Management**:
- **Global State**: React Context for auth ([aurora-eadi-front/src/context/AuthContext.tsx](aurora-eadi-front/src/context/AuthContext.tsx)) and module access
- **Server State**: TanStack Query for data fetching, caching, and synchronization
- Configured in [aurora-eadi-front/src/app/providers.tsx](aurora-eadi-front/src/app/providers.tsx)

**Authentication Flow** (Critical):
- Access token (1 hour) + Refresh token (7 days) pattern
- **Automatic token refresh** via Axios interceptors in [aurora-eadi-front/src/lib/api.ts](aurora-eadi-front/src/lib/api.ts)
- Refresh logic:
  1. Before request: Check if token expired → auto-refresh if needed
  2. On 401 response: Attempt refresh → retry original request
  3. Multiple concurrent requests queue during refresh to prevent race conditions
- Protected routes wrapped with `ProtectedRoute` component
- Session expiry redirects to `/session-expired`

**Service Layer Pattern**:
- All API calls abstracted in [aurora-eadi-front/src/services/](aurora-eadi-front/src/services/)
- Each domain has its own service file (auth, documents, users, etc.)
- Import the `api` instance from `@/lib/api` for automatic auth handling

**Component Organization**:
- [aurora-eadi-front/src/components/ui/](aurora-eadi-front/src/components/ui/): shadcn/ui reusable components
- [aurora-eadi-front/src/components/pages/](aurora-eadi-front/src/components/pages/): Page-specific business components
- [aurora-eadi-front/src/components/layout/](aurora-eadi-front/src/components/layout/): Layout components (Sidebar, Layout wrapper)
- [aurora-eadi-front/src/components/guards/](aurora-eadi-front/src/components/guards/): Route protection components

### Backend Architecture

**Module Structure**: Feature-based modules in [backend/src/](backend/src/)
- Each feature (auth, documents, users, etc.) is a self-contained NestJS module
- All modules imported into [backend/src/App/app.module.ts](backend/src/App/app.module.ts)

**Authentication & Authorization**:
- JWT strategy with Passport.js in [backend/src/auth/strategies/](backend/src/auth/strategies/)
- Token lifecycle managed by [backend/src/auth/services/token.service.ts](backend/src/auth/services/token.service.ts)
- **Critical**: All tokens stored in `user_tokens` table with metadata (IP, user agent, expiry)
- Token revocation supported via `revokedAt` field
- Guards in [backend/src/auth/guards/](backend/src/auth/guards/)

**Database Access Patterns**:
- **PostgreSQL (Primary)**: Prisma client at `@prisma/client-postgres` for app data
  - Service: [backend/src/prisma/prisma.service.ts](backend/src/prisma/prisma.service.ts)
  - Schema: [backend/prisma/postgres/schema.prisma](backend/prisma/postgres/schema.prisma)
- **SQL Server (Protheus Integration)**: Direct queries via `mssql` library
  - Used for reading legacy ERP data
  - Connection managed separately from Prisma

**File Storage Pattern**:
- MinIO service in [backend/src/minio/](backend/src/minio/)
- Presigned URLs generated with 24-hour expiry
- Internal endpoint for backend access, external for frontend downloads
- Document metadata stored in PostgreSQL, files in MinIO

**DTO Validation**:
- All DTOs use `class-validator` decorators
- Automatic validation enabled globally in [backend/src/main.ts](backend/src/main.ts) via `ValidationPipe`
- `whitelist: true` strips unknown properties
- `transform: true` auto-transforms types

**Global API Prefix**: All routes prefixed with `/api` (configured in [backend/src/main.ts](backend/src/main.ts#L26))

### Database Schema Key Points

**User & Company Relationship**:
- `User.role`: ADMIN (internal) or CLIENT (supplier)
- `Company.status`: PENDING → APPROVED/REJECTED workflow
- Cascade deletes: Deleting company deletes associated users and documents

**Document Versioning**:
- `Document.isLatest`: Boolean flag for current version
- When uploading new version: Set old `isLatest = false`, new `isLatest = true`
- `Document.status`: PENDING → APPROVED/REJECTED by admin

**Permission System** (3-level hierarchy):
1. **Module**: Top-level feature (e.g., "Documentos", "Faturamento")
2. **Activity**: Specific permission within module (e.g., "Cadastrar Documento")
3. **UserModuleAccess**: User-to-module assignments with activity access array

**Token Management**:
- `UserToken` table tracks all issued tokens
- Indexed on `userId`, `type`, `token`, `expiresAt` for performance
- `lastUsedAt` updated on each use (optional tracking)

## Module Domains

### DTA Maritime (DTA Marítimo)
- Gestão de Processos de Importação marítima com containers e Bills of Lading
- **Data model**: `ProcessoImportacao` → `ContainerDta` (1:N) → `BillOfLading` (1:N)
- **BL normalization**: o campo BL é uma entidade separada (`BillOfLading`). Um container pode ter múltiplos BLs. No formulário, o usuário informa BLs agrupados por container (abordagem "BL-group-first" para espelhar células mescladas do Excel)
- **Entrada de múltiplos BLs**: o usuário pode separar BLs com `/` (ex: `BCN0293743/BCN0295103/`). O frontend usa `splitBl()` para dividir e `sanitizeBl()` para limpar caracteres inválidos (`"',;`). A barra `/` é separador — não deve ser removida por `sanitizeBl`
- **Update de containers**: estratégia replace-all para BLs — ao editar, todos os BLs do container são deletados e recriados via `$transaction` no backend
- **Arquivos principais**:
  - `backend/src/dta-maritime/` — module, controller, service, DTOs
  - `aurora-eadi-front/src/types/dtaMaritime.ts` — tipos TypeScript
  - `aurora-eadi-front/src/services/dtaMaritimeService.ts` — serviço de API
  - `aurora-eadi-front/src/hooks/useDtaMaritime.ts` — hooks TanStack Query
  - `aurora-eadi-front/src/components/pages/dta/DtaMaritimoDashboard.tsx` — lista
  - `aurora-eadi-front/src/components/pages/dta/DtaProcessoDetail.tsx` — detalhe
  - `aurora-eadi-front/src/components/pages/dta/modals/ProcessoFormModal.tsx` — modal criar/editar

### Commercial (Comercial)
- Maritime cost simulations
- Service catalog management
- Cost calculations per service type

### Documents (Documentos)
- Multi-file upload with MinIO storage
- Document type categorization
- Approval workflow (admin approves/rejects)
- Version control via `isLatest` flag
- Expiration date tracking

### Billing (Faturamento)
- Billing cutoff management
- Service cost definitions
- Excel export functionality

### Supplier Management (Fornecedor)
- Company registration with CNPJ validation
- Protheus ERP integration for supplier creation
- Automatic user creation with temporary password
- Approval workflow before system access

### Permissions (Permissões)
- User-module-activity access matrix
- Permission catalog management
- Activity-level granular control

## Important Code Patterns

### Adding a New Module / Sub-page
1. **Novo módulo**:
   - Criar `src/app/<modulo>/page.tsx` renderizando `<XxxSelectionPage />`
   - Criar `src/components/pages/<modulo>/XxxSelectionPage.tsx` (template de apresentação)
   - Criar sub-página(s) funcional(is) em `src/app/<modulo>/<sub-rota>/page.tsx`
   - Adicionar navegação em `src/config/navigation/modules/<modulo>.ts`
   - Registrar rotas em `src/config/routes/registry.ts` E `backend/src/modules/available-routes.ts`
2. **Nova sub-página em módulo existente**:
   - Criar `src/app/<modulo>/<sub-rota>/page.tsx` com Header + Layout + componente funcional
   - Adicionar `NavItem` no arquivo de navegação do módulo (`src/config/navigation/modules/<modulo>.ts`)
   - Registrar em `registry.ts` (frontend) e `available-routes.ts` (backend)
   - Adicionar guard (`PermissionRouteGuard` / `RoleGuard`) se necessário
3. Create service in [aurora-eadi-front/src/services/your-domain/](aurora-eadi-front/src/services/your-domain/) using `api` from `@/lib/api`
4. Use TanStack Query hooks (`useQuery`, `useMutation`) for data fetching

### Adding a New Backend Endpoint
1. Create module: `nest g module your-feature`
2. Create controller: `nest g controller your-feature`
3. Create service: `nest g service your-feature`
4. Add DTOs in `dto/` with validation decorators
5. Apply `@UseGuards(JwtAuthGuard)` for protected routes
6. Add Swagger decorators: `@ApiTags()`, `@ApiOperation()`, `@ApiResponse()`
7. Import module in [backend/src/App/app.module.ts](backend/src/App/app.module.ts)

### Working with Prisma
```bash
# After schema changes
npm run prisma:generate:pg   # Regenerate client
npm run prisma:migrate:pg    # Create and run migration

# In code
import { PrismaPostgresService } from '../prisma/prisma.service';
// Inject and use this.prisma.modelName.method()
```

**Important**: Prisma client is generated to `node_modules/@prisma/client-postgres` (custom output path).

### File Upload Pattern
1. Frontend: Use FormData with `Content-Type: multipart/form-data`
2. Backend: Use `@UseInterceptors(FilesInterceptor('files'))` decorator
3. Upload to MinIO via MinioService
4. Save metadata to PostgreSQL with `fileUrl` pointing to MinIO

### Token Refresh Pattern
- **Never manually implement refresh logic** - it's handled by Axios interceptors
- Token refresh is automatic and transparent to services
- If refresh fails, user is redirected to login automatically
- When calling backend, just use the `api` instance from `@/lib/api`

## Integration Points

### Protheus ERP Integration
- Located in [backend/src/integration/protheus/](backend/src/integration/protheus/)
- Secured with integration guard (X-Integration-Key header)
- Used for supplier creation sync
- SQL Server direct queries for legacy data

### MinIO Object Storage
- Development: Accessible at http://localhost:9001
- Credentials in `.env.dev`
- Bucket auto-created on service start
- Presigned URLs expire after 24 hours

## Environment Configuration

### Required Environment Variables

**Frontend** (`.env.local` or `.env.dev`):
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

**Backend** (`.env.dev` or `.env.prod`):
```
DATABASE_URL_POSTGRES=postgresql://user:pass@host:5432/db
MSSQL_SERVER=protheus-server
MSSQL_DATABASE=protheus_db
MINIO_ENDPOINT=minio
MINIO_PORT=9000
JWT_SECRET=your-secret
PROTHEUS_INTEGRATION_KEY=your-key
CORS_ORIGIN=http://localhost:3000
```

## Common Gotchas

1. **Token Interceptor**: Always use the `api` instance from `@/lib/api`, not raw Axios - otherwise tokens won't be handled.

2. **Prisma Client Path**: Import from `@prisma/client-postgres`, not `@prisma/client`.

3. **Docker Host Binding**: Both Next.js and NestJS must bind to `0.0.0.0` for Docker networking (already configured).

4. **CORS**: Backend supports multiple origins via comma-separated `CORS_ORIGIN` env var.

5. **Global API Prefix**: All backend routes automatically prefixed with `/api` - don't add it to controller routes.

6. **Document Versioning**: When uploading new version, must manually set previous document's `isLatest = false`.

7. **SQL Server Connection**: Uses `mssql` library directly (not Prisma) - see Protheus integration for examples.

8. **File Paths in Docker**: In production, ensure MinIO paths match between Docker volumes and code configuration.

9. **Ícones de navegação devem ser únicos por módulo**: Cada sub-item dentro de um módulo DEVE ter um ícone diferente dos demais itens do mesmo grupo. Nunca repetir o mesmo ícone Lucide entre siblings na sidebar. Ao adicionar nova sub-rota, verificar os ícones já usados no módulo e escolher um diferente. Os ícones devem ser consistentes em 3 locais:
   - `src/config/navigation/modules/<modulo>.ts` (navegação estática — componente Lucide)
   - `src/config/routes/registry.ts` (registry frontend — string do nome do ícone)
   - `backend/src/modules/available-routes.ts` (registry backend — string do nome do ícone)

   A navegação dinâmica (`buildNavigation.ts`) resolve ícones na ordem: `sharedItem.icon` (banco) → `registry icon` (pela rota) → `moduleIcon` (fallback). Se o ícone não estiver no registry, todos os items ficarão com o mesmo ícone do módulo.

10. **`mutateAsync` exige `catch {}` no caller**: Hooks TanStack Query com `useMutation` tratam erros via `onError`, mas quando se usa `mutateAsync` (ao invés de `mutate`), o erro também é relançado como Promise rejection. Se o caller não tiver `try/catch` ou `.catch()`, o Next.js exibe o overlay de erro. Sempre envolva chamadas a `mutateAsync` com `try { await mutateAsync(...) } catch { /* tratado pelo onError */ }`.

11. **`JwtAuthGuard` deve lançar `UnauthorizedException`, não `Error`**: Em `handleRequest`, usar `throw new UnauthorizedException(...)` do `@nestjs/common`. Lançar `new Error(...)` genérico faz o NestJS tratar como erro 500 (não 401), o que quebra o interceptor de refresh de token do frontend que só reconhece respostas 401.

## Testing Strategy

- **Unit Tests**: Jest for services and utilities
- **E2E Tests**: Configured but use `npm run test:e2e`
- Test files: `*.spec.ts` in source directories
- Coverage reports generated to `coverage/`
