"use client";

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { GroupedMultiSelect, MultiSelectGroup } from "@/components/ui/GroupedMultiSelect";
import { Box, Save, Loader2, AlertTriangle, Package, Truck, ChevronRight, ChevronLeft, Plus, Trash2, Weight, Ruler, Hash, Hash as HashIcon, FileText } from 'lucide-react';
import { CreateWarehouseCargoDto, WarehouseCargo } from '@/types/armazem-geral';
import { useCreateCargo, useUpdateCargo } from '@/hooks/armazem-geral/useCargo';
import { useContainersList } from '@/hooks/armazem-geral/useContainers';
import { containersService } from '@/services/armazem-geral/containers.service';
import { useCustomers } from "@/hooks/useCustomers";
import { toast } from 'sonner';
import { cn } from "@/lib/utils";

const DAMAGE_GROUPS: MultiSelectGroup[] = [
  {
    label: "Avarias",
    options: [
      { value: "ABERTO", label: "Aberto" },
      { value: "AMASSADO", label: "Amassado" },
      { value: "CARGA_LACRADA_FIEL_DEPOSITARIO", label: "Carga Lacrada Pelo Fiel Depositário" },
      { value: "CARGA_RECEBIDA_COM_ALTERACAO", label: "Carga Recebida com Alteração de Informação" },
      { value: "DESPREGADO", label: "Despregado" },
      { value: "DIFERENCA_DE_PESO", label: "Diferença de Peso" },
      { value: "FURADO", label: "Furado" },
      { value: "INDICIOS_DE_DETERIORACAO", label: "Indícios de Deterioração" },
      { value: "INDICIOS_DE_VIOLACAO", label: "Indícios de Violação" },
      { value: "LACRE_VIOLADO", label: "Lacre Violado" },
      { value: "MOLHADO", label: "Molhado" },
      { value: "QUEBRADO", label: "Quebrado" },
      { value: "RASGADO", label: "Rasgado" },
      { value: "REFITADO", label: "Refitado" },
      { value: "REPREGADO", label: "Repregado" },
      { value: "RISCADO", label: "Riscado" },
      { value: "SENSOR_DE_IMPACTO_ATIVADO", label: "Sensor de Impacto Ativado" },
      { value: "SENSOR_DE_INCLINACAO_ATIVADO", label: "Sensor de Inclinação Ativado" },
      { value: "VAZAMENTO", label: "Vazamento" },
    ],
  },
];

interface RegisterCargoModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCargo?: WarehouseCargo | null;
}

export function RegisterCargoModal({ isOpen, onClose, editingCargo }: RegisterCargoModalProps) {
  const [step, setStep] = useState(1);
  const { mutateAsync: createCargo, isPending: isCreating } = useCreateCargo();
  const { mutateAsync: updateCargo, isPending: isUpdating } = useUpdateCargo();
  
  const { data: containersData } = useContainersList({ limit: 100 });
  const containers = containersData?.data || [];
  
  const { data: customersData } = useCustomers({ limit: 100 });
  const customers = (customersData as any)?.data || [];

  const [formData, setFormData] = useState<CreateWarehouseCargoDto>({
    description: '',
    cargoType: '',
    weightKg: '',
    quantity: 1,
    dangerous: false,
    containerId: '',
    customerId: '',
    documentType: '',
    documentNumber: '',
    entryDate: new Date().toISOString().split("T")[0],
    exitDate: '',
    entryContainerId: '',
    exitContainerId: '',
    packagingType: '',
    volume: 0,
    location: '',
    cifValue: undefined,
    documents: [],
  });

  const [showDocument, setShowDocument] = useState(false);

  useEffect(() => {
    if (editingCargo) {
      setFormData({
        description: editingCargo.description,
        cargoType: editingCargo.cargoType || '',
        weightKg: editingCargo.weightKg || '',
        quantity: editingCargo.quantity,
        dangerous: editingCargo.dangerous,
        containerId: editingCargo.containerId || '',
        customerId: editingCargo.customerId || '',
        documentType: editingCargo.documentType || '',
        documentNumber: editingCargo.documentNumber || '',
        entryDate: editingCargo.entryDate ? editingCargo.entryDate.split('T')[0] : '',
        exitDate: editingCargo.exitDate ? editingCargo.exitDate.split('T')[0] : '',
        entryContainerId: editingCargo.entryContainerId || '',
        exitContainerId: editingCargo.exitContainerId || '',
        packagingType: editingCargo.packagingType || '',
        volume: editingCargo.volume || 0,
        location: editingCargo.location || '',
        cifValue: editingCargo.cifValue ? Number(editingCargo.cifValue) : undefined,
        documents: editingCargo.documents && editingCargo.documents.length > 0 ? editingCargo.documents : (editingCargo.documentNumber ? [{ type: editingCargo.documentType || 'NOTA_REMESSA', number: editingCargo.documentNumber }] : []),
      });
      if (editingCargo.documentNumber) setShowDocument(true);
    } else {
      resetForm();
    }
  }, [editingCargo, isOpen]);

  const resetForm = () => {
    setStep(1);
    setShowDocument(false);
    setFormData({
        description: '',
        cargoType: '',
        weightKg: '',
        quantity: 1,
        dangerous: false,
        containerId: '',
        customerId: '',
        documentType: '',
        documentNumber: '',
        entryDate: new Date().toISOString().split("T")[0],
        exitDate: '',
        entryContainerId: '',
        exitContainerId: '',
        packagingType: '',
        volume: 0,
        location: '',
        cifValue: undefined,
        documents: [],
      });
  };

  const handleNext = () => setStep((s) => s + 1);
  const handlePrev = () => setStep((s) => s - 1);

  const handleSubmit = async () => {
    try {
      const sanitizedWeight = formData.weightKg?.toString().replace(',', '.').trim();
      
      // Sanitização rigorosa para evitar erros de validação no DTO (UUIDs e Datas não aceitam string vazia)
      const payload: any = {

        ...formData,
        containerId: formData.containerId?.trim() || undefined,
        customerId: formData.customerId?.trim() || undefined,
        entryContainerId: formData.entryContainerId?.trim() || undefined,
        exitContainerId: formData.exitContainerId?.trim() || undefined,
        entryDate: formData.entryDate || undefined,
        exitDate: formData.exitDate || undefined,
        documentType: formData.documentType || undefined,
        documentNumber: formData.documentNumber?.trim() || undefined,
        cargoType: formData.cargoType?.trim() || undefined,
        packagingType: formData.packagingType?.trim() || undefined,
        location: formData.location?.trim() || undefined,
        weightKg: sanitizedWeight || undefined,
        volume: !isNaN(Number(formData.volume)) ? Number(formData.volume) : undefined,
        quantity: !isNaN(Number(formData.quantity)) && Number(formData.quantity) > 0 ? Number(formData.quantity) : 1,
        cifValue: formData.cifValue ? Number(formData.cifValue) : undefined,
        documents: formData.documents?.filter(d => Boolean(d.number)) || undefined,
      };

      if (editingCargo) {
        await updateCargo({ id: editingCargo.id, data: payload });
        toast.success('Carga atualizada com sucesso!');
      } else {
        await createCargo(payload);
        toast.success('Carga registrada com sucesso!');
      }

      // Marcar container como CHEIO automaticamente quando houver vinculo
      if (payload.containerId) {
        try {
          await containersService.update(payload.containerId, { isFull: true });
        } catch (e) {
          console.error("[DEBUG] Error setting container to full:", e);
        }
      }

      onClose();
    } catch (err: any) {
      console.error("[DEBUG] Error saving cargo:", err);
      
      const serverMessage = err.response?.data?.message;
      const errorMessage = Array.isArray(serverMessage) 
        ? serverMessage[0] 
        : serverMessage || 'Falha ao processar requisição de salvamento.';
        
      toast.error(errorMessage);
    }
  };

  const isPending = isCreating || isUpdating;

  // Logic for automatic location/dates when container is selected
  useEffect(() => {
    if (formData.containerId && !editingCargo) {
        const selectedContainer = containers.find(c => c.id === formData.containerId);
        if (selectedContainer) {
            setFormData(prev => ({
                ...prev,
                location: selectedContainer.location || prev.location,
                entryDate: selectedContainer.entryDate ? selectedContainer.entryDate.split('T')[0] : prev.entryDate,
                exitDate: selectedContainer.exitDate ? selectedContainer.exitDate.split('T')[0] : prev.exitDate,
            }));
        }
    }
  }, [formData.containerId, containers, editingCargo]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden gap-0 border-none shadow-2xl">
        <div className="bg-primary-600 px-8 py-6">
          <DialogTitle className="text-2xl font-bold text-white">
            {editingCargo ? 'Editar Carga' : 'Registrar Nova Carga'}
          </DialogTitle>
          <p className="text-primary-100 mt-1">
            {step === 1
              ? "Identificação e dados da carga"
              : step === 2
                ? "Informações logísticas e pátio"
                : "Vistoria e avarias"}
          </p>
        </div>

        <div className="p-8 space-y-6 bg-white min-h-[480px]">
          {/* Progress Indicator */}
          <div className="mb-10 text-center">
            <div className="flex items-center justify-between relative px-2">
              <div className="absolute top-6 left-10 right-10 h-0.5 bg-gray-100 -z-0" />
              <div className="absolute top-6 left-10 right-10 h-0.5 -z-0">
                <div 
                    className="h-full bg-primary-600 transition-all duration-500" 
                    style={{ width: `${(step - 1) * 50}%` }}
                />
              </div>

              {/* Step 1 */}
              <div className="relative z-10 flex flex-col items-center flex-1">
                <div className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300",
                    step >= 1 ? "bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-100" : "bg-white border-gray-200 text-gray-400"
                )}>
                  <Package size={20} />
                </div>
                <p className={cn("text-[10px] font-bold mt-2 uppercase tracking-wider", step >= 1 ? "text-primary-600" : "text-gray-400")}>Identificação</p>
              </div>

              {/* Step 2 */}
              <div className="relative z-10 flex flex-col items-center flex-1">
                <div className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300",
                    step >= 2 ? "bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-100" : "bg-white border-gray-200 text-gray-400"
                )}>
                  <Truck size={20} />
                </div>
                <p className={cn("text-[10px] font-bold mt-2 uppercase tracking-wider", step >= 2 ? "text-primary-600" : "text-gray-400")}>Logística</p>
              </div>

              {/* Step 3 */}
              <div className="relative z-10 flex flex-col items-center flex-1">
                <div className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300",
                    step >= 3 ? "bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-100" : "bg-white border-gray-200 text-gray-400"
                )}>
                  <AlertTriangle size={20} />
                </div>
                <p className={cn("text-[10px] font-bold mt-2 uppercase tracking-wider", step >= 3 ? "text-primary-600" : "text-gray-400")}>Vistoria</p>
              </div>
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="grid gap-2">
                <Label htmlFor="description" className="text-gray-600 font-semibold">Descrição da Carga <span className="text-red-500">*</span></Label>
                <Input
                  id="description"
                  placeholder="EX: COMPONENTES ELETRÔNICOS"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value.toUpperCase() })}
                  className="h-11 bg-gray-50 border-gray-200 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="grid gap-2">
                    <Label className="text-gray-600 font-semibold">Cliente / Importador</Label>
                    <Select 
                    value={formData.customerId} 
                    onValueChange={(v) => setFormData({ ...formData, customerId: v })}
                    >
                    <SelectTrigger className="h-11 bg-gray-50 border-gray-200">
                        <SelectValue placeholder="Selecione o cliente..." />
                    </SelectTrigger>
                    <SelectContent>
                        {customers.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>
                            {c.name || c.corporateName}
                        </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                </div>
              </div>

              {/* Documento Section */}
              <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                       <FileText size={14} className="text-primary-500" /> Documentação
                    </Label>
                    <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 text-[10px] uppercase font-bold text-primary-600 hover:bg-primary-50"
                        onClick={() => setFormData({ ...formData, documents: [...(formData.documents || []), { type: 'NOTA_REMESSA', number: '' }] })}
                    >
                        <Plus size={12} className="mr-1" /> Adicionar
                    </Button>
                </div>

                {formData.documents && formData.documents.map((doc, idx) => (
                    <div key={idx} className="grid grid-cols-5 gap-2 animate-in zoom-in-95 duration-200">
                        <div className="col-span-2">
                            <Select 
                                value={doc.type || ''} 
                                onValueChange={(v) => {
                                    const newDocs = [...formData.documents!];
                                    newDocs[idx].type = v;
                                    setFormData({ ...formData, documents: newDocs });
                                }}
                            >
                                <SelectTrigger className="bg-white border-gray-200 h-10 text-xs">
                                    <SelectValue placeholder="Tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="NOTA_REMESSA">Nota de Remessa</SelectItem>
                                    <SelectItem value="DI">DI</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="col-span-2">
                            <Input
                                placeholder="Número"
                                value={doc.number || ''}
                                onChange={(e) => {
                                    const newDocs = [...formData.documents!];
                                    newDocs[idx].number = e.target.value;
                                    setFormData({ ...formData, documents: newDocs });
                                }}
                                className="bg-white border-gray-200 h-10 text-xs font-mono"
                            />
                        </div>
                        <div className="col-span-1 flex items-center justify-end">
                            <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-gray-400 hover:text-red-500"
                                onClick={() => {
                                    const newDocs = formData.documents!.filter((_, i) => i !== idx);
                                    setFormData({ ...formData, documents: newDocs });
                                }}
                            >
                                <Trash2 size={16} />
                            </Button>
                        </div>
                    </div>
                ))}
              </div>

              {/* Physical details grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="grid gap-2 col-span-2">
                    <Label className="text-gray-600 font-semibold">Tipo de Carga</Label>
                    <Select 
                        value={formData.cargoType || formData.packagingType || ''} 
                        onValueChange={(v) => setFormData({ ...formData, cargoType: v, packagingType: v })}
                    >
                        <SelectTrigger className="h-11 bg-gray-50 border-gray-200">
                            <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="BOXES">Caixaria</SelectItem>
                            <SelectItem value="PALLETIZED">Paletizada</SelectItem>
                            <SelectItem value="LOOSE">Solta / Unidade</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="quantity" className="text-gray-600 font-semibold">Qtd (Vol)</Label>
                    <Input
                        id="quantity"
                        type="number"
                        min={1}
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                        className="h-11 bg-gray-50 border-gray-200"
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="weight" className="text-gray-600 font-semibold">Peso (kg)</Label>
                    <Input
                        id="weight"
                        placeholder="0.00"
                        value={formData.weightKg || ''}
                        onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
                        className="h-11 bg-gray-50 border-gray-200 font-mono"
                    />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="volume" className="text-gray-600 font-semibold italic flex items-center gap-2">
                        <Ruler size={14} className="text-gray-400" /> Volume (m³)
                    </Label>
                    <Input
                        id="volume"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.volume}
                        onChange={(e) => setFormData({ ...formData, volume: Number(e.target.value) })}
                        className="h-11 bg-gray-50 border-gray-200"
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="cifValue" className="text-gray-600 font-semibold">Valor CIF (R$)</Label>
                    <Input
                        id="cifValue"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.cifValue || ''}
                        onChange={(e) => setFormData({ ...formData, cifValue: e.target.value ? Number(e.target.value) : undefined })}
                        className="h-11 bg-gray-50 border-gray-200 font-mono"
                    />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-gray-600 font-semibold">Contêiner Atual (No Pátio)</Label>
                  <Select 
                    value={formData.containerId || 'loose'} 
                    onValueChange={(v) => setFormData({ ...formData, containerId: v === 'loose' ? '' : v })}
                  >
                    <SelectTrigger className="h-11 bg-gray-50 border-gray-200">
                      <SelectValue placeholder="Carga Solta" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="loose">Carga Solta (Nenhum)</SelectItem>
                      {containers.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>{c.containerNumber}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="location" className="text-gray-600 font-semibold">Localização no Armazém</Label>
                  <Input
                    id="location"
                    placeholder="Ex: QUADRA A-1"
                    value={formData.location || ''}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value.toUpperCase() })}
                    className="h-11 bg-gray-50 border-gray-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-50">
                <div className="grid gap-2">
                  <Label className="text-xs font-bold text-gray-400 uppercase">Input / Entrada</Label>
                  <Select 
                    value={formData.entryContainerId || ''} 
                    onValueChange={(v) => setFormData({ ...formData, entryContainerId: v })}
                  >
                    <SelectTrigger className="h-10 bg-white border-gray-200 text-xs">
                      <SelectValue placeholder="Contêiner Origem" />
                    </SelectTrigger>
                    <SelectContent>
                      {containers.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>{c.containerNumber}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="date"
                    value={formData.entryDate || ''}
                    onChange={(e) => setFormData({ ...formData, entryDate: e.target.value })}
                    className="h-10 bg-white border-gray-200 text-xs"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs font-bold text-gray-400 uppercase">Output / Saída</Label>
                  <Select 
                    value={formData.exitContainerId || ''} 
                    onValueChange={(v) => setFormData({ ...formData, exitContainerId: v })}
                  >
                    <SelectTrigger className="h-10 bg-white border-gray-200 text-xs">
                      <SelectValue placeholder="Contêiner Destino" />
                    </SelectTrigger>
                    <SelectContent>
                      {containers.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>{c.containerNumber}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="date"
                    value={formData.exitDate || ''}
                    onChange={(e) => setFormData({ ...formData, exitDate: e.target.value })}
                    className="h-10 bg-white border-gray-200 text-xs"
                  />
                </div>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-3 text-amber-800 text-[11px] leading-relaxed">
                <div className="bg-amber-100 w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                    <Box size={16} className="text-amber-600" />
                </div>
                <p><strong>Atenção:</strong> O campo <em>Contêiner Atual</em> representa onde a carga está fisicamente agora. Os campos de <em>Entrada/Saída</em> servem para auditoria de fluxo.</p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                {/* Dangerous Toggle Improved */}
                <div className={cn(
                    "p-4 rounded-2xl border-2 transition-all duration-300 flex items-center justify-between gap-4",
                    formData.dangerous ? "bg-red-50 border-red-200 shadow-md shadow-red-100" : "bg-gray-50 border-gray-100"
                )}>
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                            formData.dangerous ? "bg-red-600 text-white animate-pulse" : "bg-gray-200 text-gray-400"
                        )}>
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <h4 className={cn("text-sm font-bold uppercase tracking-tight", formData.dangerous ? "text-red-700" : "text-gray-700")}>
                                Carga Perigosa (IMO)
                            </h4>
                            <p className="text-[10px] text-gray-500 font-medium">Sinalize se a mercadoria possui riscos químicos ou inflamáveis.</p>
                        </div>
                    </div>
                    <Switch 
                        checked={formData.dangerous}
                        onCheckedChange={(checked) => setFormData({ ...formData, dangerous: checked })}
                        className={cn(formData.dangerous && "data-[state=checked]:bg-red-600")}
                    />
                </div>

               <div className="grid gap-2">
                    <Label className="text-gray-600 font-semibold">Avarias Identificadas</Label>
                    <GroupedMultiSelect
                        groups={DAMAGE_GROUPS}
                        selected={[]} 
                        onChange={() => {}} 
                        placeholder="Selecione as avarias encontradas..."
                    />
                </div>

                <div className="grid gap-2">
                    <Label className="text-gray-600 font-semibold">Observações de Vistoria</Label>
                    <Textarea
                        placeholder="Detalhes adicionais sobre o estado da mercadoria..."
                        className="min-h-[100px] bg-gray-50 border-gray-200 border-dashed focus:bg-white transition-all"
                        value={formData.description.includes('OBS:') ? formData.description.split('OBS:')[1].trim() : ''}
                        onChange={(e) => {
                            const baseDesc = formData.description.split('OBS:')[0].trim();
                            setFormData({ ...formData, description: `${baseDesc} OBS: ${e.target.value}` });
                        }}
                    />
                </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-6 bg-gray-50 border-t">
          <div className="flex justify-between w-full items-center">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrev}
              disabled={step === 1}
              className="px-6 h-11 rounded-xl border-gray-200 text-gray-600 font-bold text-xs uppercase"
            >
              <ChevronLeft size={16} className="mr-1" /> Voltar
            </Button>
            
            {step < 3 ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={step === 1 && (!formData.description || !formData.customerId)}
                className="px-8 h-11 bg-primary-600 hover:bg-primary-700 rounded-xl text-white font-bold text-xs uppercase shadow-lg shadow-primary-200"
              >
                Próximo <ChevronRight size={16} className="ml-1" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isPending}
                className="px-8 h-11 bg-green-600 hover:bg-green-700 rounded-xl text-white font-bold text-xs uppercase shadow-lg shadow-green-200"
              >
                {isPending ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                {editingCargo ? 'Salvar Alterações' : 'Finalizar Registro'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
