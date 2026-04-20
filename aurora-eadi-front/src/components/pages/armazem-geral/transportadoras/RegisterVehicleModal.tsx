"use client";

import React, { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Truck, Save, Loader2, X, Tag } from "lucide-react";
import { useCreateVehicle } from "@/hooks/armazem-geral/useTransportadoras";
import { toast } from "sonner";

interface RegisterVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  carrierId: string;
}

export function RegisterVehicleModal({ isOpen, onClose, carrierId }: RegisterVehicleModalProps) {
  const { mutateAsync: createVehicle, isPending } = useCreateVehicle(carrierId);
  const [plate, setPlate] = useState("");
  const [type, setType] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plate.trim()) {
      setErrors({ plate: "A placa é obrigatória." });
      return;
    }
    try {
      await createVehicle({ plate: plate.trim().toUpperCase(), type: type.trim() || undefined });
      toast.success("Veículo cadastrado com sucesso!");
      handleClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao cadastrar veículo.");
    }
  };

  const handleClose = () => {
    setPlate(""); setType(""); setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl focus:outline-none">
        <div className="bg-primary-600 px-6 py-5 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-3xl" />
          <DialogHeader className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2.5 rounded-xl"><Truck className="w-5 h-5 text-white" /></div>
              <div>
                <DialogTitle className="text-xl font-bold text-white">Novo Veículo</DialogTitle>
                <DialogDescription className="text-primary-100 text-sm mt-0.5">Cadastre um veículo para a transportadora.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>
        <form onSubmit={handleSave}>
          <div className="px-6 py-6 space-y-5 bg-white">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Placa <span className="text-red-500">*</span></label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 text-xs font-black transition-colors bg-gray-50 px-1 border rounded leading-none">BR</div>
                <input type="text" placeholder="ABC1D23" value={plate}
                  onChange={(e) => { setPlate(e.target.value.toUpperCase()); if (errors.plate) setErrors({}); }}
                  className={`w-full pl-10 pr-3 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm font-bold tracking-widest ${errors.plate ? "border-red-400" : "border-gray-200"}`}
                />
              </div>
              {errors.plate && <p className="text-[11px] text-red-500 mt-1 font-semibold">{errors.plate}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tipo do Veículo <span className="text-gray-400 text-xs font-normal">(opcional)</span></label>
              <div className="relative group">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 w-4 h-4 transition-colors" />
                <input type="text" placeholder="Ex: Carreta, Truck, Van..." value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm font-medium"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="px-6 py-5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <Button type="button" variant="ghost" onClick={handleClose} disabled={isPending} className="text-gray-500 hover:text-gray-900 gap-2 font-semibold">
              <X size={16} /> Cancelar
            </Button>
            <Button type="submit" disabled={isPending} className="bg-primary-600 hover:bg-primary-700 text-white min-w-[140px] gap-2 h-11 px-6 shadow-lg shadow-primary-500/20 rounded-xl">
              {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : <><Save size={16} /> Cadastrar</>}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
