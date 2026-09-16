import 'dotenv/config';
import { AuthService } from '../auth/auth.service';
import { FirstAdminBootstrapService } from '../auth/first-admin-bootstrap.service';
import { disconnectBetterAuthDatabase } from '../auth/better-auth';
import { PrismaService } from '../prisma/prisma.service';

type BootstrapService = Pick<FirstAdminBootstrapService, 'bootstrap'>;

type RunOptions = {
  service: BootstrapService;
  env: NodeJS.ProcessEnv;
  writeStdout: (line: string) => void;
  writeStderr: (line: string) => void;
};

export async function runFirstAdminBootstrap({
  service,
  env,
  writeStdout,
  writeStderr,
}: RunOptions): Promise<number> {
  try {
    const user = await service.bootstrap({
      name: env.BOOTSTRAP_ADMIN_NAME ?? '',
      email: env.BOOTSTRAP_ADMIN_EMAIL ?? '',
      password: env.BOOTSTRAP_ADMIN_PASSWORD ?? '',
    });

    writeStdout(
      `Primeiro administrador criado com sucesso.\nE-mail: ${user.email}\nRole: ADMIN\n`,
    );
    return 0;
  } catch {
    writeStderr('Falha ao criar o primeiro administrador.\n');
    return 1;
  }
}

export async function main(): Promise<number> {
  let prisma: PrismaService | undefined;

  try {
    prisma = new PrismaService();
    await prisma.onModuleInit();
    const authService = new AuthService(prisma);
    const service = new FirstAdminBootstrapService(prisma, authService);
    return await runFirstAdminBootstrap({
      service,
      env: process.env,
      writeStdout: (line) => process.stdout.write(line),
      writeStderr: (line) => process.stderr.write(line),
    });
  } catch {
    process.stderr.write('Falha ao criar o primeiro administrador.\n');
    return 1;
  } finally {
    await prisma?.$disconnect().catch(() => undefined);
    await disconnectBetterAuthDatabase().catch(() => undefined);
  }
}

if (require.main === module) {
  void main().then((exitCode) => {
    process.exitCode = exitCode;
  });
}
