"use client";

import React, { useState } from "react";
import { PageHeader, DataTable, Column, SearchBar } from "@/components/ui/DataTable";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, UserCircle, Loader2 } from "lucide-react";
import { useConferentesList, useRemoveConferente } from "@/hooks/armazem-geral/useConferentes";
import { ConferenteResponsavel } from "@/types/armazem-geral";
import { RegisterConferenteModal } from "./RegisterConferenteModal";
import { EditConferenteModal } from "./EditConferenteModal";
import { ConferenteDeleteDialog } from "./ConferenteDeleteDialog";
import { toast } from "sonner";

export function ConferentesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 10;

  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [editingConferente, setEditingConferente] = useState<ConferenteResponsavel | null>(null);
  const [deletingConferente, setDeletingConferente] = useState<ConferenteResponsavel | null>(null);

  const { data, isLoading, isError } = useConferentesList({
    page,
    limit,
    search: search || undefined,
  });

  const { mutateAsync: removeConferente, isPending: isRemoving } = useRemoveConferente();

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleClear = () => {
    setSearch("");
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async () => {
    if (!deletingConferente) return;
    try {
      await removeConferente(deletingConferente.id);
      toast.success("Conferente removido com sucesso!");
      setDeletingConferente(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao remover conferente.");
    }
  };

  const columns: Column<ConferenteResponsavel>[] = [
    {
      key: "name",
      header: "Operador / Conferente",
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center shrink-0 border border-primary-100">
            <UserCircle size={20} />
          </div>
          <div>
            <div className="font-bold text-gray-900">{item.name}</div>
            <div className="text-[10px] text-gray-400 font-mono italic uppercase tracking-wider">ID: {item.id.split('-')[0]}</div>
          </div>
        </div>
      ),
    },
    {
      key: "matricula",
      header: "Matrícula",
      render: (item) => (
        <span className="font-mono text-sm font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
          {item.matricula}
        </span>
      ),
    },
    {
      key: "cpf",
      header: "CPF",
      render: (item) => <span className="text-gray-600 text-sm">{item.cpf}</span>,
    },
    {
      key: "acoes",
      header: "Ações",
      align: "center",
      render: (item) => (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setEditingConferente(item)}
            className="p-2 hover:bg-primary-50 text-gray-500 hover:text-primary-600 rounded-lg transition-colors border border-gray-100 shadow-sm bg-white"
            title="Editar"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => setDeletingConferente(item)}
            className="p-2 hover:bg-red-50 text-gray-500 hover:text-red-600 rounded-lg transition-colors border border-gray-100 shadow-sm bg-white"
            title="Excluir"
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
        title="Gestão de Conferentes"
        description="Cadastro de operadores responsáveis pelas operações de armazém."
        actions={
          <Button onClick={() => setIsRegisterOpen(true)} className="gap-2 bg-primary-600 hover:bg-primary-700 font-semibold h-11 px-6 shadow-md shadow-primary-500/20">
            <Plus className="h-4 w-4" /> Novo Conferente
          </Button>
        }
      />



      <div className="space-y-3">
        <SearchBar
          placeholder="Buscar por nome, matrícula ou CPF..."
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
          errorMessage="Erro ao carregar conferentes."
          emptyMessage={search ? "Nenhum conferente encontrado para esta busca." : "Nenhum conferente cadastrado."}
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

      <RegisterConferenteModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
      />

      {editingConferente && (
        <EditConferenteModal
          isOpen={!!editingConferente}
          onClose={() => setEditingConferente(null)}
          conferente={editingConferente}
        />
      )}

      <ConferenteDeleteDialog
        isOpen={!!deletingConferente}
        conferente={deletingConferente}
        onClose={() => setDeletingConferente(null)}
        onConfirm={handleDelete}
        isRemoving={isRemoving}
      />
    </div>
  );
}
