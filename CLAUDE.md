# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Portal-Aurora** is a full-stack monorepo for the Aurora EADI portal system, consisting of:
- **Frontend:** Next.js 15 (React 19) with TypeScript, Tailwind CSS, and Radix UI
- **Backend:** NestJS 11 REST API with TypeScript
- **Databases:** PostgreSQL (primary) + SQL Server (legacy Siaum system integration)
- **Repository:** https://github.com/Aurora-EADI/Portal-Aurora.git
- **Main Branch:** `main` (development on `develop`)

## Common Commands

### Frontend (aurora-eadi-front/)
```bash
npm run dev        # Start Next.js dev server on port 3000 with hot reload
npm run build      # Production build
npm run start      # Run production build
npm run lint       # Run ESLint
```

### Backend (backend/)
```bash
npm run dev          # Start NestJS with hot reload on port 3333
npm run build        # Build for production
npm run start:prod   # Run production build
npm start            # Run built code
npm run lint         # Run ESLint with auto-fix
npm run format       # Format code with Prettier

# Database
npm run studio       # Open Prisma Studio (PostgreSQL schema)
npm run prisma:seed  # Seed database with initial data

# Testing
npm run test         # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run test:cov     # Run tests with coverage
npm run test:e2e     # Run end-to-end tests
```

## Architecture

### Monorepo Structure
```
Portal-Aurora/
├── aurora-eadi-front/    # Next.js frontend (port 3000)
└── backend/              # NestJS API (port 3333)
```

### Frontend Architecture

**Routing:** Next.js 15 App Router (file-based routing in `src/app/`)
- `/modules` - Dashboard home with module access cards
- `/faturamento` - Billing/invoicing pages
- `/permissoes` - Permission management system
- `/documentos` - Document management

**State Management:**
- **Auth State:** React Context (`AuthContext`) with JWT token in localStorage + cookies
- **Server State:** TanStack React Query for data fetching and caching
- **API Client:** Axios with request/response interceptors in `src/services/httpClient.ts`

**Key Conventions:**
- UI components in `src/components/ui/` (Radix-based, reusable)
- Page components in `src/components/pages/` (feature-specific)
- API services in `src/services/` (one file per domain)
- Custom hooks in `src/hooks/`
- Path alias: `@/` points to `src/`

### Backend Architecture

**Framework:** NestJS with modular architecture
- Each feature is a module (auth, user, permissions, faturamento, etc.)
- Global API prefix: `/api` (configured in `main.ts`)
- CORS enabled for `http://localhost:3000`

**Database:**
- **PostgreSQL (primary):** User auth, RBAC, core business data
  - Schema: `prisma/postgres/schema.prisma`
  - Service: `PrismaPostgresService`
- **SQL Server (secondary):** Read-only for legacy Siaum billing data
  - Schema: `prisma/sqlserver/schema.prisma`
  - Service: `PrismaSqlServerService`

**Authentication:**
- JWT-based with Passport.js
- Protected routes use `@UseGuards(JwtAuthGuard)`
- Token expiration: 24 hours
- Login endpoint: `POST /api/auth/login` (returns JWT token)

**Validation:**
- Global ValidationPipe with `whitelist: true` and `transform: true`
- DTOs use class-validator decorators

### Permission System (RBAC)

Three-tier hierarchy:
1. **Modules** - Macro-level access (e.g., "Logistics" module)
2. **Activities** - Feature-level access within modules (e.g., "View Fleet")
3. **Permissions** - Technical permission keys (e.g., `LOG_VIEW_FLEET`)

**Access Control Flow:**
- `UserModuleAccess` - Binary toggle for module access
- `UserActivityAccess` - Exception layer for granular activity control
- `ActivityPermission` - Links activities to technical permissions

### Frontend-Backend Communication

```
Frontend (Next.js) → httpClient (Axios)
  ↓
  Base URL: process.env.NEXT_PUBLIC_API_URL (default: http://localhost:3000/api)
  Request Interceptor: Adds JWT Bearer token from localStorage
  Response Interceptor: Handles 401 errors → logout
  ↓
Backend (NestJS) → /api/* endpoints
  ↓
Database (Prisma) → PostgreSQL + SQL Server
```

**Login Flow:**
1. User submits credentials → `POST /api/auth/login`
2. Backend validates → returns JWT token
3. Frontend stores token in localStorage + cookies
4. All subsequent requests include `Authorization: Bearer {token}`
5. 401 response triggers automatic logout

## Important Files

### Must Read for Understanding Architecture
- `backend/src/App/app.module.ts` - Root module, imports all features
- `backend/prisma/postgres/schema.prisma` - Database schema with all models
- `aurora-eadi-front/src/app/providers.tsx` - React Query + Context setup
- `aurora-eadi-front/src/services/httpClient.ts` - API client with auth interceptors
- `aurora-eadi-front/src/context/AuthContext.tsx` - Auth state management
- `backend/src/auth/auth.module.ts` - JWT authentication configuration

### Entry Points
- **Frontend:** `aurora-eadi-front/src/app/layout.tsx`
- **Backend:** `backend/src/main.ts` (bootstrap, CORS, validation setup)

## Database Schema

### Core Models (PostgreSQL)

**Authentication & Users:**
- `User` - email, password (bcrypt hashed), role (ADMIN/SUPPLIER/EMPLOYEE), companyId
- `Company` - CNPJ, address, status (PENDING/ACTIVE/REJECTED)

**Permission System:**
- `Module` - Macro-level modules (name, description)
- `Activity` - Features within modules
- `Permission` - Technical permission keys
- `ActivityPermission` - Links activities to permissions
- `UserModuleAccess` - User ↔ Module access toggle
- `UserActivityAccess` - Activity-level exceptions

**Business Data:**
- `Faturamento` - Billing records (40+ fields including amounts, dates, tax info)
- `Document` - File uploads with status tracking
- `Supplier`, `Employee`, `Customer` - Business entities

### Enums
- `UserRole`: ADMIN, SUPPLIER, EMPLOYEE
- `DocumentStatus`: PENDING, APPROVED, REJECTED
- `CompanyStatus`: PENDING, ACTIVE, REJECTED

## Development Patterns

### Frontend

**Component Organization:**
- Small reusable UI components → `src/components/ui/`
- Feature-specific page components → `src/components/pages/`
- Layout components (Header, Sidebar) → `src/components/layout/`

**Data Fetching:**
- Use TanStack React Query for server state
- Custom hooks pattern (e.g., `useAuth()`) for mutations
- API services return promises (no throw statements, use `Promise.reject`)

**Navigation:**
- Dynamic navigation based on route (`src/config/navigation.ts`)
- Role-based access control checks
- Protected routes validated before rendering

### Backend

**Module Structure:**
- Each feature has: Controller (HTTP), Service (business logic), Module (imports)
- Import `PrismaModule` for database access
- Use DTOs for request/response validation

**Route Protection:**
```typescript
@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile(@Request() req) {
  return req.user; // JWT payload
}
```

**Error Handling:**
- Throw `HttpException` with appropriate status codes
- Let NestJS global exception filter handle formatting

**Database Access:**
```typescript
constructor(private prisma: PrismaPostgresService) {}

async findAll() {
  return this.prisma.user.findMany();
}
```

## Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### Backend (.env)
```
DATABASE_URL_POSTGRES=postgresql://user:pass@localhost:5432/aurora
DATABASE_URL_SQLSERVER=sqlserver://localhost:1433;database=Siaum
JWT_SECRET=your-secret-key
PORT=3333
```

## Recent Development Focus

Based on recent commits:
1. **Authentication refactoring** - JWT flow and token management
2. **Billing system** - SQL Server integration for Siaum data, date range filtering
3. **RBAC implementation** - User-Module-Activity permission hierarchy
4. **UI improvements** - Sidebar, Header, and navigation refactoring

## Key Technical Details

### Multiple Database Support
- Prisma adapters enable PostgreSQL + SQL Server in same project
- Billing module (`faturamento`) queries both databases
- SQL Server is read-only (legacy system integration)

### Authentication Token Storage
- **localStorage:** Primary storage for SPA state
- **Cookies:** Persistence across page reloads (Next.js middleware)
- **Axios interceptor:** Automatically adds Bearer token to all requests
- **Auto-logout:** 401 responses trigger logout and redirect to login

### UI Component Library
- Radix UI primitives for accessibility
- Tailwind CSS with custom configuration
- Class Variance Authority for component variants
- Lucide React for icons

### Table Components
- Tabulator Tables for complex data grids
- GridJS React as alternative
- Built-in Excel export (xlsx library)
