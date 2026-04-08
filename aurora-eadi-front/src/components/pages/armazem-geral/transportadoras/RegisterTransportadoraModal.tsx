"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Truck, Save, Loader2, X, Building2 } from "lucide-react";
import { useCreateTransportadora } from "@/hooks/armazem-geral/useTransportadoras";
import { toast } from "sonner";

interface RegisterTransportadoraModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function maskCnpj(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  return digits
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

export function RegisterTransportadoraModal({ isOpen, onClose }: RegisterTransportadoraModalProps) {
  const { mutateAsync: createTransportadora, isPending } = useCreateTransportadora();

  const [name, setName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "O nome da transportadora é obrigatório.";
    if (cnpj && cnpj.replace(/\D/g, "").length !== 14) {
      e.cnpj = "CNPJ inválido. Informe os 14 dígitos.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await createTransportadora({
        name: name.trim(),
        cnpj: cnpj || undefined,
      });
      toast.success("Transportadora cadastrada com sucesso!");
      handleClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao cadastrar transportadora.");
    }
  };

  const handleClose = () => {
    setName("");
    setCnpj("");
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
        {/* Header */}
        <div className="bg-primary-600 px-6 py-5 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-3xl" />
          <DialogHeader className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-white">Nova Transportadora</DialogTitle>
                <DialogDescription className="text-primary-100 text-sm mt-0.5">
                  Cadastre uma nova transportadora no sistema.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <form onSubmit={handleSave}>
          <div className="px-6 py-6 space-y-5 bg-white">
            {/* Nome */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Razão Social / Nome <span className="text-red-500 font-bold">*</span>
              </label>
              <div className="relative group">
                <Truck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 w-4 h-4 transition-colors" />
                <input
                  type="text"
                  placeholder="Nome da transportadora"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors({ ...errors, name: "" });
                  }}
                  className={`w-full pl-10 pr-3 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm font-medium ${
                    errors.name ? "border-red-400 shadow-sm shadow-red-100" : "border-gray-200"
                  }`}
                />
              </div>
              {errors.name && (
                <p className="text-[11px] text-red-500 mt-1 font-semibold animate-in slide-in-from-top-1">{errors.name}</p>
              )}
            </div>

            {/* CNPJ */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                CNPJ <span className="text-gray-400 font-normal text-xs">(opcional)</span>
              </label>
              <div className="relative group">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 w-4 h-4 transition-colors" />
                <input
                  type="text"
                  placeholder="00.000.000/0000-00"
                  value={cnpj}
                  onChange={(e) => {
                    setCnpj(maskCnpj(e.target.value));
                    if (errors.cnpj) setErrors({ ...errors, cnpj: "" });
                  }}
                  className={`w-full pl-10 pr-3 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm font-mono ${
                    errors.cnpj ? "border-red-400 shadow-sm shadow-red-100" : "border-gray-200"
                  }`}
                />
              </div>
              {errors.cnpj && (
                <p className="text-[11px] text-red-500 mt-1 font-semibold animate-in slide-in-from-top-1">{errors.cnpj}</p>
              )}
            </div>
          </div>

          <DialogFooter className="px-6 py-5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={isPending}
              className="text-gray-500 hover:text-gray-900 gap-2 font-semibold"
            >
              <X size={16} /> Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-primary-600 hover:bg-primary-700 text-white min-w-[140px] gap-2 h-11 px-6 shadow-lg shadow-primary-500/20 rounded-xl"
            >
              {isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
              ) : (
                <><Save size={16} /> Cadastrar</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
