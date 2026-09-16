import { UserRole } from '@prisma/client';

type FirstAdminInput = {
  name: string;
  email: string;
  password: string;
};

type CreatedIdentity = { id: string };

type FirstAdminUser = {
  email: string;
  role: UserRole;
  active: boolean;
};

type UserRepository = {
  count(): Promise<number>;
  update(input: {
    where: { id: string };
    data: { role: UserRole; active: boolean };
    select: { email: true; role: true; active: true };
  }): Promise<FirstAdminUser>;
};

type PrismaDependency = { user: UserRepository };

type AuthDependency = {
  provisionCredential(input: FirstAdminInput): Promise<CreatedIdentity>;
  removeCredential(userId: string): Promise<void>;
};

export class FirstAdminAlreadyExistsError extends Error {
  constructor() {
    super('O bootstrap do primeiro administrador exige uma base sem usuários.');
    this.name = 'FirstAdminAlreadyExistsError';
  }
}

export class FirstAdminBootstrapService {
  constructor(
    private readonly prisma: PrismaDependency,
    private readonly authService: AuthDependency,
  ) {}

  async bootstrap(input: FirstAdminInput): Promise<FirstAdminUser> {
    const name = input.name.trim().toUpperCase();
    const email = input.email.trim().toLowerCase();

    if (!name || !email || !input.password) {
      throw new Error('Dados obrigatórios ausentes.');
    }

    const userCount = await this.prisma.user.count();
    if (userCount !== 0) {
      throw new FirstAdminAlreadyExistsError();
    }

    const identity = await this.authService.provisionCredential({
      name,
      email,
      password: input.password,
    });

    try {
      return await this.prisma.user.update({
        where: { id: identity.id },
        data: { role: UserRole.ADMIN, active: true },
        select: { email: true, role: true, active: true },
      });
    } catch (error) {
      await this.authService.removeCredential(identity.id).catch(() => undefined);
      throw error;
    }
  }
}
