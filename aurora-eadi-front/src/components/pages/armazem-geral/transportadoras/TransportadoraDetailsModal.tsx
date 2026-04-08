"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Truck, UserCircle, Car, Building2, X, Users, CarFront } from "lucide-react";
import { Transportadora } from "@/types/armazem-geral";
import { DriversTab } from "./DriversTab";
import { VehiclesTab } from "./VehiclesTab";

interface TransportadoraDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transportadora: Transportadora;
  initialTab?: "motoristas" | "veiculos";
}

type TabKey = "motoristas" | "veiculos";

const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "motoristas", label: "Motoristas", icon: UserCircle },
  { key: "veiculos", label: "Veículos", icon: Truck },
];

export function TransportadoraDetailsModal({
  isOpen,
  onClose,
  transportadora,
  initialTab = "motoristas",
}: TransportadoraDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl max-h-[90vh] flex flex-col focus:outline-none">
        {/* Header */}
        <div className="bg-primary-600 px-6 py-5 relative overflow-hidden shrink-0">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -left-4 -bottom-4 w-20 h-20 bg-white/5 rounded-full blur-2xl" />
          <DialogHeader className="relative z-10">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md shrink-0">
                  <Truck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-white leading-tight">
                    {transportadora.name}
                  </DialogTitle>
                  <DialogDescription className="text-primary-100 text-sm mt-0.5 flex items-center gap-3">
                    {transportadora.cnpj ? (
                      <span className="flex items-center gap-1">
                        <Building2 size={12} /> {transportadora.cnpj}
                      </span>
                    ) : (
                      <span className="text-primary-200 italic text-xs">CNPJ não informado</span>
                    )}
                    <span className="flex items-center gap-2 ml-2">
                      <span className="flex items-center gap-1">
                        <UserCircle size={12} /> {transportadora._count?.drivers ?? 0} motoristas
                      </span>
                      <span className="flex items-center gap-1">
                        <Truck size={12} /> {transportadora._count?.vehicles ?? 0} veículos
                      </span>
                    </span>
                  </DialogDescription>
                </div>
              </div>
            </div>
          </DialogHeader>

          {/* Tabs */}
          <div className="flex gap-1 mt-4 relative z-10">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-white text-primary-600 shadow-md"
                      : "text-primary-100 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon size={15} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 bg-gray-50">
          {activeTab === "motoristas" && (
            <DriversTab carrierId={transportadora.id} />
          )}
          {activeTab === "veiculos" && (
            <VehiclesTab carrierId={transportadora.id} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
