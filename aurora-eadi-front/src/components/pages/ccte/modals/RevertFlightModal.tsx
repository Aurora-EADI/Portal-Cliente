'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useRevertFlight } from '@/hooks/useCcte';

interface RevertFlightModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flightId: string | null;
}

export function RevertFlightModal({
  open,
  onOpenChange,
  flightId,
}: RevertFlightModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const revertMutation = useRevertFlight();

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError('A justificativa e obrigatoria para reabrir este voo');
      return;
    }

    if (!flightId) return;

    try {
      await revertMutation.mutateAsync({
        id: flightId,
        data: { reason },
      });
      handleClose();
    } catch {
      // Error handled by hook
    }
  };

  const handleClose = () => {
    setReason('');
    setError('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-[480px] p-0 gap-0 overflow-hidden bg-white"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        {/* Header Style Premium */}
        <div className="p-6 border-b border-gray-100 bg-amber-50/50 flex gap-4">
          <div className="w-12 h-12 rounded-xl bg-white border border-amber-200 flex items-center justify-center text-amber-600 shadow-sm">
            <AlertTriangle size={24} />
          </div>
          <div>
            <DialogTitle className="text-xl font-bold text-slate-900">Reverter para Operação</DialogTitle>
            <p className="text-sm text-amber-700 mt-1 font-medium">
              O voo será reaberto para alterações.
            </p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <Alert className="bg-amber-50 border-amber-200 text-amber-800">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle>Informações da Operação</AlertTitle>
            <AlertDescription>
              Ao reverter este voo para <strong>"Operação"</strong>, ele voltará para a aba de Controle Aéreo, permitindo a edição de cargas existentes e a inclusão de novos itens.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label className="text-slate-700 font-semibold flex items-center justify-between">
              Justificativa da Reabertura
              <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full uppercase tracking-wider font-bold">Obrigatório</span>
            </Label>
            <Textarea
              placeholder="Explique o motivo da reversão para o histórico..."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError('');
              }}
              className={`min-h-[100px] resize-none ${error ? 'border-destructive ring-destructive/20' : 'border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none focus-visible:ring-0 focus-visible:ring-offset-0'}`}
            />
            {error && <p className="text-xs text-destructive font-medium">{error}</p>}
          </div>
        </div>

        <DialogFooter className="p-6 bg-slate-50/50 border-t border-gray-100 gap-3">
          <Button variant="outline" onClick={handleClose} className="border-slate-200 text-slate-600 hover:bg-slate-100">
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={revertMutation.isPending}
            className="bg-amber-600 hover:bg-amber-700 text-white min-w-[140px] shadow-sm"
          >
            {revertMutation.isPending ? 'Revertendo...' : 'Confirmar Reversão'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
