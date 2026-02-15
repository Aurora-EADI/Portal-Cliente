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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Send, Trash2, AlertTriangle, Package } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  useUpdateCargoItem,
  useDeleteCargoItem,
  useSendCargoItem,
} from '@/hooks/useCcte';
import { CargoItem, TCOptions, WarehouseReason } from '@/types/ccte';

interface EditItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: CargoItem | null;
}

export function EditItemModal({ open, onOpenChange, item }: EditItemModalProps) {
  const [formData, setFormData] = useState({
    house: '',
    importer: '',
    tc: TCOptions.P as TCOptions,
    warehouseReason: null as WarehouseReason | null,
    dta: '',
    responsible: '',
    observations: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const updateMutation = useUpdateCargoItem();
  const deleteMutation = useDeleteCargoItem();
  const sendMutation = useSendCargoItem();

  useEffect(() => {
    if (item) {
      setFormData({
        house: item.house,
        importer: item.importer,
        tc: item.tc,
        warehouseReason: item.warehouseReason || null,
        dta: item.dta || '',
        responsible: item.responsible,
        observations: item.observations,
      });
      setErrors({});
      setShowDeleteConfirm(false);
    }
  }, [item]);

  const handleChange = (field: string, value: string | number | WarehouseReason | null) => {
    const upperFields = ['house', 'importer'];
    const finalValue =
      typeof value === 'string' && upperFields.includes(field)
        ? value.toUpperCase()
        : value;

    // Clear warehouseReason when TC changes from A to P
    if (field === 'tc' && value === TCOptions.P) {
      setFormData((prev) => ({ ...prev, tc: value as TCOptions, warehouseReason: null }));
    } else if (field === 'warehouseReason') {
      setFormData((prev) => ({ ...prev, warehouseReason: value as WarehouseReason | null }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: finalValue }));
    }

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
    if (!formData.house.trim()) newErrors.house = 'Campo obrigatorio';
    if (!formData.importer.trim()) newErrors.importer = 'Campo obrigatorio';
    if (formData.tc === TCOptions.A) {
      if (!formData.warehouseReason) {
        newErrors.warehouseReason = 'Motivo é obrigatório quando TC = A (Armazém)';
      }
      if (!formData.observations.trim()) {
        newErrors.observations = 'Observações são obrigatórias quando o TC não é P (Pátio)';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!item || !validate()) return;

    try {
      await updateMutation.mutateAsync({
        id: item.id,
        data: {
          ...formData,
          warehouseReason: formData.warehouseReason || undefined,
        },
        flightId: item.flightId,
      });
      onOpenChange(false);
    } catch {
      // Error handled by hook
    }
  };

  const handleDelete = async () => {
    if (!item) return;

    try {
      await deleteMutation.mutateAsync({ id: item.id, flightId: item.flightId });
      onOpenChange(false);
    } catch {
      // Error handled by hook
    }
  };

  const handleSend = async () => {
    if (!item) return;

    try {
      await sendMutation.mutateAsync({ id: item.id, flightId: item.flightId });
      onOpenChange(false);
    } catch {
      // Error handled by hook
    }
  };

  if (!item) return null;

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
                <DialogTitle className="text-xl font-bold text-slate-900">Excluir Carga</DialogTitle>
                <p className="text-sm text-red-600 mt-1 font-medium">
                  Esta ação é irreversível e removerá o item do voo.
                </p>
              </div>
            </div>
            <div className="p-6">
              <Alert variant="destructive" className="bg-red-50 border-red-200">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Ação Irreversível</AlertTitle>
                <AlertDescription>
                  Você está prestes a remover permanentemente a carga <span className="font-bold underline">{item.house}</span> deste voo. Esta ação não pode ser desfeita.
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
                {deleteMutation.isPending ? 'Excluindo...' : 'Excluir Carga'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="p-6 border-b border-gray-100 bg-slate-50/50 flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 shadow-sm">
                <Package size={24} />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-slate-900">Editar Carga</DialogTitle>
                <p className="text-sm text-slate-500 mt-1">
                  Atualize as informações do item <span className="font-semibold">{item.house}</span>.
                </p>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">House</Label>
                  <Input
                    value={formData.house}
                    onChange={(e) => handleChange('house', e.target.value)}
                    className={`h-11 ${errors.house ? 'border-destructive ring-destructive/20' : 'border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none focus-visible:ring-0 focus-visible:ring-offset-0'}`}
                  />
                  {errors.house && (
                    <p className="text-xs text-destructive font-medium">{errors.house}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">Importador</Label>
                  <Input
                    value={formData.importer}
                    onChange={(e) => handleChange('importer', e.target.value)}
                    className={`h-11 ${errors.importer ? 'border-destructive ring-destructive/20' : 'border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none focus-visible:ring-0 focus-visible:ring-offset-0'}`}
                  />
                  {errors.importer && (
                    <p className="text-xs text-destructive font-medium">
                      {errors.importer}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">DTA (Ex: 26/0068086-6)</Label>
                  <Input
                    value={formData.dta}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '');
                      if (value.length > 10) value = value.slice(0, 10);

                      let masked = value;
                      if (value.length > 2) {
                        masked = value.slice(0, 2) + '/' + value.slice(2);
                      }
                      if (value.length > 9) {
                        masked = masked.slice(0, 10) + '-' + masked.slice(10);
                      }

                      setFormData(prev => ({ ...prev, dta: masked }));
                    }}
                    placeholder="26/0000000-0"
                    className="h-11 border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700 font-semibold">Tipo de Carga (TC)</Label>
                  <Select
                    value={formData.tc}
                    onValueChange={(v) => handleChange('tc', v)}
                  >
                    <SelectTrigger className="h-11 border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none focus-visible:ring-0 focus-visible:ring-offset-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TCOptions.P}>P (Pátio)</SelectItem>
                      <SelectItem value={TCOptions.A}>A (Armazém)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Warehouse Reason - Only show when TC = A */}
              {formData.tc === TCOptions.A && (
                <div className="space-y-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <Label className="text-slate-700 font-semibold flex items-center justify-between">
                    Motivo do Armazém
                    <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full uppercase tracking-wider font-bold">Obrigatório</span>
                  </Label>
                  <RadioGroup
                    value={formData.warehouseReason || ''}
                    onValueChange={(value) => handleChange('warehouseReason', value as WarehouseReason)}
                    className="grid grid-cols-2 gap-3"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={WarehouseReason.CV} id="cv" />
                      <Label htmlFor="cv" className="font-normal cursor-pointer">Canal Vermelho</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={WarehouseReason.MA} id="ma" />
                      <Label htmlFor="ma" className="font-normal cursor-pointer">Ministério da Agricultura</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={WarehouseReason.RF} id="rf" />
                      <Label htmlFor="rf" className="font-normal cursor-pointer">Receita Federal</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={WarehouseReason.DOC} id="doc" />
                      <Label htmlFor="doc" className="font-normal cursor-pointer">Documento Pendente</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={WarehouseReason.DIV} id="div" />
                      <Label htmlFor="div" className="font-normal cursor-pointer">Diversos</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={WarehouseReason.MT} id="mt" />
                      <Label htmlFor="mt" className="font-normal cursor-pointer">Mudança de Tratamento</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={WarehouseReason.P} id="p" />
                      <Label htmlFor="p" className="font-normal cursor-pointer">Removida no Prazo Pátio</Label>
                    </div>
                  </RadioGroup>
                  {errors.warehouseReason && (
                    <p className="text-xs text-destructive font-medium">{errors.warehouseReason}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold">Responsável</Label>
                <Input
                  value={formData.responsible}
                  onChange={(e) => handleChange('responsible', e.target.value)}
                  className="h-11 border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold flex items-center justify-between">
                  Observações
                  {formData.tc === TCOptions.A && (
                    <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full uppercase tracking-wider font-bold">Obrigatório</span>
                  )}
                </Label>
                <Textarea
                  value={formData.observations}
                  onChange={(e) =>
                    handleChange('observations', e.target.value)
                  }
                  className={`min-h-[80px] resize-none ${errors.observations ? 'border-destructive ring-destructive/20' : 'border-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none focus-visible:ring-0 focus-visible:ring-offset-0'}`}
                />
                {errors.observations && (
                  <p className="text-xs text-destructive font-medium">
                    {errors.observations}
                  </p>
                )}
              </div>
            </div>

            {item.dta && item.dta.trim() !== '' && !item.sent && (
              <div className="px-6 pb-2">
                <Button
                  onClick={handleSend}
                  disabled={sendMutation.isPending}
                  className="w-full bg-primary-50 text-primary-600 hover:bg-primary-100 border-none shadow-none font-semibold"
                  variant="outline"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {sendMutation.isPending
                    ? 'Enviando...'
                    : 'Finalizar e Marcar como Enviado'}
                </Button>
              </div>
            )}

            <DialogFooter className="p-6 bg-slate-50/50 border-t border-gray-100 flex flex-row items-center justify-between gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-600 hover:bg-red-50 font-semibold px-3"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
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
