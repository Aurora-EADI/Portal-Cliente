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
import { nomeExibicao, validarPdfEGerarKey } from '../common/arquivo';
import { procuracaoVigente } from '../procuracoes/procuracoes.service';
import { CriarAverbacaoDto } from './dto/criar-averbacao.dto';

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
  localOrigem: true,
  recintoDestino: true,
  cargaEspecial: true,
  status: true,
  nLote: true,
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
      const protocolo = await this.gerarProtocolo(tx);

      return tx.averbacaoProcesso.create({
        data: {
          protocolo,
          clienteId: dto.clienteId,
          despachanteId,
          modalidade: dto.modalidade,
          diDuimp: dto.diDuimp,
          containerConhecimento: dto.containerConhecimento,
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
        processo: { select: { id: true, despachanteId: true, status: true } },
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

      await this.recalcularProcesso(tx, processoId);
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
      select: { id: true, status: true, processoId: true },
    });
    if (!documento) throw new NotFoundException('Documento não encontrado');

    // Só o que está aguardando análise pode ser decidido — mesma razão da
    // procuração: dois analistas na mesma fila não podem decidir duas vezes.
    if (documento.status !== AverbacaoDocumentoStatus.EM_ANALISE) {
      throw new ConflictException(
        `Documento está ${documento.status} e não está aguardando análise`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const atualizado = await tx.averbacaoDocumento.update({
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

      await this.recalcularProcesso(tx, documento.processoId);
      return atualizado;
    });
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
  ) {
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
      select: { status: true },
    });
    if (processo?.status === AverbacaoProcessoStatus.LIBERADO_AGENDAMENTO) {
      return;
    }

    const novo = algumRejeitado
      ? AverbacaoProcessoStatus.PENDENTE_CORRECAO
      : algumEnviado
        ? AverbacaoProcessoStatus.EM_ANALISE
        : AverbacaoProcessoStatus.RASCUNHO;

    await tx.averbacaoProcesso.update({
      where: { id: processoId },
      data: { status: novo },
    });
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

    // Liberado é terminal: mexer no lote depois disso deixaria a DI já
    // empurrada para o agendamento apontando para outra operação.
    if (processo.status === AverbacaoProcessoStatus.LIBERADO_AGENDAMENTO) {
      throw new ConflictException(
        'Processo já liberado para agendamento — o vínculo não pode mais mudar.',
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
      where: {
        nLote: null,
        // Liberado sem lote é o passivo do modelo antigo: não há como vincular
        // depois, e listar aqui só encheria a fila com o que não tem ação.
        status: { not: AverbacaoProcessoStatus.LIBERADO_AGENDAMENTO },
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

    return this.prisma.averbacaoProcesso.update({
      where: { id: processoId },
      data: {
        status: AverbacaoProcessoStatus.LIBERADO_AGENDAMENTO,
        // Compatibilidade com o Aurora atual, que ainda manda o lote aqui. O
        // caminho novo é vincular antes; quando o Aurora migrar, este
        // parâmetro sai e liberar passa a exigir vínculo prévio.
        nLote: nLote?.trim().toUpperCase() || undefined,
      },
      select: SELECT_PROCESSO,
    });
  }
}
