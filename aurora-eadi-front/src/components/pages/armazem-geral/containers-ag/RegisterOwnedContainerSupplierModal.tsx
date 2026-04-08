"use client";

import React, { useState } from "react";
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
import { useCreateOwnedContainerSupplier } from "@/hooks/armazem-geral/useOwnedContainers";
import { toast } from "sonner";
import { Building2, Save, FileText } from "lucide-react";

interface RegisterOwnedContainerSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (supplierId: string) => void;
}

export function RegisterOwnedContainerSupplierModal({
  isOpen,
  onClose,
  onSuccess,
}: RegisterOwnedContainerSupplierModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    document: "",
  });

  const { mutateAsync: createSupplier, isPending } = useCreateOwnedContainerSupplier();

  const maskCnpj = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .slice(0, 18);
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, document: maskCnpj(e.target.value) });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("O nome do fornecedor é obrigatório.");
      return;
    }

    try {
      const result = await createSupplier({
        name: formData.name.trim(),
        document: formData.document.replace(/\D/g, "") || undefined, // Send only numbers to backend
      });
      
      toast.success("Fornecedor cadastrado com sucesso!");
      if (onSuccess) onSuccess(result.id);
      onClose();
      setFormData({ name: "", document: "" });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao cadastrar fornecedor.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="text-primary-600" size={20} />
            Novo Fornecedor de Containers
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="supplier-name">Nome do Fornecedor *</Label>
            <Input
              id="supplier-name"
              placeholder="Razão Social ou Nome Fantasia"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supplier-document">CNPJ Fornecedor</Label>
            <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  id="supplier-document"
                  placeholder="00.000.000/0001-00"
                  className="pl-10"
                  value={formData.document}
                  onChange={handleDocumentChange}
                />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isPending} className="gap-2">
            {isPending ? "Salvando..." : <><Save size={16} /> Salvar Fornecedor</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
