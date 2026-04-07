"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserCircle, Save, Loader2, X, Phone, IdCard } from "lucide-react";
import { useUpdateDriver } from "@/hooks/armazem-geral/useTransportadoras";
import { TransportadoraDriver } from "@/types/armazem-geral";
import { toast } from "sonner";

interface EditDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  carrierId: string;
  driver: TransportadoraDriver;
}

function maskCpf(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}
function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10) return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").trim();
  return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").trim();
}

export function EditDriverModal({ isOpen, onClose, carrierId, driver }: EditDriverModalProps) {
  const { mutateAsync: updateDriver, isPending } = useUpdateDriver(carrierId);
  const [name, setName] = useState(driver.name);
  const [cpf, setCpf] = useState(driver.cpf || "");
  const [phone, setPhone] = useState(driver.phone || "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setName(driver.name); setCpf(driver.cpf || ""); setPhone(driver.phone || ""); setErrors({});
  }, [driver]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "O nome é obrigatório.";
    if (cpf && cpf.replace(/\D/g, "").length !== 11) e.cpf = "CPF inválido.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await updateDriver({ driverId: driver.id, data: { name: name.trim(), cpf: cpf || undefined, phone: phone || undefined } });
      toast.success("Motorista atualizado com sucesso!");
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao atualizar motorista.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl focus:outline-none">
        <div className="bg-primary-600 px-6 py-5 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-3xl" />
          <DialogHeader className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2.5 rounded-xl"><UserCircle className="w-5 h-5 text-white" /></div>
              <div>
                <DialogTitle className="text-xl font-bold text-white">Editar Motorista</DialogTitle>
                <DialogDescription className="text-primary-100 text-sm mt-0.5">Atualize os dados do motorista.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>
        <form onSubmit={handleSave}>
          <div className="px-6 py-6 space-y-5 bg-white">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nome Completo <span className="text-red-500">*</span></label>
              <div className="relative group">
                <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 w-4 h-4 transition-colors" />
                <input type="text" value={name} onChange={(e) => { setName(e.target.value); if (errors.name) setErrors({ ...errors, name: "" }); }}
                  className={`w-full pl-10 pr-3 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm font-medium ${errors.name ? "border-red-400" : "border-gray-200"}`}
                />
              </div>
              {errors.name && <p className="text-[11px] text-red-500 mt-1 font-semibold">{errors.name}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">CPF</label>
                <div className="relative group">
                  <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 w-4 h-4 transition-colors" />
                  <input type="text" placeholder="000.000.000-00" value={cpf}
                    onChange={(e) => { setCpf(maskCpf(e.target.value)); if (errors.cpf) setErrors({ ...errors, cpf: "" }); }}
                    className={`w-full pl-10 pr-3 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm font-mono ${errors.cpf ? "border-red-400" : "border-gray-200"}`}
                  />
                </div>
                {errors.cpf && <p className="text-[11px] text-red-500 mt-1 font-semibold">{errors.cpf}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Telefone</label>
                <div className="relative group">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 w-4 h-4 transition-colors" />
                  <input type="text" placeholder="(00) 00000-0000" value={phone}
                    onChange={(e) => setPhone(maskPhone(e.target.value))}
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="px-6 py-5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isPending} className="text-gray-500 hover:text-gray-900 gap-2 font-semibold">
              <X size={16} /> Cancelar
            </Button>
            <Button type="submit" disabled={isPending} className="bg-primary-600 hover:bg-primary-700 text-white min-w-[140px] gap-2 h-11 px-6 shadow-lg shadow-primary-500/20 rounded-xl">
              {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : <><Save size={16} /> Salvar</>}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
