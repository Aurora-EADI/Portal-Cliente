"use client";

import React, { useState } from "react";
import { PageHeader, DataTable, Column, SearchBar } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import {
  Plus, Pencil, Trash2, Truck, UserCircle, Eye,
} from "lucide-react";
import {
  useTransportadorasList,
  useDeactivateTransportadora,
} from "@/hooks/armazem-geral/useTransportadoras";
import { Transportadora } from "@/types/armazem-geral";
import { RegisterTransportadoraModal } from "./RegisterTransportadoraModal";
import { EditTransportadoraModal } from "./EditTransportadoraModal";
import { TransportadoraDeactivateDialog } from "./TransportadoraDeactivateDialog";
import { TransportadoraDetailsModal } from "./TransportadoraDetailsModal";
import { toast } from "sonner";

export function TransportadorasPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const limit = 10;

  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [editingTransportadora, setEditingTransportadora] = useState<Transportadora | null>(null);
  const [deactivatingTransportadora, setDeactivatingTransportadora] = useState<Transportadora | null>(null);
  const [detailsTransportadora, setDetailsTransportadora] = useState<{ item: Transportadora; initialTab: "motoristas" | "veiculos" } | null>(null);

  const { data, isLoading, isError } = useTransportadorasList({
    page,
    limit,
    search: search || undefined,
    active: true, // Sempre ativas por padrão conforme solicitado
  });

  const { mutateAsync: deactivate, isPending: isDeactivating } = useDeactivateTransportadora();

  const handleSearch = (value: string) => { setSearch(value); setPage(1); };
  const handleClear = () => { setSearch(""); setPage(1); };
  const handlePageChange = (newPage: number) => { setPage(newPage); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const handleDeactivate = async () => {
    if (!deactivatingTransportadora) return;
    try {
      await deactivate(deactivatingTransportadora.id);
      toast.success("Transportadora removida com sucesso!");
      setDeactivatingTransportadora(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao remover transportadora.");
    }
  };

  const columns: Column<Transportadora>[] = [
    {
      key: "name",
      header: "Transportadora",
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center shrink-0 border border-primary-100">
            <Truck size={18} />
          </div>
          <div>
            <div className="font-bold text-gray-900">{item.name}</div>
            <div className="text-[10px] text-gray-400 font-mono italic uppercase tracking-wider">
              ID: {item.id.split("-")[0]}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "cnpj",
      header: "CNPJ",
      render: (item) =>
        item.cnpj ? (
          <span className="font-mono text-sm text-gray-700 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
            {item.cnpj}
          </span>
        ) : (
          <span className="text-gray-400 text-sm italic">—</span>
        ),
    },
    {
      key: "drivers" as any,
      header: "Motoristas",
      render: (item) => (
        <div className="flex items-center gap-1.5">
          <UserCircle size={14} className="text-primary-400" />
          <span className="font-semibold text-gray-700 text-sm">{item._count?.drivers ?? 0}</span>
        </div>
      ),
    },
    {
      key: "vehicles" as any,
      header: "Veículos",
      render: (item) => (
        <div className="flex items-center gap-1.5">
          <Truck size={14} className="text-primary-400" />
          <span className="font-semibold text-gray-700 text-sm">{item._count?.vehicles ?? 0}</span>
        </div>
      ),
    },
    {
      key: "acoes" as any,
      header: "Ações",
      align: "center",
      render: (item) => (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setDetailsTransportadora({ item, initialTab: "motoristas" })}
            className="p-2 hover:bg-primary-50 text-gray-500 hover:text-primary-600 rounded-lg transition-colors border border-gray-100 shadow-sm bg-white"
            title="Gerenciar Motoristas"
          >
            <UserCircle size={16} />
          </button>
          <button
            onClick={() => setDetailsTransportadora({ item, initialTab: "veiculos" })}
            className="p-2 hover:bg-primary-50 text-gray-500 hover:text-primary-600 rounded-lg transition-colors border border-gray-100 shadow-sm bg-white"
            title="Gerenciar Veículos"
          >
            <Truck size={16} />
          </button>
          <button
            onClick={() => setEditingTransportadora(item)}
            className="p-2 hover:bg-primary-50 text-gray-500 hover:text-primary-600 rounded-lg transition-colors border border-gray-100 shadow-sm bg-white"
            title="Editar"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => setDeactivatingTransportadora(item)}
            className="p-2 hover:bg-red-50 text-gray-500 hover:text-red-600 rounded-lg transition-colors border border-gray-100 shadow-sm bg-white"
            title="Remover"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-20 p-8 pt-6">
      <PageHeader
        title="Gestão de Transportadoras"
        description="Cadastro de transportadoras com seus motoristas e veículos vinculados."
        actions={
          <Button
            onClick={() => setIsRegisterOpen(true)}
            className="gap-2 bg-primary-600 hover:bg-primary-700 font-semibold h-11 px-6 shadow-md shadow-primary-500/20"
          >
            <Plus className="h-4 w-4" /> Nova Transportadora
          </Button>
        }
      />

      <div className="space-y-3">
        <SearchBar
          placeholder="Buscar por nome ou CNPJ..."
          onSearch={handleSearch}
          onClear={handleClear}
          showClearButton={!!search}
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={data?.data || []}
          keyExtractor={(item) => item.id}
          isLoading={isLoading}
          isError={isError}
          errorMessage="Erro ao carregar transportadoras."
          emptyMessage={
            search
              ? "Nenhuma transportadora encontrada para esta busca."
              : "Nenhuma transportadora cadastrada."
          }
          pagination={
            data?.pagination
              ? {
                  page,
                  total: data.pagination.total,
                  limit,
                  onPageChange: handlePageChange,
                }
              : undefined
          }
        />
      </div>

      <RegisterTransportadoraModal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} />

      {editingTransportadora && (
        <EditTransportadoraModal
          isOpen={!!editingTransportadora}
          onClose={() => setEditingTransportadora(null)}
          transportadora={editingTransportadora}
        />
      )}

      <TransportadoraDeactivateDialog
        isOpen={!!deactivatingTransportadora}
        transportadora={deactivatingTransportadora}
        onClose={() => setDeactivatingTransportadora(null)}
        onConfirm={handleDeactivate}
        isLoading={isDeactivating}
      />

      {detailsTransportadora && (
        <TransportadoraDetailsModal
          isOpen={!!detailsTransportadora}
          onClose={() => setDetailsTransportadora(null)}
          transportadora={detailsTransportadora.item}
          initialTab={detailsTransportadora.initialTab}
        />
      )}
    </div>
  );
}
