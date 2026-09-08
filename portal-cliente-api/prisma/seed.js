"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient();
const DEFAULT_DEV_PASSWORD = 'mudar123';
async function main() {
    console.log('Iniciando seed do banco portal-cliente...');
    const passwordHash = await bcrypt.hash(DEFAULT_DEV_PASSWORD, 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@portalcliente.com.br' },
        update: {},
        create: {
            name: 'ADMINISTRADOR',
            email: 'admin@portalcliente.com.br',
            password: passwordHash,
            role: client_1.UserRole.ADMIN,
            position: 'Administrador do Sistema',
        },
    });
    console.log(`Admin criado: ${admin.email}`);
    const fcl = await prisma.module.upsert({
        where: { name: 'Agendamento' },
        update: {},
        create: {
            name: 'Agendamento',
            description: 'Portal de agendamento de retirada de containers FCL',
            route: '/agendamento',
            icon: 'CalendarDays',
            sortOrder: 1,
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
    await prisma.userModuleAccess.upsert({
        where: { userId_moduleId: { userId: admin.id, moduleId: fcl.id } },
        update: { isEnabled: true },
        create: { userId: admin.id, moduleId: fcl.id, isEnabled: true },
    });
    const janelas = [
        { descricao: 'Agendamento DTA', horaInicio: '08:00', horaFim: '12:00', intervaloMinutos: 60, vagasSimultaneas: 5 },
        { descricao: 'Agendamento', horaInicio: '13:00', horaFim: '17:00', intervaloMinutos: 60, vagasSimultaneas: 3 },
    ];
    for (const j of janelas) {
        await prisma.janelaAtendimento.create({ data: j }).catch(() => { });
    }
    console.log('Janelas de atendimento criadas');
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
    await prisma.user.upsert({
        where: { email: 'operador@globalimport.com.br' },
        update: {},
        create: {
            name: 'OPERADOR GLOBAL',
            email: 'operador@globalimport.com.br',
            password: passwordHash,
            role: client_1.UserRole.CLIENTE,
            clienteId: cliente1.id,
            position: 'Operador Logístico',
        },
    });
    console.log('Usuário cliente1 criado: operador@globalimport.com.br');
    await prisma.user.upsert({
        where: { email: 'logistica@tecavancada.com.br' },
        update: {},
        create: {
            name: 'LOGÍSTICA TECAVANÇADA',
            email: 'logistica@tecavancada.com.br',
            password: passwordHash,
            role: client_1.UserRole.CLIENTE,
            clienteId: cliente2.id,
            position: 'Coordenador de Logística',
        },
    });
    console.log('Usuário cliente2 criado: logistica@tecavancada.com.br');
    console.log(`\nSeed concluído com sucesso! Senha padrão dos usuários de dev: ${DEFAULT_DEV_PASSWORD}`);
}
main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=seed.js.map