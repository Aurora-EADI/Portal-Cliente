"use client";

import React, { useState } from "react";
import { PageHeader, DataTable, Column, SearchBar } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { 
  Plus, Building2, Pencil, Trash2, FileText, Hash
} from "lucide-react";
import { 
  useOwnedContainerSuppliers, 
  useCreateOwnedContainerSupplier 
} from "@/hooks/armazem-geral/useOwnedContainers";
import { WarehouseOwnedContainerSupplier, CreateContainerAgSupplierDto } from "@/types/armazem-geral";
import { toast } from "sonner";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ownedContainersService } from "@/services/armazem-geral/owned-containers.service";
import { OWNED_CONTAINER_KEYS } from "@/hooks/armazem-geral/useOwnedContainers";
import { cn } from "@/lib/utils";

function maskCnpj(value: string) {
  return value
    .replace(/\D/g, "")
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")
    .slice(0, 18);
}

function formatCnpjDisplay(raw: string) {
  if (!raw) return "—";
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 14) return raw;
  return digits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5"
  );
}

interface SupplierFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editing?: WarehouseOwnedContainerSupplier | null;
}

function SupplierFormModal({ isOpen, onClose, editing }: SupplierFormModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: editing?.name || "",
    document: editing?.document ? formatCnpjDisplay(editing.document) : "",
  });

  React.useEffect(() => {
    if (editing) {
      setFormData({
        name: editing.name || "",
        document: editing.document ? formatCnpjDisplay(editing.document) : "",
      });
    } else {
      setFormData({ name: "", document: "" });
    }
  }, [editing, isOpen]);

  const { mutateAsync: create, isPending: isCreating } = useCreateOwnedContainerSupplier();

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; dto: Partial<CreateContainerAgSupplierDto> }) =>
      ownedContainersService.suppliers.update?.(data.id, data.dto) as Promise<WarehouseOwnedContainerSupplier>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OWNED_CONTAINER_KEYS.suppliers });
    },
  });

  const isPending = isCreating || updateMutation.isPending;

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("O nome do fornecedor é obrigatório.");
      return;
    }
    try {
      const payload = {
        name: formData.name.trim(),
        document: formData.document.replace(/\D/g, "") || undefined,
      };
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, dto: payload });
        toast.success("Fornecedor atualizado com sucesso!");
      } else {
        await create(payload);
        toast.success("Fornecedor cadastrado com sucesso!");
      }
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao salvar fornecedor.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl font-black">
            <div className="p-2 bg-primary-50 rounded-xl text-primary-600">
              <Building2 size={20} />
            </div>
            {editing ? "Editar Fornecedor" : "Novo Fornecedor de Containers"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="space-y-2">
            <Label htmlFor="s-name" className="text-xs font-black uppercase tracking-wider text-gray-500">
              Razão Social / Nome Fantasia *
            </Label>
            <Input
              id="s-name"
              placeholder="Ex: Shipping Lines Brasil Ltda"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-cnpj" className="text-xs font-black uppercase tracking-wider text-gray-500">
              CNPJ
            </Label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <Input
                id="s-cnpj"
                placeholder="00.000.000/0001-00"
                className="h-11 pl-10 font-mono"
                value={formData.document}
                onChange={(e) =>
                  setFormData({ ...formData, document: maskCnpj(e.target.value) })
                }
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isPending} className={cn(
            "gap-2",
            editing ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-primary-600 hover:bg-primary-700 text-white"
          )}>
            {isPending ? "Salvando..." : editing ? "Salvar Alterações" : <><Plus size={16} /> Cadastrar</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ContainerSuppliersPage() {
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<WarehouseOwnedContainerSupplier | null>(null);

  const { data: suppliers, isLoading, isError } = useOwnedContainerSuppliers();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: string) => ownedContainersService.suppliers.remove?.(id) as Promise<void>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OWNED_CONTAINER_KEYS.suppliers });
    },
  });

  const filtered = suppliers?.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.document || "").includes(search)
  );

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este fornecedor?")) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Fornecedor removido com sucesso.");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao remover fornecedor.");
    }
  };

  const columns: Column<WarehouseOwnedContainerSupplier>[] = [
    {
      key: "name",
      header: "Fornecedor",
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-600 shrink-0">
            <Building2 size={20} />
          </div>
          <div className="text-left">
            <div className="font-bold text-gray-900">{item.name}</div>
            {item.document && (
              <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                {formatCnpjDisplay(item.document)}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "document",
      header: "CNPJ",
      render: (item) => (
        <span className="font-mono text-sm text-gray-600">
          {item.document ? formatCnpjDisplay(item.document) : "—"}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Cadastrado em",
      render: (item) => (
        <span className="text-xs text-gray-500">
          {new Date(item.createdAt).toLocaleDateString("pt-BR")}
        </span>
      ),
    },
    {
      key: "acoes",
      header: "Ações",
      align: "center",
      render: (item) => (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => {
              setEditingSupplier(item);
              setIsFormOpen(true);
            }}
            className="p-2 hover:bg-amber-50 text-gray-400 hover:text-amber-600 rounded-lg transition-colors border border-transparent hover:border-amber-100"
            title="Editar"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => handleDelete(item.id)}
            className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-colors border border-transparent hover:border-red-100"
            title="Remover"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20 p-8 pt-6">
      <PageHeader
        title="Fornecedores de Containers"
        description="Gerenciamento de fornecedores exclusivos da frota de containers próprios."
        actions={
          <Button
            onClick={() => {
              setEditingSupplier(null);
              setIsFormOpen(true);
            }}
            className="gap-2 bg-primary-600 hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" /> Novo Fornecedor
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="p-3 bg-primary-50 rounded-xl">
            <Building2 size={24} className="text-primary-600" />
          </div>
          <div>
            <p className="text-2xl font-black text-gray-900">{suppliers?.length ?? 0}</p>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Cadastrados</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="p-3 bg-green-50 rounded-xl">
            <FileText size={24} className="text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-black text-gray-900">
              {suppliers?.filter(s => s.document).length ?? 0}
            </p>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Com CNPJ</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="p-3 bg-amber-50 rounded-xl">
            <Building2 size={24} className="text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-black text-gray-900">
              {suppliers?.filter(s => !s.document).length ?? 0}
            </p>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sem CNPJ</p>
          </div>
        </div>
      </div>

      <SearchBar
        placeholder="Buscar por nome ou CNPJ..."
        onSearch={setSearch}
        onClear={() => setSearch("")}
        showClearButton={!!search}
      />

      <DataTable
        columns={columns}
        data={filtered || []}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        isError={isError}
        errorMessage="Erro ao carregar fornecedores."
        emptyMessage="Nenhum fornecedor cadastrado ainda."
      />

      <SupplierFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingSupplier(null);
        }}
        editing={editingSupplier}
      />
    </div>
  );
}
