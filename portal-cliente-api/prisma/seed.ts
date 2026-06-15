import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed do banco portal-cliente...');

  // Admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@portalcliente.com.br' },
    update: {},
    create: {
      name: 'ADMINISTRADOR',
      email: 'admin@portalcliente.com.br',
      password: hashedPassword,
      role: UserRole.ADMIN,
      position: 'Administrador do Sistema',
    },
  });
  console.log(`Admin criado: ${admin.email}`);

  // Módulo Configurador
  const configurador = await prisma.module.upsert({
    where: { name: 'Configurador' },
    update: {},
    create: {
      name: 'Configurador',
      description: 'Gestão de usuários, módulos e permissões',
      route: '/permissoes',
      icon: 'Shield',
      sortOrder: 1,
      sharedItems: {
        create: [
          { targetRoute: '/permissoes/gestao', label: 'Gestão de Perfis', icon: 'Shield', sortOrder: 1 },
          { targetRoute: '/permissoes/usuario', label: 'Gestão de Usuário', icon: 'Users', sortOrder: 2 },
          { targetRoute: '/permissoes/catalogo', label: 'Catálogo de Funcionalidades', icon: 'Database', sortOrder: 3 },
          { targetRoute: '/permissoes/atividades', label: 'Módulo x Funcionalidade', icon: 'Layers', sortOrder: 4 },
        ],
      },
    },
  });
  console.log(`Módulo criado: ${configurador.name}`);

  // Módulo Agendamento FCL
  const fcl = await prisma.module.upsert({
    where: { name: 'Agendamento' },
    update: {},
    create: {
      name: 'Agendamento',
      description: 'Portal de agendamento de retirada de containers FCL',
      route: '/agendamento',
      icon: 'CalendarDays',
      sortOrder: 2,
      sharedItems: {
        create: [
          { targetRoute: '/agendamento', label: 'Dashboard', icon: 'LayoutDashboard', sortOrder: 1 },
          { targetRoute: '/agendamento?tab=wizard', label: 'Novo Agendamento', icon: 'CalendarDays', sortOrder: 2 },
          { targetRoute: '/agendamento?tab=gate', label: 'Portaria (Gate)', icon: 'Clock', sortOrder: 3 },
          { targetRoute: '/agendamento?tab=dis', label: 'DIs & Containers', icon: 'Package', sortOrder: 4 },
          { targetRoute: '/agendamento?tab=drivers', label: 'Motoristas', icon: 'Users', sortOrder: 5 },
          { targetRoute: '/agendamento?tab=config', label: 'Configurações', icon: 'SlidersHorizontal', sortOrder: 6 },
        ],
      },
    },
  });
  console.log(`Módulo criado: ${fcl.name}`);

  // Ativar módulos para o admin
  await prisma.userModuleAccess.upsert({
    where: { userId_moduleId: { userId: admin.id, moduleId: configurador.id } },
    update: { isEnabled: true },
    create: { userId: admin.id, moduleId: configurador.id, isEnabled: true },
  });

  await prisma.userModuleAccess.upsert({
    where: { userId_moduleId: { userId: admin.id, moduleId: fcl.id } },
    update: { isEnabled: true },
    create: { userId: admin.id, moduleId: fcl.id, isEnabled: true },
  });

  // Janelas de atendimento padrão
  const janelas = [
    { descricao: 'Agendamento DTA', horaInicio: '08:00', horaFim: '12:00', intervaloMinutos: 60, vagasSimultaneas: 5 },
    { descricao: 'Agendamento', horaInicio: '13:00', horaFim: '17:00', intervaloMinutos: 60, vagasSimultaneas: 3 },
  ];

  for (const j of janelas) {
    await prisma.janelaAtendimento.create({ data: j }).catch(() => {});
  }
  console.log('Janelas de atendimento criadas');

  // Clientes de exemplo
  const cliente1 = await prisma.cliente.upsert({
    where: { cnpj: '11.222.333/0001-44' },
    update: {},
    create: {
      nome: 'Global Importações e Logística Ltda',
      cnpj: '11.222.333/0001-44',
      email: 'operacoes@globalimport.com.br',
      telefone: '(92) 3234-5678',
    },
  });

  // DIs de exemplo para o cliente
  await prisma.dI.upsert({
    where: { numeroDI: '26/0894321-4' },
    update: {},
    create: {
      numeroDI: '26/0894321-4',
      clienteId: cliente1.id,
      container: 'TGBU5819320',
      tipoContainer: "40' High Cube (HC)",
      status: 'liberada',
      pesoBruto: 24350,
      mercadoria: 'Inversores Solares e Placas de Silício',
      transportadora: 'TransÁguia Logística',
    },
  });

  await prisma.dI.upsert({
    where: { numeroDI: '26/1102943-8' },
    update: {},
    create: {
      numeroDI: '26/1102943-8',
      clienteId: cliente1.id,
      container: 'MSCU8942315',
      tipoContainer: "40' Dry Van (DV)",
      status: 'bloqueada',
      pesoBruto: 18400,
      mercadoria: 'Componentes e Circuitos Eletrônicos',
      transportadora: 'Express Multimodal',
    },
  });

  await prisma.dI.upsert({
    where: { numeroDI: '26/0743219-5' },
    update: {},
    create: {
      numeroDI: '26/0743219-5',
      clienteId: cliente1.id,
      container: 'CMAU1049382',
      tipoContainer: "20' Heavy Tested (HT)",
      status: 'liberada',
      pesoBruto: 28120,
      mercadoria: 'Bobinas de Aço Galvanizado',
      transportadora: 'Rápido Paulista',
    },
  });

  // Segundo cliente com DIs próprias
  const cliente2 = await prisma.cliente.upsert({
    where: { cnpj: '22.333.444/0001-55' },
    update: {},
    create: {
      nome: 'Tecnologia Avançada Brasil S.A.',
      cnpj: '22.333.444/0001-55',
      email: 'logistica@tecavancada.com.br',
      telefone: '(92) 3345-6789',
    },
  });

  await prisma.dI.upsert({
    where: { numeroDI: '26/1529430-5' },
    update: {},
    create: {
      numeroDI: '26/1529430-5',
      clienteId: cliente2.id,
      container: 'PANS3829014',
      tipoContainer: "40' Dry Van (DV)",
      status: 'liberada',
      pesoBruto: 17200,
      mercadoria: 'Módulos LCD, Placas e displays',
      transportadora: 'Express Multimodal',
    },
  });

  await prisma.dI.upsert({
    where: { numeroDI: '26/1728349-1' },
    update: {},
    create: {
      numeroDI: '26/1728349-1',
      clienteId: cliente2.id,
      container: 'TEXU4928103',
      tipoContainer: "40' High Cube (HC)",
      status: 'bloqueada',
      pesoBruto: 19500,
      mercadoria: 'Processadores e Placas de Vídeo',
      transportadora: 'Express Multimodal',
    },
  });

  // Usuário cliente para cliente1
  const hashedCliente = await bcrypt.hash('cliente123', 10);
  await prisma.user.upsert({
    where: { email: 'operador@globalimport.com.br' },
    update: {},
    create: {
      name: 'OPERADOR GLOBAL',
      email: 'operador@globalimport.com.br',
      password: hashedCliente,
      role: UserRole.CLIENTE,
      clienteId: cliente1.id,
      position: 'Operador Logístico',
    },
  });
  console.log('Usuário cliente1 criado: operador@globalimport.com.br');

  // Usuário cliente para cliente2
  await prisma.user.upsert({
    where: { email: 'logistica@tecavancada.com.br' },
    update: {},
    create: {
      name: 'LOGÍSTICA TECAVANÇADA',
      email: 'logistica@tecavancada.com.br',
      password: hashedCliente,
      role: UserRole.CLIENTE,
      clienteId: cliente2.id,
      position: 'Coordenador de Logística',
    },
  });
  console.log('Usuário cliente2 criado: logistica@tecavancada.com.br');

  console.log('\nSeed concluído com sucesso!');
  console.log('\nCredenciais:');
  console.log('  ADMIN:    admin@portalcliente.com.br   / admin123');
  console.log('  CLIENTE1: operador@globalimport.com.br / cliente123');
  console.log('  CLIENTE2: logistica@tecavancada.com.br / cliente123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
