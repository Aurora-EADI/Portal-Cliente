'use client';

import { useState } from 'react';
import { Ban, CheckCircle2, Loader2, PencilLine, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/error-message';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Checkbox,
  Input,
  Label,
  Textarea,
} from '@/components/orion/ui';
import {
  CodeBadge,
  CrudModalFrame,
  FormActions,
  FormField,
} from '@/components/orion/blocks';
import {
  useCancelarAverbacao,
  useEditarAverbacao,
} from '@/hooks/useAverbacoes';
import {
  AverbacaoProcessoDetalhe,
  EditarAverbacaoDto,
  processoEditavel,
} from '@/types/averbacao';
import { DI_REGEX, mascararDi } from './NovaAverbacaoModal';

const MOTIVO_MINIMO = 5;

function formatarDataHora(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

/**
 * Aviso de devolução pela Aurora, ou de correção já enviada e aguardando
 * conferência. Aparece para todos que veem o processo (despachante e cliente);
 * só o despachante tem o botão de corrigir.
 */
export function BannerDevolucao({
  processo,
}: {
  processo: AverbacaoProcessoDetalhe;
}) {
  if (processo.devolvidoEm) {
    return (
      <Alert variant="destructive">
        <Undo2 className="h-4 w-4" />
        <AlertTitle>Devolvido pela equipe Aurora para correção</AlertTitle>
        <AlertDescription>
          {processo.motivoDevolucao && (
            <p className="text-foreground">{processo.motivoDevolucao}</p>
          )}
          <p className="mt-1 text-xs">
            {processo.devolvidoPor ?? 'Equipe Aurora'} ·{' '}
            {formatarDataHora(processo.devolvidoEm)} — corrija em &quot;Corrigir
            dados&quot;. Os documentos já validados continuam validados.
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  // Correção enviada e ainda sem vínculo: a Aurora ainda vai conferir.
  if (processo.corrigidoEm && !processo.nLote) {
    return (
      <Alert variant="info">
        <CheckCircle2 className="h-4 w-4" />
        <AlertTitle>
          Correção enviada em {formatarDataHora(processo.corrigidoEm)}
        </AlertTitle>
        <AlertDescription>
          {processo.diDuimpAnterior && (
            <p>
              DI <CodeBadge className="line-through">{processo.diDuimpAnterior}</CodeBadge>{' '}
              → <CodeBadge>{processo.diDuimp}</CodeBadge>
            </p>
          )}
          <p>Aguardando a conferência da equipe Aurora.</p>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}

/**
 * Corrigir dados e cancelar processo. Mesma janela do backend: até o vínculo
 * com o SIAUM, e fechada enquanto uma correção enviada aguarda a Aurora. Só o
 * despachante dono vê — o backend também exige.
 */
export function AcoesProcesso({
  processo,
}: {
  processo: AverbacaoProcessoDetalhe;
}) {
  const [corrigindo, setCorrigindo] = useState(false);
  const [cancelando, setCancelando] = useState(false);

  if (!processoEditavel(processo)) return null;

  return (
    <>
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          size="sm"
          variant={processo.devolvidoEm ? 'default' : 'outline'}
          onClick={() => setCorrigindo(true)}
        >
          <PencilLine className="h-3.5 w-3.5" />
          Corrigir dados
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-destructive hover:text-destructive"
          onClick={() => setCancelando(true)}
        >
          <Ban className="h-3.5 w-3.5" />
          Cancelar processo
        </Button>
      </div>

      {corrigindo && (
        <CorrigirModal
          processo={processo}
          onClose={() => setCorrigindo(false)}
        />
      )}
      {cancelando && (
        <CancelarModal
          processo={processo}
          onClose={() => setCancelando(false)}
        />
      )}
    </>
  );
}

function CorrigirModal({
  processo,
  onClose,
}: {
  processo: AverbacaoProcessoDetalhe;
  onClose: () => void;
}) {
  const [diDuimp, setDiDuimp] = useState(processo.diDuimp);
  const [localOrigem, setLocalOrigem] = useState(processo.localOrigem ?? '');
  const [recintoDestino, setRecintoDestino] = useState(
    processo.recintoDestino ?? '',
  );
  const [cargaEspecial, setCargaEspecial] = useState(processo.cargaEspecial);
  const { mutateAsync: editar, isPending } = useEditarAverbacao(processo.id);

  const diValida = DI_REGEX.test(diDuimp);

  // Envia só o que mudou — o backend recusa corpo vazio.
  const dto: EditarAverbacaoDto = {
    ...(diDuimp !== processo.diDuimp && { diDuimp }),
    ...(localOrigem !== (processo.localOrigem ?? '') && { localOrigem }),
    ...(recintoDestino !== (processo.recintoDestino ?? '') && {
      recintoDestino,
    }),
    ...(cargaEspecial !== processo.cargaEspecial && { cargaEspecial }),
  };
  const mudou = Object.keys(dto).length > 0;

  const salvar = async () => {
    try {
      await editar(dto);
      toast.success(
        processo.devolvidoEm
          ? 'Dados corrigidos. O processo voltou para a análise da Aurora.'
          : 'Dados do processo corrigidos.',
      );
      onClose();
    } catch (e: unknown) {
      toast.error(getErrorMessage(e, 'Falha ao corrigir o processo.'));
    }
  };

  return (
    <CrudModalFrame
      open
      onOpenChange={(a) => !a && onClose()}
      title="Corrigir dados"
      description={`Processo ${processo.protocolo}`}
      icon={PencilLine}
      tone={processo.devolvidoEm ? 'warning' : 'default'}
      size="md"
      footer={
        <FormActions
          secondary={
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          }
          primary={
            <Button
              onClick={salvar}
              disabled={!mudou || !diValida || isPending}
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar correção
            </Button>
          }
        />
      }
    >
      <div className="space-y-4">
        {processo.motivoDevolucao && (
          <Alert variant="destructive">
            <AlertTitle>Pedido da Aurora</AlertTitle>
            <AlertDescription>{processo.motivoDevolucao}</AlertDescription>
          </Alert>
        )}

        <FormField
          label="Documento de saída (DI / DUIMP)"
          htmlFor="corrigir-di"
          required
          error={diDuimp && !diValida ? 'Formato esperado: XX/XXXXXXX-X' : undefined}
        >
          <Input
            id="corrigir-di"
            value={diDuimp}
            onChange={(e) => setDiDuimp(mascararDi(e.target.value))}
            placeholder="00/0000000-0"
            className="font-mono"
            inputMode="numeric"
            autoFocus
            aria-describedby="corrigir-di-error"
          />
        </FormField>

        <FormField label="Local de Origem" htmlFor="corrigir-origem">
          <Input
            id="corrigir-origem"
            value={localOrigem}
            onChange={(e) => setLocalOrigem(e.target.value)}
            maxLength={200}
          />
        </FormField>

        <FormField label="Recinto Alfandegado de Destino" htmlFor="corrigir-recinto">
          <Input
            id="corrigir-recinto"
            value={recintoDestino}
            onChange={(e) => setRecintoDestino(e.target.value)}
            maxLength={200}
          />
        </FormField>

        <div className="flex items-center gap-2">
          <Checkbox
            id="corrigir-carga-especial"
            checked={cargaEspecial}
            onCheckedChange={(v) => setCargaEspecial(Boolean(v))}
          />
          <Label htmlFor="corrigir-carga-especial">
            Carga Especial ou Anuência Específica
          </Label>
        </div>

        <p className="text-xs text-muted-foreground">
          Modalidade e importador não mudam: para trocá-los, cancele este
          processo e abra outro.
        </p>
      </div>
    </CrudModalFrame>
  );
}

function CancelarModal({
  processo,
  onClose,
}: {
  processo: AverbacaoProcessoDetalhe;
  onClose: () => void;
}) {
  const [motivo, setMotivo] = useState('');
  const { mutateAsync: cancelar, isPending } = useCancelarAverbacao(
    processo.id,
  );
  const motivoCurto = motivo.trim().length < MOTIVO_MINIMO;

  const confirmar = async () => {
    try {
      await cancelar(motivo.trim());
      toast.success(`Processo ${processo.protocolo} cancelado.`);
      onClose();
    } catch (e: unknown) {
      toast.error(getErrorMessage(e, 'Falha ao cancelar o processo.'));
    }
  };

  // CrudModalFrame e não ConfirmDialog: o cancelamento exige motivo, e o
  // ConfirmDialog do Orion não tem campo.
  return (
    <CrudModalFrame
      open
      onOpenChange={(a) => !a && onClose()}
      title="Cancelar processo"
      description={`Processo ${processo.protocolo}`}
      icon={Ban}
      tone="danger"
      size="md"
      footer={
        <FormActions
          secondary={
            <Button variant="outline" onClick={onClose}>
              Voltar
            </Button>
          }
          primary={
            <Button
              variant="destructive"
              onClick={confirmar}
              disabled={motivoCurto || isPending}
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Cancelar processo
            </Button>
          }
        />
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          O processo sai da análise da Aurora e não pode ser reaberto. O
          registro e os documentos enviados ficam guardados para auditoria.
        </p>
        <FormField
          label="Motivo do cancelamento"
          htmlFor="cancelar-motivo"
          required
          description={`Mínimo de ${MOTIVO_MINIMO} caracteres.`}
        >
          <Textarea
            id="cancelar-motivo"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Ex.: processo aberto em duplicidade."
            autoFocus
            aria-describedby="cancelar-motivo-description"
          />
        </FormField>
      </div>
    </CrudModalFrame>
  );
}
