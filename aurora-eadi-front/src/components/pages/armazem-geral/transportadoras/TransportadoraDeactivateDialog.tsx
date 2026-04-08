"use client";

import React from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, AlertCircle, X, Loader2 } from "lucide-react";
import { Transportadora } from "@/types/armazem-geral";

interface TransportadoraDeactivateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  transportadora: Transportadora | null;
  isLoading?: boolean;
}

export function TransportadoraDeactivateDialog({
  isOpen,
  onClose,
  onConfirm,
  transportadora,
  isLoading,
}: TransportadoraDeactivateDialogProps) {
  if (!transportadora) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl focus:outline-none">
        <div className="bg-red-600 px-6 py-8 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -left-4 -bottom-4 w-20 h-20 bg-white/5 rounded-full blur-2xl" />
          
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md mb-4 shadow-xl border border-white/10">
              <Trash2 className="w-8 h-8 text-white" />
            </div>
            <DialogTitle className="text-2xl font-black text-white tracking-tight">
              Remover Transportadora?
            </DialogTitle>
            <DialogDescription className="text-red-100 text-sm mt-2 max-w-[280px] font-medium leading-relaxed">
              Deseja realmente remover <span className="text-white font-bold underline decoration-red-400 decoration-2 underline-offset-4">{transportadora.name}</span>?
            </DialogDescription>
          </div>
        </div>

        <div className="px-6 py-6 pb-2 space-y-4 bg-white">
          <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex gap-3 items-start">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="text-[12px] text-red-700 font-medium leading-relaxed line-clamp-3">
              Esta ação inativará a transportadora e seus vínculos. Ela deixará de aparecer nas listagens principais do sistema.
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-6 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 text-gray-500 hover:text-gray-900 hover:bg-gray-100 gap-2 font-bold h-12 rounded-xl transition-all"
          >
            <X size={18} /> Cancelar
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-[1.5] bg-red-600 hover:bg-red-700 text-white gap-2 font-black h-12 rounded-xl shadow-lg shadow-red-500/20 transition-all active:scale-[0.98]"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Trash2 size={18} /> CONFIRMAR REMOÇÃO
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
