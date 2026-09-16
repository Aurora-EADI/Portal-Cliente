-- Migration: add_local_auth
-- Reintroduz autenticacao local (JWT) no lugar do Supabase Auth.

-- Coluna de senha (hash bcrypt) em users
ALTER TABLE "users" ADD COLUMN "password" TEXT;

-- Tokens de reset de senha
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");
