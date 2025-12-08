# Guia de Testes - Sistema de Gerenciamento de Permissões

## Pré-requisitos

- API rodando (ex: http://localhost:3000)
- Ferramenta de teste de API (Postman, Insomnia, ou Thunder Client)
- Banco de dados limpo ou resetado

---

## CENÁRIO 1: Fluxo Completo de Configuração de Permissões

### Passo 1: Criar Empresa
**Endpoint:** `POST /companies`
```json
{
  "fantasyName": "Tech Solutions LTDA",
  "cnpj": "12345678000199",
  "status": "ACTIVE"
}
```
**Resultado Esperado:**
- Status: 201
- Salvar o `id` da empresa criada (ex: `company_123`)

---

### Passo 2: Criar Usuário Admin
**Endpoint:** `POST /users`
```json
{
  "name": "João Admin",
  "email": "admin@techsolutions.com",
  "password": "senha123",
  "role": "ADMIN"
}
```
**Resultado Esperado:**
- Status: 201
- Salvar o `id` do usuário (ex: `user_admin_123`)
- Verificar que não retorna a senha

---

### Passo 3: Fazer Login
**Endpoint:** `POST /auth/login`
```json
{
  "email": "admin@techsolutions.com",
  "password": "senha123"
}
```
**Resultado Esperado:**
- Status: 200
- Copiar o `access_token`
- Configurar Authorization Header: `Bearer {access_token}` para as próximas requisições

---

### Passo 4: Criar Permissões Técnicas
**Endpoint:** `POST /permissions`

**Permissão 1 - Visualizar Frota**
```json
{
  "key": "LOG_VIEW_FLEET",
  "description": "Visualizar dados da frota",
  "category": "LOGISTICA"
}
```
**Salvar:** `permission_1_id`

**Permissão 2 - Editar Frota**
```json
{
  "key": "LOG_EDIT_FLEET",
  "description": "Editar dados da frota",
  "category": "LOGISTICA"
}
```
**Salvar:** `permission_2_id`

**Permissão 3 - Visualizar Financeiro**
```json
{
  "key": "FIN_VIEW_REPORTS",
  "description": "Visualizar relatórios financeiros",
  "category": "FINANCEIRO"
}
```
**Salvar:** `permission_3_id`

**Resultado Esperado para cada:**
- Status: 201
- Retorna a permissão criada

---

### Passo 5: Criar Módulo
**Endpoint:** `POST /modules`
```json
{
  "name": "Logística",
  "description": "Módulo de gestão logística e frota"
}
```
**Resultado Esperado:**
- Status: 201
- Salvar o `id` do módulo (ex: `module_1`)

---

### Passo 6: Criar Atividades no Módulo

**Atividade 1 - Obrigatória**
**Endpoint:** `POST /activities`
```json
{
  "name": "Visualizar Dashboard",
  "moduleId": 1,
  "isMandatory": true,
  "permissionIds": [1]
}
```
**Salvar:** `activity_1_id`

**Atividade 2 - Opcional**
```json
{
  "name": "Gerenciar Frota",
  "moduleId": 1,
  "isMandatory": false,
  "permissionIds": [1, 2]
}
```
**Salvar:** `activity_2_id`

**Resultado Esperado:**
- Status: 201
- Atividades criadas com permissões vinculadas

---

### Passo 7: Criar Usuário Funcionário
**Endpoint:** `POST /users`
```json
{
  "name": "Maria Funcionária",
  "email": "maria@techsolutions.com",
  "password": "senha123",
  "role": "EMPLOYEE",
  "companyId": "company_123",
  "position": "Analista"
}
```
**Resultado Esperado:**
- Status: 201
- Salvar o `user_id` (ex: `user_func_456`)

---

### Passo 8: Verificar Status de Módulos (Antes de Atribuir)
**Endpoint:** `GET /user-module-access/user_func_456`

**Resultado Esperado:**
- Status: 200
- Retorna todos os módulos com `isEnabled: false`
- `summary.enabledModules: 0`

---

### Passo 9: Habilitar Módulo para o Usuário
**Endpoint:** `PUT /user-module-access/user_func_456/toggle/1`
```json
{
  "isEnabled": true
}
```
**Resultado Esperado:**
- Status: 200
- Módulo habilitado
- Mensagem: "Módulo 'Logística' habilitado para Maria Funcionária"
- Atividades obrigatórias criadas automaticamente

---

### Passo 10: Verificar Módulos do Usuário
**Endpoint:** `GET /users/user_func_456/modules`

**Resultado Esperado:**
- Status: 200
- Retorna array com o módulo "Logística"
- Inclui atividades do módulo

---

### Passo 11: Verificar Atividades do Usuário
**Endpoint:** `GET /users/user_func_456/activities`

**Resultado Esperado:**
- Status: 200
- Array contém:
  - "Visualizar Dashboard" (isMandatory: true, isEnabled: true)
  - "Gerenciar Frota" (isMandatory: false, isEnabled: false) - ainda não habilitada

---

### Passo 12: Verificar Permissões do Usuário (Antes de Ativar Opcional)
**Endpoint:** `GET /users/user_func_456/permissions`

**Resultado Esperado:**
- Status: 200
- `totalPermissions: 1`
- Array contém apenas: `LOG_VIEW_FLEET`

---

### Passo 13: Habilitar Atividade Opcional
**Endpoint:** `PUT /user-activity-access/user_func_456/module/1/activity/2/toggle`
```json
{
  "isEnabled": true
}
```
**Resultado Esperado:**
- Status: 200
- Atividade "Gerenciar Frota" habilitada

---

### Passo 14: Verificar Permissões Novamente
**Endpoint:** `GET /users/user_func_456/permissions`

**Resultado Esperado:**
- Status: 200
- `totalPermissions: 2`
- Array contém:
  - `LOG_VIEW_FLEET`
  - `LOG_EDIT_FLEET`

---

### Passo 15: Login do Funcionário e Verificar Permissões
**Endpoint:** `POST /auth/login`
```json
{
  "email": "maria@techsolutions.com",
  "password": "senha123"
}
```
**Resultado Esperado:**
- Status: 200
- Retorna `access_token` e dados do usuário

**Usar o token para:** `GET /auth/me`

**Resultado Esperado:**
- Status: 200
- Retorna:
  - Dados do usuário
  - Módulos ativos
  - Array de permissões: `["LOG_VIEW_FLEET", "LOG_EDIT_FLEET"]`

---

## CENÁRIO 2: Testes de Validação e Erros

### Teste 1: Criar Usuário EMPLOYEE sem companyId
**Endpoint:** `POST /users`
```json
{
  "name": "Pedro Sem Empresa",
  "email": "pedro@email.com",
  "password": "senha123",
  "role": "EMPLOYEE"
}
```
**Resultado Esperado:**
- Status: 400
- Mensagem: "companyId é obrigatório para SUPPLIER e EMPLOYEE"

---

### Teste 2: Criar Usuário com Email Duplicado
**Endpoint:** `POST /users`
```json
{
  "name": "João Clone",
  "email": "admin@techsolutions.com",
  "password": "senha123",
  "role": "ADMIN"
}
```
**Resultado Esperado:**
- Status: 409
- Mensagem: "Email já cadastrado"

---

### Teste 3: Login com Senha Errada
**Endpoint:** `POST /auth/login`
```json
{
  "email": "admin@techsolutions.com",
  "password": "senhaErrada"
}
```
**Resultado Esperado:**
- Status: 401
- Mensagem: "Credenciais inválidas"

---

### Teste 4: Tentar Desabilitar Atividade Obrigatória
**Endpoint:** `PUT /user-activity-access/user_func_456/module/1/activity/1/toggle`
```json
{
  "isEnabled": false
}
```
**Resultado Esperado:**
- Status: 400
- Mensagem: "A atividade 'Visualizar Dashboard' é obrigatória e não pode ser desabilitada"

---

### Teste 5: Habilitar Módulo Inativo
**Endpoint (primeiro desativar módulo):** `PATCH /modules/1`
```json
{
  "active": false
}
```

**Depois tentar habilitar para usuário:**
**Endpoint:** `PUT /user-module-access/user_func_456/toggle/1`
```json
{
  "isEnabled": true
}
```
**Resultado Esperado:**
- Status: 400
- Mensagem: "O módulo 'Logística' está inativo e não pode ser atribuído"

---

### Teste 6: Criar Atividade com Permissão Inexistente
**Endpoint:** `POST /activities`
```json
{
  "name": "Atividade Teste",
  "moduleId": 1,
  "isMandatory": false,
  "permissionIds": [999]
}
```
**Resultado Esperado:**
- Status: 404
- Mensagem: "Permissões não encontradas: 999"

---

### Teste 7: Criar Atividade com Nome Duplicado no Módulo
**Endpoint:** `POST /activities`
```json
{
  "name": "Visualizar Dashboard",
  "moduleId": 1,
  "isMandatory": false,
  "permissionIds": [1]
}
```
**Resultado Esperado:**
- Status: 409
- Mensagem: "Já existe uma atividade com o nome 'Visualizar Dashboard' no módulo 'Logística'"

---

## CENÁRIO 3: Operações em Massa (Bulk)

### Passo 1: Criar Mais Módulos
**Criar:** Módulo "Financeiro" (id: 2)
**Criar:** Módulo "RH" (id: 3)

---

### Passo 2: Atribuir Múltiplos Módulos de Uma Vez
**Endpoint:** `POST /user-module-access/user_func_456/bulk`
```json
{
  "moduleIds": [2, 3],
  "isEnabled": true
}
```
**Resultado Esperado:**
- Status: 200
- Mensagem: "2 módulo(s) habilitados para Maria Funcionária"
- Array results com os 2 módulos

---

### Passo 3: Verificar Summary Atualizado
**Endpoint:** `GET /user-module-access/user_func_456`

**Resultado Esperado:**
- `summary.enabledModules: 3`
- Todos os 3 módulos com `isEnabled: true`

---

## CENÁRIO 4: Estatísticas e Relatórios

### Passo 1: Obter Estatísticas de Módulos
**Endpoint:** `GET /user-module-access/stats/modules`

**Resultado Esperado:**
- Status: 200
- Array com todos os módulos
- Cada módulo mostra `totalUsers`
- Lista de usuários com acesso

---

### Passo 2: Listar Permissões por Categoria
**Endpoint:** `GET /permissions?category=LOGISTICA`

**Resultado Esperado:**
- Status: 200
- Retorna apenas permissões da categoria LOGISTICA

---

### Passo 3: Buscar Permissões Órfãs
**Endpoint:** `GET /permissions/orphaned`

**Resultado Esperado:**
- Status: 200
- Lista permissões sem vínculo com atividades

---

### Passo 4: Buscar Atividades Sem Permissões
**Endpoint:** `GET /activities/without-permissions`

**Resultado Esperado:**
- Status: 200
- Lista atividades que não têm permissões vinculadas

---

## CENÁRIO 5: Sincronização e Manutenção

### Passo 1: Adicionar Nova Atividade Obrigatória ao Módulo
**Endpoint:** `POST /activities`
```json
{
  "name": "Visualizar Relatórios",
  "moduleId": 1,
  "isMandatory": true,
  "permissionIds": [3]
}
```

---

### Passo 2: Sincronizar Atividades Obrigatórias
**Endpoint:** `POST /user-module-access/sync/1`

**Resultado Esperado:**
- Status: 200
- Nova atividade obrigatória criada para todos os usuários que têm o módulo

---

### Passo 3: Verificar que Usuário Recebeu Nova Atividade
**Endpoint:** `GET /users/user_func_456/activities`

**Resultado Esperado:**
- Array inclui "Visualizar Relatórios" com isEnabled: true

---

## CENÁRIO 6: Remoção e Limpeza

### Passo 1: Remover Acesso a Módulo Específico
**Endpoint:** `DELETE /user-module-access/user_func_456/remove/2`

**Resultado Esperado:**
- Status: 200
- Mensagem: "Acesso ao módulo 'Financeiro' removido para Maria Funcionária"

---

### Passo 2: Verificar Remoção
**Endpoint:** `GET /user-module-access/user_func_456`

**Resultado Esperado:**
- Módulo Financeiro agora tem `isEnabled: false`
- `userModuleAccessId: null`

---

### Passo 3: Deletar Usuário
**Endpoint:** `DELETE /users/user_func_456`

**Resultado Esperado:**
- Status: 204 No Content
- Todos os acessos são removidos em cascata

---

### Passo 4: Tentar Deletar Permissão em Uso
**Endpoint:** `DELETE /permissions/1`

**Resultado Esperado:**
- Status: 400
- Mensagem: "Não é possível deletar esta permissão pois existem X atividade(s) vinculada(s)"

---

## Checklist de Validação Final

- [ ] Usuário ADMIN pode criar módulos e permissões
- [ ] Usuário EMPLOYEE precisa de companyId
- [ ] Atividades obrigatórias são criadas automaticamente ao habilitar módulo
- [ ] Atividades obrigatórias não podem ser desabilitadas
- [ ] Permissões do usuário refletem apenas atividades ativas
- [ ] Login retorna token JWT válido
- [ ] Endpoint /auth/me retorna permissões corretas
- [ ] Bulk operations funcionam corretamente
- [ ] Sync adiciona novas atividades obrigatórias
- [ ] Cascata de deleção funciona
- [ ] Validações de duplicidade funcionam
- [ ] Estatísticas retornam dados corretos

---

## Ferramentas Recomendadas

**Postman:**
- Criar Collection com todas as requisições
- Usar Environment Variables para IDs
- Configurar Pre-request Scripts para token

**Insomnia:**
- Criar Workspace
- Usar Chain Requests
- Environment para variáveis

**Scripts de Teste Automatizado:**
- Jest + Supertest
- newman (CLI do Postman)

---

## Dicas Importantes

1. **Ordem dos Testes:** Sempre seguir: Permissões → Módulos → Atividades → Usuários → Acessos
2. **Limpar Base:** Resetar banco entre cenários completos
3. **Salvar IDs:** Usar variáveis de ambiente para IDs criados
4. **Token JWT:** Configurar header Authorization automaticamente
5. **Verificar Cascata:** Ao deletar, verificar remoção em relacionamentos