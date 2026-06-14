-- Migration: remove-password-usertokens
-- Auth agora gerenciada pelo Supabase — senha e refresh tokens saem do banco local

-- Remove tabela de refresh tokens (substituída pelo Supabase Auth)
DROP TABLE IF EXISTS "user_tokens";

-- Remove coluna de senha da tabela de usuários
ALTER TABLE "users" DROP COLUMN IF EXISTS "password";
