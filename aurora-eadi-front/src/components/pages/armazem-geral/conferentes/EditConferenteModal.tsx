"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Pencil, Save, Loader2, X, Fingerprint, IdCard } from "lucide-react";
import { useUpdateConferente } from "@/hooks/armazem-geral/useConferentes";
import { ConferenteResponsavel } from "@/types/armazem-geral";
import { toast } from "sonner";

interface EditConferenteModalProps {
  isOpen: boolean;
  onClose: () => void;
  conferente: ConferenteResponsavel;
}

function maskCpf(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function EditConferenteModal({ isOpen, onClose, conferente }: EditConferenteModalProps) {
  const { mutateAsync: updateConferente, isPending } = useUpdateConferente();

  const [name, setName] = useState("");
  const [matricula, setMatricula] = useState("");
  const [cpf, setCpf] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && conferente) {
      setName(conferente.name);
      setMatricula(conferente.matricula);
      setCpf(conferente.cpf);
      setErrors({});
    }
  }, [isOpen, conferente]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "O nome é obrigatório.";
    if (!matricula.trim()) e.matricula = "A matrícula é obrigatória.";
    if (cpf.replace(/\D/g, "").length !== 11) e.cpf = "CPF inválido.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await updateConferente({
        id: conferente.id,
        data: {
          name: name.trim(),
          matricula: matricula.trim(),
          cpf: cpf,
        },
      });
      toast.success("Conferente atualizado com sucesso!");
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao atualizar conferente.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
        {/* Header */}
        <div className="bg-orange-600 px-6 py-5 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-3xl" />
          <DialogHeader className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md">
                <Pencil className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-white">Editar Conferente</DialogTitle>
                <DialogDescription className="text-orange-100 text-sm mt-0.5">
                  Atualize os dados cadastrais do operador selecionado.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <form onSubmit={handleSave}>
          <div className="px-6 py-6 space-y-5 bg-white">
            {/* Nome */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                Nome Completo <span className="text-red-500 font-bold">*</span>
              </label>
              <div className="relative group">
                <Pencil className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 w-4 h-4 transition-colors shrink-0" />
                <input
                  type="text"
                  placeholder="Nome do operador"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors({ ...errors, name: "" });
                  }}
                  className={`w-full pl-10 pr-3 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm font-medium ${
                    errors.name ? "border-red-400 shadow-sm shadow-red-100" : "border-gray-200"
                  }`}
                />
              </div>
              {errors.name && <p className="text-[11px] text-red-500 mt-1 font-semibold animate-in slide-in-from-top-1">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Matrícula */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  Matrícula <span className="text-red-500 font-bold">*</span>
                </label>
                <div className="relative group">
                  <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 w-4 h-4 transition-colors shrink-0" />
                  <input
                    type="text"
                    placeholder="Registro ID"
                    value={matricula}
                    onChange={(e) => {
                      setMatricula(e.target.value);
                      if (errors.matricula) setErrors({ ...errors, matricula: "" });
                    }}
                    className={`w-full pl-10 pr-3 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm font-mono ${
                      errors.matricula ? "border-red-400 shadow-sm shadow-red-100" : "border-gray-200"
                    }`}
                  />
                </div>
                {errors.matricula && <p className="text-[11px] text-red-500 mt-1 font-semibold animate-in slide-in-from-top-1">{errors.matricula}</p>}
              </div>

              {/* CPF */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  CPF <span className="text-red-500 font-bold">*</span>
                </label>
                <div className="relative group">
                  <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 w-4 h-4 transition-colors shrink-0" />
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => {
                      setCpf(maskCpf(e.target.value));
                      if (errors.cpf) setErrors({ ...errors, cpf: "" });
                    }}
                    className={`w-full pl-10 pr-3 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-sm font-mono ${
                      errors.cpf ? "border-red-400 shadow-sm shadow-red-100" : "border-gray-200"
                    }`}
                  />
                </div>
                {errors.cpf && <p className="text-[11px] text-red-500 mt-1 font-semibold animate-in slide-in-from-top-1">{errors.cpf}</p>}
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 py-5 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isPending}
              className="text-gray-500 hover:text-gray-900 gap-2 font-semibold"
            >
              <X size={16} /> Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-orange-600 hover:bg-orange-700 text-white min-w-[140px] gap-2 h-11 px-6 shadow-lg shadow-orange-500/20 rounded-xl"
            >
              {isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
              ) : (
                <><Save size={16} /> Salvar Alterações</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
