'use client';

import { useState } from 'react';
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
import { Plane } from 'lucide-react';
import { useCreateFlight } from '@/hooks/useCcte';

interface NewFlightModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewFlightModal({ open, onOpenChange }: NewFlightModalProps) {
  const [formData, setFormData] = useState({
    aircraftName: '',
    arrivalDate: '',
    arrivalTime: '',
    flightCode: '',
    termoEntrada: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createFlightMutation = useCreateFlight();

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
    if (!formData.aircraftName.trim()) newErrors.aircraftName = 'Campo obrigatorio';
    if (!formData.arrivalDate) newErrors.arrivalDate = 'Campo obrigatorio';
    if (!formData.arrivalTime) newErrors.arrivalTime = 'Campo obrigatorio';
    if (!formData.flightCode.trim()) newErrors.flightCode = 'Campo obrigatorio';
    if (!formData.termoEntrada.trim()) newErrors.termoEntrada = 'Campo obrigatorio';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      await createFlightMutation.mutateAsync(formData);
      setFormData({ aircraftName: '', arrivalDate: '', arrivalTime: '', flightCode: '', termoEntrada: '' });
      setErrors({});
      onOpenChange(false);
    } catch {
      // Error handled by hook
    }
  };

  const handleClose = () => {
    setFormData({ aircraftName: '', arrivalDate: '', arrivalTime: '', flightCode: '', termoEntrada: '' });
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-[520px] p-0 gap-0 overflow-hidden bg-white"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        {/* Header Style Premium */}
        <div className="p-6 border-b border-gray-100 bg-slate-50/50 flex gap-4">
          <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-primary-600 shadow-sm">
            <Plane size={24} />
          </div>
          <div>
            <DialogTitle className="text-xl font-bold text-slate-900">Novo Voo</DialogTitle>
            <p className="text-sm text-slate-500 mt-1">
              Registre as informações básicas da nova operação aérea.
            </p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="aircraftName" className="text-slate-700 font-semibold">Compania Aérea</Label>
            <Input
              id="aircraftName"
              placeholder="Ex: BOEING 747 - DHL"
              value={formData.aircraftName}
              onChange={(e) => handleChange('aircraftName', e.target.value)}
              className={`h-11 ${errors.aircraftName ? 'border-destructive ring-destructive/20' : 'border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none focus-visible:ring-0 focus-visible:ring-offset-0'}`}
            />
            {errors.aircraftName && (
              <p className="text-xs text-destructive font-medium">{errors.aircraftName}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="arrivalDate" className="text-slate-700 font-semibold">Data de Chegada</Label>
              <Input
                id="arrivalDate"
                type="date"
                value={formData.arrivalDate}
                onChange={(e) => handleChange('arrivalDate', e.target.value)}
                className={`h-11 ${errors.arrivalDate ? 'border-destructive ring-destructive/20' : 'border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none focus-visible:ring-0 focus-visible:ring-offset-0'}`}
              />
              {errors.arrivalDate && (
                <p className="text-xs text-destructive font-medium">{errors.arrivalDate}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="arrivalTime" className="text-slate-700 font-semibold">Hora de Chegada</Label>
              <Input
                id="arrivalTime"
                type="time"
                value={formData.arrivalTime}
                onChange={(e) => handleChange('arrivalTime', e.target.value)}
                className={`h-11 ${errors.arrivalTime ? 'border-destructive ring-destructive/20' : 'border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none focus-visible:ring-0 focus-visible:ring-offset-0'}`}
              />
              {errors.arrivalTime && (
                <p className="text-xs text-destructive font-medium">{errors.arrivalTime}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="termoEntrada" className="text-slate-700 font-semibold">Termo de Entrada</Label>
              <Input
                id="termoEntrada"
                placeholder="Ex: TERMO-123"
                value={formData.termoEntrada}
                onChange={(e) => handleChange('termoEntrada', e.target.value)}
                className={`h-11 ${errors.termoEntrada ? 'border-destructive ring-destructive/20' : 'border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none focus-visible:ring-0 focus-visible:ring-offset-0'}`}
              />
              {errors.termoEntrada && (
                <p className="text-xs text-destructive font-medium">{errors.termoEntrada}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="flightCode" className="text-slate-700 font-semibold">Código do Voo</Label>
              <Input
                id="flightCode"
                placeholder="Ex: 1234.AB"
                value={formData.flightCode}
                onChange={(e) => handleChange('flightCode', e.target.value)}
                className={`h-11 font-mono uppercase ${errors.flightCode ? 'border-destructive ring-destructive/20' : 'border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none focus-visible:ring-0 focus-visible:ring-offset-0'}`}
              />
              {errors.flightCode && (
                <p className="text-xs text-destructive font-medium">{errors.flightCode}</p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 bg-slate-50/50 border-t border-gray-100 gap-3">
          <Button variant="outline" onClick={handleClose} className="border-slate-200 text-slate-600 hover:bg-slate-100">
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createFlightMutation.isPending}
            className="bg-primary-600 hover:bg-primary-700 text-white min-w-[120px] shadow-sm"
          >
            {createFlightMutation.isPending ? 'Criando...' : 'Criar Voo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
