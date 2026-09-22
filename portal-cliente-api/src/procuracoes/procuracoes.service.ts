import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  ProcuracaoHistoricoAcao,
  ProcuracaoStatus,
  User,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MinioService } from '../minio/minio.service';
import { MailService } from '../mail/mail.service';
import { procuracaoDecidida } from '../mail/templates';
import { nomeExibicao, validarPdfEGerarKey } from '../common/arquivo';
import { RepresentacaoReplicadaDto } from './dto/replicar-representacoes.dto';
import { ProcuracoesEventos } from './procuracoes.eventos';

/** Campos seguros para devolver ao usuário externo — sem a key do MinIO. */
const SELECT_PUBLICO = {
  id: true,
  status: true,
  validade: true,
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

/**
 * Trilha da procuração, do envio mais recente para o mais antigo.
 *
 * `arquivoKey` fica de fora como em SELECT_PUBLICO: o PDF de cada entrada sai
 * por streaming autenticado, nunca por referência direta ao bucket.
 */
const SELECT_HISTORICO = {
  select: {
    id: true,
    acao: true,
    autorNome: true,
    motivo: true,
    arquivoNome: true,
    arquivoTamanho: true,
    validade: true,
    criadoEm: true,
  },
  orderBy: { criadoEm: 'desc' },
} as const;

/**
 * Hoje à meia-noite: a procuração vale o dia inteiro do vencimento.
 *
 * Meia-noite em UTC, com o dia do calendário local. `validade` é coluna `date`
 * e o Prisma a entrega como meia-noite UTC; comparar com a meia-noite local
 * (Manaus, UTC−4) dava a procuração por vencida no próprio dia do vencimento.
 */
function inicioDeHoje(): Date {
  const d = new Date();
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

/**
 * Vigente = aprovada e dentro do prazo.
 *
 * Mora aqui, e não espalhada pelas consultas, porque a mesma pergunta é feita
 * em quatro lugares: listar clientes autorizados, abrir averbação, montar a
 * lista de DIs e barrar o agendamento. Divergir num deles produziria tela que
 * promete o que a API recusa.
 */
export function procuracaoVigente(p: {
  status: ProcuracaoStatus;
  validade: Date | null;
}): boolean {
  if (p.status !== ProcuracaoStatus.APROVADA) return false;
  if (!p.validade) return true;
  return p.validade >= inicioDeHoje();
}

@Injectable()
export class ProcuracoesService {
  private readonly logger = new Logger(ProcuracoesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly minio: MinioService,
    private readonly mail: MailService,
    private readonly eventos: ProcuracoesEventos,
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
        // Vencida não autoriza — a data no banco é o filtro, não a tela.
        OR: [{ validade: null }, { validade: { gte: inicioDeHoje() } }],
      },
      select: { cliente: { select: { id: true, nome: true, cnpj: true } } },
      orderBy: { cliente: { nome: 'asc' } },
    });

    return procuracoes.map((p) => p.cliente);
  }

  /**
   * Todos os clientes que o despachante representa, com a situação da
   * procuração de cada um — inclusive quem ainda não tem nenhuma.
   *
   * É a lista que a tela mostra. Listar só as procurações existentes escondia
   * exatamente o cliente sobre o qual o despachante precisa agir.
   */
  async listarRepresentados(user: User) {
    const despachanteId = this.despachanteDo(user);

    const [clientes, procuracoes, processos] = await Promise.all([
      this.clientesDoDespachante(despachanteId),
      this.prisma.procuracao.findMany({
        where: { despachanteId },
        select: SELECT_PUBLICO,
      }),
      this.prisma.averbacaoProcesso.groupBy({
        by: ['clienteId'],
        where: { despachanteId },
        _count: { _all: true },
      }),
    ]);

    const porCliente = new Map(procuracoes.map((p) => [p.cliente.id, p]));
    const contagem = new Map(
      processos.map((p) => [p.clienteId, p._count._all]),
    );

    // Une os dois lados: cliente com procuração e cliente ainda sem.
    const universo = new Map(clientes.map((c) => [c.id, c]));
    for (const p of procuracoes) universo.set(p.cliente.id, p.cliente);

    return Array.from(universo.values())
      .map((cliente) => {
        const procuracao = porCliente.get(cliente.id) ?? null;
        return {
          cliente,
          procuracao,
          vigente: procuracao ? procuracaoVigente(procuracao) : false,
          processos: contagem.get(cliente.id) ?? 0,
        };
      })
      .sort((a, b) => a.cliente.nome.localeCompare(b.cliente.nome, 'pt-BR'));
  }

  /**
   * Recebe do Portal Aurora uma remessa da carteira despachante ↔ cliente.
   *
   * A carteira é espelho do estoque do SIAUM: esta chamada cria o que falta e
   * marca `sincronizadoEm` em todo par recebido; `concluirReplicacao` remove
   * depois o que nenhuma remessa marcou. Cliente com procuração continua na
   * tela do despachante pela própria procuração.
   *
   * Sem transação de propósito: cada escrita é idempotente e a carteira inteira
   * é reenviada a cada execução. Uma transação longa estouraria o timeout
   * interativo do Prisma sem proteger nada que a próxima execução não conserte.
   */
  async replicarRepresentacoes(itens: RepresentacaoReplicadaDto[]) {
    // A hora é daqui, não do Aurora nem do banco: é contra ela que a limpeza
    // compara, e o `default now()` do Postgres usaria outro relógio.
    const agora = new Date();

    if (!itens.length) {
      return {
        recebidos: 0,
        clientesNovos: 0,
        vinculosNovos: 0,
        sincronizadoEm: agora.toISOString(),
      };
    }

    const nomeDespachante = new Map(
      itens.map((i) => [i.codDespachante, i.nomeDespachante]),
    );
    const nomeCliente = new Map(itens.map((i) => [i.documento, i.nomeCliente]));
    const codigos = [...nomeDespachante.keys()];
    const documentos = [...nomeCliente.keys()];

    // Despachante e cliente podem ainda não existir aqui: nascem da DI, antes
    // de qualquer convite. Nome existente não é sobrescrito — o cadastro pode
    // ter sido ajustado no registro do usuário.
    await this.prisma.despachante.createMany({
      data: codigos.map((cod) => ({
        codDespachante: cod,
        nome: nomeDespachante.get(cod)!,
      })),
      skipDuplicates: true,
    });
    const { count: clientesNovos } = await this.prisma.cliente.createMany({
      data: documentos.map((doc) => ({ cnpj: doc, nome: nomeCliente.get(doc)! })),
      skipDuplicates: true,
    });

    const [despachantes, clientes] = await Promise.all([
      this.prisma.despachante.findMany({
        where: { codDespachante: { in: codigos } },
        select: { id: true, codDespachante: true },
      }),
      this.prisma.cliente.findMany({
        where: { cnpj: { in: documentos } },
        select: { id: true, cnpj: true },
      }),
    ]);
    const idDespachante = new Map(
      despachantes.map((d) => [d.codDespachante, d.id]),
    );
    const idCliente = new Map(clientes.map((c) => [c.cnpj, c.id]));

    const pares = itens.map((i) => ({
      despachanteId: idDespachante.get(i.codDespachante)!,
      clienteId: idCliente.get(i.documento)!,
      ultimaDiEm: i.ultimaDiEm ? new Date(i.ultimaDiEm) : null,
      sincronizadoEm: agora,
    }));

    const { count: vinculosNovos } =
      await this.prisma.despachanteCliente.createMany({
        data: pares,
        skipDuplicates: true,
      });

    // Vínculo que já existia é marcado como visto nesta execução — sem isso a
    // limpeza o trataria como fora do estoque.
    for (const par of pares) {
      await this.prisma.despachanteCliente.updateMany({
        where: { despachanteId: par.despachanteId, clienteId: par.clienteId },
        data: { ultimaDiEm: par.ultimaDiEm, sincronizadoEm: agora },
      });
    }

    this.logger.log(
      `Carteira replicada: ${itens.length} par(es), ${clientesNovos} cliente(s) e ${vinculosNovos} vínculo(s) novo(s)`,
    );

    return {
      recebidos: itens.length,
      clientesNovos,
      vinculosNovos,
      sincronizadoEm: agora.toISOString(),
    };
  }

  /**
   * Fecha uma execução do Aurora: remove os vínculos que nenhuma remessa marcou
   * desde `desde` — clientes cujo lote saiu do estoque do despachante.
   *
   * O cliente em si fica: pode ter procuração, processo ou voltar na próxima
   * carga. O Aurora só chama isto quando todas as remessas passaram.
   */
  async concluirReplicacao(desde: Date) {
    const { count: removidos } =
      await this.prisma.despachanteCliente.deleteMany({
        where: { sincronizadoEm: { lt: desde } },
      });

    this.logger.log(
      `Carteira concluída: ${removidos} vínculo(s) fora do estoque removido(s)`,
    );

    return { removidos };
  }

  /**
   * Clientes que este despachante representa, de duas fontes:
   *
   * - a carteira espelhada do estoque do SIAUM (despachante_clientes), que traz
   *   o cliente assim que a DI chega ao terminal — antes da averbação;
   * - as DIs averbadas, a fonte original, mantida enquanto a carteira é testada.
   */
  private async clientesDoDespachante(despachanteId: string) {
    const despachante = await this.prisma.despachante.findUnique({
      where: { id: despachanteId },
      select: { codDespachante: true },
    });
    if (!despachante) return [];

    const [lotes, carteira] = await Promise.all([
      this.prisma.diAverbada.findMany({
        where: {
          codDespachante: despachante.codDespachante,
          cnpjCliente: { not: null },
        },
        select: { cnpjCliente: true },
        distinct: ['cnpjCliente'],
      }),
      this.prisma.despachanteCliente.findMany({
        where: { despachanteId },
        select: { clienteId: true },
      }),
    ]);

    const cnpjs = lotes
      .map((l) => l.cnpjCliente)
      .filter((c): c is string => Boolean(c));
    const idsDaCarteira = carteira.map((v) => v.clienteId);
    if (!cnpjs.length && !idsDaCarteira.length) return [];

    return this.prisma.cliente.findMany({
      where: {
        ativo: true,
        OR: [{ cnpj: { in: cnpjs } }, { id: { in: idsDaCarteira } }],
      },
      select: { id: true, nome: true, cnpj: true },
    });
  }

  /**
   * Clientes para os quais o Despachante ainda pode pedir procuração.
   *
   * Derivados das DIs em que ele já aparece como despachante — não a lista de
   * clientes inteira. Devolver todos permitiria a qualquer despachante
   * enumerar a base de clientes da Aurora, que não é dele.
   *
   * Cliente sem carga no terminal não aparece aqui: entra quando a DI chega ao
   * SIAUM e o Aurora espelha a carteira (a cada 30 minutos).
   */
  async clientesDisponiveis(user: User) {
    const despachanteId = this.despachanteDo(user);
    const clientes = await this.clientesDoDespachante(despachanteId);
    if (!clientes.length) return [];

    const jaTem = await this.prisma.procuracao.findMany({
      where: { despachanteId, clienteId: { in: clientes.map((c) => c.id) } },
      select: { clienteId: true },
    });
    const comProcuracao = new Set(jaTem.map((p) => p.clienteId));

    return clientes
      .filter((c) => !comProcuracao.has(c.id))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
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
    validadeIso?: string,
  ) {
    const despachanteId = this.despachanteDo(user);

    // Data no passado seria uma procuração que já nasce vencida — recusa aqui
    // em vez de aceitar e bloquear depois sem explicação.
    let validade: Date | null = null;
    if (validadeIso) {
      validade = new Date(validadeIso);
      if (Number.isNaN(validade.getTime())) {
        throw new BadRequestException('Validade inválida');
      }
      if (validade < inicioDeHoje()) {
        throw new BadRequestException(
          'A validade informada já passou. Confira a data no documento.',
        );
      }
    }

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
      select: { id: true, status: true, validade: true, arquivoKey: true },
    });

    // Reenviar por cima de uma aprovada e vigente jogaria fora a autorização
    // e pararia as operações em nome desse cliente até uma nova análise.
    // Vencida não: o acesso já está bloqueado pelo prazo, e o novo envio é
    // justamente a saída — sem isto o despachante ficava preso.
    if (existente && procuracaoVigente(existente)) {
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
      validade,
      motivoRecusa: null,
      analisadoPor: null,
      analisadoEm: null,
      enviadoPorUserId: user.id,
      enviadoEm: new Date(),
    };

    // O envio e a entrada de histórico caem na mesma transação: um envio que
    // não aparecesse na trilha seria pior que um envio que falhou, porque
    // ninguém saberia procurar por ele.
    const procuracao = await this.prisma.$transaction(async (tx) => {
      const salva = await tx.procuracao.upsert({
        where: { despachanteId_clienteId: { despachanteId, clienteId } },
        create: { despachanteId, clienteId, ...dados },
        update: dados,
        select: SELECT_PUBLICO,
      });

      await tx.procuracaoHistorico.create({
        data: {
          procuracaoId: salva.id,
          acao: ProcuracaoHistoricoAcao.ENVIO,
          autorNome: user.name ?? user.email,
          autorUserId: user.id,
          arquivoKey: key,
          arquivoNome: dados.arquivoNome,
          arquivoTamanho: file!.size,
          validade,
        },
      });

      return salva;
    });

    // Outra aba ou outro login do mesmo escritório também vê o envio.
    this.eventos.emitir({
      despachanteId,
      procuracaoId: procuracao.id,
      clienteId,
      status: procuracao.status,
    });

    // O PDF anterior NÃO é apagado: ele é o anexo da entrada de histórico do
    // envio que o trouxe. Apagá-lo deixaria a trilha apontando para um arquivo
    // que não existe mais — que é o mesmo que não ter trilha.
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

  /**
   * Stream do PDF de uma entrada de histórico — a versão que estava valendo
   * naquele momento, não a atual. É o que dá sentido à trilha: reler o
   * documento que foi reprovado, e não o que veio depois dele.
   *
   * A checagem de dono é a mesma da procuração viva, feita pela procuração-pai.
   */
  async abrirArquivoDoHistorico(historicoId: string, user?: User) {
    const entrada = await this.prisma.procuracaoHistorico.findUnique({
      where: { id: historicoId },
      select: {
        arquivoKey: true,
        arquivoNome: true,
        procuracao: { select: { despachanteId: true, clienteId: true } },
      },
    });

    if (!entrada?.arquivoKey) {
      throw new NotFoundException('Esta entrada do histórico não tem arquivo');
    }

    if (user) {
      const ehDoDespachante =
        user.despachanteId &&
        user.despachanteId === entrada.procuracao.despachanteId;
      const ehDoCliente =
        user.clienteId && user.clienteId === entrada.procuracao.clienteId;
      if (!ehDoDespachante && !ehDoCliente) {
        throw new ForbiddenException('Sem acesso a esta procuração');
      }
    }

    return {
      stream: await this.minio.getFileStream(entrada.arquivoKey),
      nome: entrada.arquivoNome ?? 'procuracao.pdf',
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

  /**
   * A mesma visão de `listarRepresentados`, mas pedida pelo Portal Aurora para
   * um despachante escolhido — lá não há JWT de despachante para derivar o
   * escopo, e o analista precisa ver também os clientes ainda sem procuração:
   * é sobre eles que ele cobra o envio.
   */
  async listarRepresentadosPorCodigo(codDespachante: string) {
    const despachante = await this.prisma.despachante.findUnique({
      where: { codDespachante },
      select: { id: true, nome: true, codDespachante: true },
    });

    if (!despachante) {
      throw new NotFoundException(
        `Despachante ${codDespachante} não encontrado`,
      );
    }

    const [clientes, procuracoes, processos] = await Promise.all([
      this.clientesDoDespachante(despachante.id),
      this.prisma.procuracao.findMany({
        where: { despachanteId: despachante.id },
        select: { ...SELECT_PUBLICO, historico: SELECT_HISTORICO },
      }),
      this.prisma.averbacaoProcesso.groupBy({
        by: ['clienteId'],
        where: { despachanteId: despachante.id },
        _count: { _all: true },
      }),
    ]);

    const porCliente = new Map(procuracoes.map((p) => [p.cliente.id, p]));
    const contagem = new Map(processos.map((p) => [p.clienteId, p._count._all]));

    const universo = new Map(clientes.map((c) => [c.id, c]));
    for (const p of procuracoes) universo.set(p.cliente.id, p.cliente);

    const itens = Array.from(universo.values())
      .map((cliente) => {
        const procuracao = porCliente.get(cliente.id) ?? null;
        return {
          cliente,
          procuracao,
          vigente: procuracao ? procuracaoVigente(procuracao) : false,
          processos: contagem.get(cliente.id) ?? 0,
        };
      })
      .sort((a, b) => a.cliente.nome.localeCompare(b.cliente.nome, 'pt-BR'));

    return {
      despachante,
      itens,
      liberados: itens.filter((i) => i.vigente).length,
      aguardandoAnalise: itens.filter(
        (i) => i.procuracao?.status === ProcuracaoStatus.EM_ANALISE,
      ).length,
    };
  }

  /**
   * Quantas procurações de cada despachante estão aguardando análise.
   *
   * Alimenta o contador no botão da Gestão de Acesso — sem ele, o analista
   * teria de abrir um despachante de cada vez para descobrir onde há trabalho.
   */
  async pendenciasPorDespachante() {
    const grupos = await this.prisma.procuracao.groupBy({
      by: ['despachanteId'],
      where: { status: ProcuracaoStatus.EM_ANALISE },
      _count: { _all: true },
    });

    if (!grupos.length) return [];

    const despachantes = await this.prisma.despachante.findMany({
      where: { id: { in: grupos.map((g) => g.despachanteId) } },
      select: { id: true, codDespachante: true },
    });
    const codigoPorId = new Map(
      despachantes.map((d) => [d.id, d.codDespachante]),
    );

    return grupos
      .map((g) => ({
        codDespachante: codigoPorId.get(g.despachanteId) ?? null,
        emAnalise: g._count._all,
      }))
      .filter(
        (p): p is { codDespachante: string; emAnalise: number } =>
          p.codDespachante !== null,
      );
  }

  async aprovar(id: string, analisadoPor?: string) {
    await this.exigirEmAnalise(id);

    return this.decidir(
      id,
      ProcuracaoStatus.APROVADA,
      ProcuracaoHistoricoAcao.APROVACAO,
      null,
      analisadoPor,
    );
  }

  async reprovar(id: string, motivo: string, analisadoPor?: string) {
    await this.exigirEmAnalise(id);

    return this.decidir(
      id,
      ProcuracaoStatus.REPROVADA,
      ProcuracaoHistoricoAcao.REJEICAO,
      motivo.trim(),
      analisadoPor,
    );
  }

  /**
   * Aplica a decisão e registra a entrada de histórico na mesma transação.
   *
   * A entrada copia o arquivo vigente no momento: é ele que foi julgado, e
   * depois de uma substituição a procuração já apontaria para outro PDF.
   */
  private async decidir(
    id: string,
    status: ProcuracaoStatus,
    acao: ProcuracaoHistoricoAcao,
    motivo: string | null,
    analisadoPor?: string,
  ) {
    const { salva, despachanteId } = await this.prisma.$transaction(async (tx) => {
      const atual = await tx.procuracao.findUniqueOrThrow({
        where: { id },
        select: {
          arquivoKey: true,
          arquivoNome: true,
          arquivoTamanho: true,
          validade: true,
          despachanteId: true,
        },
      });

      const salva = await tx.procuracao.update({
        where: { id },
        data: {
          status,
          motivoRecusa: motivo,
          analisadoPor: analisadoPor ?? null,
          analisadoEm: new Date(),
        },
        select: SELECT_PUBLICO,
      });

      await tx.procuracaoHistorico.create({
        data: {
          procuracaoId: id,
          acao,
          autorNome: analisadoPor ?? 'Equipe Aurora',
          motivo,
          arquivoKey: atual.arquivoKey,
          arquivoNome: atual.arquivoNome,
          arquivoTamanho: atual.arquivoTamanho,
          validade: atual.validade,
        },
      });

      return { salva, despachanteId: atual.despachanteId };
    });

    // Depois do commit: avisar antes faria a tela recarregar o estado antigo.
    this.eventos.emitir({
      despachanteId,
      procuracaoId: id,
      clienteId: salva.cliente.id,
      status,
    });

    // Fora da transação e sem await: a decisão já está gravada e o email é
    // consequência dela, não parte dela. Segurar o commit esperando o Office
    // 365 só transformaria lentidão da Microsoft em lentidão do portal.
    void this.notificarDecisao(id, status, motivo, analisadoPor);

    return salva;
  }

  /**
   * Avisa quem depende da decisão: o login que enviou o PDF e a caixa do
   * escritório despachante.
   *
   * Engole os próprios erros — inclusive os da consulta ao banco. Uma falha ao
   * montar a notificação não pode escapar para o `void` que a dispara e virar
   * unhandled rejection derrubando o processo do Node.
   */
  private async notificarDecisao(
    id: string,
    status: ProcuracaoStatus,
    motivo: string | null,
    analisadoPor?: string,
  ) {
    try {
      const procuracao = await this.prisma.procuracao.findUnique({
        where: { id },
        select: {
          cliente: { select: { nome: true, cnpj: true } },
          despachante: { select: { nome: true, email: true } },
          enviadoPor: { select: { email: true } },
        },
      });
      if (!procuracao) return;

      const corpo = procuracaoDecidida({
        despachanteNome: procuracao.despachante.nome,
        clienteNome: procuracao.cliente.nome,
        clienteCnpj: procuracao.cliente.cnpj,
        status: status as 'APROVADA' | 'REPROVADA' | 'REVOGADA',
        motivo,
        analisadoPor,
      });

      await this.mail.enviar({
        para: [procuracao.enviadoPor?.email, procuracao.despachante.email],
        ...corpo,
      });
    } catch (erro) {
      this.logger.error(
        `Falha ao notificar decisão da procuração ${id} — ${(erro as Error).message}`,
      );
    }
  }

  /**
   * Cassa uma procuração que já estava valendo.
   *
   * Não é reprovar: reprovar recusa o documento na análise, revogar retira um
   * acesso concedido. Por isso status próprio — quem audita precisa saber se o
   * despachante nunca pôde operar ou se deixou de poder, e quando.
   *
   * O efeito é imediato e não precisa de código novo: `procuracaoVigente` só
   * aceita APROVADA, então o gate de averbação e de agendamento já barra.
   */
  async revogar(id: string, motivo: string, analisadoPor?: string) {
    const procuracao = await this.prisma.procuracao.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!procuracao) throw new NotFoundException('Procuração não encontrada');

    if (procuracao.status !== ProcuracaoStatus.APROVADA) {
      throw new ConflictException(
        `Só uma procuração aprovada pode ser revogada — esta está ${procuracao.status}`,
      );
    }

    return this.decidir(
      id,
      ProcuracaoStatus.REVOGADA,
      ProcuracaoHistoricoAcao.REVOGACAO,
      motivo.trim(),
      analisadoPor,
    );
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
