'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Trash2, AlertTriangle, Edit } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useUpdateFlight, useDeleteFlight } from '@/hooks/useCcte';
import { Flight } from '@/types/ccte';

interface EditFlightModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flight: Flight | null;
  onDeleted?: () => void;
}

export function EditFlightModal({
  open,
  onOpenChange,
  flight,
  onDeleted,
}: EditFlightModalProps) {
  const [formData, setFormData] = useState({
    aircraftName: '',
    arrivalDate: '',
    arrivalTime: '',
    flightCode: '',
    termoEntrada: '',
    reason: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const updateMutation = useUpdateFlight();
  const deleteMutation = useDeleteFlight();

  useEffect(() => {
    if (flight) {
      const dateStr = flight.arrivalDate.includes('T')
        ? flight.arrivalDate.split('T')[0]
        : flight.arrivalDate;
      setFormData({
        aircraftName: flight.aircraftName,
        arrivalDate: dateStr,
        arrivalTime: flight.arrivalTime,
        flightCode: flight.flightCode,
        termoEntrada: flight.termoEntrada,
        reason: '',
      });
      setErrors({});
      setShowDeleteConfirm(false);
    }
  }, [flight]);

  const handleChange = (field: string, value: string) => {
    const upperFields = ['aircraftName', 'flightCode', 'termoEntrada'];
    const finalValue = upperFields.includes(field) ? value.toUpperCase() : value;
    setFormData((prev) => ({ ...prev, [field]: finalValue }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.aircraftName.trim())
      newErrors.aircraftName = 'Campo obrigatorio';
    if (!formData.arrivalDate) newErrors.arrivalDate = 'Campo obrigatorio';
    if (!formData.arrivalTime) newErrors.arrivalTime = 'Campo obrigatorio';
    if (!formData.flightCode.trim())
      newErrors.flightCode = 'Campo obrigatorio';
    if (!formData.reason.trim())
      newErrors.reason =
        'A justificativa e obrigatoria para realizar alteracoes';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!flight || !validate()) return;

    try {
      await updateMutation.mutateAsync({
        id: flight.id,
        data: formData,
      });
      onOpenChange(false);
    } catch {
      // Error handled by hook
    }
  };

  const handleDelete = async () => {
    if (!flight) return;

    try {
      await deleteMutation.mutateAsync(flight.id);
      onOpenChange(false);
      onDeleted?.();
    } catch {
      // Error handled by hook
    }
  };

  if (!flight) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[520px] p-0 gap-0 overflow-hidden bg-white"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        {showDeleteConfirm ? (
          <>
            <div className="p-6 border-b border-gray-100 bg-red-50/50 flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-white border border-red-100 flex items-center justify-center text-red-600 shadow-sm">
                <AlertTriangle size={24} />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-slate-900">Confirmar Exclusão</DialogTitle>
                <p className="text-sm text-red-600 mt-1 font-medium">
                  Esta ação é irreversível e removerá todos os dados.
                </p>
              </div>
            </div>
            <div className="p-6">
              <Alert variant="destructive" className="bg-red-50 border-red-200">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Confirmação de Exclusão</AlertTitle>
                <AlertDescription>
                  O voo <span className="font-bold underline">{flight.flightCode}</span> e todas as cargas vinculadas serão removidos permanentemente. Se for o único voo do mês, a pasta também será removida.
                </AlertDescription>
              </Alert>
            </div>
            <DialogFooter className="p-6 bg-slate-50/50 border-t border-gray-100 gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                className="border-slate-200 text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="bg-red-600 hover:bg-red-700 min-w-[120px] shadow-sm"
              >
                {deleteMutation.isPending ? 'Excluindo...' : 'Excluir Voo'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="p-6 border-b border-gray-100 bg-slate-50/50 flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-primary-600 shadow-sm">
                <Edit size={24} />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-slate-900">Editar Voo</DialogTitle>
                <p className="text-sm text-slate-500 mt-1">
                  Atualize as informações do voo <span className="font-semibold">{flight.flightCode}</span>.
                </p>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold">Compania Aérea</Label>
                <Input
                  value={formData.aircraftName}
                  onChange={(e) =>
                    handleChange('aircraftName', e.target.value)
                  }
                  className={`h-11 ${errors.aircraftName ? 'border-destructive ring-destructive/20' : 'border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none focus-visible:ring-0 focus-visible:ring-offset-0'}`}
                />
                {errors.aircraftName && (
                  <p className="text-xs text-destructive font-medium">
                    {errors.aircraftName}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">Data de Chegada</Label>
                  <Input
                    type="date"
                    value={formData.arrivalDate}
                    onChange={(e) =>
                      handleChange('arrivalDate', e.target.value)
                    }
                    className={`h-11 ${errors.arrivalDate ? 'border-destructive ring-destructive/20' : 'border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none focus-visible:ring-0 focus-visible:ring-offset-0'}`}
                  />
                  {errors.arrivalDate && (
                    <p className="text-xs text-destructive font-medium">
                      {errors.arrivalDate}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">Hora</Label>
                  <Input
                    type="time"
                    value={formData.arrivalTime}
                    onChange={(e) =>
                      handleChange('arrivalTime', e.target.value)
                    }
                    className={`h-11 ${errors.arrivalTime ? 'border-destructive ring-destructive/20' : 'border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none focus-visible:ring-0 focus-visible:ring-offset-0'}`}
                  />
                  {errors.arrivalTime && (
                    <p className="text-xs text-destructive font-medium">
                      {errors.arrivalTime}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">Termo de Entrada</Label>
                  <Input
                    value={formData.termoEntrada}
                    onChange={(e) =>
                      handleChange('termoEntrada', e.target.value)
                    }
                    className="h-11 border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">Código do Voo</Label>
                  <Input
                    value={formData.flightCode}
                    onChange={(e) =>
                      handleChange('flightCode', e.target.value)
                    }
                    className={`h-11 font-mono uppercase ${errors.flightCode ? 'border-destructive ring-destructive/20' : 'border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none focus-visible:ring-0 focus-visible:ring-offset-0'}`}
                  />
                  {errors.flightCode && (
                    <p className="text-xs text-destructive font-medium">
                      {errors.flightCode}
                    </p>
                  )}
                </div>
              </div>

              <Separator className="bg-slate-100" />

              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold flex items-center justify-between">
                  Justificativa da Alteração
                  <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full uppercase tracking-wider font-bold">Obrigatório</span>
                </Label>
                <Textarea
                  placeholder="Explique o motivo da alteração para o histórico..."
                  value={formData.reason}
                  onChange={(e) => handleChange('reason', e.target.value)}
                  className={`min-h-[80px] resize-none ${errors.reason ? 'border-destructive ring-destructive/20' : 'border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none focus-visible:ring-0 focus-visible:ring-offset-0'}`}
                />
                {errors.reason && (
                  <p className="text-xs text-destructive font-medium">{errors.reason}</p>
                )}
              </div>
            </div>

            <DialogFooter className="p-6 bg-slate-50/50 border-t border-gray-100 flex flex-row items-center justify-between gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-600 hover:bg-red-50 font-semibold px-3"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir Voo
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-200 text-slate-600 hover:bg-slate-100">
                  Cancelar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={updateMutation.isPending}
                  className="bg-primary-600 hover:bg-primary-700 text-white min-w-[100px] shadow-sm"
                >
                  {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
