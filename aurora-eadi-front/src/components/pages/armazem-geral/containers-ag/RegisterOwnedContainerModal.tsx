"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { GroupedMultiSelect } from "@/components/ui/GroupedMultiSelect";
import { CONTAINER_DAMAGE_GROUPS } from "@/config/armazem-geral/container-damages";
import { 
  useCreateOwnedContainer, 
  useUpdateOwnedContainer, 
  useNextOwnedContainerCode 
} from "@/hooks/armazem-geral/useOwnedContainers";
import { useSuppliersByType } from "@/hooks/useSuppliers";
import { WarehouseOwnedContainer, WarehouseOwnedContainerStatus } from "@/types/armazem-geral";
import { toast } from "sonner";
import { Package, Truck, AlertTriangle, ChevronRight, ChevronLeft, Save, Building2, Hash, MapPin, ClipboardList, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const CONTAINER_TYPES = ["20 DRY", "40 DRY", "40 HC", "20 REEFER", "40 REEFER", "OPEN TOP", "FLAT RACK"];

interface RegisterOwnedContainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingContainer?: WarehouseOwnedContainer | null;
}

export function RegisterOwnedContainerModal({
  isOpen,
  onClose,
  editingContainer,
}: RegisterOwnedContainerModalProps) {
  const [step, setStep] = useState(1);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    containerNumber: "",
    containerType: "",
    supplierId: "NONE",
    isFull: "false",
    status: "AVAILABLE" as WarehouseOwnedContainerStatus,
    location: "",
    observations: "",
    avarias: [] as string[],
  });

  const { data: suppliersData } = useSuppliersByType("Locação de equipamentos");
  const suppliers = suppliersData?.data || [];
  const { data: nextCodeData, refetch: refetchNextCode } = useNextOwnedContainerCode(isOpen && !editingContainer);
  const { mutateAsync: createContainer, isPending: isCreating } = useCreateOwnedContainer();
  const { mutateAsync: updateContainer, isPending: isUpdating } = useUpdateOwnedContainer();
  const isPending = isCreating || isUpdating;

  useEffect(() => {
    if (editingContainer) {
      setFormData({
        code: editingContainer.code || "",
        containerNumber: editingContainer.containerNumber || "",
        containerType: editingContainer.containerType || "",
        supplierId: editingContainer.supplierId || "NONE",
        isFull: String(editingContainer.isFull),
        status: editingContainer.status,
        location: editingContainer.location || "",
        observations: editingContainer.observations || "",
        avarias: editingContainer.damages?.map(d => d.description) || [],
      });
    } else {
      resetForm();
    }
  }, [editingContainer, isOpen]);

  // Set code when nextCodeData is available
  useEffect(() => {
    if (nextCodeData && !editingContainer && isOpen) {
      setFormData(prev => ({ ...prev, code: nextCodeData.code }));
    }
  }, [nextCodeData, editingContainer, isOpen]);

  const handleNext = () => setStep((s) => s + 1);
  const handlePrev = () => setStep((s) => s - 1);

  const handleSubmit = async () => {
    try {
      const payload = {
        ...formData,
        isFull: formData.isFull === "true",
        code: formData.code.trim().toUpperCase(),
        containerNumber: formData.containerNumber.trim().toUpperCase() || undefined,
        containerType: formData.containerType || undefined,
        supplierId: formData.supplierId !== "NONE" ? formData.supplierId : undefined,
        location: formData.location.trim().toUpperCase() || undefined,
        observations: formData.observations.trim() || undefined,
        avarias: formData.avarias.length > 0 ? formData.avarias : undefined,
      };

      if (editingContainer) {
        await updateContainer({ id: editingContainer.id, data: payload });
        toast.success("Container próprio atualizado com sucesso!");
      } else {
        await createContainer(payload);
        toast.success("Container próprio registrado com sucesso!");
      }
      onClose();
      resetForm();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao processar container.");
    }
  };

  const resetForm = () => {
    setStep(1);
    setFormData({
      code: "",
      containerNumber: "",
      containerType: "",
      supplierId: "NONE",
      isFull: "false",
      status: "AVAILABLE",
      location: "",
      observations: "",
      avarias: [],
    });
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden gap-0 border-none shadow-2xl">
        {/* Header com Gradiente */}
        <div className="bg-gradient-to-r from-primary-700 to-primary-600 px-8 py-8">
          <DialogTitle className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
            <Package size={28} className="text-primary-200" />
            {editingContainer ? "Editar Ativo" : "Novo Container Próprio"}
          </DialogTitle>
          <p className="text-primary-100 mt-2 font-medium opacity-90">
             {step === 1 ? "1. Identificação Básica" : step === 2 ? "2. Estado e Localização" : "3. Vistoria de Avarias"}
          </p>
        </div>

        <div className="p-8 space-y-8 bg-white">
          {/* Progress Indicator */}
          <div className="mb-12">
            <div className="flex items-center justify-between relative px-4">
              {[
                { icon: Hash, label: "Identificação", step: 1 },
                { icon: MapPin, label: "Estado", step: 2 },
                { icon: AlertTriangle, label: "Vistoria", step: 3 }
              ].map((item, idx) => (
                <React.Fragment key={item.step}>
                  <div className="flex flex-col items-center z-10">
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-500 shadow-sm",
                      step >= item.step ? "bg-primary-600 border-primary-600 text-white" : "bg-white border-gray-200 text-gray-400"
                    )}>
                      <item.icon size={20} />
                    </div>
                    <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest mt-3 transition-colors duration-300",
                        step >= item.step ? "text-primary-700" : "text-gray-400"
                    )}>
                        {item.label}
                    </span>
                  </div>
                  {idx < 2 && (
                    <div className="flex-1 h-[2px] bg-gray-100 mx-2 -mt-7">
                        <div className={cn(
                            "h-full bg-primary-500 transition-all duration-700 ease-in-out",
                            step > item.step ? "w-full" : "w-0"
                        )} />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Step 1: Identificação */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2 text-left">
                    <Label htmlFor="code" className="text-xs font-black uppercase tracking-wider text-gray-500">Código Interno *</Label>
                    <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-400" size={16} />
                        <Input
                          id="code"
                          readOnly
                          disabled
                          placeholder="AG-24/0001"
                          className="h-11 pl-10 font-mono font-black uppercase bg-gray-100 border-gray-200 cursor-not-allowed opacity-80 text-primary-900"
                          value={formData.code}
                        />
                    </div>
                  </div>
                  <div className="space-y-2 text-left">
                    <Label htmlFor="containerNumber" className="text-xs font-black uppercase tracking-wider text-gray-500">Número do Container</Label>
                    <Input
                      id="containerNumber"
                      placeholder="EX: ABCU1234567"
                      className="h-11 font-mono uppercase bg-gray-50 border-gray-200 focus:bg-white transition-all shadow-sm"
                      value={formData.containerNumber}
                      onChange={(e) => setFormData({ ...formData, containerNumber: e.target.value })}
                    />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2 text-left">
                    <Label className="text-xs font-black uppercase tracking-wider text-gray-500">Fornecedor</Label>
                    <div className="flex gap-2">
                        <Select 
                          value={formData.supplierId} 
                          onValueChange={(v) => setFormData({ ...formData, supplierId: v })}
                        >
                          <SelectTrigger className="h-11 bg-gray-50 border-gray-200 shadow-sm text-sm font-semibold">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NONE">Não Informado</SelectItem>
                            {suppliers?.map(s => (
                              <SelectItem key={s.id} value={s.id}>{s.fantasyName}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                    </div>
                  </div>
                  <div className="space-y-2 text-left">
                    <Label className="text-xs font-black uppercase tracking-wider text-gray-500">Tipo / Tamanho</Label>
                    <Select value={formData.containerType} onValueChange={(v) => setFormData({ ...formData, containerType: v })}>
                      <SelectTrigger className="h-11 bg-gray-50 border-gray-200 shadow-sm">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {CONTAINER_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
               </div>
            </div>
          )}

          {/* Step 2: Estado e Localização */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 text-left">
              <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-wider text-gray-500">Status Operacional</Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(v) => setFormData({ ...formData, status: v as WarehouseOwnedContainerStatus })}
                    >
                      <SelectTrigger className="h-11 bg-gray-50 border-gray-200 shadow-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AVAILABLE">Disponível</SelectItem>
                        <SelectItem value="IN_USE">Em Uso</SelectItem>
                        <SelectItem value="MAINTENANCE">Manutenção</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
               </div>

               <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-gray-500">Localização no Pátio</Label>
                  <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <Input
                        placeholder="Ex: QUADRA 10 - FILA B"
                        className="h-11 pl-10 bg-gray-50 border-gray-200 focus:bg-white transition-all shadow-sm font-bold tracking-tight uppercase"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      />
                  </div>
               </div>
            </div>
          )}

          {/* Step 3: Vistoria */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 text-left">
               <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-gray-500">Avarias Identificadas</Label>
                  <GroupedMultiSelect
                    groups={CONTAINER_DAMAGE_GROUPS}
                    selected={formData.avarias}
                    onChange={(selected) => setFormData({ ...formData, avarias: selected })}
                    placeholder="Selecione as avarias encontradas..."
                  />
               </div>

               <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-gray-500 flex items-center gap-2">
                      <ClipboardList size={14} className="text-primary-500" /> Observações Adicionais
                  </Label>
                  <Textarea
                    placeholder="Descreva detalhes específicos do estado do container..."
                    className="min-h-[120px] bg-gray-50 border-gray-200 focus:bg-white transition-all shadow-sm resize-none"
                    value={formData.observations}
                    onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                  />
               </div>

               <div className={cn(
                  "p-4 rounded-xl border flex items-center gap-4 transition-all duration-500",
                  formData.avarias.length > 0 ? "bg-red-50 border-red-200 text-red-800" : "bg-green-50 border-green-200 text-green-800"
               )}>
                  <div className={cn(
                      "p-2 rounded-full",
                      formData.avarias.length > 0 ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
                  )}>
                    <AlertTriangle size={20} />
                  </div>
                  <p className="text-sm font-semibold">
                    {formData.avarias.length > 0 
                      ? `${formData.avarias.length} avarias serão registradas no banco.`
                      : "Nenhuma avaria foi selecionada."}
                  </p>
               </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-6 bg-gray-50 border-t border-gray-100 flex items-center">
          <div className="flex justify-between w-full">
            <Button
              type="button"
              variant="ghost"
              onClick={handlePrev}
              disabled={step === 1}
              className="gap-2 font-black text-xs uppercase tracking-widest text-gray-400 hover:text-gray-600"
            >
              <ChevronLeft size={16} /> Voltar
            </Button>
            
            {step < 3 ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={!formData.code}
                className="gap-3 bg-primary-600 hover:bg-primary-700 text-white font-black text-xs uppercase tracking-widest px-8 shadow-lg shadow-primary-200 transition-all rounded-xl"
              >
                Próximo <ChevronRight size={16} />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isPending}
                className={cn(
                    "gap-3 font-black text-xs uppercase tracking-widest px-8 shadow-lg transition-all rounded-xl",
                    editingContainer ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200" : "bg-green-600 hover:bg-green-700 text-white shadow-green-200"
                )}
              >
                {isPending ? "Processando..." : (
                  <>
                    <Save size={16} /> {editingContainer ? "Salvar Alterações" : "Concluir Registro"}
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    </>
  );
}
