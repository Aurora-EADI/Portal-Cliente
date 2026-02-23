'use client';

import React, { useState, useEffect } from 'react';
import { Document } from '@/types/document';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RejectionReasonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: Document | null;
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
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!reason.trim() || isLoading}
          >
            {isLoading && <Loader2 className="animate-spin" size={16} />}
            Confirmar Reprovação
          </Button>
        </div>
      </div>
    </div>
  );
}
