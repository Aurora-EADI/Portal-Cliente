import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  AverbacaoDocumentoStatus,
  AverbacaoHistoricoAcao,
  AverbacaoProcessoStatus,
  Prisma,
  ProcuracaoStatus,
  User,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MinioService } from '../minio/minio.service';
import { MailService } from '../mail/mail.service';
import {
  documentoDecidido,
  processoDevolvido,
  processoLiberado,
} from '../mail/templates';
import { nomeExibicao, validarPdfEGerarKey } from '../common/arquivo';
import { procuracaoVigente } from '../procuracoes/procuracoes.service';
import { resolverContainers } from '../common/containers';
import { CriarAverbacaoDto } from './dto/criar-averbacao.dto';
import { EditarAverbacaoDto } from './dto/editar-averbacao.dto';
import { AverbacoesEventos } from './averbacoes.eventos';
import { OutboxService } from '../rabbitmq/publishers/outbox.service';

/** Sem arquivoKey: a key do MinIO não sai da API. */
const SELECT_DOCUMENTO = {
  id: true,
  status: true,
  arquivoNome: true,
  arquivoTamanho: true,
  motivoRejeicao: true,
  createdAt: true,
  updatedAt: true,
  tipoDocumento: {
    select: {
      id: true,
      descricao: true,
      obrigatorio: true,
      step: true,
      ordem: true,
      modalidade: true,
    },
  },
} as const;

const SELECT_PROCESSO = {
  id: true,
  protocolo: true,
  modalidade: true,
  diDuimp: true,
  containerConhecimento: true,
  containers: true,
  localOrigem: true,
  recintoDestino: true,
  cargaEspecial: true,
  status: true,
  nLote: true,
  devolvidoEm: true,
  devolvidoPor: true,
  motivoDevolucao: true,
  corrigidoEm: true,
  corrigidoPor: true,
  diDuimpAnterior: true,
  canceladoEm: true,
  motivoCancelamento: true,
  createdAt: true,
  updatedAt: true,
  cliente: { select: { id: true, nome: true, cnpj: true } },
} as const;

@Injectable()
export class AverbacoesService {
  private readonly logger = new Logger(AverbacoesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly minio: MinioService,
    private readonly mail: MailService,
    private readonly eventos: AverbacoesEventos,
    private readonly outbox: OutboxService,
  ) {}

  private despachanteDo(user: User): string {
    if (!user.despachanteId) {
      throw new ForbiddenException('Usuário não está vinculado a um despachante');
    }
    return user.despachanteId;
  }

  /**
   * Protocolo legível: AVB-<ano>-<sequencial do ano>.
   *
   * A contagem roda dentro da transação de criação, então dois processos
   * simultâneos não recebem o mesmo número — e `protocolo` é unique no banco,
   * que é a garantia final.
   */
  private async gerarProtocolo(tx: Prisma.TransactionClient): Promise<string> {
    const ano = new Date().getFullYear();
    const prefixo = `AVB-${ano}-`;
    const total = await tx.averbacaoProcesso.count({
      where: { protocolo: { startsWith: prefixo } },
    });
    return `${prefixo}${String(total + 1).padStart(5, '0')}`;
  }

  /**
   * Uma DI, um processo vivo. Só um processo CANCELADO libera a DI para outro.
   *
   * O índice em `diDuimp` não é unique de propósito (o cancelado continua na
   * tabela, para auditoria), então a regra vive aqui. Sem ela o despachante
   * abria dois processos iguais para a mesma DI, e a Aurora validava os dois.
   *
   * Roda dentro da transação de quem grava, com um lock por DI: dois cliques
   * simultâneos em "Criar" esperam um pelo outro em vez de passarem juntos pela
   * checagem.
   */
  private async exigirDiLivre(
    tx: Prisma.TransactionClient,
    diDuimp: string,
    despachanteId: string,
    ignorarProcessoId?: string,
  ) {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`averbacao-di:${diDuimp}`}))`;

    const existente = await tx.averbacaoProcesso.findFirst({
      where: {
        diDuimp,
        status: { not: AverbacaoProcessoStatus.CANCELADO },
        ...(ignorarProcessoId && { id: { not: ignorarProcessoId } }),
      },
      select: { protocolo: true, status: true, despachanteId: true },
    });
    if (!existente) return;

    // O protocolo só é mostrado a quem é dono dele: dizer a um despachante o
    // número do processo de outro vazaria o que não é dele.
    if (existente.despachanteId === despachanteId) {
      throw new ConflictException(
        `Já existe o processo ${existente.protocolo} para a DI ${diDuimp}. ` +
          'Continue nele ou cancele-o antes de abrir outro.',
      );
    }
    throw new ConflictException(
      `A DI ${diDuimp} já tem um processo em andamento aberto por outro despachante. ` +
        'Procure a equipe da Aurora.',
    );
  }

  /**
   * Abre o processo e já cria uma linha NAO_ENVIADO para cada tipo de
   * documento ativo da modalidade.
   *
   * Materializar os documentos na criação, em vez de calcular na leitura,
   * congela as exigências do momento da abertura: mudar o catálogo depois não
   * altera o que já foi pedido a quem está no meio do processo.
   */
  async criar(user: User, dto: CriarAverbacaoDto) {
    const despachanteId = this.despachanteDo(user);

    const procuracao = await this.prisma.procuracao.findUnique({
      where: {
        despachanteId_clienteId: { despachanteId, clienteId: dto.clienteId },
      },
      select: { status: true, validade: true },
    });

    // Vencida não autoriza, e a mensagem diz qual dos dois casos é — "não
    // aprovada" para uma procuração vencida mandaria a pessoa reenviar o
    // documento errado.
    if (!procuracao || !procuracaoVigente(procuracao)) {
      const vencida =
        procuracao?.status === ProcuracaoStatus.APROVADA && !!procuracao.validade;
      throw new ForbiddenException(
        vencida
          ? 'Operação bloqueada — a procuração deste cliente venceu. Envie uma procuração vigente.'
          : 'Operação bloqueada — é necessário possuir procuração aprovada para este cliente.',
      );
    }

    const tipos = await this.prisma.tipoDocumento.findMany({
      where: { modalidade: dto.modalidade, ativo: true },
      select: { id: true },
    });

    if (!tipos.length) {
      throw new ConflictException(
        'Não há tipos de documento cadastrados para esta modalidade. Procure a equipe da Aurora.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await this.exigirDiLivre(tx, dto.diDuimp, despachanteId);

      const protocolo = await this.gerarProtocolo(tx);

      return tx.averbacaoProcesso.create({
        data: {
          protocolo,
          clienteId: dto.clienteId,
          despachanteId,
          modalidade: dto.modalidade,
          diDuimp: dto.diDuimp,
          // A carga não é mais identificada por container/conhecimento na
          // abertura: o container deixou de importar para o vínculo com o SIAUM.
          containerConhecimento: null,
          containers: [],
          localOrigem: dto.localOrigem || null,
          recintoDestino: dto.recintoDestino || null,
          cargaEspecial: dto.cargaEspecial ?? false,
          status: AverbacaoProcessoStatus.RASCUNHO,
          criadoPorUserId: user.id,
          documentos: {
            create: tipos.map((t) => ({
              tipoDocumentoId: t.id,
              status: AverbacaoDocumentoStatus.NAO_ENVIADO,
            })),
          },
        },
        select: SELECT_PROCESSO,
      });
    });
  }

  /**
   * Corrige os dados de identificação de um processo aberto com engano.
   *
   * Existe porque `diDuimp` e `containerConhecimento` só eram gravados na
   * criação: quem digitava o container errado não tinha saída — não havia
   * edição, cancelamento nem exclusão, e o processo seguia para a fila de
   * vínculo com o dado errado, derrubando a conferência do analista.
   *
   * A janela de edição fecha no VÍNCULO, não antes. É o vínculo que amarra
   * esta documentação a uma operação do SIAUM; até ele existir, estes campos
   * são só o que o despachante digitou. Documento já validado NÃO bloqueia de
   * propósito — travar aí devolveria a pessoa ao mesmo beco sem saída por um
   * erro de digitação, que é justamente o que este método resolve. O caso fica
   * registrado no log para a auditoria enxergar.
   */
  /**
   * Correção já enviada em resposta a uma devolução: o processo está com a
   * Aurora conferindo. Editar ou cancelar agora mudaria o dado debaixo do
   * analista. A janela reabre se a Aurora devolver de novo — `devolver` zera
   * `corrigidoEm`.
   */
  private exigirSemCorrecaoPendente(processo: {
    protocolo: string;
    devolvidoEm: Date | null;
    corrigidoEm: Date | null;
  }) {
    if (processo.corrigidoEm && !processo.devolvidoEm) {
      throw new ConflictException(
        `A correção do processo ${processo.protocolo} já foi enviada e está com a equipe Aurora. ` +
          'Se precisar de nova alteração, aguarde uma nova devolução.',
      );
    }
  }

  async editar(id: string, user: User, dto: EditarAverbacaoDto) {
    const processo = await this.prisma.averbacaoProcesso.findUnique({
      where: { id },
      select: {
        id: true,
        protocolo: true,
        despachanteId: true,
        status: true,
        nLote: true,
        modalidade: true,
        diDuimp: true,
        containerConhecimento: true,
        containers: true,
        clienteId: true,
        devolvidoEm: true,
        corrigidoEm: true,
        documentos: { select: { status: true } },
      },
    });

    if (!processo) throw new NotFoundException('Processo não encontrado');

    // Só o despachante dono corrige. ADMIN/EMPLOYEE não editam dado que o
    // despachante declarou — se está errado, quem declarou corrige.
    if (processo.despachanteId !== this.despachanteDo(user)) {
      throw new ForbiddenException('Processo pertence a outro despachante');
    }

    this.exigirSemCorrecaoPendente(processo);

    if (processo.status === AverbacaoProcessoStatus.LIBERADO_AGENDAMENTO) {
      throw new ConflictException(
        `O processo ${processo.protocolo} já foi liberado para agendamento e não pode mais ser alterado.`,
      );
    }

    if (processo.status === AverbacaoProcessoStatus.CANCELADO) {
      throw new ConflictException(
        `O processo ${processo.protocolo} está cancelado. Abra um novo processo.`,
      );
    }

    if (processo.nLote) {
      throw new ConflictException(
        `O processo ${processo.protocolo} já está vinculado ao lote ${processo.nLote}. ` +
          'Peça à Aurora para desfazer o vínculo antes de corrigir estes dados.',
      );
    }

    // Redeclarar containers substitui a lista inteira, e `containerConhecimento`
    // volta a ser o primeiro item — os dois campos nunca divergem.
    const redeclarou =
      dto.containers !== undefined || dto.containerConhecimento !== undefined;
    const lista = redeclarou
      ? resolverContainers(processo.modalidade, dto)
      : null;

    const dados = {
      ...(dto.diDuimp !== undefined && { diDuimp: dto.diDuimp }),
      ...(lista && {
        containerConhecimento: lista.principal,
        containers: lista.containers,
      }),
      ...(dto.localOrigem !== undefined && {
        localOrigem: dto.localOrigem || null,
      }),
      ...(dto.recintoDestino !== undefined && {
        recintoDestino: dto.recintoDestino || null,
      }),
      ...(dto.cargaEspecial !== undefined && {
        cargaEspecial: dto.cargaEspecial,
      }),
    };

    if (!Object.keys(dados).length) {
      throw new BadRequestException('Nenhum campo para alterar');
    }

    // Corrigir é a resposta à devolução: limpa a pendência e o status volta a
    // ser derivado dos documentos (os já validados continuam validados — só o
    // cabeçalho estava errado). Na mesma transação avisa o Aurora, que recoloca
    // o processo na fila de vínculo sem F5.
    const respondeuDevolucao = Boolean(processo.devolvidoEm);

    const atualizado = await this.prisma.$transaction(async (tx) => {
      // Corrigir a DI para uma que já tem processo vivo criaria o mesmo
      // duplicado que a abertura recusa.
      if (dto.diDuimp !== undefined && dto.diDuimp !== processo.diDuimp) {
        await this.exigirDiLivre(tx, dto.diDuimp, processo.despachanteId, id);
      }

      await tx.averbacaoProcesso.update({
        where: { id },
        data: {
          ...dados,
          // Marca a correção para o analista enxergar que o processo voltou
          // porque o despachante atendeu o pedido — e o que mudou na DI.
          ...(respondeuDevolucao && {
            devolvidoEm: null,
            devolvidoPor: null,
            motivoDevolucao: null,
            corrigidoEm: new Date(),
            corrigidoPor: user.name ?? user.email,
            diDuimpAnterior:
              dto.diDuimp !== undefined && dto.diDuimp !== processo.diDuimp
                ? processo.diDuimp
                : null,
          }),
        },
      });

      const status = await this.recalcularProcesso(tx, id);

      await this.outbox.createAverbacaoProcessoAtualizado(
        tx,
        {
          id,
          clienteId: processo.clienteId,
          despachanteId: processo.despachanteId,
          status,
        },
        null,
        respondeuDevolucao
          ? {
              evento: 'corrigido',
              protocolo: processo.protocolo,
              diDuimp: dto.diDuimp ?? processo.diDuimp,
              diDuimpAnterior:
                dto.diDuimp !== undefined && dto.diDuimp !== processo.diDuimp
                  ? processo.diDuimp
                  : null,
              corrigidoPor: user.name ?? user.email,
            }
          : undefined,
      );

      return tx.averbacaoProcesso.findUniqueOrThrow({
        where: { id },
        select: SELECT_PROCESSO,
      });
    });

    // Outra aba do despachante (e a do cliente) reflete a correção.
    this.eventos.emitir({
      despachanteId: processo.despachanteId,
      clienteId: processo.clienteId,
      processoId: id,
      status: atualizado.status,
    });

    const validados = processo.documentos.filter(
      (d) => d.status === AverbacaoDocumentoStatus.VALIDADO,
    ).length;

    this.logger.log(
      `Processo ${processo.protocolo} corrigido por ${user.name ?? user.email}: ` +
        `DI ${processo.diDuimp} → ${atualizado.diDuimp}, ` +
        `containers ${processo.containers.join(', ') || processo.containerConhecimento} → ` +
        `${atualizado.containers.join(', ') || atualizado.containerConhecimento}` +
        (validados ? ` (atenção: ${validados} documento(s) já validado(s))` : ''),
    );

    return atualizado;
  }

  /**
   * Descarta um processo aberto por engano.
   *
   * Não apaga: marca CANCELADO com data e motivo. Apagar levaria junto o
   * histórico dos documentos já enviados e o rastro de quem abriu o quê — e
   * um processo aberto por engano é exatamente o que a auditoria quer ver.
   *
   * A janela fecha no vínculo, como na edição: depois que o analista amarrou
   * a documentação a um lote do SIAUM, sumir com o processo deixaria o lote
   * apontando para nada. Nesse ponto o caminho é desfazer o vínculo primeiro.
   */
  async cancelar(id: string, user: User, motivo: string) {
    const processo = await this.prisma.averbacaoProcesso.findUnique({
      where: { id },
      select: {
        id: true,
        protocolo: true,
        despachanteId: true,
        status: true,
        nLote: true,
        devolvidoEm: true,
        corrigidoEm: true,
      },
    });

    if (!processo) throw new NotFoundException('Processo não encontrado');

    if (processo.despachanteId !== this.despachanteDo(user)) {
      throw new ForbiddenException('Processo pertence a outro despachante');
    }

    this.exigirSemCorrecaoPendente(processo);

    if (processo.status === AverbacaoProcessoStatus.CANCELADO) {
      throw new ConflictException(
        `O processo ${processo.protocolo} já está cancelado.`,
      );
    }

    if (processo.status === AverbacaoProcessoStatus.LIBERADO_AGENDAMENTO) {
      throw new ConflictException(
        `O processo ${processo.protocolo} já foi liberado para agendamento e não pode ser cancelado.`,
      );
    }

    if (processo.nLote) {
      throw new ConflictException(
        `O processo ${processo.protocolo} está vinculado ao lote ${processo.nLote}. ` +
          'Peça à Aurora para desfazer o vínculo antes de cancelar.',
      );
    }

    const atualizado = await this.prisma.$transaction(async (tx) => {
      const salvo = await tx.averbacaoProcesso.update({
        where: { id },
        data: {
          status: AverbacaoProcessoStatus.CANCELADO,
          canceladoEm: new Date(),
          motivoCancelamento: motivo,
        },
        select: SELECT_PROCESSO,
      });

      // Sem isto a fila do Aurora só via o cancelamento no próximo F5 — e o
      // analista podia seguir validando documento de um processo descartado.
      await this.outbox.createAverbacaoProcessoAtualizado(tx, {
        id,
        clienteId: salvo.cliente.id,
        despachanteId: processo.despachanteId,
        status: salvo.status,
      });

      return salvo;
    });

    this.eventos.emitir({
      despachanteId: processo.despachanteId,
      clienteId: atualizado.cliente.id,
      processoId: id,
      status: atualizado.status,
    });

    this.logger.log(
      `Processo ${processo.protocolo} cancelado por ${user.name ?? user.email}: ${motivo}`,
    );

    return atualizado;
  }

  /**
   * A equipe Aurora devolve o processo para o despachante corrigir os dados
   * de identificação — o caso típico é o documento de saída que não existe no
   * SIAUM: os PDFs podem estar certos, mas sem o número certo não há vínculo.
   *
   * Não rejeita documento nenhum: o problema está no cabeçalho, e o que já foi
   * validado continua validado. O processo fica em PENDENTE_CORRECAO e sai da
   * fila de vínculo até `editar` limpar a devolução.
   *
   * Mesma janela de `editar`: depois do vínculo, o caminho é desvincular antes.
   * Devolver de novo o que já está devolvido só atualiza o motivo — é o que
   * torna a op idempotente para o comando por RabbitMQ.
   */
  async devolver(processoId: string, motivo: string, devolvidoPor?: string) {
    const processo = await this.prisma.averbacaoProcesso.findUnique({
      where: { id: processoId },
      select: {
        protocolo: true,
        status: true,
        nLote: true,
        clienteId: true,
        despachanteId: true,
        devolvidoEm: true,
        motivoDevolucao: true,
      },
    });

    if (!processo) throw new NotFoundException('Processo não encontrado');

    if (processo.status === AverbacaoProcessoStatus.CANCELADO) {
      throw new ConflictException(
        `O processo ${processo.protocolo} foi cancelado pelo despachante.`,
      );
    }

    if (processo.status === AverbacaoProcessoStatus.LIBERADO_AGENDAMENTO) {
      throw new ConflictException(
        `O processo ${processo.protocolo} já foi liberado para agendamento e não pode ser devolvido.`,
      );
    }

    if (processo.nLote) {
      throw new ConflictException(
        `O processo ${processo.protocolo} está vinculado ao lote ${processo.nLote}. ` +
          'Desfaça o vínculo antes de devolver ao despachante.',
      );
    }

    const motivoLimpo = motivo.trim();
    if (processo.devolvidoEm && processo.motivoDevolucao === motivoLimpo) {
      return this.prisma.averbacaoProcesso.findUniqueOrThrow({
        where: { id: processoId },
        select: SELECT_PROCESSO,
      });
    }

    const atualizado = await this.prisma.$transaction(async (tx) => {
      const salvo = await tx.averbacaoProcesso.update({
        where: { id: processoId },
        data: {
          status: AverbacaoProcessoStatus.PENDENTE_CORRECAO,
          devolvidoEm: new Date(),
          devolvidoPor: devolvidoPor ?? 'Equipe Aurora',
          motivoDevolucao: motivoLimpo,
          // Nova devolução apaga o selo de uma correção anterior.
          corrigidoEm: null,
          corrigidoPor: null,
          diDuimpAnterior: null,
        },
        select: SELECT_PROCESSO,
      });

      // Aurora tira o processo da fila de vínculo e mostra a devolução.
      await this.outbox.createAverbacaoProcessoAtualizado(tx, {
        id: processoId,
        clienteId: processo.clienteId,
        despachanteId: processo.despachanteId,
        status: salvo.status,
      });

      return salvo;
    });

    // Depois do commit: a tela do despachante mostra a devolução sem F5.
    this.eventos.emitir({
      despachanteId: processo.despachanteId,
      clienteId: processo.clienteId,
      processoId,
      status: atualizado.status,
      devolvido: true,
    });

    void this.notificarDevolucao(processoId);

    this.logger.log(
      `Processo ${processo.protocolo} devolvido por ${devolvidoPor ?? 'Equipe Aurora'}: ${motivoLimpo}`,
    );

    return atualizado;
  }

  /** Avisa o despachante por e-mail. Engole os próprios erros (disparo por `void`). */
  private async notificarDevolucao(processoId: string) {
    try {
      const processo = await this.prisma.averbacaoProcesso.findUnique({
        where: { id: processoId },
        select: {
          protocolo: true,
          diDuimp: true,
          devolvidoPor: true,
          motivoDevolucao: true,
          cliente: { select: { nome: true } },
          despachante: { select: { email: true } },
          criadoPor: { select: { email: true } },
        },
      });
      if (!processo?.motivoDevolucao) return;

      const corpo = processoDevolvido({
        protocolo: processo.protocolo,
        clienteNome: processo.cliente.nome,
        diDuimp: processo.diDuimp,
        motivo: processo.motivoDevolucao,
        devolvidoPor: processo.devolvidoPor,
      });

      await this.mail.enviar({
        para: [processo.criadoPor?.email, processo.despachante.email],
        ...corpo,
      });
    } catch (erro) {
      this.logger.error(
        `Falha ao notificar devolução do processo ${processoId} — ${(erro as Error).message}`,
      );
    }
  }

  async listar(user: User) {
    const where = this.escopoDoUsuario(user);
    return this.prisma.averbacaoProcesso.findMany({
      where,
      select: {
        ...SELECT_PROCESSO,
        documentos: { select: { status: true, tipoDocumento: { select: { obrigatorio: true } } } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async detalhar(id: string, user?: User) {
    const processo = await this.prisma.averbacaoProcesso.findUnique({
      where: { id },
      select: {
        ...SELECT_PROCESSO,
        despachante: { select: { id: true, nome: true, codDespachante: true } },
        // Quem abriu — primeiro evento da linha do tempo do Arquivo de
        // Processos no Aurora.
        criadoPor: { select: { name: true, email: true } },
        documentos: {
          select: {
            ...SELECT_DOCUMENTO,
            historico: {
              select: {
                id: true,
                acao: true,
                autorNome: true,
                motivo: true,
                arquivoNome: true,
                criadoEm: true,
              },
              orderBy: { criadoEm: 'asc' },
            },
          },
        },
      },
    });

    if (!processo) throw new NotFoundException('Processo não encontrado');
    if (user) this.exigirAcesso(processo as any, user);

    // Ordena por etapa e depois por ordem — o "step" agrupa seções na tela.
    processo.documentos.sort(
      (a, b) =>
        a.tipoDocumento.step - b.tipoDocumento.step ||
        a.tipoDocumento.ordem - b.tipoDocumento.ordem ||
        a.tipoDocumento.descricao.localeCompare(b.tipoDocumento.descricao),
    );

    return processo;
  }

  private escopoDoUsuario(user: User): Prisma.AverbacaoProcessoWhereInput {
    if (user.despachanteId) return { despachanteId: user.despachanteId };
    if (user.clienteId) return { clienteId: user.clienteId };
    // ADMIN/EMPLOYEE do portal veem tudo; externo sem vínculo não vê nada.
    return {};
  }

  /**
   * O despachante vem aninhado no select (`despachante.id`), não como
   * `despachanteId` — comparar com o campo errado dá undefined e barra o
   * próprio dono do processo.
   */
  private exigirAcesso(
    processo: { despachante?: { id: string } | null; cliente: { id: string } },
    user: User,
  ) {
    if (!user.despachanteId && !user.clienteId) return; // ADMIN/EMPLOYEE

    const meu =
      (user.despachanteId &&
        user.despachanteId === processo.despachante?.id) ||
      (user.clienteId && user.clienteId === processo.cliente.id);

    if (!meu) throw new ForbiddenException('Sem acesso a este processo');
  }

  /** Anexa ou substitui o arquivo de um tipo de documento do processo. */
  async enviarDocumento(
    user: User,
    processoId: string,
    tipoDocumentoId: string,
    file: Express.Multer.File | undefined,
  ) {
    const despachanteId = this.despachanteDo(user);

    const documento = await this.prisma.averbacaoDocumento.findUnique({
      where: { processoId_tipoDocumentoId: { processoId, tipoDocumentoId } },
      select: {
        id: true,
        status: true,
        arquivoKey: true,
        processo: {
          select: {
            id: true,
            clienteId: true,
            despachanteId: true,
            status: true,
          },
        },
      },
    });

    if (!documento) {
      throw new NotFoundException(
        'Documento não previsto neste processo',
      );
    }
    if (documento.processo.despachanteId !== despachanteId) {
      throw new ForbiddenException('Sem acesso a este processo');
    }
    if (
      documento.processo.status ===
      AverbacaoProcessoStatus.LIBERADO_AGENDAMENTO
    ) {
      throw new ConflictException(
        'Processo já liberado para agendamento — não aceita novos documentos.',
      );
    }
    if (documento.processo.status === AverbacaoProcessoStatus.CANCELADO) {
      throw new ConflictException(
        'Processo cancelado — não aceita novos documentos.',
      );
    }
    // Reenviar por cima de um documento já validado o devolveria para análise
    // e derrubaria a liberação sem que ninguém pedisse.
    if (documento.status === AverbacaoDocumentoStatus.VALIDADO) {
      throw new ConflictException(
        'Documento já validado. Peça a reabertura à equipe da Aurora antes de substituir.',
      );
    }

    const substituicao = Boolean(documento.arquivoKey);
    const key = validarPdfEGerarKey(file, `averbacoes/${processoId}`);
    await this.minio.uploadFile(file!, key);

    const nome = nomeExibicao(file!.originalname);

    const atualizado = await this.prisma.$transaction(async (tx) => {
      const doc = await tx.averbacaoDocumento.update({
        where: { id: documento.id },
        data: {
          status: AverbacaoDocumentoStatus.EM_ANALISE,
          arquivoKey: key,
          arquivoNome: nome,
          arquivoTamanho: file!.size,
          arquivoMime: 'application/pdf',
          motivoRejeicao: null,
        },
        select: SELECT_DOCUMENTO,
      });

      await tx.averbacaoHistorico.create({
        data: {
          documentoId: documento.id,
          acao: substituicao
            ? AverbacaoHistoricoAcao.SUBSTITUICAO
            : AverbacaoHistoricoAcao.ENVIO,
          autorNome: user.name,
          autorUserId: user.id,
          arquivoKey: key,
          arquivoNome: nome,
        },
      });

      const statusProcesso = await this.recalcularProcesso(tx, processoId);

      // Na mesma transação, para o Portal Aurora atualizar a fila de validação
      // em tempo real. O outbox garante que o evento só é publicado se o commit
      // do documento passar — e sobrevive a um broker fora do ar.
      await this.outbox.createAverbacaoProcessoAtualizado(tx, {
        id: processoId,
        clienteId: documento.processo.clienteId,
        despachanteId: documento.processo.despachanteId,
        status: statusProcesso,
      });

      return doc;
    });

    // O arquivo anterior fica no bucket: o histórico aponta para ele e apagar
    // destruiria a versão que foi analisada.
    return atualizado;
  }

  async abrirArquivo(documentoId: string, user?: User) {
    const documento = await this.prisma.averbacaoDocumento.findUnique({
      where: { id: documentoId },
      select: {
        arquivoKey: true,
        arquivoNome: true,
        processo: {
          select: { despachanteId: true, clienteId: true },
        },
      },
    });

    if (!documento?.arquivoKey) {
      throw new NotFoundException('Documento sem arquivo anexado');
    }

    if (user && (user.despachanteId || user.clienteId)) {
      const meu =
        (user.despachanteId &&
          user.despachanteId === documento.processo.despachanteId) ||
        (user.clienteId && user.clienteId === documento.processo.clienteId);
      if (!meu) throw new ForbiddenException('Sem acesso a este documento');
    }

    return {
      stream: await this.minio.getFileStream(documento.arquivoKey),
      nome: documento.arquivoNome ?? 'documento.pdf',
    };
  }

  /**
   * PDF de uma entrada do histórico — a versão que valia naquele momento.
   *
   * É o que permite ao Arquivo de Processos do Aurora entregar também as
   * versões substituídas ou rejeitadas, e não só a atual: numa auditoria, a
   * versão que motivou uma recusa é justamente a que se pede. Só o Aurora
   * (service key) chama; o despachante continua vendo a versão atual.
   */
  async abrirArquivoDoHistorico(historicoId: string) {
    const entrada = await this.prisma.averbacaoHistorico.findUnique({
      where: { id: historicoId },
      select: { arquivoKey: true, arquivoNome: true },
    });

    if (!entrada?.arquivoKey) {
      throw new NotFoundException('Esta entrada do histórico não tem arquivo');
    }

    return {
      stream: await this.minio.getFileStream(entrada.arquivoKey),
      nome: entrada.arquivoNome ?? 'documento.pdf',
    };
  }

  // ── Consumido pelo Portal Aurora ───────────────────────────────────

  async listarParaValidacao(status?: AverbacaoProcessoStatus) {
    return this.prisma.averbacaoProcesso.findMany({
      where: status ? { status } : {},
      select: {
        ...SELECT_PROCESSO,
        despachante: { select: { id: true, nome: true, codDespachante: true } },
        documentos: {
          select: {
            status: true,
            tipoDocumento: { select: { obrigatorio: true } },
          },
        },
      },
      orderBy: { updatedAt: 'asc' },
    });
  }

  async aprovarDocumento(documentoId: string, analisadoPor?: string) {
    return this.decidirDocumento(
      documentoId,
      AverbacaoDocumentoStatus.VALIDADO,
      AverbacaoHistoricoAcao.APROVACAO,
      analisadoPor,
    );
  }

  async rejeitarDocumento(
    documentoId: string,
    motivo: string,
    analisadoPor?: string,
  ) {
    return this.decidirDocumento(
      documentoId,
      AverbacaoDocumentoStatus.REJEITADO,
      AverbacaoHistoricoAcao.REJEICAO,
      analisadoPor,
      motivo.trim(),
    );
  }

  private async decidirDocumento(
    documentoId: string,
    novoStatus: AverbacaoDocumentoStatus,
    acao: AverbacaoHistoricoAcao,
    analisadoPor?: string,
    motivo?: string,
  ) {
    const documento = await this.prisma.averbacaoDocumento.findUnique({
      where: { id: documentoId },
      select: {
        id: true,
        status: true,
        processoId: true,
        processo: {
          select: { clienteId: true, despachanteId: true, status: true },
        },
      },
    });
    if (!documento) throw new NotFoundException('Documento não encontrado');

    // Processo descartado pelo despachante não tem mais o que validar: o
    // documento pode ter ficado EM_ANALISE, mas decidir sobre ele só geraria
    // e-mail e trilha de um processo que não existe mais.
    if (documento.processo.status === AverbacaoProcessoStatus.CANCELADO) {
      throw new ConflictException(
        'O processo foi cancelado pelo despachante; os documentos não podem mais ser decididos.',
      );
    }

    // Só o que está aguardando análise pode ser decidido — mesma razão da
    // procuração: dois analistas na mesma fila não podem decidir duas vezes.
    if (documento.status !== AverbacaoDocumentoStatus.EM_ANALISE) {
      throw new ConflictException(
        `Documento está ${documento.status} e não está aguardando análise`,
      );
    }

    const atualizado = await this.prisma.$transaction(async (tx) => {
      const doc = await tx.averbacaoDocumento.update({
        where: { id: documentoId },
        data: {
          status: novoStatus,
          motivoRejeicao: motivo ?? null,
        },
        select: SELECT_DOCUMENTO,
      });

      await tx.averbacaoHistorico.create({
        data: {
          documentoId,
          acao,
          autorNome: analisadoPor ?? 'Equipe Aurora',
          motivo: motivo ?? null,
        },
      });

      const statusProcesso = await this.recalcularProcesso(tx, documento.processoId);

      // Na mesma transação, o Portal Aurora atualiza a fila de validação e o
      // espelho documental em tempo real. Antes só `enviarDocumento` emitia este
      // evento; agora a decisão do analista também emite, para que a migração
      // das decisões para comando (fire-and-forget) reconcilie a tela do Aurora
      // — que deixou de depender da resposta HTTP síncrona.
      await this.outbox.createAverbacaoProcessoAtualizado(tx, {
        id: documento.processoId,
        clienteId: documento.processo.clienteId,
        despachanteId: documento.processo.despachanteId,
        status: statusProcesso,
      });

      return { doc, statusProcesso };
    });

    // Depois do commit: a tela do despachante (e a do cliente) mostra a
    // aprovação/recusa sem F5. Antes só a liberação avisava, e o documento
    // recusado só aparecia recarregando a página.
    this.eventos.emitir({
      despachanteId: documento.processo.despachanteId,
      clienteId: documento.processo.clienteId,
      processoId: documento.processoId,
      status: atualizado.statusProcesso,
      documentoStatus: novoStatus,
    });

    // Fora da transação e sem await, pela mesma razão da procuração: a decisão
    // já está gravada e o email não pode segurar o commit nem derrubá-lo.
    void this.notificarDocumento(
      documentoId,
      novoStatus === AverbacaoDocumentoStatus.VALIDADO,
      motivo,
      analisadoPor,
    );

    return atualizado.doc;
  }

  /**
   * Avisa o despachante do processo e quem abriu a averbação.
   *
   * Engole os próprios erros: é disparada por `void`, então uma exceção aqui
   * viraria unhandled rejection.
   */
  private async notificarDocumento(
    documentoId: string,
    aprovado: boolean,
    motivo?: string,
    analisadoPor?: string,
  ) {
    try {
      const documento = await this.prisma.averbacaoDocumento.findUnique({
        where: { id: documentoId },
        select: {
          tipoDocumento: { select: { descricao: true } },
          processo: {
            select: {
              protocolo: true,
              cliente: { select: { nome: true } },
              despachante: { select: { email: true } },
              criadoPor: { select: { email: true } },
            },
          },
        },
      });
      if (!documento) return;

      const corpo = documentoDecidido({
        protocolo: documento.processo.protocolo,
        tipoDescricao: documento.tipoDocumento.descricao,
        clienteNome: documento.processo.cliente.nome,
        aprovado,
        motivo,
        analisadoPor,
      });

      await this.mail.enviar({
        para: [
          documento.processo.criadoPor?.email,
          documento.processo.despachante.email,
        ],
        ...corpo,
      });
    } catch (erro) {
      this.logger.error(
        `Falha ao notificar decisão do documento ${documentoId} — ${(erro as Error).message}`,
      );
    }
  }

  /**
   * Avisa da liberação. Aqui o email do cliente entra junto: a liberação é a
   * informação que o importador espera para agendar, diferente das decisões
   * documento a documento, que são trabalho do despachante.
   */
  private async notificarLiberacao(processoId: string, liberadoPor?: string) {
    try {
      const processo = await this.prisma.averbacaoProcesso.findUnique({
        where: { id: processoId },
        select: {
          protocolo: true,
          nLote: true,
          diDuimp: true,
          cliente: { select: { nome: true, email: true } },
          despachante: { select: { nome: true, email: true } },
          criadoPor: { select: { email: true } },
        },
      });
      if (!processo) return;

      const corpo = processoLiberado({
        protocolo: processo.protocolo,
        clienteNome: processo.cliente.nome,
        despachanteNome: processo.despachante.nome,
        // Nunca nulo neste ponto: `liberar` recusa processo sem lote.
        nLote: processo.nLote ?? '',
        diDuimp: processo.diDuimp,
        liberadoPor,
      });

      await this.mail.enviar({
        para: [
          processo.criadoPor?.email,
          processo.despachante.email,
          processo.cliente.email,
        ],
        ...corpo,
      });
    } catch (erro) {
      this.logger.error(
        `Falha ao notificar liberação do processo ${processoId} — ${(erro as Error).message}`,
      );
    }
  }

  /**
   * Deriva o status do processo dos documentos. Nunca é informado de fora.
   *
   * LIBERADO_AGENDAMENTO fica de fora daqui de propósito: liberar é ato do time
   * Aurora, não consequência automática de o último documento ser aprovado.
   */
  private async recalcularProcesso(
    tx: Prisma.TransactionClient,
    processoId: string,
  ): Promise<AverbacaoProcessoStatus> {
    const documentos = await tx.averbacaoDocumento.findMany({
      where: { processoId },
      select: { status: true },
    });

    const algumRejeitado = documentos.some(
      (d) => d.status === AverbacaoDocumentoStatus.REJEITADO,
    );
    const algumEnviado = documentos.some(
      (d) => d.status !== AverbacaoDocumentoStatus.NAO_ENVIADO,
    );

    const processo = await tx.averbacaoProcesso.findUnique({
      where: { id: processoId },
      select: { status: true, devolvidoEm: true },
    });
    // Os dois estados terminais não são derivados dos documentos: recalcular
    // aqui devolveria um processo cancelado para EM_ANALISE no próximo upload.
    if (
      processo?.status === AverbacaoProcessoStatus.LIBERADO_AGENDAMENTO ||
      processo?.status === AverbacaoProcessoStatus.CANCELADO
    ) {
      return processo.status;
    }

    // Devolução pendente segura PENDENTE_CORRECAO: sem isto, o próximo upload
    // (ou decisão de documento) jogaria o processo de volta para EM_ANALISE
    // antes de o despachante corrigir o que a Aurora pediu.
    const novo = algumRejeitado || processo?.devolvidoEm
      ? AverbacaoProcessoStatus.PENDENTE_CORRECAO
      : algumEnviado
        ? AverbacaoProcessoStatus.EM_ANALISE
        : AverbacaoProcessoStatus.RASCUNHO;

    await tx.averbacaoProcesso.update({
      where: { id: processoId },
      data: { status: novo },
    });

    return novo;
  }

  /**
   * Gate de agendamento, recalculado aqui e nunca confiado ao cliente:
   * todo documento obrigatório precisa estar VALIDADO.
   */
  /**
   * Amarra o processo documental ao registro do SIAUM.
   *
   * Existe separado de `liberar` porque lá o vínculo só podia ser gravado uma
   * única vez: `liberar` recusa reexecução, então um processo liberado sem lote
   * ficava permanentemente sem referência ao SIAUM, sem caminho de correção.
   * Aqui o vínculo é um ato próprio, repetível enquanto o processo não foi
   * liberado, e auditável.
   *
   * Quem decide qual lote é o certo é o analista no Portal Aurora — este
   * método não busca nem adivinha nada, só registra a decisão.
   */
  async vincularLote(processoId: string, nLote: string, vinculadoPor?: string) {
    const processo = await this.prisma.averbacaoProcesso.findUnique({
      where: { id: processoId },
      select: { id: true, status: true, nLote: true, protocolo: true },
    });
    if (!processo) throw new NotFoundException('Processo não encontrado');

    // Depois de liberado, TROCAR o lote deixaria a DI já empurrada para o
    // agendamento apontando para outra operação. Mas PREENCHER um lote vazio é
    // conserto, não troca: é a única saída para um processo liberado sem
    // vínculo, que de outro modo ficaria órfão para sempre — sem caminho nem
    // pela interface nem pela API.
    if (
      processo.status === AverbacaoProcessoStatus.LIBERADO_AGENDAMENTO &&
      processo.nLote
    ) {
      throw new ConflictException(
        `Processo já liberado e vinculado ao lote ${processo.nLote} — o vínculo não pode mais mudar.`,
      );
    }

    if (processo.status === AverbacaoProcessoStatus.CANCELADO) {
      throw new ConflictException(
        `O processo ${processo.protocolo} foi cancelado pelo despachante e não pode ser vinculado.`,
      );
    }

    const lote = nLote.trim().toUpperCase();
    if (!lote) throw new BadRequestException('Informe o lote do SIAUM');

    this.logger.log(
      `Processo ${processo.protocolo} vinculado ao lote ${lote}` +
        (processo.nLote ? ` (antes: ${processo.nLote})` : '') +
        ` por ${vinculadoPor ?? 'Equipe Aurora'}`,
    );

    return this.prisma.averbacaoProcesso.update({
      where: { id: processoId },
      data: { nLote: lote },
      select: SELECT_PROCESSO,
    });
  }

  /** Desfaz o vínculo. Permitido só enquanto o processo não foi liberado. */
  async desvincularLote(
    processoId: string,
    motivo: string,
    vinculadoPor?: string,
  ) {
    const processo = await this.prisma.averbacaoProcesso.findUnique({
      where: { id: processoId },
      select: { id: true, status: true, nLote: true, protocolo: true },
    });
    if (!processo) throw new NotFoundException('Processo não encontrado');

    if (processo.status === AverbacaoProcessoStatus.LIBERADO_AGENDAMENTO) {
      throw new ConflictException(
        'Processo já liberado para agendamento — desfaça a liberação antes.',
      );
    }

    if (!processo.nLote) {
      throw new ConflictException('Processo não tem vínculo para desfazer');
    }

    this.logger.log(
      `Vínculo do processo ${processo.protocolo} com o lote ${processo.nLote} ` +
        `desfeito por ${vinculadoPor ?? 'Equipe Aurora'}: ${motivo.trim()}`,
    );

    return this.prisma.averbacaoProcesso.update({
      where: { id: processoId },
      data: { nLote: null },
      select: SELECT_PROCESSO,
    });
  }

  /**
   * Processos ainda sem lote — é a fila de vinculação do Portal Aurora.
   *
   * Devolve o que o Aurora precisa para procurar o registro no SIAUM
   * (`diDuimp`, `containerConhecimento`) e para conferir se o candidato bate
   * (CNPJ do cliente, código do despachante).
   */
  async listarSemVinculo() {
    const processos = await this.prisma.averbacaoProcesso.findMany({
      // Inclui processo liberado sem lote: agora ele PODE ser vinculado (o
      // preenchimento é conserto, não troca), e deixá-lo fora da fila seria
      // escondê-lo justamente de quem precisa consertá-lo.
      //
      // Cancelado, por outro lado, sai: o despachante já disse que o processo
      // não deve existir, e mantê-lo na fila daria trabalho ao analista para
      // vincular algo que ninguém vai liberar — que é o problema que o
      // cancelamento veio resolver.
      //
      // Devolvido ao despachante também sai até ele corrigir: vincular com o
      // dado que a própria Aurora acabou de apontar como errado não faz sentido.
      where: {
        nLote: null,
        status: { not: AverbacaoProcessoStatus.CANCELADO },
        devolvidoEm: null,
      },
      select: {
        ...SELECT_PROCESSO,
        despachante: {
          select: { id: true, nome: true, codDespachante: true },
        },
        documentos: {
          select: {
            status: true,
            tipoDocumento: { select: { obrigatorio: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return processos.map(({ documentos, ...processo }) => {
      const obrigatorios = documentos.filter((d) => d.tipoDocumento.obrigatorio);
      return {
        ...processo,
        obrigatoriosTotal: obrigatorios.length,
        obrigatoriosValidados: obrigatorios.filter(
          (d) => d.status === AverbacaoDocumentoStatus.VALIDADO,
        ).length,
      };
    });
  }

  async liberar(processoId: string, analisadoPor?: string, nLote?: string) {
    const processo = await this.prisma.averbacaoProcesso.findUnique({
      where: { id: processoId },
      select: {
        id: true,
        status: true,
        nLote: true,
        protocolo: true,
        despachanteId: true,
        clienteId: true,
        documentos: {
          select: {
            status: true,
            tipoDocumento: { select: { obrigatorio: true, descricao: true } },
          },
        },
      },
    });
    if (!processo) throw new NotFoundException('Processo não encontrado');

    if (processo.status === AverbacaoProcessoStatus.LIBERADO_AGENDAMENTO) {
      throw new ConflictException('Processo já está liberado para agendamento');
    }

    if (processo.status === AverbacaoProcessoStatus.CANCELADO) {
      throw new ConflictException(
        `O processo ${processo.protocolo} foi cancelado pelo despachante e não pode ser liberado.`,
      );
    }

    // Liberar sem lote produz um processo órfão: a operação fica liberada sem
    // que ninguém saiba a que registro do SIAUM ela pertence, e o gate de
    // agendamento não tem como cruzar os dois lados. O lote pode vir no corpo
    // (compatibilidade) ou já estar gravado pelo vínculo — mas um dos dois tem
    // de existir.
    const lote = nLote?.trim().toUpperCase() || processo.nLote;
    if (!lote) {
      throw new ConflictException(
        `O processo ${processo.protocolo} não está vinculado a um lote do SIAUM. ` +
          'Faça o vínculo em Averbação Aduaneira › Validação › Aguardando vínculo antes de liberar.',
      );
    }

    const pendentes = processo.documentos
      .filter(
        (d) =>
          d.tipoDocumento.obrigatorio &&
          d.status !== AverbacaoDocumentoStatus.VALIDADO,
      )
      .map((d) => d.tipoDocumento.descricao);

    if (pendentes.length) {
      throw new ConflictException(
        `Há ${pendentes.length} documento(s) obrigatório(s) sem validação: ${pendentes.join(', ')}`,
      );
    }

    this.logger.log(
      `Processo ${processoId} liberado para agendamento por ${analisadoPor ?? 'Equipe Aurora'}`,
    );

    const liberado = await this.prisma.averbacaoProcesso.update({
      where: { id: processoId },
      data: {
        status: AverbacaoProcessoStatus.LIBERADO_AGENDAMENTO,
        // `lote` já resolveu a origem: o corpo da requisição (compatibilidade)
        // ou o vínculo feito antes. Nunca é nulo aqui — a checagem acima
        // recusaria.
        nLote: lote,
      },
      select: SELECT_PROCESSO,
    });

    void this.notificarLiberacao(processoId, analisadoPor);

    // Depois do commit: a tela do despachante (e a do cliente) relê a lista
    // sem F5. Avisar antes faria o navegador recarregar o estado antigo.
    this.eventos.emitir({
      despachanteId: processo.despachanteId,
      clienteId: processo.clienteId,
      processoId,
      status: liberado.status,
    });

    return liberado;
  }
}
