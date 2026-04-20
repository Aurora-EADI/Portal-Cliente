"use client";

import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2, Loader2 } from "lucide-react";
import { ConferenteResponsavel } from "@/types/armazem-geral";

interface ConferenteDeleteDialogProps {
  conferente: ConferenteResponsavel | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isRemoving: boolean;
}

export function ConferenteDeleteDialog({
  conferente,
  isOpen,
  onClose,
  onConfirm,
  isRemoving,
}: ConferenteDeleteDialogProps) {
  if (!conferente) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="rounded-2xl border-none shadow-2xl overflow-hidden">
        <AlertDialogHeader className="p-6 pb-2">
          <AlertDialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100 shadow-sm">
              <Trash2 size={22} />
            </div>
            Confirmar Exclusão
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600 text-sm py-4 border-b border-gray-100">
            Você está prestes a remover o conferente <span className="font-bold text-gray-900 select-all">{conferente.name}</span>. 
            <br/><br/>
            Esta ação é irreversível e o operador não aparecerá mais em novas consultas ou seleções. Registros históricos que já utilizam este conferente não serão afetados.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="bg-gray-50 p-6 pt-4 flex gap-3">
          <AlertDialogCancel onClick={onClose} className="rounded-xl border-gray-300 hover:bg-white transiton-all h-11 px-6 font-semibold">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isRemoving}
            className="bg-red-600 hover:bg-red-700 text-white border-none rounded-xl h-11 px-6 font-semibold shadow-lg shadow-red-500/20 active:scale-95 transition-all min-w-[140px]"
          >
            {isRemoving ? (
              <div className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Excluindo...
              </div>
            ) : (
              "Confirmar Exclusão"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
