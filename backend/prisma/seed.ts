import { PrismaClient, UserRole, CompanyStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed do banco de dados...');

  // Limpa dados existentes (cuidado em produção!)
  await prisma.document.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  // ============================================
  // 2. CRIAR ADMIN
  // ============================================
  const adminPassword = await bcrypt.hash('123456', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Admin Master',
      email: 'admin@docflow.com',
      password: adminPassword,
      role: UserRole.ADMIN,
    },
  });

  console.log(' Admin criado:', admin.email);

  // ============================================
  // 3. CRIAR EMPLOYEE
  // ============================================
  const employeePassword = await bcrypt.hash('123456', 10);

  const employee = await prisma.user.create({
    data: {
      name: 'Funcionário Interno',
      email: 'employee@docflow.com',
      password: employeePassword,
      role: UserRole.EMPLOYEE,
    },
  });

  console.log(' Employee criado:', employee.email);

  // ============================================
  // 4. CRIAR EMPRESA ATIVA + SUPPLIER
  // ============================================
  console.log('\n Criando empresa ativa...');
  const demoCompany = await prisma.company.create({
    data: {
      cnpj: '12345678000199',
      fantasyName: 'Tech Solutions Ltda',
      socialReason: 'Tech Solutions Comércio e Serviços Ltda',
      zipCode: '69000000',
      address: 'Av. Torquato Tapajós',
      number: '123',
      complement: 'Sala 456',
      neighborhood: 'Flores',
      city: 'Manaus',
      state: 'AM',
      phone: '92999999999',
      status: CompanyStatus.ACTIVE,
    },
  });

  const supplierPassword = await bcrypt.hash('123456', 10);

  const supplier = await prisma.user.create({
    data: {
      name: 'João Silva',
      email: 'joao@tech.com',
      password: supplierPassword,
      role: UserRole.SUPPLIER,
      companyId: demoCompany.id,
    },
  });

  console.log('✔️ Empresa ativa criada:', demoCompany.fantasyName);
  console.log('✔️ Supplier ativo criado:', supplier.email);

  // ============================================
  // 5. CRIAR EMPRESA PENDENTE + SUPPLIER
  // ============================================
  console.log('\n Criando empresa pendente...');
  const pendingCompany = await prisma.company.create({
    data: {
      cnpj: '98765432000110',
      fantasyName: 'Inovação Brasil',
      socialReason: 'Inovação Brasil Tecnologia Ltda',
      zipCode: '69050000',
      address: 'Rua das Américas',
      number: '789',
      neighborhood: 'Adrianópolis',
      city: 'Manaus',
      state: 'AM',
      phone: '92988888888',
      status: CompanyStatus.PENDING,
    },
  });

  const pendingSupplier = await prisma.user.create({
    data: {
      name: 'Maria Santos',
      email: 'maria@inovacao.com',
      password: supplierPassword,
      role: UserRole.SUPPLIER,
      companyId: pendingCompany.id,
    },
  });

  console.log('Empresa pendente criada:', pendingCompany.fantasyName);
  console.log('Supplier pendente criado:', pendingSupplier.email);

  // ============================================
  // 6. LOG FINAL
  // ============================================
  console.log('\n Seed concluído com sucesso!');
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Admin:
Email: admin@docflow.com
Senha: 123456

Employee:
Email: employee@docflow.com
Senha: 123456

Supplier Ativo:
Email: joao@tech.com
Senha: 123456

Supplier Pendente:
Email: maria@inovacao.com
Senha: 123456
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}

main()
  .catch((e) => {
    console.error('Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
