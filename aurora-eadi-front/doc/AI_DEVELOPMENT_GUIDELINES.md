# 🤖 AI Development Guidelines - Aurora EADI Frontend

Este documento serve como referência para IAs (e desenvolvedores) que trabalham no projeto Aurora EADI Frontend. Contém padrões, convenções e boas práticas a serem seguidas.

---

## 📦 Stack Principal

| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| **Next.js** | 15.x | Framework React com App Router |
| **React** | 19.x | Biblioteca de UI |
| **TypeScript** | 5.x | Tipagem estática |
| **TanStack Query** | 5.x | Gerenciamento de server state |
| **Axios** | 1.x | Cliente HTTP |
| **Tailwind CSS** | 3.x | Estilização utilitária |
| **Shadcn/ui** | new-york style | Biblioteca de componentes (Radix UI) |
| **Lucide React** | - | Biblioteca de ícones |
| **Tabulator Tables** | 6.x | Tabelas avançadas |

---

## 🗂️ Estrutura de Pastas

```
src/
├── app/                    # Rotas e páginas (App Router)
│   ├── globals.css         # Estilos globais + CSS Variables
│   ├── layout.tsx          # Layout raiz
│   ├── providers.tsx       # Providers (QueryClient, Auth)
│   └── [rotas]/            # Páginas por rota
├── components/
│   ├── ui/                 # Componentes Shadcn/ui
│   ├── layout/             # Componentes de layout (Sidebar, Header)
│   ├── pages/              # Componentes específicos de páginas
│   └── guards/             # Guards de rota (proteção de acesso)
├── context/                # React Context (AuthContext)
├── hooks/                  # Custom hooks (useAuth, useDocuments, etc.)
├── lib/                    # Utilitários e configurações
│   ├── api.ts              # Instância Axios configurada
│   ├── react-query.ts      # Configuração do QueryClient
│   └── utils.ts            # Funções utilitárias (cn)
├── services/               # Chamadas de API separadas por domínio
│   ├── api.ts              # Services consolidados
│   ├── [domínio]/          # Services específicos por domínio
└── types/                  # Definições de tipos TypeScript
    ├── index.ts            # Re-export de todos os tipos
    ├── user.ts             # Tipos de usuário
    ├── company.ts          # Tipos de empresa
    └── ...                 # Outros tipos por domínio
```

---

## 🎨 Paleta de Cores

O projeto utiliza **CSS Variables** para theming, permitindo modo claro e escuro.

### Cores Principais (Light Mode)

| Variável | HSL | Uso |
|----------|-----|-----|
| `--background` | `0 0% 100%` | Fundo principal |
| `--foreground` | `222.2 84% 4.9%` | Texto principal |
| `--primary` | `222.2 47.4% 11.2%` | Cor primária (botões, links) |
| `--primary-foreground` | `210 40% 98%` | Texto sobre cor primária |
| `--secondary` | `210 40% 96.1%` | Cor secundária |
| `--muted` | `210 40% 96.1%` | Elementos suaves |
| `--muted-foreground` | `215.4 16.3% 46.9%` | Texto suave |
| `--accent` | `210 40% 96.1%` | Destaques |
| `--destructive` | `0 84.2% 60.2%` | Ações destrutivas (vermelho) |
| `--border` | `214.3 31.8% 91.4%` | Bordas |
| `--ring` | `222.2 84% 4.9%` | Focus ring |

### Cores Primárias (Orange Scale)

```
primary-50:  #fff7ed
primary-100: #ffedd5
primary-200: #fed7aa
primary-300: #fdba74
primary-400: #fb923c
primary-500: #f97316  ← Principal
primary-600: #ea580c
primary-700: #c2410c
primary-800: #9a3412
primary-900: #7c2d12
```

### Uso no Código

```tsx
// ✅ Correto: usar classes do Tailwind
<div className="bg-primary text-primary-foreground">
<Button variant="destructive">

// ❌ Evitar: cores hardcodadas
<div style={{ backgroundColor: '#f97316' }}>
```

---

## 📡 Chamadas de API

### Estrutura de Services

Todas as chamadas de API devem ser separadas em **services** por domínio.

```typescript
// src/services/api.ts ou src/services/[domínio]/index.ts

import { api } from '@/lib/api';

export const documentService = {
  getAll: async (): Promise<Document[]> => {
    try {
      const response = await api.get('/documents');
      return response.data;
    } catch (error: any) {
      return Promise.reject(new Error(error.response?.data?.message || 'Erro ao buscar documentos'));
    }
  },

  create: async (data: CreateDocumentDto): Promise<Document> => {
    try {
      const response = await api.post('/documents', data);
      return response.data;
    } catch (error: any) {
      return Promise.reject(new Error(error.response?.data?.message || 'Erro ao criar documento'));
    }
  },
};
```

### Padrão de Tratamento de Erros

```typescript
// ⚠️ SEMPRE usar Promise.reject ao invés de throw para React Query funcionar corretamente
catch (error: any) {
  const backendMessage = error.response?.data?.message;
  let message = 'Mensagem padrão de erro';

  if (typeof backendMessage === 'string') {
    message = backendMessage;
  } else if (Array.isArray(backendMessage)) {
    message = backendMessage.join(', ');
  }

  return Promise.reject(new Error(message));
}
```

---

## 🔄 TanStack Query (React Query)

### Query Keys

Defina constantes para as query keys:

```typescript
// src/hooks/useDocuments.ts
export const DOCS_KEY = ['documents'];
export const COMPANIES_KEY = ['companies'];
```

### useQuery - Buscar Dados

```typescript
import { useQuery } from '@tanstack/react-query';
import { documentService } from '@/services/api';

export const useDocuments = (user: User | null) => {
  return useQuery({
    queryKey: DOCS_KEY,
    queryFn: async () => {
      if (!user) return [];
      return await documentService.getAll();
    },
    enabled: !!user, // Só executa se tiver usuário
  });
};
```

### useMutation - Criar/Atualizar/Deletar

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useCreateDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateDocumentDto) => {
      return await documentService.create(data);
    },
    onSuccess: () => {
      // ✅ IMPORTANTE: Invalidar queries para atualização em tempo real
      queryClient.invalidateQueries({ queryKey: DOCS_KEY });
    },
  });
};
```

### ⚡ invalidateQueries - Atualizações em Tempo Real

**Sempre use `invalidateQueries` após mutações** para garantir que a UI reflita os dados mais recentes:

```typescript
onSuccess: () => {
  // Invalida uma query específica
  queryClient.invalidateQueries({ queryKey: ['documents'] });
  
  // Invalida múltiplas queries
  queryClient.invalidateQueries({ queryKey: ['documents'] });
  queryClient.invalidateQueries({ queryKey: ['companies'] });
  
  // Invalida queries que começam com 'documents'
  queryClient.invalidateQueries({ queryKey: ['documents'], exact: false });
},
```

---

## 🔐 Autenticação

### Contexto de Auth

O projeto usa `AuthContext` para gerenciar estado de autenticação:

```typescript
import { useAuthContext } from '@/context/AuthContext';

const { currentUser, userPermissions, loginUser, logoutUser, isLoading } = useAuthContext();
```

### Storage

- **localStorage**: `access_token`, `auth_session`, `user_permissions`
- **Cookies**: `auth_session` (para middleware Next.js)

### Fluxo de Login

```typescript
import { useLogin } from '@/hooks/useAuth';

const loginMutation = useLogin();

const handleLogin = () => {
  loginMutation.mutate({ 
    email, 
    password, 
    role: UserRole.ADMIN 
  });
};
```

---

## 🧩 Componentes UI

### Utilizando Shadcn/ui

Os componentes estão em `src/components/ui/`. Use-os diretamente:

```tsx
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

<Button variant="default" size="sm">Salvar</Button>
<Button variant="destructive">Excluir</Button>
<Button variant="outline">Cancelar</Button>
<Button variant="ghost">Opção</Button>
```

### Variantes de Button

| Variant | Uso |
|---------|-----|
| `default` | Ação principal |
| `destructive` | Ações destrutivas (excluir, rejeitar) |
| `outline` | Ação secundária |
| `secondary` | Ação alternativa |
| `ghost` | Ação sutil (menus, links) |
| `link` | Links estilizados |

### Ícones

```tsx
import { Plus, Trash, Edit, Download, Search } from 'lucide-react';

<Button>
  <Plus className="h-4 w-4 mr-2" />
  Adicionar
</Button>
```

---

## 📝 Tipagem TypeScript

### Convenções

- Use `interface` para objetos e DTOs
- Use `enum` para valores constantes
- Exporte todos os tipos via barrel file (`types/index.ts`)

```typescript
// types/document.ts
export interface Document {
  id: string;
  name: string;
  status: DocumentStatus;
  createdAt: string;
}

export enum DocumentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface CreateDocumentDto {
  name: string;
  file: File;
}
```

### Nomenclatura

| Tipo | Sufixo | Exemplo |
|------|--------|---------|
| Entity | - | `User`, `Document` |
| Create DTO | `Create...Dto` | `CreateUserDto` |
| Update DTO | `Update...Dto` | `UpdateUserDto` |
| Response | `...Response` | `LoginResponse` |
| Enum | - | `UserRole`, `DocumentStatus` |

---

## 🛡️ Guards e Proteção de Rotas

### RouteGuard

Use para proteger rotas baseado em roles:

```tsx
import { RouteGuard } from '@/components/guards/RouteGuard';

<RouteGuard allowedRoles={['ADMIN']}>
  <AdminPage />
</RouteGuard>
```

---

## 📋 Checklist para Novas Features

- [ ] Criar tipos em `src/types/`
- [ ] Criar service em `src/services/` ou `src/services/[domínio]/`
- [ ] Criar hook com `useQuery`/`useMutation` em `src/hooks/`
- [ ] Usar `invalidateQueries` após mutações
- [ ] Usar componentes Shadcn/ui de `src/components/ui/`
- [ ] Usar cores via classes Tailwind (não hardcoded)
- [ ] Tratar erros com `Promise.reject`
- [ ] Adicionar tipagem completa

---

## ⚠️ Práticas a Evitar

❌ **Não fazer:**
- Cores hardcodadas no código
- `throw` ao invés de `Promise.reject` em services
- Queries sem query keys constantes
- Mutações sem `invalidateQueries`
- Componentes com estilos inline excessivos
- Tipos `any` sem necessidade
- fetch() ao invés de axios/api

✅ **Preferir:**
- CSS Variables via Tailwind
- `Promise.reject(new Error(message))`
- Query keys como constantes exportadas
- `invalidateQueries` para sync de dados
- Classes Tailwind
- Tipagem explícita
- Instância `api` de `@/lib/api`

---

## 🔧 Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Lint
npm run lint

# Type check
npx tsc --noEmit
```

---

*Última atualização: Dezembro 2024*
