PROBLEMA ATUAL (Hardcoded)

  // ❌ Frontend: aurora-eadi-front/src/components/pages/modules/ModulePage.tsx
  const MODULE_ROUTES: Record<string, string> = {
    'Logística & Operações': '/logistics',
    'Logística': '/logistics',
    'Faturamento': '/faturamento',
    'Gestão de Documentos': '/documentos',
    'Permissões': '/permissoes',
  };

  Problemas:
  - Se mudar nome do módulo no banco, rota quebra
  - Se adicionar novo módulo, precisa alterar código frontend
  - Não é escalável
  - Frontend e backend desacoplados

  ---
  ✅ SOLUÇÃO IDEAL (Backend-Driven)

  Arquitetura:

  Backend (Source of Truth)
      ↓
    Módulo tem campo "route"
      ↓
    API retorna módulos com route
      ↓
    Frontend renderiza dinamicamente

  ---
  🗄️ 1. BACKEND - Schema do Prisma

  Arquivo: backend/prisma/postgres/schema.prisma

  Adicionar campo route ao modelo Module:

  model Module {
    id          Int      @id @default(autoincrement())
    name        String   @unique
    description String?
    route       String?  // 🆕 Campo para rota do frontend
    icon        String?  // 🆕 Campo para nome do ícone
    active      Boolean  @default(true)
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt

    activities         Activity[]
    userModuleAccess   UserModuleAccess[]

    @@map("modules")
  }

  Executar migração:

  cd backend
  npx prisma migrate dev --name add_route_icon_to_modules

  ---
  📊 2. BACKEND - Dados no Banco (Seed)

  Arquivo: backend/prisma/postgres/seed.ts (ou executar manualmente)

  Popular módulos com rotas:

  const modules = [
    {
      name: 'Logística',
      description: 'Gestão de frota, rotas e entregas',
      route: '/logistics',           // 🆕 Rota do frontend
      icon: 'Truck',                  // 🆕 Nome do ícone (Lucide React)
      active: true,
    },
    {
      name: 'Faturamento',
      description: 'Gestão de faturas e pagamentos',
      route: '/faturamento',
      icon: 'ShoppingCart',
      active: true,
    },
    {
      name: 'Gestão de Documentos',
      description: 'Controle de documentos',
      route: '/documentos',
      icon: 'FileText',
      active: true,
    },
    {
      name: 'Permissões',
      description: 'Gestão de acessos e permissões',
      route: '/permissoes',
      icon: 'Shield',
      active: true,
    },
  ];

  for (const module of modules) {
    await prisma.module.upsert({
      where: { name: module.name },
      update: module,
      create: module,
    });
  }

  ---
  🔌 3. BACKEND - API Response

  Arquivo: backend/src/modules/modules.service.ts

  A API já retorna os dados, mas agora com route e icon:

  async findAll() {
    return this.prisma.module.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        description: true,
        route: true,      // 🆕 Retorna rota
        icon: true,       // 🆕 Retorna ícone
        active: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  Response da API ficaria assim:

  GET /api/modules

  {
    "modules": [
      {
        "id": 8,
        "name": "Logística",
        "description": "Gestão de frota, rotas e entregas",
        "route": "/logistics",
        "icon": "Truck",
        "isEnabled": true
      },
      {
        "id": 9,
        "name": "Faturamento",
        "description": "Gestão de faturas e pagamentos",
        "route": "/faturamento",
        "icon": "ShoppingCart",
        "isEnabled": true
      }
    ]
  }

  ---
  💻 4. FRONTEND - Type Update

  Arquivo: aurora-eadi-front/src/services/modules/modules.service.ts

  Adicionar campos ao tipo Module:

  export interface Module {
    id: number;
    name: string;
    description: string;
    route?: string;        // 🆕 Rota do módulo
    icon?: string;         // 🆕 Nome do ícone
    isEnabled: boolean;
    userModuleAccessId?: string;
    activities?: Activity[];
  }

  ---
  🎨 5. FRONTEND - Icon Mapper

  Arquivo: aurora-eadi-front/src/components/pages/modules/ModulePage.tsx

  Criar mapeamento de ícones por nome (string → componente):

  import {
    Truck,
    FileText,
    ShoppingCart,
    Shield,
    Package,
    Users,
    BarChart3,
    Settings,
    // ... importar todos os ícones necessários
  } from 'lucide-react';

  // Mapeamento de string para componente de ícone
  const ICON_COMPONENTS: Record<string, any> = {
    'Truck': Truck,
    'FileText': FileText,
    'ShoppingCart': ShoppingCart,
    'Shield': Shield,
    'Package': Package,
    'Users': Users,
    'BarChart3': BarChart3,
    'Settings': Settings,
    // Fallback padrão
  };

  const getModuleIcon = (iconName?: string) => {
    if (!iconName) return FileText; // Ícone padrão
    return ICON_COMPONENTS[iconName] || FileText;
  };

  ---
  📱 6. FRONTEND - Renderização Dinâmica

  Arquivo: aurora-eadi-front/src/components/pages/modules/ModulePage.tsx

  Remover hardcoded e usar dados do backend:

  export function ModulesPage() {
    const router = useRouter();
    const { currentUser } = useAuthContext();

    const [modules, setModules] = useState<Module[]>([]);

    // Carrega módulos do backend (JÁ FAZ ISSO)
    useEffect(() => {
      const loadModules = async () => {
        const data = await modulesService.getAll(currentUser!.id);
        const activeModules = data.modules.filter(m => m.isEnabled === true);
        setModules(activeModules);
      };
      loadModules();
    }, [currentUser]);

    // ✅ NOVA IMPLEMENTAÇÃO - Usa rota do backend
    const handleModuleClick = (module: Module) => {
      if (module.route) {
        router.push(module.route);  // 🆕 Usa rota do backend
      } else {
        console.warn(`Módulo ${module.name} não tem rota configurada`);
      }
    };

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module) => {
          const Icon = getModuleIcon(module.icon); // 🆕 Ícone dinâmico

          return (
            <ModuleCard
              key={module.id}
              icon={Icon}                              // 🆕 Do backend
              title={module.name}                      // Do backend
              description={module.description}         // Do backend
              onClick={() => handleModuleClick(module)} // 🆕 Usa route do backend
              disabled={false}                         // Sempre enabled (já filtrado)
            />
          );
        })}
      </div>
    );
  }

  ---
  ✨ BENEFÍCIOS DESSA ABORDAGEM

  ✅ 1. Gerenciamento Centralizado

  - CRUD de módulos via painel admin
  - Criar/editar módulos sem tocar no código
  - Mudar rota de um módulo no banco → reflete instantaneamente

  ✅ 2. Escalabilidade

  // Adicionar novo módulo = INSERT no banco:
  INSERT INTO modules (name, description, route, icon, active)
  VALUES ('Compras', 'Gestão de compras', '/compras', 'ShoppingBag', true);

  // ✅ Frontend automaticamente renderiza o novo módulo
  // ❌ Não precisa alterar código e fazer deploy

  ✅ 3. Multi-tenancy / White-label

  - Empresas diferentes podem ter módulos diferentes
  - Configuração por tenant no banco
  - Mesmo código do frontend serve para todos

  ✅ 4. A/B Testing / Feature Flags

  -- Habilitar módulo apenas para alguns usuários
  UPDATE modules SET active = true WHERE name = 'Beta Feature';

  -- Ou criar lógica de feature flag:
  SELECT * FROM modules WHERE active = true
    AND (release_date IS NULL OR release_date <= NOW());

  ✅ 5. Auditoria e Controle

  - Histórico de mudanças de rotas
  - Saber quais módulos foram acessados
  - Logs de navegação por módulo

  ---
  🎯 EXEMPLO DE FLUXO COMPLETO

  Cenário: Adicionar novo módulo "Relatórios"

  1. Backend - Seed ou Admin Panel:

  INSERT INTO modules (name, description, route, icon, active)
  VALUES (
    'Relatórios',
    'Visualização de relatórios e dashboards',
    '/relatorios',
    'BarChart3',
    true
  );

  2. Backend - Nenhuma mudança de código necessária

  A API GET /api/modules já retorna o novo módulo.

  3. Frontend - Nenhuma mudança de código necessária

  O ModulePage.tsx automaticamente:
  - Busca módulos (incluindo o novo)
  - Renderiza card com nome, descrição
  - Usa ícone BarChart3
  - Ao clicar, navega para /relatorios

  4. Admin atribui permissão:

  1. Admin vai em Gestão de Permissões
  2. Seleciona usuário
  3. Habilita módulo "Relatórios"
  4. Salva

  5. Usuário vê o novo módulo:

  1. Usuário faz login
  2. Permissões carregadas (include novo módulo)
  3. Módulo "Relatórios" aparece na home
  4. Clica e vai para /relatorios

  ✅ ZERO linhas de código alteradas!

  ---
  🏗️ FUNCIONALIDADES FUTURAS POSSÍVEIS

  Com rotas no backend, você pode adicionar:

  1. Ordenação de Módulos:

  model Module {
    // ...
    order Int @default(0)  // Ordem de exibição
  }

  2. Módulos por Categoria:

  model Module {
    // ...
    category String? // "Operacional", "Financeiro", "Admin"
  }

  3. Permissões de Navegação:

  model Module {
    // ...
    requiresPermission String? // "ADMIN_ONLY", "MANAGER_ONLY"
  }

  4. Módulos Externos:

  model Module {
    // ...
    isExternal Boolean @default(false)
    externalUrl String? // "https://external-system.com/dashboard"
  }

  5. Módulos em Manutenção:

  model Module {
    // ...
    maintenanceMode Boolean @default(false)
    maintenanceMessage String?
  }

  ---
  📋 RESUMO DA ARQUITETURA

  ┌─────────────────────────────────────────────────────────┐
  │                    DATABASE (PostgreSQL)                 │
  │  ┌───────────────────────────────────────────────────┐  │
  │  │ Module Table                                      │  │
  │  │  - id, name, description                          │  │
  │  │  - route (/logistics)                             │  │
  │  │  - icon (Truck)                                   │  │
  │  │  - active (true/false)                            │  │
  │  └───────────────────────────────────────────────────┘  │
  └─────────────────────────────────────────────────────────┘
                            ↓
  ┌─────────────────────────────────────────────────────────┐
  │                    BACKEND (NestJS)                      │
  │  ┌───────────────────────────────────────────────────┐  │
  │  │ GET /api/modules                                  │  │
  │  │ GET /api/user-module-access/:userId               │  │
  │  │                                                   │  │
  │  │ Returns: { id, name, route, icon, isEnabled }    │  │
  │  └───────────────────────────────────────────────────┘  │
  └─────────────────────────────────────────────────────────┘
                            ↓
  ┌─────────────────────────────────────────────────────────┐
  │                   FRONTEND (Next.js)                     │
  │  ┌───────────────────────────────────────────────────┐  │
  │  │ ModulePage.tsx                                    │  │
  │  │  - Busca módulos da API                           │  │
  │  │  - Filtra por isEnabled                           │  │
  │  │  - Renderiza dinamicamente                        │  │
  │  │  - onClick: router.push(module.route)             │  │
  │  │  - Icon: ICON_COMPONENTS[module.icon]             │  │
  │  └───────────────────────────────────────────────────┘  │
  └─────────────────────────────────────────────────────────┘
                            ↓
                      ✅ USER SEES MODULE

  ---
  🎯 CONCLUSÃO

  Backend-driven routes = Configuração dinâmica sem deploy

  - ✅ Adicionar módulo = INSERT no banco
  - ✅ Mudar rota = UPDATE no banco
  - ✅ Reordenar módulos = UPDATE order
  - ✅ Desabilitar módulo = UPDATE active = false
  - ✅ Zero alterações de código
  - ✅ Zero deploys para mudanças de rotas/ícones

  Essa é a arquitetura ideal para sistemas escaláveis e multi-tenant!