"use client";

import React, { useState } from "react";
import { Plus, Pencil, Trash2, Truck, Loader2, ToggleLeft, ToggleRight, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVehiclesList, useToggleVehicleActive, useRemoveVehicle } from "@/hooks/armazem-geral/useTransportadoras";
import { TransportadoraVehicle } from "@/types/armazem-geral";
import { RegisterVehicleModal } from "./RegisterVehicleModal";
import { EditVehicleModal } from "./EditVehicleModal";
import { toast } from "sonner";

interface VehiclesTabProps {
  carrierId: string;
}

export function VehiclesTab({ carrierId }: VehiclesTabProps) {
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<TransportadoraVehicle | null>(null);

  const { data, isLoading } = useVehiclesList(carrierId, { limit: 100 });
  const { mutateAsync: toggleActive, isPending: isToggling } = useToggleVehicleActive(carrierId);
  const { mutateAsync: removeVehicle, isPending: isRemoving } = useRemoveVehicle(carrierId);

  const vehicles = data?.data || [];

  const handleToggle = async (vehicle: TransportadoraVehicle) => {
    try {
      await toggleActive(vehicle.id);
      toast.success(`Veículo ${vehicle.active ? "inativado" : "ativado"} com sucesso!`);
    } catch {
      toast.error("Erro ao alterar status do veículo.");
    }
  };

  const handleRemove = async (vehicle: TransportadoraVehicle) => {
    if (!confirm(`Remover o veículo de placa "${vehicle.plate}" permanentemente?`)) return;
    try {
      await removeVehicle(vehicle.id);
      toast.success("Veículo removido com sucesso!");
    } catch {
      toast.error("Erro ao remover veículo.");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {vehicles.length} veículo{vehicles.length !== 1 ? "s" : ""} cadastrado{vehicles.length !== 1 ? "s" : ""}
        </p>
        <Button
          size="sm"
          onClick={() => setIsRegisterOpen(true)}
          className="bg-primary-600 hover:bg-primary-700 text-white gap-1.5 h-9 px-4 shadow-sm"
        >
          <Plus size={14} /> Novo Veículo
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-primary-500 w-6 h-6" />
        </div>
      ) : vehicles.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
          <Truck className="mx-auto w-8 h-8 text-gray-300 mb-2" />
          <p className="text-sm text-gray-400 font-medium">Nenhum veículo cadastrado</p>
          <p className="text-xs text-gray-300 mt-0.5">Clique em "Novo Veículo" para adicionar</p>
        </div>
      ) : (
        <div className="space-y-2">
          {vehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                vehicle.active
                  ? "bg-white border-gray-200 hover:border-primary-200 hover:shadow-sm"
                  : "bg-gray-50 border-gray-100 opacity-60"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border ${
                  vehicle.active ? "bg-primary-50 text-primary-600 border-primary-100" : "bg-gray-100 text-gray-400 border-gray-200"
                }`}>
                  <Truck size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-gray-900 tracking-widest">{vehicle.plate}</span>
                    {!vehicle.active && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full">Inativo</span>
                    )}
                  </div>
                  {vehicle.type && (
                    <span className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
                      <Tag size={10} /> {vehicle.type}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleToggle(vehicle)}
                  disabled={isToggling}
                  title={vehicle.active ? "Inativar" : "Ativar"}
                  className="p-1.5 rounded-lg transition-colors border border-gray-100"
                >
                  {vehicle.active
                    ? <ToggleRight size={16} className="text-primary-500" />
                    : <ToggleLeft size={16} className="text-gray-400" />}
                </button>
                <button
                  onClick={() => setEditingVehicle(vehicle)}
                  className="p-1.5 hover:bg-primary-50 text-gray-400 hover:text-primary-600 rounded-lg transition-colors border border-gray-100"
                  title="Editar"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleRemove(vehicle)}
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

      <RegisterVehicleModal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} carrierId={carrierId} />
      {editingVehicle && (
        <EditVehicleModal isOpen={!!editingVehicle} onClose={() => setEditingVehicle(null)} carrierId={carrierId} vehicle={editingVehicle} />
      )}
    </div>
  );
}
