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

/**
 * O que a criação de agendamento precisa saber de quem está agendando. É um
 * Pick, e não o User inteiro, para os testes poderem montar o usuário sem
 * inventar as trinta colunas da tabela.
 */
type UsuarioAgendamento = Pick<
  User,
  'role' | 'clienteId' | 'despachanteId' | 'transportadoraContaId'
>;

/** Campos que o formulário manda como lista e a tabela guarda como texto. */
function juntarLista(valor: unknown): string | null {
  if (Array.isArray(valor)) return valor.join(', ') || null;
  return (valor as string) || null;
}

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

  /**
   * Duas formas de agendar convivem desde o Next, e o mesmo POST atende as
   * duas: a antiga escolhe uma DI já averbada (`diId`), a nova é o formulário
   * do wizard, que declara os dados da carga. O legado despachava olhando
   * `body.diId` e o front continua postando nos dois formatos — manter o
   * despacho aqui é o que torna o wizard funcional de novo.
   */
  async createAgendamento(user: UsuarioAgendamento, body: any) {
    if (body?.diId) {
      // Transportadora não escolhe DI da lista: opera pelo que lhe foi
      // atribuído, e isso é conferido no caminho do formulário.
      if (user.role === UserRole.TRANSPORTADORA) {
        throw new ForbiddenException('Fluxo não disponível para transportadoras');
      }
      return this.criarAgendamentoPorDi(user, body);
    }
    return this.criarAgendamentoPeloFormulario(user, body);
  }

  private async criarAgendamentoPorDi(
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

  /**
   * Clientes que este despachante alcança, derivados das DIs averbadas em que
   * ele aparece. Espelha getDespachanteClienteIds, do fluxo legado: é escopo de
   * visibilidade, não autorização — quem autoriza operar em nome do importador
   * continua sendo a procuração, conferida logo em seguida.
   */
  private async clientesDoDespachante(despachanteId: string): Promise<string[]> {
    const despachante = await this.prisma.despachante.findUnique({
      where: { id: despachanteId },
      select: { codDespachante: true },
    });
    if (!despachante) return [];

    const lotes = await this.prisma.diAverbada.findMany({
      where: { codDespachante: despachante.codDespachante, cnpjCliente: { not: null } },
      select: { cnpjCliente: true },
      distinct: ['cnpjCliente'],
    });
    const cnpjs = lotes
      .map((l) => l.cnpjCliente)
      .filter((c): c is string => Boolean(c));
    if (!cnpjs.length) return [];

    const clientes = await this.prisma.cliente.findMany({
      where: { cnpj: { in: cnpjs } },
      select: { id: true },
    });
    return clientes.map((c) => c.id);
  }

  /**
   * Agendamento pelo formulário do wizard, portado de handleNewFormPost.
   *
   * Aqui não se escolhe uma DI do estoque: o usuário declara a carga. Cada
   * perfil chega ao cliente por um caminho diferente, e é isso que decide o que
   * ele pode agendar — transportadora só o que lhe foi atribuído, despachante
   * só quem o representa e com procuração vigente, cliente só a si mesmo.
   */
  private async criarAgendamentoPeloFormulario(user: UsuarioAgendamento, body: any) {
    const {
      operacao, subOperacao, cargaEspecial, servicos,
      tipoVeiculo, dataAgendamento, inicio,
      cpfMotorista, nomeMotorista, transportadora, empresa,
      awbMawb, di: diDeclarada, dta, hawb, numeroVoo,
      placaVeiculo, volumes, peso, consignatario, observacoes,
      container, notificarWhatsapp, whatsapp,
      transportadoraCnpj, transportadoraEmail,
    } = body ?? {};

    // Mesmo motorista, mesma data e mesmo horário é sempre engano de digitação:
    // uma pessoa não dirige dois caminhões ao mesmo tempo.
    if (cpfMotorista && dataAgendamento && inicio) {
      const cpfLimpo = String(cpfMotorista).replace(/\D/g, '');
      const mesmoSlot = await this.prisma.agendamento.findMany({
        where: {
          data: dataAgendamento,
          horario: inicio,
          status: { not: AgendamentoStatus.CANCELADO },
        },
        select: { cpfMotorista: true },
      });
      if (mesmoSlot.some((b) => b.cpfMotorista?.replace(/\D/g, '') === cpfLimpo)) {
        throw new ConflictException(
          'Já existe um agendamento para este motorista nesta data e horário.',
        );
      }
    }

    const disInformadas: string[] = (
      Array.isArray(diDeclarada) ? diDeclarada : diDeclarada ? [diDeclarada] : []
    )
      .map((d: unknown) => String(d).trim())
      .filter(Boolean);

    let clienteId: string | null = null;
    let transportadoraContaId: string | null = null;
    let transportadoraNome: string | null = null;

    if (user.role === UserRole.TRANSPORTADORA) {
      if (!user.transportadoraContaId) {
        throw new ForbiddenException('Conta de transportadora não vinculada');
      }
      if (!disInformadas.length) {
        throw new BadRequestException('Informe a DI para agendar');
      }

      const contaId = user.transportadoraContaId;
      const disAtribuidas = await this.prisma.diAverbada.findMany({
        where: {
          OR: [
            { documentoSaida: { in: disInformadas } },
            { nLote: { in: disInformadas } },
          ],
          atribuicoes: { some: { transportadoraContaId: contaId } },
        },
        include: {
          atribuicoes: {
            where: { transportadoraContaId: contaId },
            select: { container: true },
          },
        },
      });

      const encontrados = new Set(
        disAtribuidas.flatMap((d) =>
          [d.documentoSaida, d.nLote].filter((v): v is string => Boolean(v)),
        ),
      );
      const semAtribuicao = disInformadas.filter((n) => !encontrados.has(n));
      if (semAtribuicao.length) {
        throw new ForbiddenException(
          `DI(s) não atribuída(s) a esta transportadora: ${semAtribuicao.join(', ')}`,
        );
      }

      // Atribuição por container específico não libera a DI inteira: só vale o
      // container que foi realmente entregue a esta transportadora.
      const containerSolicitado = typeof container === 'string' ? container.trim() : '';
      if (containerSolicitado) {
        const atribuidos = disAtribuidas.flatMap((d) =>
          d.atribuicoes.map((a) => a.container),
        );
        const temDiInteira = atribuidos.includes('');
        if (!temDiInteira && !atribuidos.includes(containerSolicitado)) {
          throw new ForbiddenException(
            `Container ${containerSolicitado} não foi atribuído a esta transportadora`,
          );
        }
      }

      transportadoraContaId = contaId;
      const conta = await this.prisma.transportadoraConta.findUnique({
        where: { id: contaId },
        select: { nome: true },
      });
      transportadoraNome = conta?.nome ?? null;

      const cnpjClienteDi = disAtribuidas.find((d) => d.cnpjCliente)?.cnpjCliente;
      if (cnpjClienteDi) {
        const cliente = await this.prisma.cliente.findFirst({
          where: { cnpj: cnpjClienteDi },
        });
        clienteId = cliente?.id ?? null;
      }
    } else if (user.role === UserRole.CLIENTE && user.clienteId) {
      clienteId = user.clienteId;
    } else if (user.role === UserRole.DESPACHANTE && user.despachanteId) {
      if (empresa) {
        const cliente = await this.prisma.cliente.findFirst({
          where: { nome: { contains: empresa, mode: 'insensitive' } },
        });
        if (cliente) {
          const permitidos = await this.clientesDoDespachante(user.despachanteId);
          if (!permitidos.includes(cliente.id)) {
            throw new ForbiddenException('Sem permissão para agendar para este cliente');
          }
          await this.exigirProcuracao(user.despachanteId, cliente.id);
          clienteId = cliente.id;
        }
      }
    } else if (empresa) {
      const cliente = await this.prisma.cliente.findFirst({
        where: { nome: { contains: empresa, mode: 'insensitive' } },
      });
      clienteId = cliente?.id ?? null;
    }

    // Gate documental, para qualquer perfil: a DI informada não pode ser
    // agendada enquanto houver processo de averbação aberto e não liberado.
    await this.exigirAverbacaoLiberada(disInformadas);

    let transportadoraConvite: unknown = null;
    if (!transportadoraContaId && transportadoraCnpj) {
      const cnpjDigits = String(transportadoraCnpj).replace(/\D/g, '');
      if (cnpjDigits.length === 14) {
        let conta = await this.prisma.transportadoraConta.findUnique({
          where: { cnpj: cnpjDigits },
        });
        if (!conta && transportadora) {
          conta = await this.prisma.transportadoraConta.create({
            data: { cnpj: cnpjDigits, nome: transportadora },
          });
        }
        if (conta) {
          transportadoraContaId = conta.id;
          transportadoraConvite = await this.ensureTransportadoraInvite(
            conta,
            transportadoraEmail,
          );
        }
      }
    }

    // Motorista e veículo nascem do agendamento quando ainda não existem: o
    // cadastro prévio não é exigido de quem agenda pela primeira vez.
    let motoristaId: string | null = null;
    if (cpfMotorista && clienteId) {
      const cpfLimpo = String(cpfMotorista).replace(/\D/g, '');
      const motoristas = await this.prisma.motorista.findMany({ where: { clienteId } });
      let motorista =
        motoristas.find((m) => m.cpf.replace(/\D/g, '') === cpfLimpo) ?? null;
      if (!motorista && nomeMotorista) {
        motorista = await this.prisma.motorista.create({
          data: { clienteId, nome: nomeMotorista, cpf: cpfMotorista, cnh: '', telefone: '' },
        });
      } else if (motorista && nomeMotorista && motorista.nome !== nomeMotorista) {
        motorista = await this.prisma.motorista.update({
          where: { id: motorista.id },
          data: { nome: nomeMotorista },
        });
      }
      motoristaId = motorista?.id ?? null;
    }

    let veiculoId: string | null = null;
    if (placaVeiculo && clienteId) {
      const placaLimpa = String(placaVeiculo).replace(/\s/g, '').toUpperCase();
      let veiculo = await this.prisma.veiculo.findFirst({
        where: { clienteId, placa: { contains: placaLimpa, mode: 'insensitive' } },
      });
      if (!veiculo && tipoVeiculo) {
        veiculo = await this.prisma.veiculo.create({
          data: { clienteId, placa: placaLimpa, modelo: tipoVeiculo, tipo: tipoVeiculo },
        });
      }
      veiculoId = veiculo?.id ?? null;
    }

    // Contato vira snapshot no agendamento: o cadastro pode mudar depois, e
    // quem for atender precisa do telefone que valia no dia.
    const [clienteInfo, transportadoraInfo] = await Promise.all([
      clienteId
        ? this.prisma.cliente.findUnique({
            where: { id: clienteId },
            select: { cnpj: true, email: true, telefone: true },
          })
        : null,
      transportadoraContaId
        ? this.prisma.transportadoraConta.findUnique({
            where: { id: transportadoraContaId },
            select: { cnpj: true, email: true, telefone: true },
          })
        : null,
    ]);

    const protocolo = `AG-${Date.now().toString(36).toUpperCase()}`;

    const agendamento = await this.prisma.agendamento.create({
      data: {
        protocolo,
        status: AgendamentoStatus.ATIVO,
        data: dataAgendamento,
        horario: inicio,
        observacao: observacoes || null,
        clienteId,
        motoristaId,
        veiculoId,
        operacao: operacao || null,
        subOperacao: subOperacao || null,
        cargaEspecial: cargaEspecial ?? false,
        servicos: Array.isArray(servicos) ? servicos : [],
        tipoVeiculo: tipoVeiculo || null,
        cpfMotorista: cpfMotorista || null,
        nomeMotorista: nomeMotorista || null,
        placaVeiculo: placaVeiculo || null,
        transportadora: transportadora || transportadoraNome || null,
        transportadoraContaId,
        empresa: empresa || null,
        awbMawb: juntarLista(awbMawb),
        diNumero: juntarLista(diDeclarada),
        dta: juntarLista(dta),
        hawb: juntarLista(hawb),
        numeroVoo: numeroVoo || null,
        volumes: volumes || null,
        peso: peso || null,
        consignatario: consignatario || null,
        container: container || null,
        whatsapp: notificarWhatsapp && whatsapp ? whatsapp : null,
        notificarWhatsapp: Boolean(notificarWhatsapp && whatsapp),
        cnpjCliente: clienteInfo?.cnpj || null,
        telefoneCliente: clienteInfo?.telefone || null,
        emailCliente: clienteInfo?.email || null,
        cnpjTransportadora:
          transportadoraInfo?.cnpj ||
          (transportadoraCnpj ? String(transportadoraCnpj).replace(/\D/g, '') : null),
        telefoneTransportadora: transportadoraInfo?.telefone || null,
        emailTransportadora: transportadoraInfo?.email || transportadoraEmail || null,
      },
      include: {
        motorista: true,
        veiculo: true,
        cliente: { select: { id: true, nome: true } },
      },
    });

    return { ...agendamento, transportadoraConvite };
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
