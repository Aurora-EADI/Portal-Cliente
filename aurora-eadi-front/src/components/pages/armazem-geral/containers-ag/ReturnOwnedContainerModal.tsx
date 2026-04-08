"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, LogIn, MapPin, ChevronRight, ChevronLeft, CheckCircle2, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { useReturnOwnedContainer } from "@/hooks/armazem-geral/useOwnedContainers";
import type { WarehouseOwnedContainer } from "@/types/armazem-geral";
import { cn } from "@/lib/utils";

interface ReturnOwnedContainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  container: WarehouseOwnedContainer | null;
}

export function ReturnOwnedContainerModal({
  isOpen,
  onClose,
  container,
}: ReturnOwnedContainerModalProps) {
  const [step, setStep] = useState(1);
  const [location, setLocation] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const { mutateAsync: returnToPatio, isPending } = useReturnOwnedContainer();

  const containerLabel = useMemo(() => {
    if (!container) return "";
    return container.containerNumber || container.code;
  }, [container]);

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setLocation(container?.location || "");
      setNotes("");
    }
  }, [isOpen, container]);

  const handleNext = () => setStep((s) => s + 1);
  const handlePrev = () => setStep((s) => s - 1);

  const handleSubmit = async () => {
    if (!container?.id) return;

    try {
      await returnToPatio({
        id: container.id,
        data: {
          location: location.trim() || undefined,
          notes: notes.trim() || undefined,
        },
      });
      toast.success("Devolução registrada");
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Erro ao registrar devolução do contêiner próprio.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden gap-0 border-none shadow-2xl">
        <div className="bg-primary-600 px-8 py-6">
          <DialogTitle className="text-2xl font-bold text-white">Registrar Devolução (Retorno)</DialogTitle>
          <p className="text-primary-100 mt-1">
            {step === 1
              ? `Informe a nova localização para o container ${containerLabel}`
              : "Revise os dados e confirme a devolução"}
          </p>
        </div>

        <div className="p-8 space-y-6 bg-white">
          {/* Progress Indicator */}
          <div className="mb-10">
            <div className="flex items-center justify-center space-x-12">
              {/* Step 1 */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300",
                    step >= 1 ? "bg-primary-600 border-primary-600" : "border-gray-300 bg-white"
                  )}
                >
                  <MapPin className={step >= 1 ? "text-white" : "text-gray-400"} size={20} />
                </div>
                <p className={cn("text-sm font-medium mt-3 transition-colors", step >= 1 ? "text-primary-600" : "text-gray-400")}>
                  Pátio
                </p>
              </div>

              {/* Progress Line */}
              <div className="flex items-center" style={{ width: "100px", marginTop: "-30px" }}>
                <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div className={cn("h-full transition-all duration-500 ease-in-out", step >= 2 ? "bg-primary-600 w-full" : "bg-primary-600 w-0")} />
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300",
                    step >= 2 ? "bg-primary-600 border-primary-600" : "border-gray-300 bg-white"
                  )}
                >
                  <ClipboardList className={step >= 2 ? "text-white" : "text-gray-400"} size={20} />
                </div>
                <p className={cn("text-sm font-medium mt-3 transition-colors", step >= 2 ? "text-primary-600" : "text-gray-400")}>
                  Finalizar
                </p>
              </div>
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="grid gap-2">
                <Label>Contêiner Selecionado</Label>
                <div className="px-4 py-3 rounded-lg border bg-gray-50 text-primary-900 font-bold flex items-center gap-3">
                  <div className="bg-primary-100 p-2 rounded-full">
                    <MapPin size={18} className="text-primary-600" />
                  </div>
                  {containerLabel}
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="location">Localização no Pátio (Opcional)</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value.toUpperCase())}
                  placeholder="Ex: QUADRA A - LINHA 05"
                  className="h-12 font-bold uppercase"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="grid gap-2">
                <Label>Observações da Devolução</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex.: estado geral do container, avarias detectadas no retorno..."
                  className="min-h-[120px] resize-none"
                />
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
            
            {step < 2 ? (
              <Button
                type="button"
                onClick={handleNext}
                className="gap-2 bg-primary-600 hover:bg-primary-700 min-w-[120px]"
              >
                Próximo <ChevronRight size={16} />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isPending}
                className="gap-2 bg-primary-600 hover:bg-primary-700 min-w-[150px]"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 size={16} /> Confirmar Retorno
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

