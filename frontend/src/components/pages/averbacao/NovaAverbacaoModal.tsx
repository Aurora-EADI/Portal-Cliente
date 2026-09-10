'use client';

import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  FolderOpen,
  Loader2,
  Package,
  Plane,
  Ship,
  Truck,
} from 'lucide-react';
import { toast } from 'sonner';
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
import { cn, formatContainer } from '@/lib/utils';
import {
  useClientesAutorizados,
  useCriarAverbacao,
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
const DI_REGEX = /^\d{2}\/(\d{7}-\d|\d{9})$/;

/** Só dígitos, formatando como XX/XXXXXXX-X enquanto digita. */
function mascararDi(valor: string): string {
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
    } catch (e: any) {
      const m = e?.response?.data?.message;
      setErro(Array.isArray(m) ? m.join(', ') : m || 'Falha ao enviar o arquivo.');
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
  const { data: clientes, isLoading: carregandoClientes } =
    useClientesAutorizados();
  const { mutateAsync: criar, isPending } = useCriarAverbacao();

  const [etapa, setEtapa] = useState(1);
  const [processo, setProcesso] = useState<AverbacaoProcessoResumo | null>(null);
  const [enviados, setEnviados] = useState<Set<string>>(new Set());

  const [modalidade, setModalidade] = useState<Modalidade | ''>('');
  const [clienteId, setClienteId] = useState('');
  const [diDuimp, setDiDuimp] = useState('');
  const [container, setContainer] = useState('');
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
    setModalidade('');
    setClienteId('');
    setDiDuimp('');
    setContainer('');
    setLocalOrigem('');
    setRecintoDestino('');
    setCargaEspecial(false);
    setErro(null);
    onClose();
  };

  const opcoes = clientes ?? [];
  const clienteSelecionado = opcoes.find((c) => c.id === clienteId);

  // A máscara ISO 6346 é do container marítimo. Aéreo (AWB) e rodoviário (CRT)
  // usam conhecimento de transporte, que não tem esse formato — aplicar a
  // mesma máscara neles apagaria o que a pessoa digitasse.
  const ehMaritimo = modalidade === Modalidade.MARITIMO;

  const mascararContainer = (valor: string): string =>
    ehMaritimo
      ? formatContainer(valor)
      : valor.toUpperCase().replace(/[^A-Z0-9]/g, '');

  const containerIsoCompleto = /^[A-Z]{4}\d{7}$/.test(container);
  const diValida = DI_REGEX.test(diDuimp);
  const containerValido = ehMaritimo
    ? containerIsoCompleto
    : /^[A-Z0-9]+$/.test(container);
  const podeAvancar =
    Boolean(modalidade) && Boolean(clienteId) && diValida && containerValido;

  const exigidos = useMemo(
    () =>
      (tipos ?? []).slice().sort((a, b) => a.step - b.step || a.ordem - b.ordem),
    [tipos],
  );

  const obrigatoriosPendentes = exigidos.filter(
    (t) => t.obrigatorio && !enviados.has(t.id),
  ).length;

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
        containerConhecimento: container,
        clienteId,
        localOrigem: localOrigem.trim() || undefined,
        recintoDestino: recintoDestino.trim() || undefined,
        cargaEspecial,
      });
      setProcesso(criado);
      setEtapa(2);
      toast.success(`Processo ${criado.protocolo} aberto. Anexe os documentos.`);
    } catch (e: any) {
      const m = e?.response?.data?.message;
      setErro(Array.isArray(m) ? m.join(', ') : m || 'Falha ao abrir o processo.');
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
                      onClick={() => {
                        setModalidade(valor);
                        // Trocar de modalidade troca a regra do campo: um AWB
                        // digitado antes não é container ISO válido, e deixá-lo
                        // ali travaria o botão sem dizer por quê.
                        setContainer((atual) =>
                          valor === Modalidade.MARITIMO
                            ? formatContainer(atual)
                            : atual.toUpperCase().replace(/[^A-Z0-9]/g, ''),
                        );
                      }}
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
                <Label htmlFor="container">
                  {ehMaritimo
                    ? 'Container'
                    : 'Container / Conhecimento de Transporte'}{' '}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="container"
                  value={container}
                  onChange={(e) => setContainer(mascararContainer(e.target.value))}
                  placeholder={ehMaritimo ? 'Ex: MSKU1234567' : 'ABCD0000000'}
                  maxLength={ehMaritimo ? 11 : undefined}
                  className="font-mono uppercase"
                />
                {ehMaritimo && container && !containerIsoCompleto && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Padrão ISO 6346: 4 letras + 7 dígitos.
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="importador">
                  Razão Social do Importador{' '}
                  <span className="text-destructive">*</span>
                </Label>
                {carregandoClientes ? (
                  <p className="mt-2 text-sm text-muted-foreground">Carregando…</p>
                ) : opcoes.length === 0 ? (
                  <p className="mt-1 rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
                    Nenhum importador disponível. Só é possível abrir averbação
                    para quem tem procuração aprovada — envie a procuração em
                    &quot;Procurações&quot; e aguarde a análise.
                  </p>
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
                  Selecione o cliente representado. O CNPJ será preenchido
                  automaticamente.
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
              Anexe os documentos em PDF. Você pode enviar agora ou depois — o
              processo fica salvo e só entra em análise quando todos os
              obrigatórios forem anexados.
            </p>

            <div className="space-y-3">
              {exigidos.map((tipo) => (
                <LinhaDocumento
                  key={tipo.id}
                  tipo={tipo}
                  processoId={processo!.id}
                  enviado={enviados.has(tipo.id)}
                  onEnviado={() =>
                    setEnviados((atual) => new Set(atual).add(tipo.id))
                  }
                />
              ))}
            </div>
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
