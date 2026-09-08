'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useClientesAutorizados,
  useCriarAverbacao,
  useTiposPorModalidade,
} from '@/hooks/useAverbacoes';
import { MODALIDADE_LABEL, Modalidade } from '@/types/averbacao';

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

export function NovaAverbacaoPage() {
  const router = useRouter();
  const { data: clientes, isLoading: carregandoClientes } =
    useClientesAutorizados();
  const { mutateAsync: criar, isPending } = useCriarAverbacao();

  const [modalidade, setModalidade] = useState<Modalidade | ''>('');
  const [clienteId, setClienteId] = useState('');
  const [diDuimp, setDiDuimp] = useState('');
  const [container, setContainer] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  const { data: tipos } = useTiposPorModalidade(modalidade || undefined);

  const opcoes = clientes ?? [];
  const clienteSelecionado = opcoes.find((c) => c.id === clienteId);

  const diValida = DI_REGEX.test(diDuimp);
  const containerValido = /^[A-Z0-9]+$/.test(container);
  const podeEnviar =
    Boolean(modalidade) && Boolean(clienteId) && diValida && containerValido;

  const exigidos = useMemo(
    () =>
      (tipos ?? [])
        .slice()
        .sort((a, b) => a.step - b.step || a.ordem - b.ordem),
    [tipos],
  );

  const submeter = async () => {
    if (!podeEnviar) return;
    setErro(null);
    try {
      const processo = await criar({
        modalidade: modalidade as Modalidade,
        diDuimp,
        containerConhecimento: container,
        clienteId,
      });
      toast.success(`Processo ${processo.protocolo} aberto. Anexe os documentos.`);
      router.push(`/averbacao/${processo.id}`);
    } catch (e: any) {
      const m = e?.response?.data?.message;
      setErro(Array.isArray(m) ? m.join(', ') : m || 'Falha ao abrir o processo.');
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/averbacao')}
          className="mb-2 gap-1 px-0"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <h1 className="text-lg font-semibold">Nova Averbação</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Depois de abrir o processo você anexa os documentos na tela seguinte.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados da DI</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="importador">Razão social do importador</Label>
            {carregandoClientes ? (
              <p className="mt-1 text-sm text-muted-foreground">Carregando…</p>
            ) : opcoes.length === 0 ? (
              <p className="mt-1 rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
                Nenhum importador disponível. Só é possível abrir averbação para
                quem tem procuração aprovada — envie a procuração em
                &quot;Procurações&quot; e aguarde a análise.
              </p>
            ) : (
              <Select value={clienteId} onValueChange={setClienteId}>
                <SelectTrigger id="importador">
                  <SelectValue placeholder="Selecione o importador" />
                </SelectTrigger>
                <SelectContent>
                  {opcoes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {/* O CNPJ vem do cadastro, não é digitado. */}
            {clienteSelecionado?.cnpj && (
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                CNPJ {clienteSelecionado.cnpj}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="modalidade">Modalidade</Label>
              <Select
                value={modalidade}
                onValueChange={(v) => setModalidade(v as Modalidade)}
              >
                <SelectTrigger id="modalidade">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(Modalidade).map((m) => (
                    <SelectItem key={m} value={m}>
                      {MODALIDADE_LABEL[m]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="di">DI / DUIMP</Label>
              <Input
                id="di"
                value={diDuimp}
                onChange={(e) => setDiDuimp(mascararDi(e.target.value))}
                placeholder="26/0715989-9"
                className="font-mono"
                inputMode="numeric"
              />
              {diDuimp && !diValida && (
                <p className="mt-1 text-xs text-destructive">
                  Formato esperado: XX/XXXXXXX-X
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="container">Container / Conhecimento</Label>
            <Input
              id="container"
              value={container}
              // Normaliza ao digitar: o backend faz o mesmo, e mostrar aqui
              // evita a pessoa achar que perdeu o que escreveu.
              onChange={(e) =>
                setContainer(
                  e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''),
                )
              }
              placeholder="TGBU5819320"
              className="font-mono"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Somente letras e números — maiúsculas.
            </p>
          </div>

          {erro && (
            <p role="alert" className="text-sm text-destructive">
              {erro}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Prévia do que será exigido: evita abrir processo e só então descobrir
          que faltam documentos que a pessoa não tem em mãos. */}
      {modalidade && exigidos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Documentos exigidos para {MODALIDADE_LABEL[modalidade]}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {exigidos.map((t) => (
                <li key={t.id} className="flex items-center gap-2 text-sm">
                  <FileText
                    className="h-4 w-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                  <span className="flex-1">{t.descricao}</span>
                  {t.obrigatorio ? (
                    <Badge variant="warning">Obrigatório</Badge>
                  ) : (
                    <Badge variant="outline">Opcional</Badge>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {modalidade && exigidos.length === 0 && (
        <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          Não há tipos de documento cadastrados para esta modalidade. Procure a
          equipe da Aurora antes de abrir o processo.
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.push('/averbacao')}>
          Cancelar
        </Button>
        <Button onClick={submeter} disabled={!podeEnviar || isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Abrir processo
        </Button>
      </div>
    </div>
  );
}
