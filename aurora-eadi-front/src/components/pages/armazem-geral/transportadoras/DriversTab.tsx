"use client";

import React, { useState } from "react";
import { Plus, Pencil, Trash2, UserCircle, Loader2, ToggleLeft, ToggleRight, Phone, IdCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDriversList, useToggleDriverActive, useRemoveDriver } from "@/hooks/armazem-geral/useTransportadoras";
import { TransportadoraDriver } from "@/types/armazem-geral";
import { RegisterDriverModal } from "./RegisterDriverModal";
import { EditDriverModal } from "./EditDriverModal";
import { toast } from "sonner";

interface DriversTabProps {
  carrierId: string;
}

export function DriversTab({ carrierId }: DriversTabProps) {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<TransportadoraDriver | null>(null);

  const { data, isLoading } = useDriversList(carrierId, { limit: 100 });
  const { mutateAsync: toggleActive, isPending: isToggling } = useToggleDriverActive(carrierId);
  const { mutateAsync: removeDriver, isPending: isRemoving } = useRemoveDriver(carrierId);

  const drivers = data?.data || [];

  const handleToggle = async (driver: TransportadoraDriver) => {
    try {
      await toggleActive(driver.id);
      toast.success(`Motorista ${driver.active ? "inativado" : "ativado"} com sucesso!`);
    } catch {
      toast.error("Erro ao alterar status do motorista.");
    }
  };

  const handleRemove = async (driver: TransportadoraDriver) => {
    if (!confirm(`Remover motorista "${driver.name}" permanentemente?`)) return;
    try {
      await removeDriver(driver.id);
      toast.success("Motorista removido com sucesso!");
    } catch {
      toast.error("Erro ao remover motorista.");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {drivers.length} motorista{drivers.length !== 1 ? "s" : ""} cadastrado{drivers.length !== 1 ? "s" : ""}
        </p>
        <Button
          size="sm"
          onClick={() => setIsRegisterOpen(true)}
          className="bg-primary-600 hover:bg-primary-700 text-white gap-1.5 h-9 px-4 shadow-sm"
        >
          <Plus size={14} /> Novo Motorista
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-primary-500 w-6 h-6" />
        </div>
      ) : drivers.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
          <UserCircle className="mx-auto w-8 h-8 text-gray-300 mb-2" />
          <p className="text-sm text-gray-400 font-medium">Nenhum motorista cadastrado</p>
          <p className="text-xs text-gray-300 mt-0.5">Clique em "Novo Motorista" para adicionar</p>
        </div>
      ) : (
        <div className="space-y-2">
          {drivers.map((driver) => (
            <div
              key={driver.id}
              className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                driver.active
                  ? "bg-white border-gray-200 hover:border-primary-200 hover:shadow-sm"
                  : "bg-gray-50 border-gray-100 opacity-60"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border ${
                  driver.active ? "bg-primary-50 text-primary-600 border-primary-100" : "bg-gray-100 text-gray-400 border-gray-200"
                }`}>
                  <UserCircle size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-gray-900">{driver.name}</span>
                    {!driver.active && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full">Inativo</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    {driver.cpf && (
                      <span className="flex items-center gap-1 text-[11px] text-gray-400">
                        <IdCard size={10} /> {driver.cpf}
                      </span>
                    )}
                    {driver.phone && (
                      <span className="flex items-center gap-1 text-[11px] text-gray-400">
                        <Phone size={10} /> {driver.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleToggle(driver)}
                  disabled={isToggling}
                  title={driver.active ? "Inativar" : "Ativar"}
                  className={`p-1.5 rounded-lg transition-colors border text-xs font-medium ${
                    driver.active
                      ? "hover:bg-orange-50 text-gray-400 hover:text-orange-500 border-gray-100"
                      : "hover:bg-green-50 text-gray-400 hover:text-green-500 border-gray-100"
                  }`}
                >
                  {driver.active ? <ToggleRight size={16} className="text-primary-500" /> : <ToggleLeft size={16} />}
                </button>
                <button
                  onClick={() => setEditingDriver(driver)}
                  className="p-1.5 hover:bg-primary-50 text-gray-400 hover:text-primary-600 rounded-lg transition-colors border border-gray-100"
                  title="Editar"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleRemove(driver)}
                  disabled={isRemoving}
                  className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-colors border border-gray-100"
                  title="Remover"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <RegisterDriverModal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} carrierId={carrierId} />
      {editingDriver && (
        <EditDriverModal isOpen={!!editingDriver} onClose={() => setEditingDriver(null)} carrierId={carrierId} driver={editingDriver} />
      )}
    </div>
  );
}
