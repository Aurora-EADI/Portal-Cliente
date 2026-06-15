import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Senhas de seed — altere no Supabase Dashboard após o primeiro deploy
const users = [
  { email: 'admin@portalcliente.com.br',    password: process.env.SEED_ADMIN_PASSWORD    ?? 'Admin@2026!',    name: 'Administrador' },
  { email: 'operador@globalimport.com.br',  password: process.env.SEED_CLIENTE1_PASSWORD ?? 'Operador@2026!', name: 'Operador Global' },
  { email: 'logistica@tecavancada.com.br',  password: process.env.SEED_CLIENTE2_PASSWORD ?? 'Logistica@2026!', name: 'Logística TecAvançada' },
];

for (const u of users) {
  const { data, error } = await supabase.auth.admin.createUser({
    email: u.email,
    password: u.password,
    email_confirm: true,
    user_metadata: { name: u.name },
  });

  if (error) {
    if (error.message.includes('already been registered') || error.message.includes('already exists')) {
      console.log(`  já existe: ${u.email}`);
    } else {
      console.error(`  erro em ${u.email}:`, error.message);
    }
  } else {
    console.log(`✓ criado: ${u.email} (senha: ${u.password})`);
  }
}

console.log('\nDone.');
