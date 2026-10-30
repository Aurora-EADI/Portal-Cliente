'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  FileSignature,
  FileStack,
  Files,
  FolderOpen,
  Info,
  Loader2,
  Package,
  Plane,
  Ship,
  Truck,
} from 'lucide-react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/error-message';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FileUpload } from '@/components/ui/FileUpload';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useAuthContext } from '@/context/AuthContext';
import { UserRole } from '@/types';
import {
  useClientesAutorizados,
  useCriarAverbacao,
  useEnviarArquivoUnico,
  useEnviarDocumento,
  useTiposPorModalidade,
} from '@/hooks/useAverbacoes';
import {
  AverbacaoProcessoResumo,
  MODALIDADE_LABEL,
  Modalidade,
  TipoDocumentoResumo,
} from '@/types/averbacao';

// A spec pede ^\d{2}/\d{9}$, mas as DIs reais têm dígito verificador
// (22/2564365-1). O backend aceita as duas; a máscara aqui segue a real.
export const DI_REGEX = /^\d{2}\/(\d{7}-\d|\d{9})$/;

/** Só dígitos, formatando como XX/XXXXXXX-X enquanto digita. */
export function mascararDi(valor: string): string {
  const d = valor.replace(/\D/g, '').slice(0, 10);
  if (d.length <= 2) return d;
  if (d.length <= 9) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 9)}-${d.slice(9)}`;
}

const MODALIDADES: {
  valor: Modalidade;
  Icon: typeof Ship;
  exemplos: string;
}[] = [
  { valor: Modalidade.MARITIMO, Icon: Ship, exemplos: 'BL, CE Mercante, Container' },
  { valor: Modalidade.AEREO, Icon: Plane, exemplos: 'AWB, Mantra, Carga Expressa' },
  {
    valor: Modalidade.RODOVIARIO,
    Icon: Truck,
    exemplos: 'CRT, MIC/DTA, Frota Terrestre',
  },
];

const ETAPAS = [
  { numero: 1, titulo: 'Dados da Carga', descricao: 'Identificação e transporte' },
  { numero: 2, titulo: 'Anexo de Documentos', descricao: 'PDFs e arquivos comprobatórios' },
];

function Stepper({ atual }: { atual: number }) {
  return (
    <div className="flex items-center justify-center gap-3 border-b bg-muted/30 px-6 py-4">
      {ETAPAS.map((etapa, indice) => {
        const concluida = atual > etapa.numero;
        const ativa = atual === etapa.numero;
        return (
          <div key={etapa.numero} className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                  concluida
                    ? 'bg-emerald-500 text-white'
                    : ativa
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground',
                )}
              >
                {concluida ? <Check className="h-4 w-4" /> : etapa.numero}
              </span>
              <div className="hidden sm:block">
                <p
                  className={cn(
                    'text-sm font-medium leading-tight',
                    ativa || concluida ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {etapa.numero}. {etapa.titulo}
                </p>
                <p className="text-xs text-muted-foreground">{etapa.descricao}</p>
              </div>
            </div>
            {indice < ETAPAS.length - 1 && (
              <span
                className={cn(
                  'h-px w-10 sm:w-16',
                  concluida ? 'bg-emerald-500' : 'bg-border',
                )}
                aria-hidden
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Uma linha da etapa 2: o tipo exigido e o upload dele. */
function LinhaDocumento({
  tipo,
  processoId,
  enviado,
  onEnviado,
}: {
  tipo: TipoDocumentoResumo;
  processoId: string;
  enviado: boolean;
  onEnviado: () => void;
}) {
  const { mutateAsync: enviar, isPending } = useEnviarDocumento(processoId);
  const [erro, setErro] = useState<string | null>(null);

  const anexar = async (arquivo: File | null) => {
    if (!arquivo) return;
    setErro(null);
    try {
      await enviar({ tipoDocumentoId: tipo.id, arquivo });
      onEnviado();
    } catch (e: unknown) {
      setErro(getErrorMessage(e, 'Falha ao enviar o arquivo.'));
    }
  };

  return (
    <div className="rounded-lg border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium">{tipo.descricao}</p>
        </div>
        {enviado ? (
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Enviado
          </Badge>
        ) : tipo.obrigatorio ? (
          <Badge variant="warning">Obrigatório</Badge>
        ) : (
          <Badge variant="secondary">Opcional</Badge>
        )}
      </div>

      {!enviado && (
        <div className="mt-3">
          {isPending ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Enviando…
            </p>
          ) : (
            <FileUpload
              value={null}
              onChange={anexar}
              accept={['application/pdf']}
              label="Arraste o PDF ou clique para selecionar"
              hint="PDF até 20 MB"
              error={erro}
            />
          )}
        </div>
      )}
    </div>
  );
}

type ModoEnvio = 'individual' | 'unico';

const MODOS_ENVIO: {
  valor: ModoEnvio;
  Icon: typeof Files;
  titulo: string;
  descricao: string;
}[] = [
  {
    valor: 'individual',
    Icon: Files,
    titulo: 'Um arquivo por documento',
    descricao: 'Anexe cada documento separadamente.',
  },
  {
    valor: 'unico',
    Icon: FileStack,
    titulo: 'Arquivo único',
    descricao: 'Todos os obrigatórios em um só PDF.',
  },
];

/** Escolha entre anexar documento a documento ou um PDF com todos. */
function SeletorModoEnvio({
  modo,
  onChange,
  bloqueado,
}: {
  modo: ModoEnvio;
  onChange: (modo: ModoEnvio) => void;
  /** Depois do arquivo único enviado não há mais o que alternar. */
  bloqueado: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Forma de envio dos documentos"
      className="grid gap-3 sm:grid-cols-2"
    >
      {MODOS_ENVIO.map(({ valor, Icon, titulo, descricao }) => {
        const ativo = modo === valor;
        return (
          <button
            key={valor}
            type="button"
            role="radio"
            aria-checked={ativo}
            disabled={bloqueado && !ativo}
            onClick={() => onChange(valor)}
            className={cn(
              'relative flex items-start gap-3 rounded-lg border p-3 text-left transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              ativo
                ? 'border-primary bg-primary/5'
                : 'hover:border-muted-foreground/40 hover:bg-muted/40',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border disabled:hover:bg-transparent',
            )}
          >
            <span
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                ativo
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block font-medium">{titulo}</span>
              <span className="block text-xs text-muted-foreground">
                {descricao}
              </span>
            </span>
            {ativo && (
              <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-primary" />
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Upload de um PDF que cobre todos os obrigatórios ainda sem anexo. A lista
 * numerada serve de roteiro para montar o arquivo na ordem que a equipe da
 * Aurora espera encontrar.
 */
function BlocoArquivoUnico({
  processoId,
  obrigatorios,
  enviados,
  arquivoEnviado,
  onEnviado,
}: {
  processoId: string;
  obrigatorios: TipoDocumentoResumo[];
  enviados: Set<string>;
  /** Nome do PDF único já enviado nesta sessão, se houver. */
  arquivoEnviado: string | null;
  onEnviado: (nome: string, tipoIds: string[]) => void;
}) {
  const { mutateAsync: enviar, isPending } = useEnviarArquivoUnico(processoId);
  const [erro, setErro] = useState<string | null>(null);

  const pendentes = obrigatorios.filter((t) => !enviados.has(t.id));
  const jaEnviados = obrigatorios.length - pendentes.length;

  const anexar = async (arquivo: File | null) => {
    if (!arquivo) return;
    setErro(null);
    try {
      const { documentos } = await enviar(arquivo);
      onEnviado(
        arquivo.name,
        documentos.map((d) => d.tipoDocumento.id),
      );
      toast.success(
        `Arquivo único enviado — ${documentos.length} documento(s) em análise.`,
      );
    } catch (e: unknown) {
      setErro(getErrorMessage(e, 'Falha ao enviar o arquivo.'));
    }
  };

  if (arquivoEnviado) {
    return (
      <div className="rounded-lg border border-emerald-300 bg-emerald-50/60 p-4 dark:border-emerald-800 dark:bg-emerald-950/30">
        <div className="flex items-start gap-3">
          <CheckCircle2
            className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="font-medium">Arquivo único enviado</p>
            <p className="truncate text-sm text-muted-foreground">
              {arquivoEnviado}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              A equipe da Aurora vai validar cada documento abaixo
              separadamente. Se algum for rejeitado, você reenvia só aquele no
              detalhe do processo.
            </p>
          </div>
        </div>
        <ul className="mt-3 divide-y rounded-md border bg-background">
          {obrigatorios.map((tipo) => (
            <li
              key={tipo.id}
              className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
            >
              <span className="min-w-0">{tipo.descricao}</span>
              <Badge variant="warning" className="shrink-0">
                Em análise
              </Badge>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex gap-3 rounded-md border border-primary/20 bg-primary/5 p-3 text-sm">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
        <p>
          Junte todos os documentos obrigatórios em um único PDF, de preferência
          na ordem abaixo. A equipe da Aurora vai abrir o arquivo e{' '}
          <strong>validar cada documento separadamente</strong> — todos ficam
          &quot;Em análise&quot; ao enviar.
        </p>
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          O PDF deve conter ({pendentes.length})
        </p>
        <ol className="mt-2 space-y-1.5">
          {obrigatorios.map((tipo, i) => {
            const enviado = enviados.has(tipo.id);
            return (
              <li
                key={tipo.id}
                className={cn(
                  'flex items-center gap-3 text-sm',
                  enviado && 'text-muted-foreground',
                )}
              >
                <span
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                    enviado
                      ? 'bg-muted text-muted-foreground'
                      : 'bg-primary/10 text-primary',
                  )}
                >
                  {enviado ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <span className={cn('min-w-0 flex-1', enviado && 'line-through')}>
                  {tipo.descricao}
                </span>
                {enviado && (
                  <Badge variant="secondary" className="shrink-0">
                    Já enviado
                  </Badge>
                )}
              </li>
            );
          })}
        </ol>
        {jaEnviados > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            Os documentos já enviados separadamente não serão substituídos.
          </p>
        )}
      </div>

      {pendentes.length === 0 ? (
        <p className="rounded-md bg-muted/40 p-3 text-sm text-muted-foreground">
          Todos os obrigatórios já foram anexados separadamente — não há o que
          enviar no arquivo único.
        </p>
      ) : isPending ? (
        <p className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Enviando arquivo único…
        </p>
      ) : (
        <FileUpload
          value={null}
          onChange={anexar}
          accept={['application/pdf']}
          label="Arraste o PDF com todos os documentos obrigatórios"
          hint="PDF até 20 MB"
          error={erro}
        />
      )}
    </div>
  );
}

export function NovaAverbacaoModal({
  aberto,
  onClose,
  onCriado,
}: {
  aberto: boolean;
  onClose: () => void;
  /** Chamado ao concluir, com o id do processo aberto. */
  onCriado: (processoId: string) => void;
}) {
  const router = useRouter();
  const { currentUser } = useAuthContext();
  // CLIENTE abre em nome próprio: não escolhe importador, é ele mesmo. O
  // DESPACHANTE escolhe entre os clientes de procuração aprovada.
  const souCliente = currentUser?.role === UserRole.CLIENTE;
  const clienteProprio = currentUser?.cliente ?? null;
  const { data: clientesDespachante, isLoading: carregandoClientes } =
    useClientesAutorizados({ enabled: !souCliente });
  const { mutateAsync: criar, isPending } = useCriarAverbacao();

  const [etapa, setEtapa] = useState(1);
  const [processo, setProcesso] = useState<AverbacaoProcessoResumo | null>(null);
  const [enviados, setEnviados] = useState<Set<string>>(new Set());
  const [modoEnvio, setModoEnvio] = useState<ModoEnvio>('individual');
  const [arquivoUnico, setArquivoUnico] = useState<string | null>(null);

  const [modalidade, setModalidade] = useState<Modalidade | ''>('');
  const [clienteId, setClienteId] = useState('');
  const [diDuimp, setDiDuimp] = useState('');
  const [localOrigem, setLocalOrigem] = useState('');
  const [recintoDestino, setRecintoDestino] = useState('');
  const [cargaEspecial, setCargaEspecial] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const { data: tipos } = useTiposPorModalidade(modalidade || undefined);

  // O modal fica montado entre aberturas, então o estado precisa ser zerado na
  // saída — senão a próxima abertura reaproveitaria o formulário anterior, ou
  // pior, a etapa 2 de um processo já concluído.
  const fechar = () => {
    setEtapa(1);
    setProcesso(null);
    setEnviados(new Set());
    setModoEnvio('individual');
    setArquivoUnico(null);
    setModalidade('');
    setClienteId('');
    setDiDuimp('');
    setLocalOrigem('');
    setRecintoDestino('');
    setCargaEspecial(false);
    setErro(null);
    onClose();
  };

  const opcoes = souCliente
    ? clienteProprio
      ? [clienteProprio]
      : []
    : clientesDespachante ?? [];
  const clienteSelecionado = opcoes.find((c) => c.id === clienteId);

  // CLIENTE não tem seletor — fixa o próprio cliente assim que o modal abre.
  useEffect(() => {
    if (aberto && souCliente && clienteProprio) {
      setClienteId(clienteProprio.id);
    }
  }, [aberto, souCliente, clienteProprio]);

  const diValida = DI_REGEX.test(diDuimp);
  const podeAvancar = Boolean(modalidade) && Boolean(clienteId) && diValida;

  const exigidos = useMemo(
    () =>
      (tipos ?? []).slice().sort((a, b) => a.step - b.step || a.ordem - b.ordem),
    [tipos],
  );

  const obrigatorios = exigidos.filter((t) => t.obrigatorio);
  const opcionais = exigidos.filter((t) => !t.obrigatorio);

  const obrigatoriosPendentes = obrigatorios.filter(
    (t) => !enviados.has(t.id),
  ).length;

  const marcarEnviado = (tipoId: string) =>
    setEnviados((atual) => new Set(atual).add(tipoId));

  // Criar o processo é o que fecha a etapa 1: os documentos precisam de um
  // processo para pertencer. Se a pessoa sair daqui, ele fica em RASCUNHO e
  // reaparece na lista — que é justamente para isso que esse status existe.
  const avancar = async () => {
    if (!podeAvancar) return;
    setErro(null);
    try {
      const criado = await criar({
        modalidade: modalidade as Modalidade,
        diDuimp,
        clienteId,
        localOrigem: localOrigem.trim() || undefined,
        recintoDestino: recintoDestino.trim() || undefined,
        cargaEspecial,
      });
      setProcesso(criado);
      setEtapa(2);
      toast.success(`Processo ${criado.protocolo} aberto. Anexe os documentos.`);
    } catch (e: unknown) {
      setErro(getErrorMessage(e, 'Falha ao abrir o processo.'));
    }
  };

  const concluir = () => {
    if (!processo) return;
    onCriado(processo.id);
    fechar();
  };

  return (
    <Dialog open={aberto} onOpenChange={(a) => !a && fechar()}>
      {/* Coluna flex em vez do grid padrão: assim o rodapé com os botões fica
          fixo e só o formulário rola. */}
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 flex-row items-start gap-3 space-y-0 border-b px-6 py-4 text-left">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FolderOpen className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <DialogTitle className="text-lg">
              Nova Solicitação de Averbação
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Preencha as informações da operação e faça o upload da documentação
              necessária para liberação.
            </p>
          </div>
        </DialogHeader>

        <div className="shrink-0">
          <Stepper atual={etapa} />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
        {etapa === 1 ? (
          <div className="space-y-5 px-6 py-5">
            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Modalidade de transporte <span className="text-destructive">*</span>
              </Label>
              <div className="mt-2 grid gap-3 sm:grid-cols-3">
                {MODALIDADES.map(({ valor, Icon, exemplos }) => {
                  const ativa = modalidade === valor;
                  return (
                    <button
                      key={valor}
                      type="button"
                      onClick={() => setModalidade(valor)}
                      aria-pressed={ativa}
                      className={cn(
                        'relative rounded-lg border p-4 text-left transition-colors',
                        ativa
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-muted-foreground/40 hover:bg-muted/40',
                      )}
                    >
                      {ativa && (
                        <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-primary" />
                      )}
                      <span
                        className={cn(
                          'flex h-9 w-9 items-center justify-center rounded-lg',
                          ativa
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground',
                        )}
                      >
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      <p className="mt-2.5 font-medium">{MODALIDADE_LABEL[valor]}</p>
                      <p className="text-xs text-muted-foreground">{exemplos}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="di">
                  Declaração de Importação (DI / DUIMP){' '}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="di"
                  value={diDuimp}
                  onChange={(e) => setDiDuimp(mascararDi(e.target.value))}
                  placeholder="00/0000000-0"
                  className="font-mono"
                  inputMode="numeric"
                />
                {diDuimp && !diValida && (
                  <p className="mt-1 text-xs text-destructive">
                    Formato esperado: XX/XXXXXXX-X
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="importador">
                  Razão Social do Importador{' '}
                  <span className="text-destructive">*</span>
                </Label>
                {souCliente ? (
                  // O cliente abre para si: o importador é ele mesmo, sem
                  // seletor. Vem do login, não é digitável.
                  <Input
                    id="importador"
                    value={clienteProprio?.nome ?? ''}
                    readOnly
                    tabIndex={-1}
                  />
                ) : carregandoClientes ? (
                  <p className="mt-2 text-sm text-muted-foreground">Carregando…</p>
                ) : opcoes.length === 0 ? (
                  <div className="mt-1 rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
                    <p>
                      Nenhum importador disponível. Só é possível abrir averbação
                      para quem tem procuração aprovada — envie a procuração em
                      &quot;Procurações&quot; e aguarde a análise.
                    </p>
                    {/* Fecha antes de navegar: o Dialog preso aberto deixaria a
                        outra tela sem rolagem por causa do scroll lock. */}
                    <button
                      type="button"
                      onClick={() => {
                        fechar();
                        router.push('/procuracoes');
                      }}
                      className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                    >
                      <FileSignature className="h-3.5 w-3.5" />
                      Ir para Procurações
                    </button>
                  </div>
                ) : (
                  <select
                    id="importador"
                    value={clienteId}
                    onChange={(e) => setClienteId(e.target.value)}
                    className="mt-1 h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">Selecione o cliente</option>
                    {opcoes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  {souCliente
                    ? 'A averbação é aberta em nome da sua empresa. O CNPJ é preenchido automaticamente.'
                    : 'Selecione o cliente representado. O CNPJ será preenchido automaticamente.'}
                </p>
              </div>

              <div>
                <Label htmlFor="cnpj">
                  CNPJ do Importador <span className="text-destructive">*</span>
                </Label>
                {/* Não é digitável: vem do cadastro do cliente escolhido. */}
                <Input
                  id="cnpj"
                  value={clienteSelecionado?.cnpj ?? ''}
                  placeholder="00.000.000/0000-00"
                  className="font-mono"
                  readOnly
                  tabIndex={-1}
                />
              </div>

              <div>
                <Label htmlFor="origem">Local de Origem</Label>
                <Input
                  id="origem"
                  value={localOrigem}
                  onChange={(e) => setLocalOrigem(e.target.value)}
                  placeholder="Porto, aeroporto ou fronteira de origem"
                  maxLength={200}
                />
              </div>

              <div>
                <Label htmlFor="recinto">Recinto Alfandegado de Destino</Label>
                <Input
                  id="recinto"
                  value={recintoDestino}
                  onChange={(e) => setRecintoDestino(e.target.value)}
                  placeholder="Recinto de destino da carga"
                  maxLength={200}
                />
              </div>
            </div>

            <label className="flex cursor-pointer items-start justify-between gap-4 rounded-lg border p-4">
              <span>
                <span className="block font-medium">
                  Carga Especial ou Anuência Específica
                </span>
                <span className="block text-sm text-muted-foreground">
                  Marque se a carga possui DTA, Anvisa, MAPA, Exército ou
                  sobredimensão.
                </span>
              </span>
              <input
                type="checkbox"
                checked={cargaEspecial}
                onChange={(e) => setCargaEspecial(e.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 accent-[hsl(var(--primary))]"
              />
            </label>

            {/* Prévia do que será exigido: evita abrir o processo e só então
                descobrir que faltam documentos que a pessoa não tem em mãos. */}
            {modalidade && exigidos.length === 0 && (
              <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                Não há tipos de documento cadastrados para esta modalidade.
                Procure a equipe da Aurora antes de abrir o processo.
              </p>
            )}

            {modalidade && exigidos.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Na próxima etapa serão pedidos {exigidos.length} documentos —{' '}
                {exigidos.filter((t) => t.obrigatorio).length} obrigatórios.
              </p>
            )}

            {erro && (
              <p role="alert" className="text-sm text-destructive">
                {erro}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4 px-6 py-5">
            <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm">
              <span className="font-mono font-semibold">
                {processo?.protocolo}
              </span>
              {' · '}
              {processo?.cliente.nome}
              {' · DI '}
              <span className="font-mono">{processo?.diDuimp}</span>
            </div>

            <p className="text-sm text-muted-foreground">
              Anexe os documentos em PDF — um arquivo por documento ou um
              arquivo único com todos os obrigatórios. Você pode enviar agora
              ou depois: o processo fica salvo.
            </p>

            {obrigatorios.length > 0 && (
              <SeletorModoEnvio
                modo={modoEnvio}
                onChange={setModoEnvio}
                bloqueado={arquivoUnico !== null}
              />
            )}

            {modoEnvio === 'individual' ? (
              <div className="space-y-3">
                {exigidos.map((tipo) => (
                  <LinhaDocumento
                    key={tipo.id}
                    tipo={tipo}
                    processoId={processo!.id}
                    enviado={enviados.has(tipo.id)}
                    onEnviado={() => marcarEnviado(tipo.id)}
                  />
                ))}
              </div>
            ) : (
              <>
                <BlocoArquivoUnico
                  processoId={processo!.id}
                  obrigatorios={obrigatorios}
                  enviados={enviados}
                  arquivoEnviado={arquivoUnico}
                  onEnviado={(nome, tipoIds) => {
                    setArquivoUnico(nome);
                    setEnviados((atual) => new Set([...atual, ...tipoIds]));
                  }}
                />

                {opcionais.length > 0 && (
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium">Documentos opcionais</p>
                      <p className="text-sm text-muted-foreground">
                        Não fazem parte do arquivo único. Envie separadamente,
                        se tiver.
                      </p>
                    </div>
                    {opcionais.map((tipo) => (
                      <LinhaDocumento
                        key={tipo.id}
                        tipo={tipo}
                        processoId={processo!.id}
                        enviado={enviados.has(tipo.id)}
                        onEnviado={() => marcarEnviado(tipo.id)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-t bg-muted/20 px-6 py-4">
          {etapa === 1 ? (
            <>
              <Button
                variant="ghost"
                onClick={fechar}
                className="text-muted-foreground"
              >
                Cancelar
              </Button>
              <Button
                onClick={avancar}
                disabled={!podeAvancar || isPending}
                className="gap-2"
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Próximo: Anexar Documentos
                <ArrowRight className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {obrigatoriosPendentes === 0
                  ? 'Todos os obrigatórios anexados.'
                  : `${obrigatoriosPendentes} obrigatório(s) ainda sem anexo.`}
              </p>
              <Button onClick={concluir} className="gap-2">
                <Package className="h-4 w-4" />
                Concluir
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
