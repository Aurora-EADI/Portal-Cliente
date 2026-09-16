import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    // `prisma generate` não conecta no banco e precisa funcionar no build.
    // Comandos de migration continuam exigindo DATABASE_URL explicitamente.
    url: process.env.DATABASE_URL,
    shadowDatabaseUrl: process.env.SHADOW_DATABASE_URL,
  },
});
