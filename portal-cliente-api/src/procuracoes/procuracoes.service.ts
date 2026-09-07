import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ProcuracaoStatus, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MinioService } from '../minio/minio.service';
import { nomeExibicao, validarPdfEGerarKey } from '../common/arquivo';

/** Campos seguros para devolver ao usuário externo — sem a key do MinIO. */
const SELECT_PUBLICO = {
  id: true,
  status: true,
  arquivoNome: true,
  arquivoTamanho: true,
  motivoRecusa: true,
  analisadoPor: true,
  analisadoEm: true,
  enviadoEm: true,
  createdAt: true,
  updatedAt: true,
  cliente: { select: { id: true, nome: true, cnpj: true } },
} as const;

@Injectable()
export class ProcuracoesService {
  private readonly logger = new Logger(ProcuracoesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly minio: MinioService,
  ) {}

  /**
   * O despachante do token, não o que vier no corpo. Sem isso, um despachante
   * anexaria procuração em nome de outro.
   */
  private despachanteDo(user: User): string {
    if (!user.despachanteId) {
      throw new ForbiddenException(
        'Usuário não está vinculado a um despachante',
      );
    }
    return user.despachanteId;
  }

  async listarDoDespachante(user: User) {
    return this.prisma.procuracao.findMany({
      where: { despachanteId: this.despachanteDo(user) },
      select: SELECT_PUBLICO,
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Clientes que o Despachante pode representar hoje — os de procuração
   * APROVADA. É o que alimenta o select de importador na Nova Averbação.
   */
  async clientesAutorizados(user: User) {
    const procuracoes = await this.prisma.procuracao.findMany({
      where: {
        despachanteId: this.despachanteDo(user),
        status: ProcuracaoStatus.APROVADA,
      },
      select: { cliente: { select: { id: true, nome: true, cnpj: true } } },
      orderBy: { cliente: { nome: 'asc' } },
    });

    return procuracoes.map((p) => p.cliente);
  }

  /**
   * Clientes para os quais o Despachante ainda pode pedir procuração.
   *
   * Derivados das DIs em que ele já aparece como despachante — não a lista de
   * clientes inteira. Devolver todos permitiria a qualquer despachante
   * enumerar a base de clientes da Aurora, que não é dele.
   *
   * Cliente sem DI ainda não aparece aqui; nesse caso o pedido depende de a
   * primeira DI chegar do SIAUM.
   */
  async clientesDisponiveis(user: User) {
    const despachanteId = this.despachanteDo(user);

    const despachante = await this.prisma.despachante.findUnique({
      where: { id: despachanteId },
      select: { codDespachante: true },
    });
    if (!despachante) return [];

    const lotes = await this.prisma.diAverbada.findMany({
      where: {
        codDespachante: despachante.codDespachante,
        cnpjCliente: { not: null },
      },
      select: { cnpjCliente: true },
      distinct: ['cnpjCliente'],
    });

    const cnpjs = lotes
      .map((l) => l.cnpjCliente)
      .filter((c): c is string => Boolean(c));
    if (!cnpjs.length) return [];

    return this.prisma.cliente.findMany({
      where: {
        cnpj: { in: cnpjs },
        ativo: true,
        // Quem já tem procuração aparece na lista principal, não aqui.
        procuracoes: { none: { despachanteId } },
      },
      select: { id: true, nome: true, cnpj: true },
      orderBy: { nome: 'asc' },
    });
  }

  /**
   * Anexa ou substitui o PDF.
   *
   * Um par (despachante, cliente) tem no máximo uma procuração — reenviar
   * depois de reprovada atualiza a mesma linha e volta para EM_ANALISE, que é
   * o ciclo descrito na regra de negócio.
   */
  async enviar(
    user: User,
    clienteId: string,
    file: Express.Multer.File | undefined,
  ) {
    const despachanteId = this.despachanteDo(user);

    const cliente = await this.prisma.cliente.findUnique({
      where: { id: clienteId },
      select: { id: true, ativo: true },
    });
    if (!cliente) throw new NotFoundException('Cliente não encontrado');
    if (!cliente.ativo) {
      throw new ConflictException('Cliente inativo');
    }

    const existente = await this.prisma.procuracao.findUnique({
      where: { despachanteId_clienteId: { despachanteId, clienteId } },
      select: { id: true, status: true, arquivoKey: true },
    });

    // Reenviar por cima de uma já aprovada jogaria fora a autorização vigente
    // e pararia as operações em nome desse cliente até uma nova análise.
    if (existente?.status === ProcuracaoStatus.APROVADA) {
      throw new ConflictException(
        'Já existe procuração aprovada para este cliente. Peça a revogação à equipe da Aurora antes de enviar outra.',
      );
    }

    const key = validarPdfEGerarKey(file, `procuracoes/${despachanteId}`);
    await this.minio.uploadFile(file!, key);

    const dados = {
      status: ProcuracaoStatus.EM_ANALISE,
      arquivoKey: key,
      arquivoNome: nomeExibicao(file!.originalname),
      arquivoTamanho: file!.size,
      arquivoMime: 'application/pdf',
      motivoRecusa: null,
      analisadoPor: null,
      analisadoEm: null,
      enviadoPorUserId: user.id,
      enviadoEm: new Date(),
    };

    const procuracao = await this.prisma.procuracao.upsert({
      where: { despachanteId_clienteId: { despachanteId, clienteId } },
      create: { despachanteId, clienteId, ...dados },
      update: dados,
      select: SELECT_PUBLICO,
    });

    // O arquivo antigo só sai depois que o novo está gravado e referenciado —
    // falhar aqui deixa um órfão no bucket, o que é melhor que perder o PDF.
    if (existente?.arquivoKey) {
      try {
        await this.minio.deleteFile(existente.arquivoKey);
      } catch (error: any) {
        this.logger.warn(
          `Arquivo antigo ${existente.arquivoKey} não removido: ${error.message}`,
        );
      }
    }

    return procuracao;
  }

  /** Stream do PDF para quem tem direito de ver. */
  async abrirArquivo(id: string, user?: User) {
    const procuracao = await this.prisma.procuracao.findUnique({
      where: { id },
      select: {
        arquivoKey: true,
        arquivoNome: true,
        despachanteId: true,
        clienteId: true,
      },
    });

    if (!procuracao?.arquivoKey) {
      throw new NotFoundException('Procuração sem arquivo anexado');
    }

    // user ausente = chamada server-to-server do Aurora, já autenticada pelo
    // ServiceKeyGuard. Com user, o dono tem de bater.
    if (user) {
      const ehDoDespachante =
        user.despachanteId && user.despachanteId === procuracao.despachanteId;
      const ehDoCliente =
        user.clienteId && user.clienteId === procuracao.clienteId;
      if (!ehDoDespachante && !ehDoCliente) {
        throw new ForbiddenException('Sem acesso a esta procuração');
      }
    }

    return {
      stream: await this.minio.getFileStream(procuracao.arquivoKey),
      nome: procuracao.arquivoNome ?? 'procuracao.pdf',
    };
  }

  // ── Consumido pelo Portal Aurora (ServiceKeyGuard) ──────────────────

  async listarParaAnalise(status?: ProcuracaoStatus) {
    return this.prisma.procuracao.findMany({
      where: status ? { status } : {},
      select: {
        ...SELECT_PUBLICO,
        despachante: {
          select: { id: true, nome: true, codDespachante: true, cnpj: true },
        },
      },
      orderBy: { enviadoEm: 'asc' },
    });
  }

  async aprovar(id: string, analisadoPor?: string) {
    await this.exigirEmAnalise(id);

    return this.prisma.procuracao.update({
      where: { id },
      data: {
        status: ProcuracaoStatus.APROVADA,
        motivoRecusa: null,
        analisadoPor: analisadoPor ?? null,
        analisadoEm: new Date(),
      },
      select: SELECT_PUBLICO,
    });
  }

  async reprovar(id: string, motivo: string, analisadoPor?: string) {
    await this.exigirEmAnalise(id);

    return this.prisma.procuracao.update({
      where: { id },
      data: {
        status: ProcuracaoStatus.REPROVADA,
        motivoRecusa: motivo.trim(),
        analisadoPor: analisadoPor ?? null,
        analisadoEm: new Date(),
      },
      select: SELECT_PUBLICO,
    });
  }

  /**
   * Só o que está EM_ANALISE pode ser decidido. Sem isso, dois analistas
   * abrindo a fila ao mesmo tempo decidiriam a mesma procuração duas vezes, e
   * a segunda decisão sobrescreveria a primeira sem ninguém perceber.
   */
  private async exigirEmAnalise(id: string) {
    const procuracao = await this.prisma.procuracao.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!procuracao) throw new NotFoundException('Procuração não encontrada');

    if (procuracao.status !== ProcuracaoStatus.EM_ANALISE) {
      throw new ConflictException(
        `Procuração está ${procuracao.status} e não está aguardando análise`,
      );
    }
  }
}
