"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, LogOut, Truck, ChevronRight, ChevronLeft, CheckCircle2, Building2, ClipboardList, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useCustomers } from "@/hooks/useCustomers";
import { useCarriers } from "@/hooks/useCarriers";
import { useDispatchOwnedContainer } from "@/hooks/armazem-geral/useOwnedContainers";
import type { WarehouseOwnedContainer } from "@/types/armazem-geral";
import { cn } from "@/lib/utils";
import { GroupedMultiSelect } from "@/components/ui/GroupedMultiSelect";
import { CONTAINER_DAMAGE_GROUPS } from "@/config/armazem-geral/container-damages";

interface DispatchOwnedContainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  container: WarehouseOwnedContainer | null;
}

export function DispatchOwnedContainerModal({
  isOpen,
  onClose,
  container,
}: DispatchOwnedContainerModalProps) {
  const [step, setStep] = useState(1);
  const [customerId, setCustomerId] = useState<string | undefined>(undefined);
  const [carrierId, setCarrierId] = useState<string | undefined>(undefined);
  const [driverId, setDriverId] = useState<string | undefined>(undefined);
  const [vehicleId, setVehicleId] = useState<string | undefined>(undefined);
  const [avarias, setAvarias] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const { data: customersData, isLoading: isLoadingCustomers } = useCustomers({ limit: 200 });
  const customers = (customersData as any)?.data || [];

  const { data: carriersRes, isLoading: isLoadingCarriers } = useCarriers({
    page: 1,
    limit: 200,
    active: true,
  });
  const carriers = carriersRes?.data ?? [];

  const selectedCarrier = useMemo(
    () => carriers.find((c) => c.id === carrierId) ?? null,
    [carriers, carrierId],
  );

  const availableDrivers = selectedCarrier?.drivers?.filter((d) => d.active) ?? [];
  const availableVehicles = selectedCarrier?.vehicles?.filter((v) => v.active) ?? [];

  const { mutateAsync: dispatch, isPending } = useDispatchOwnedContainer();

  const containerLabel = useMemo(() => {
    if (!container) return "";
    return container.containerNumber || container.code;
  }, [container]);

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setCustomerId(undefined);
      setCarrierId(undefined);
      setDriverId(undefined);
      setVehicleId(undefined);
      setAvarias([]);
      setNotes("");
    }
  }, [isOpen]);

  useEffect(() => {
    setDriverId(undefined);
    setVehicleId(undefined);
  }, [carrierId]);

  const handleNext = () => setStep((s) => s + 1);
  const handlePrev = () => setStep((s) => s - 1);

  const handleSubmit = async () => {
    if (!container?.id || !customerId) return;

    try {
      await dispatch({
        id: container.id,
        data: {
          customerId,
          notes: notes.trim() || undefined,
          carrierId,
          driverId,
          vehicleId,
          avarias: avarias.length > 0 ? avarias : undefined,
        },
      });
      toast.success("Saída registrada");
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Erro ao registrar saída do contêiner próprio.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden gap-0 border-none shadow-2xl">
        <div className="bg-primary-600 px-8 py-6 text-left">
          <DialogTitle className="text-2xl font-bold text-white">Registrar Saída (Com Cliente)</DialogTitle>
          <p className="text-primary-100 mt-1">
            {step === 1
              ? `Informe o cliente que receberá o container ${containerLabel}`
              : step === 2
                ? "Informe os dados do transporte"
                : step === 3
                  ? "Registre as avarias se houver"
                  : "Revise os dados e confirme a saída"}
          </p>
        </div>

        <div className="p-8 space-y-6 bg-white">
          {/* Progress Indicator */}
          <div className="mb-10">
            <div className="flex items-center justify-between">
              {/* Step 1 */}
              <div className="flex flex-col items-center flex-1">
                <div
                  className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300",
                    step >= 1 ? "bg-primary-600 border-primary-600" : "border-gray-300 bg-white"
                  )}
                >
                  <Building2 className={step >= 1 ? "text-white" : "text-gray-400"} size={20} />
                </div>
                <p className={cn("text-[10px] font-bold uppercase tracking-wider mt-3 transition-colors", step >= 1 ? "text-primary-600" : "text-gray-400")}>
                  Destino
                </p>
              </div>

              {/* Progress Line 1 */}
              <div className="flex-1 flex items-center px-1 md:px-2" style={{ maxWidth: "80px", marginTop: "-30px" }}>
                <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div className={cn("h-full transition-all duration-500 ease-in-out", step >= 2 ? "bg-primary-600 w-full" : "bg-primary-600 w-0")} />
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center flex-1">
                <div
                  className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300",
                    step >= 2 ? "bg-primary-600 border-primary-600" : "border-gray-300 bg-white"
                  )}
                >
                  <Truck className={step >= 2 ? "text-white" : "text-gray-400"} size={20} />
                </div>
                <p className={cn("text-[10px] font-bold uppercase tracking-wider mt-3 transition-colors", step >= 2 ? "text-primary-600" : "text-gray-400")}>
                  Transporte
                </p>
              </div>

              {/* Progress Line 2 */}
              <div className="flex-1 flex items-center px-1 md:px-2" style={{ maxWidth: "80px", marginTop: "-30px" }}>
                <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div className={cn("h-full transition-all duration-500 ease-in-out", step >= 3 ? "bg-primary-600 w-full" : "bg-primary-600 w-0")} />
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center flex-1">
                <div
                  className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300",
                    step >= 3 ? "bg-primary-600 border-primary-600" : "border-gray-300 bg-white"
                  )}
                >
                  <AlertTriangle className={step >= 3 ? "text-white" : "text-gray-400"} size={20} />
                </div>
                <p className={cn("text-[10px] font-bold uppercase tracking-wider mt-3 transition-colors", step >= 3 ? "text-primary-600" : "text-gray-400")}>
                  Vistoria
                </p>
              </div>

              {/* Progress Line 3 */}
              <div className="flex-1 flex items-center px-1 md:px-2" style={{ maxWidth: "80px", marginTop: "-30px" }}>
                <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div className={cn("h-full transition-all duration-500 ease-in-out", step >= 4 ? "bg-primary-600 w-full" : "bg-primary-600 w-0")} />
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex flex-col items-center flex-1">
                <div
                  className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300",
                    step >= 4 ? "bg-primary-600 border-primary-600" : "border-gray-300 bg-white"
                  )}
                >
                  <ClipboardList className={step >= 4 ? "text-white" : "text-gray-400"} size={20} />
                </div>
                <p className={cn("text-[10px] font-bold uppercase tracking-wider mt-3 transition-colors", step >= 4 ? "text-primary-600" : "text-gray-400")}>
                  Finalizar
                </p>
              </div>
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 text-left">
               <div className="grid gap-2">
                <Label className="text-xs font-black uppercase tracking-wider text-gray-500">Contêiner Selecionado</Label>
                <div className="px-4 py-3 rounded-lg border bg-gray-50 text-primary-900 font-bold flex items-center gap-3">
                  <div className="bg-primary-100 p-2 rounded-full">
                    <Truck size={18} className="text-primary-600" />
                  </div>
                  {containerLabel}
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="text-xs font-black uppercase tracking-wider text-gray-500">
                  Cliente / Destinatário <span className="text-red-500">*</span>
                </Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger className="h-12 shadow-sm text-left">
                    <SelectValue placeholder={isLoadingCustomers ? "Carregando..." : "Selecione o cliente..."} />
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
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 text-left">
              <div className="grid gap-2">
                <Label className="text-xs font-black uppercase tracking-wider text-gray-500">Transportadora</Label>
                <Select
                  value={carrierId}
                  onValueChange={(value) => setCarrierId(value === "__NONE__" ? undefined : value)}
                >
                  <SelectTrigger className="h-11 shadow-sm">
                    <SelectValue placeholder={isLoadingCarriers ? "Carregando..." : "Selecione a transportadora"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__NONE__">Nenhuma</SelectItem>
                    {carriers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2 text-left">
                  <Label className="text-xs font-black uppercase tracking-wider text-gray-500">Motorista</Label>
                  <Select
                    value={driverId}
                    onValueChange={(value) => setDriverId(value === "__NONE__" ? undefined : value)}
                    disabled={!carrierId}
                  >
                    <SelectTrigger className="h-11 shadow-sm">
                      <SelectValue placeholder={!carrierId ? "Selecione a transportadora" : "Selecione"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__NONE__">Nenhum</SelectItem>
                      {availableDrivers.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2 text-left">
                  <Label className="text-xs font-black uppercase tracking-wider text-gray-500">Veículo</Label>
                  <Select
                    value={vehicleId}
                    onValueChange={(value) => setVehicleId(value === "__NONE__" ? undefined : value)}
                    disabled={!carrierId}
                  >
                    <SelectTrigger className="h-11 shadow-sm">
                      <SelectValue placeholder={!carrierId ? "Selecione a transportadora" : "Selecione"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__NONE__">Nenhum</SelectItem>
                      {availableVehicles.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.plate} {v.type ? `• ${v.type}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 text-left">
              <div className="grid gap-2">
                <Label className="text-xs font-black uppercase tracking-wider text-gray-500">Avarias Identificadas na Saída</Label>
                <GroupedMultiSelect
                  groups={CONTAINER_DAMAGE_GROUPS}
                  selected={avarias}
                  onChange={(selected) => setAvarias(selected)}
                  placeholder="Selecione as avarias encontradas na saída..."
                />
              </div>
              <div className={cn(
                "p-4 rounded-xl border flex items-center gap-4 transition-all duration-500",
                avarias.length > 0 ? "bg-red-50 border-red-200 text-red-800" : "bg-green-50 border-green-200 text-green-800"
              )}>
                <div className={cn(
                  "p-2 rounded-full",
                  avarias.length > 0 ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
                )}>
                  <AlertTriangle size={20} />
                </div>
                <p className="text-sm font-semibold">
                  {avarias.length > 0 
                    ? `${avarias.length} avarias serão registradas nesta saída.`
                    : "Nenhuma nova avaria detectada na saída."}
                </p>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 text-left">
              <div className="grid gap-2">
                <Label className="text-xs font-black uppercase tracking-wider text-gray-500">Observações de Saída</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex.: número da ordem, motorista responsável, destino final..."
                  className="min-h-[120px] resize-none shadow-sm h-11 bg-gray-50 border-gray-200 focus:bg-white transition-all shadow-sm"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-6 bg-gray-50 border-t border-gray-100">
          <div className="flex justify-between w-full items-center">
            <Button
              type="button"
              variant="ghost"
              onClick={handlePrev}
              disabled={step === 1}
              className="gap-2 font-black text-xs uppercase tracking-widest text-gray-400 hover:text-gray-600"
            >
              <ChevronLeft size={16} /> Voltar
            </Button>
            
            {step < 4 ? (
              <Button
                type="button"
                onClick={handleNext}
                disabled={step === 1 && !customerId}
                className="gap-3 bg-primary-600 hover:bg-primary-700 text-white font-black text-xs uppercase tracking-widest px-8 shadow-lg shadow-primary-200 transition-all rounded-xl min-w-[120px]"
              >
                Próximo <ChevronRight size={16} />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isPending}
                className="gap-3 bg-primary-600 hover:bg-primary-700 text-white font-black text-xs uppercase tracking-widest px-8 shadow-lg shadow-primary-200 transition-all rounded-xl min-w-[150px]"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 size={16} /> Confirmar Saída
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

