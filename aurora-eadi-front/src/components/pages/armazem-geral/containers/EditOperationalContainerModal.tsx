"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
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
import { useUpdateContainer } from "@/hooks/armazem-geral/useContainers";
import { useCustomers } from "@/hooks/useCustomers";
import { toast } from "sonner";
import { Package, Truck, AlertTriangle, ChevronRight, ChevronLeft, Save, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { OperationalContainer } from "@/types/armazem-geral";

const CONTAINER_TYPES = ["20 DRY", "40 DRY", "40 HC", "20 REEFER", "40 REEFER", "OPEN TOP", "FLAT RACK"];

interface EditOperationalContainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  container: OperationalContainer;
}

export function EditOperationalContainerModal({
  isOpen,
  onClose,
  container,
}: EditOperationalContainerModalProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    containerType: "",
    originalSeal: "",
    customerId: "",
    isFull: "true",
    entryDate: "",
    freeTimeDate: "",
    origin: "",
    destination: "",
    location: "",
    observations: "",
    avarias: [] as string[],
  });

  useEffect(() => {
    if (isOpen && container) {
      setFormData({
        containerType: container.containerType || "",
        originalSeal: container.originalSeal || "",
        customerId: (container as any).customerId || "",
        isFull: container.isFull ? "true" : "false",
        entryDate: container.entryDate ? new Date(container.entryDate).toISOString().split("T")[0] : "",
        freeTimeDate: container.freeTimeDate ? new Date(container.freeTimeDate).toISOString().split("T")[0] : "",
        origin: container.origin || "",
        destination: container.destination || "",
        location: container.location || "",
        observations: container.observations || "",
        avarias: container.damages?.map(d => d.description) || [],
      });
      setStep(1);
    }
  }, [isOpen, container]);

  const { mutateAsync: updateContainer, isPending } = useUpdateContainer();
  const { data: customersData } = useCustomers({ limit: 100 });
  const customers = (customersData as any)?.data || [];

  const handleNext = () => setStep((s) => s + 1);
  const handlePrev = () => setStep((s) => s - 1);

  const handleSubmit = async () => {
    try {
      const payload = {
        ...formData,
        isFull: formData.isFull === "true",
        location: formData.location.trim() || undefined,
        containerType: formData.containerType.trim() || undefined,
        originalSeal: formData.originalSeal.trim() || undefined,
        origin: formData.origin.trim() || undefined,
        destination: formData.destination.trim() || undefined,
        freeTimeDate: formData.freeTimeDate || undefined,
        entryDate: formData.entryDate || undefined,
        observations: formData.observations.trim() || undefined,
        avarias: formData.avarias,
      };

      await updateContainer({ id: container.id, data: payload });
      toast.success("Container atualizado com sucesso!");
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao atualizar container.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden gap-0 border-none shadow-2xl">
        <div className="bg-primary-600 px-8 py-6">
          <DialogTitle className="text-2xl font-bold text-white">Editar Container</DialogTitle>
          <p className="text-primary-100 mt-1">
            {step === 1
              ? "Atualize os dados básicos do container"
              : step === 2
                ? "Atualize os dados logísticos"
                : "Revise as avarias e observações"}
          </p>
        </div>

        <div className="p-8 space-y-6 bg-white">
          {/* Progress Indicator (Standard de Projeto) */}
          <div className="mb-10">
            <div className="flex items-center justify-between">
              {/* Step 1 */}
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                    step >= 1
                      ? "bg-primary-600 border-primary-600"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  <Package className={step >= 1 ? "text-white" : "text-gray-400"} size={20} />
                </div>
                <p className={`text-sm font-medium mt-3 transition-colors ${step >= 1 ? "text-primary-600" : "text-gray-400"}`}>
                  Identificação
                </p>
                <p className={`text-xs mt-1 text-center max-w-[140px] transition-colors ${step >= 1 ? "text-gray-600" : "text-gray-400"}`}>
                  Dados do container
                </p>
              </div>

              {/* Progress Line 1 */}
              <div className="flex-1 flex items-center px-2 md:px-4" style={{ maxWidth: "140px", marginTop: "-45px" }}>
                <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-500 ease-in-out ${step >= 2 ? "bg-primary-600 w-full" : "bg-primary-600 w-0"}`} />
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                    step >= 2
                      ? "bg-primary-600 border-primary-600"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  <Truck className={step >= 2 ? "text-white" : "text-gray-400"} size={20} />
                </div>
                <p className={`text-sm font-medium mt-3 transition-colors ${step >= 2 ? "text-primary-600" : "text-gray-400"}`}>
                  Logística
                </p>
                <p className={`text-xs mt-1 text-center max-w-[140px] transition-colors ${step >= 2 ? "text-gray-600" : "text-gray-400"}`}>
                  Datas e origem
                </p>
              </div>

              {/* Progress Line 2 */}
              <div className="flex-1 flex items-center px-2 md:px-4" style={{ maxWidth: "140px", marginTop: "-45px" }}>
                <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-500 ease-in-out ${step >= 3 ? "bg-primary-600 w-full" : "bg-primary-600 w-0"}`} />
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                    step >= 3
                      ? "bg-primary-600 border-primary-600"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  <AlertTriangle className={step >= 3 ? "text-white" : "text-gray-400"} size={20} />
                </div>
                <p className={`text-sm font-medium mt-3 transition-colors ${step >= 3 ? "text-primary-600" : "text-gray-400"}`}>
                  Vistoria
                </p>
                <p className={`text-xs mt-1 text-center max-w-[140px] transition-colors ${step >= 3 ? "text-gray-600" : "text-gray-400"}`}>
                  Avarias e fotos
                </p>
              </div>
            </div>
          </div>
          {step === 1 && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <div className="grid gap-2">
                <Label>Cliente (Empresa)</Label>
                <Select 
                  value={formData.customerId} 
                  onValueChange={(v) => setFormData({ ...formData, customerId: v })}
                >
                  <SelectTrigger>
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
              <div className="grid gap-2">
                <Label htmlFor="originalSeal">Lacre de Origem</Label>
                <Input
                  id="originalSeal"
                  placeholder="EX: 0001"
                  value={formData.originalSeal}
                  onChange={(e) => setFormData({ ...formData, originalSeal: e.target.value.toUpperCase() })}
                  className="font-mono uppercase"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Tipo de Container</Label>
                  <Select 
                    value={formData.containerType} 
                    onValueChange={(v) => setFormData({ ...formData, containerType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTAINER_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="entryDate">Data de Entrada</Label>
                  <Input
                    id="entryDate"
                    type="date"
                    value={formData.entryDate}
                    onChange={(e) => setFormData({ ...formData, entryDate: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="freeTimeDate">Data Free Time</Label>
                  <Input
                    id="freeTimeDate"
                    type="date"
                    value={formData.freeTimeDate}
                    onChange={(e) => setFormData({ ...formData, freeTimeDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="origin">Origem</Label>
                  <Input
                    id="origin"
                    placeholder="Cidade / Porto de Origem"
                    value={formData.origin}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="destination">Destino</Label>
                  <Input
                    id="destination"
                    placeholder="Cidade / Fábrica de Destino"
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">Localização no Pátio</Label>
                <Input
                  id="location"
                  placeholder="Ex: QUADRA A - LINHA 05"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <div className="grid gap-2">
                <Label>Avarias Identificadas</Label>
                <GroupedMultiSelect
                  groups={CONTAINER_DAMAGE_GROUPS}
                  selected={formData.avarias}
                  onChange={(selected) => setFormData({ ...formData, avarias: selected })}
                  placeholder="Selecione as avarias encontradas..."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="observations">Observações Gerais</Label>
                <Textarea
                  id="observations"
                  placeholder="Descreva detalhes adicionais..."
                  className="min-h-[120px] resize-none"
                  value={formData.observations}
                  onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                />
              </div>
              <div className={cn(
                "p-3 rounded-lg border flex items-center gap-3 text-sm",
                formData.avarias.length > 0 ? "bg-red-50 border-red-200 text-red-800" : "bg-green-50 border-green-200 text-green-800"
              )}>
                <AlertTriangle size={18} className={formData.avarias.length > 0 ? "text-red-500" : "text-green-500"} />
                <p>
                  {formData.avarias.length > 0 
                    ? `Foram identificadas ${formData.avarias.length} avarias neste container.`
                    : "Nenhuma avaria selecionada para este container."}
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-6 bg-gray-50 border-t">
          <div className="flex justify-between w-full items-center">
            <Button
              type="button"
              variant="ghost"
              onClick={handlePrev}
              disabled={step === 1}
              className="gap-2"
            >
              <ChevronLeft size={16} /> Voltar
            </Button>
            
            {step < 3 ? (
              <Button
                type="button"
                onClick={handleNext}
                className="gap-2 bg-primary-600 hover:bg-primary-700 min-w-[120px] text-white"
              >
                Próximo <ChevronRight size={16} />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isPending}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 min-w-[150px] text-white"
              >
                {isPending ? "Salvando..." : (
                  <>
                    <Save size={16} /> Salvar Alterações
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
