'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FileUpload } from '@/components/ui/FileUpload';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEnviarProcuracao } from '@/hooks/useProcuracoes';
import {
  ClienteRepresentado,
  SITUACAO_LABEL,
  situacaoDe,
} from '@/types/procuracao';

/** Hoje em ISO, para travar o mínimo do campo de data. */
function hojeIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function AnexarProcuracaoModal({
  aberto,
  onClose,
  representados,
  clienteInicial,
}: {
  aberto: boolean;
  onClose: () => void;
  representados: ClienteRepresentado[];
  /** Quando vem de uma linha, o cliente já está decidido e não se troca. */
  clienteInicial?: string | null;
}) {
  const [clienteId, setClienteId] = useState('');
  const [validade, setValidade] = useState('');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  // O modal fica montado entre aberturas, então o estado inicial do useState
  // só valeria na primeira. Sem isto, abrir por uma linha não seleciona o
  // cliente e o botão de enviar nunca habilita.
  useEffect(() => {
    if (!aberto) return;
    setClienteId(clienteInicial ?? '');
    setValidade('');
    setArquivo(null);
    setErro(null);
  }, [aberto, clienteInicial]);

  const { mutateAsync: enviar, isPending } = useEnviarProcuracao();

  // Já aprovada e vigente não entra: o backend recusa com 409, e oferecer aqui
  // só produziria erro depois do upload.
  const opcoes = representados.filter((r) => !r.vigente);
  const travado = Boolean(clienteInicial);
  const selecionado = representados.find((r) => r.cliente.id === clienteId);

  const fechar = () => {
    setClienteId('');
    setValidade('');
    setArquivo(null);
    setErro(null);
    onClose();
  };

  const submeter = async () => {
    if (!clienteId || !arquivo) return;
    setErro(null);
    try {
      await enviar({ clienteId, arquivo, validade: validade || undefined });
      toast.success('Procuração enviada para análise da equipe Aurora.');
      fechar();
    } catch (e: any) {
      const m = e?.response?.data?.message;
      setErro(Array.isArray(m) ? m.join(', ') : m || 'Falha ao enviar a procuração.');
    }
  };

  return (
    <Dialog open={aberto} onOpenChange={(a) => !a && fechar()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Anexar Procuração</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Envie a procuração do cliente que deseja representar.
          </p>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="cliente-repr">
              Cliente representado <span className="text-destructive">*</span>
            </Label>
            {travado && selecionado ? (
              <div className="mt-1 rounded-md border bg-muted/40 px-3 py-2 text-sm">
                {selecionado.cliente.nome}
                {selecionado.cliente.cnpj && (
                  <span className="ml-2 font-mono text-xs text-muted-foreground">
                    {selecionado.cliente.cnpj}
                  </span>
                )}
              </div>
            ) : (
              <Select value={clienteId} onValueChange={setClienteId}>
                <SelectTrigger id="cliente-repr">
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {opcoes.map((r) => (
                    <SelectItem key={r.cliente.id} value={r.cliente.id}>
                      {r.cliente.nome} — {SITUACAO_LABEL[situacaoDe(r)]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div>
            <Label htmlFor="validade">Validade da procuração</Label>
            <Input
              id="validade"
              type="date"
              value={validade}
              min={hojeIso()}
              onChange={(e) => setValidade(e.target.value)}
            />
            {/* A data não é enfeite: depois dela o despachante volta a ficar
                bloqueado para este cliente. Dizer isso evita a surpresa. */}
            <p className="mt-1 text-xs text-muted-foreground">
              Opcional. Informada, as operações em nome deste cliente param
              automaticamente quando a procuração vencer.
            </p>
          </div>

          <FileUpload
            value={arquivo}
            onChange={(f) => {
              setArquivo(f);
              setErro(null);
            }}
            accept={['application/pdf']}
            label="Arraste a procuração ou clique para selecionar"
            hint="PDF até 20 MB — assinada e com poderes de representação"
            error={erro}
          />

          <p className="text-xs text-muted-foreground">
            A procuração passa por análise da equipe Aurora antes de liberar as
            operações em nome deste cliente.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={fechar}>
            Cancelar
          </Button>
          <Button onClick={submeter} disabled={!clienteId || !arquivo || isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar para análise
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
