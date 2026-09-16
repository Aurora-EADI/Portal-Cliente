import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  DIStatus,
  AgendamentoStatus,
  UserRole,
  AverbacaoProcessoStatus,
  ProcuracaoStatus,
} from '@prisma/client';
import type { Prisma, User } from '@prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MailService } from '../mail/mail.service';
import { procuracaoVigente } from '../procuracoes/procuracoes.service';

const ACTIVE_STATUSES = [AgendamentoStatus.ATIVO];

/** Como a procuração aparece na mensagem de bloqueio, na voz do despachante. */
function descreverProcuracao(status: ProcuracaoStatus): string {
  switch (status) {
    case ProcuracaoStatus.PENDENTE_ENVIO:
      return 'pendente de envio';
    case ProcuracaoStatus.EM_ANALISE:
      return 'em análise';
    case ProcuracaoStatus.REPROVADA:
      return 'reprovada';
    case ProcuracaoStatus.REVOGADA:
      return 'revogada';
    default:
      return 'não aprovada';
  }
}

@Injectable()
export class AgendamentoService {
  constructor(private prisma: PrismaService, private readonly mail: MailService) {}

  async findAtribuicoes(user: Pick<User, 'role' | 'clienteId' | 'despachanteId'>, nLote?: string) {
    let ownership: Prisma.DiAverbadaWhereInput | null = null;
    if (user.role === 'CLIENTE' && user.clienteId) {
      const cliente = await this.prisma.cliente.findUnique({
        where: { id: user.clienteId }, select: { cnpj: true },
      });
      if (cliente?.cnpj) ownership = { cnpjCliente: cliente.cnpj };
    } else if (user.role === 'DESPACHANTE' && user.despachanteId) {
      const despachante = await this.prisma.despachante.findUnique({
        where: { id: user.despachanteId }, select: { codDespachante: true },
      });
      if (despachante) ownership = { codDespachante: despachante.codDespachante };
    }
    if (!ownership) return [];

    return this.prisma.diTransportadoraAtribuicao.findMany({
      where: { ...(nLote ? { nLote } : {}), diAverbada: ownership },
      include: { transportadora: { select: { id: true, nome: true, cnpj: true } } },
      orderBy: { atribuidoEm: 'desc' },
    });
  }

  private async ownership(user: Pick<User, 'role' | 'clienteId' | 'despachanteId'>) {
    if (user.role === UserRole.CLIENTE && user.clienteId) {
      const cliente = await this.prisma.cliente.findUnique({ where: { id: user.clienteId }, select: { cnpj: true } });
      return cliente?.cnpj ? { cnpjCliente: cliente.cnpj } : null;
    }
    if (user.role === UserRole.DESPACHANTE && user.despachanteId) {
      const despachante = await this.prisma.despachante.findUnique({ where: { id: user.despachanteId }, select: { codDespachante: true } });
      return despachante ? { codDespachante: despachante.codDespachante } : null;
    }
    return null;
  }

  async criarAtribuicao(user: User, body: any) {
    const nLote = String(body.nLote ?? '').trim();
    const cnpj = String(body.cnpj ?? '').replace(/\D/g, '');
    const container = typeof body.container === 'string' ? body.container.trim() : '';
    if (!nLote || cnpj.length !== 14) throw new BadRequestException('nLote e CNPJ válido são obrigatórios');
    const where = await this.ownership(user);
    if (!where) throw new ForbiddenException('Usuário sem vínculo de cliente/despachante');
    const di = await this.prisma.diAverbada.findFirst({ where: { nLote, ...where } });
    if (!di) throw new NotFoundException('DI não encontrada ou sem permissão');
    if (container && !(di.containers ?? '').split('/').map((v) => v.trim()).includes(container)) {
      throw new BadRequestException('Container não pertence a esta DI');
    }
    let transportadora = await this.prisma.transportadoraConta.findUnique({ where: { cnpj } });
    if (!transportadora) {
      if (!body.nome) throw new BadRequestException('nome é obrigatório para nova transportadora');
      transportadora = await this.prisma.transportadoraConta.create({ data: { cnpj, nome: body.nome, whatsapp: body.whatsapp || null } });
    } else if (body.whatsapp && body.whatsapp !== transportadora.whatsapp) {
      transportadora = await this.prisma.transportadoraConta.update({ where: { id: transportadora.id }, data: { whatsapp: body.whatsapp } });
      await this.prisma.diTransportadoraAtribuicao.updateMany({ where: { transportadoraContaId: transportadora.id, whatsappNotificadoEm: null }, data: { whatsappNotificadoEm: new Date() } });
    }
    const existente = await this.prisma.diTransportadoraAtribuicao.findFirst({ where: { nLote, container }, include: { transportadora: { select: { nome: true } } } });
    if (existente) throw new ConflictException('Esta DI/container já possui uma atribuição');
    const convite = await this.ensureTransportadoraInvite(transportadora, body.email);
    const atribuicao = await this.prisma.diTransportadoraAtribuicao.create({
      data: { nLote, container, transportadoraContaId: transportadora.id, atribuidoPorUserId: user.id, atribuidoPorRole: user.role },
      include: { transportadora: { select: { id: true, nome: true, cnpj: true } } },
    });
    return { ...atribuicao, convite };
  }

  private async ensureTransportadoraInvite(transportadora: { id: string; cnpj: string; nome: string; email: string | null; codTransp: string | null }, emailOverride?: string) {
    const active = await this.prisma.user.findFirst({ where: { transportadoraContaId: transportadora.id, active: true }, select: { id: true } });
    if (active) return { status: 'has_access' as const };
    const pending = await this.prisma.conviteRegistro.findFirst({ where: { tipo: UserRole.TRANSPORTADORA, cnpjTransportadora: transportadora.cnpj, usedAt: null, expiresAt: { gt: new Date() } }, orderBy: { createdAt: 'desc' } });
    if (pending) return { status: 'pending' as const, link: `${process.env.BETTER_AUTH_URL || process.env.FRONTEND_URL || 'http://localhost:3000'}/registro?token=${pending.token}` };
    const email = emailOverride?.trim() || transportadora.email;
    const convite = await this.prisma.conviteRegistro.create({ data: { tipo: UserRole.TRANSPORTADORA, nome: transportadora.nome, email, cnpjTransportadora: transportadora.cnpj, codTransp: transportadora.codTransp, expiresAt: new Date(Date.now() + 36500 * 86400000) } });
    const link = `${process.env.BETTER_AUTH_URL || process.env.FRONTEND_URL || 'http://localhost:3000'}/registro?token=${convite.token}`;
    if (email) await this.mail.enviar({ para: [email], assunto: 'Convite — Portal do Cliente Aurora EADI', texto: `Acesse ${link} para concluir seu cadastro.`, html: `<p>Acesse <a href="${link}">${link}</a> para concluir seu cadastro.</p>` });
    return { status: 'created' as const, link, emailSent: Boolean(email) };
  }

  async removerAtribuicao(user: User, query: any) {
    const nLote = String(query.nLote ?? '').trim();
    const transportadoraContaId = String(query.transportadoraContaId ?? '').trim();
    const container = query.container === undefined ? undefined : String(query.container);
    if (!nLote || !transportadoraContaId) throw new BadRequestException('nLote e transportadoraContaId são obrigatórios');
    const where = await this.ownership(user);
    if (!where) throw new ForbiddenException('Usuário sem vínculo de cliente/despachante');
    const di = await this.prisma.diAverbada.findFirst({ where: { nLote, ...where }, select: { nLote: true } });
    if (!di) throw new NotFoundException('DI não encontrada ou sem permissão');
    const deleted = await this.prisma.diTransportadoraAtribuicao.deleteMany({ where: { nLote, transportadoraContaId, ...(container === undefined ? {} : { container }) } });
    if (!deleted.count) throw new NotFoundException('Atribuição não encontrada');
    return { message: 'Atribuição removida' };
  }

  findTransportadorasConta() {
    return this.prisma.transportadoraConta.findMany({
      where: { ativo: true, cnpj: { not: '' } },
      orderBy: { nome: 'asc' },
    });
  }



  // ---- AGENDAMENTOS ----
  findAllAgendamentos(clienteId?: string) {
    return this.prisma.agendamento.findMany({
      where: {
        status: { in: ACTIVE_STATUSES },
        ...(clienteId ? { di: { clienteId } } : {}),
      },
      include: {
        di: { include: { cliente: { select: { id: true, nome: true } } } },
        motorista: true,
        veiculo: true,
      },
      orderBy: { criadoEm: 'desc' },
    });
  }

  findHistorico(clienteId?: string) {
    return this.prisma.agendamento.findMany({
      where: {
        status: AgendamentoStatus.CANCELADO,
        ...(clienteId ? { di: { clienteId } } : {}),
      },
      include: {
        di: { include: { cliente: { select: { id: true, nome: true } } } },
        motorista: true,
        veiculo: true,
      },
      orderBy: { criadoEm: 'desc' },
    });
  }

  /**
   * As duas travas abaixo vieram das Route Handlers do Next (`lib/procuracao-
   * guard.ts` e `lib/averbacao-gate.ts`), que saíram quando o Nest passou a ser
   * a única fronteira de persistência. A tela já esconde o botão de agendar,
   * mas isso é conveniência: sem estas checagens bastaria um POST direto para
   * operar em nome de um importador que nunca autorizou ninguém, ou para
   * agendar carga cuja documentação foi reprovada.
   *
   * Ficam no serviço, e não nos call sites, porque a criação de agendamento é o
   * único ponto que precisa delas — e um ponto só não diverge.
   */
  private readonly averbacaoAtiva = process.env.AVERBACAO_ATIVA === 'true';

  /**
   * Aparecer nas DIs do despachante não autoriza operar: a procuração é a
   * autorização explícita do importador, e vale por cliente.
   */
  private async exigirProcuracao(despachanteId: string, clienteId: string) {
    // Procuração entra junto com a averbação: enquanto o módulo não opera, a
    // tela de envio nem existe, então exigi-la travaria o agendamento sem saída.
    if (!this.averbacaoAtiva) return;

    const procuracao = await this.prisma.procuracao.findUnique({
      where: { despachanteId_clienteId: { despachanteId, clienteId } },
      select: { status: true, validade: true },
    });
    if (procuracao && procuracaoVigente(procuracao)) return;

    // Vencida tem mensagem própria: mandar "aprove a procuração" para algo que
    // já foi aprovado e caducou levaria a pessoa a reenviar o mesmo documento.
    const vencida =
      procuracao?.status === ProcuracaoStatus.APROVADA && !!procuracao.validade;

    throw new ForbiddenException(
      vencida
        ? 'Operação bloqueada — a procuração deste cliente venceu. Envie uma procuração vigente e aguarde a aprovação da equipe da Aurora.'
        : 'Operação bloqueada — procuração ' +
          (procuracao ? descreverProcuracao(procuracao.status) : 'não enviada') +
          '. Para realizar esta operação em nome deste cliente, é necessário possuir uma procuração válida e aprovada pela equipe da Aurora.',
    );
  }

  /**
   * Gate documental. Só bloqueia quando EXISTE processo de averbação para a DI
   * e ele ainda não foi liberado; DI sem processo segue livre.
   *
   * A regra é deliberada: `dis_averbadas` só recebe DI que o Portal Aurora já
   * averbou pelo fluxo antigo. Exigir processo documental de todas bloquearia
   * de uma vez a operação existente — o fluxo novo convive com o legado até
   * substituí-lo.
   */
  private async exigirAverbacaoLiberada(identificadores: string[]) {
    if (!this.averbacaoAtiva) return;

    const limpos = identificadores.filter(Boolean);
    if (!limpos.length) return;

    const processo = await this.prisma.averbacaoProcesso.findFirst({
      where: { OR: [{ nLote: { in: limpos } }, { diDuimp: { in: limpos } }] },
      select: { status: true, protocolo: true },
      orderBy: { updatedAt: 'desc' },
    });

    // Sem processo documental, vale o fluxo legado.
    if (!processo) return;
    if (processo.status === AverbacaoProcessoStatus.LIBERADO_AGENDAMENTO) return;

    throw new ForbiddenException(
      `Averbação pendente — o processo ${processo.protocolo} ainda não foi liberado para agendamento pela equipe da Aurora.`,
    );
  }

  async createAgendamento(
    user: Pick<User, 'role' | 'despachanteId'>,
    data: { diId: string; motoristaId: string; veiculoId: string; data: string; horario: string },
  ) {
    const di = await this.prisma.dI.findUnique({ where: { id: data.diId } });
    if (!di) throw new NotFoundException('DI não encontrada');
    if (di.status !== 'liberada') throw new BadRequestException('DI não está liberada para agendamento');

    if (user.role === UserRole.DESPACHANTE && user.despachanteId) {
      await this.exigirProcuracao(user.despachanteId, di.clienteId);
    }

    // Vale para qualquer perfil, não só despachante: quem agenda não muda o
    // fato de a documentação não estar liberada.
    await this.exigirAverbacaoLiberada([di.numeroDI]);

    const cleanedDate = data.data.replace(/-/g, '');
    const diCode = di.numeroDI.replace(/[^A-Z0-9]/gi, '').slice(2, 8).toUpperCase();
    const randomHash = Math.random().toString(36).substring(2, 6).toUpperCase();
    const protocolo = `FCL-${cleanedDate}-${diCode}-${randomHash}`;

    const agendamento = await this.prisma.agendamento.create({
      data: { ...data, protocolo, status: AgendamentoStatus.ATIVO },
      include: { di: true, motorista: true, veiculo: true },
    });

    await this.prisma.slotReserva.deleteMany({ where: { diId: data.diId } });

    return agendamento;
  }

  cancelarAgendamento(id: string) {
    return this.prisma.agendamento.update({
      where: { id },
      data: { status: AgendamentoStatus.CANCELADO },
    });
  }

  // ---- SLOT RESERVAS (HOLD) ----
  private readonly HOLD_MINUTES = parseInt(process.env.SLOT_HOLD_MINUTES ?? '10', 10);

  async reservarSlot(data: string, horario: string, diId: string, vagasTotais: number) {
    const now = new Date();
    await this.prisma.slotReserva.deleteMany({ where: { diId } });

    const ocupados = await this.contarOcupacao(data, horario);
    if (ocupados >= vagasTotais) throw new ConflictException('Slot sem vagas disponíveis');

    const expiraEm = new Date(now.getTime() + this.HOLD_MINUTES * 60 * 1000);
    return this.prisma.slotReserva.create({ data: { data, horario, diId, expiraEm } });
  }

  async liberarSlot(id: string) {
    await this.prisma.slotReserva.deleteMany({ where: { id } });
  }

  async getDisponibilidade(data: string, horario: string) {
    const ocupados = await this.contarOcupacao(data, horario);
    return { ocupados };
  }

  async verificarHoldDI(diId: string) {
    const hold = await this.prisma.slotReserva.findFirst({
      where: { diId, expiraEm: { gt: new Date() } },
    });
    return { temHold: !!hold };
  }

  private async contarOcupacao(data: string, horario: string): Promise<number> {
    const now = new Date();
    const [bookings, holds] = await Promise.all([
      this.prisma.agendamento.count({ where: { data, horario, status: { in: ACTIVE_STATUSES } } }),
      this.prisma.slotReserva.count({ where: { data, horario, expiraEm: { gt: now } } }),
    ]);
    return bookings + holds;
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async limparHoldsExpirados() {
    await this.prisma.slotReserva.deleteMany({ where: { expiraEm: { lt: new Date() } } });
  }
}
