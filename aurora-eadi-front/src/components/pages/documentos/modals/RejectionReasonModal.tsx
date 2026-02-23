'use client';

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

type RejectableDocument = {
  name: string;
};

interface RejectionReasonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: RejectableDocument | null;
  onConfirm: (reason: string) => void;
  isLoading?: boolean;
}

/**
 * Modal para coletar motivo de rejeição de documento
 *
 * @example
 * <RejectionReasonModal
 *   open={!!rejectingDoc}
 *   onOpenChange={(open) => !open && setRejectingDoc(null)}
 *   document={rejectingDoc}
 *   onConfirm={handleRejectConfirm}
 *   isLoading={isUpdatingDoc}
 * />
 */
export function RejectionReasonModal({
  open,
  onOpenChange,
  document,
  onConfirm,
  isLoading = false,
}: RejectionReasonModalProps) {
  const [reason, setReason] = useState('');

  // Reset reason when modal closes
  useEffect(() => {
    if (!open) {
      setReason('');
    }
  }, [open]);

  const handleConfirm = () => {
    if (reason.trim()) {
      onConfirm(reason);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onOpenChange(false);
    }
  };

  if (!open || !document) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 backdrop-blur-[2px] animate-in fade-in">
      <div
        className="bg-card rounded-xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200"
        onKeyDown={handleKeyDown}
      >
        <h3 className="text-lg font-bold text-foreground mb-2">
          Reprovar Documento
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Justificativa para reprovar <strong>{document.name}</strong>:
        </p>
        <textarea
          className="w-full h-32 p-3 border border-border rounded-lg focus:ring-2 focus:ring-red-500 outline-none resize-none text-sm bg-muted/50 text-foreground placeholder:text-muted-foreground"
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Descreva o motivo..."
          autoFocus
        />
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="px-4 py-2 text-muted-foreground hover:bg-accent rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!reason.trim() || isLoading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
            {isLoading && <Loader2 className="animate-spin" size={16} />}
            Confirmar Reprovação
          </button>
        </div>
      </div>
    </div>
  );
}
