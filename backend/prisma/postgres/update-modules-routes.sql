-- Atualizar módulos existentes com rotas e ícones

-- Atualiza o módulo de Logística
UPDATE modules
SET
  route = '/logistics',
  icon = 'Truck',
  description = 'Gestão de frota, rotas e entregas'
WHERE name = 'Logística' OR name = 'Logística & Operações';

-- Insere ou atualiza Faturamento
INSERT INTO modules (name, description, route, icon, active)
VALUES ('Faturamento', 'Gestão de faturas e pagamentos', '/faturamento', 'ShoppingCart', true)
ON CONFLICT (name) DO UPDATE SET
  route = EXCLUDED.route,
  icon = EXCLUDED.icon,
  description = EXCLUDED.description;

-- Insere ou atualiza Gestão de Documentos
INSERT INTO modules (name, description, route, icon, active)
VALUES ('Gestão de Documentos', 'Controle de documentos', '/documentos', 'FileText', true)
ON CONFLICT (name) DO UPDATE SET
  route = EXCLUDED.route,
  icon = EXCLUDED.icon,
  description = EXCLUDED.description;

-- Insere ou atualiza Permissões
INSERT INTO modules (name, description, route, icon, active)
VALUES ('Permissões', 'Gestão de acessos e permissões', '/permissoes', 'Shield', true)
ON CONFLICT (name) DO UPDATE SET
  route = EXCLUDED.route,
  icon = EXCLUDED.icon,
  description = EXCLUDED.description;

-- Verificar resultado
SELECT id, name, route, icon, active FROM modules ORDER BY name;
