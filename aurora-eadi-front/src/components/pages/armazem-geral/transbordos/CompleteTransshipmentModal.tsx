import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, Save, Loader2, Package, Lock, Container, ArrowRight } from 'lucide-react';
import { useCompleteTransshipment } from '@/hooks/armazem-geral/useTransshipments';
import { WarehouseTransshipment } from '@/types/armazem-geral';
import { toast } from 'sonner';

interface CompleteTransshipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  transshipment: WarehouseTransshipment;
}

export function CompleteTransshipmentModal({ isOpen, onClose, transshipment }: CompleteTransshipmentModalProps) {
  const { mutateAsync: completeTransshipment, isPending: isCompleting } = useCompleteTransshipment();

  // Pre-populate with the seal already registered in the transshipment
  const [newSeal, setNewSeal] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNewSeal(transshipment.newSeal || '');
    }
  }, [isOpen, transshipment.newSeal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await completeTransshipment({
        id: transshipment.id,
        data: {
          newSeal: newSeal.trim() || undefined,
        },
      });
      toast.success('Transbordo finalizado com sucesso!');
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Falha ao finalizar transbordo.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl">

        {/* Header */}
        <div className="bg-orange-600 px-7 py-5">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-white">Finalizar Transbordo</DialogTitle>
                <DialogDescription className="text-orange-50 text-sm mt-0.5">
                  Confirme os dados antes de concluir a operação.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-7 py-6 space-y-5 bg-white">

            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3">
              {/* Container Origem */}
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  <Package size={11} /> Carga
                </p>
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {transshipment.cargo?.description || '—'}
                </p>
              </div>

              {/* Container Origem → Destino */}
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1">
                  <Container size={11} /> Contêineres
                </p>
                <div className="flex items-center gap-1.5 text-sm font-mono">
                  <span className="font-semibold text-gray-700 truncate">
                    {transshipment.container?.containerNumber || '—'}
                  </span>
                  <ArrowRight size={13} className="text-gray-400 shrink-0" />
                  <span className="font-semibold text-orange-700 truncate">
                    {transshipment.destinationContainerNumber || '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Lacre Aurora — pre-populated, editable if needed */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Lacre Aurora (Novo)
                {transshipment.newSeal && (
                  <span className="ml-2 text-[10px] font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                    Pré-preenchido
                  </span>
                )}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Número do lacre (opcional)"
                  value={newSeal}
                  onChange={(e) => setNewSeal(e.target.value.toUpperCase())}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono text-sm"
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                Valor registrado no transbordo. Edite somente se necessário corrigir.
              </p>
            </div>

            {/* Warning */}
            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <CheckCircle size={15} className="text-amber-500 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-800 leading-relaxed">
                Após a confirmação, o transbordo será marcado como <strong>Concluído</strong> e o contêiner voltará ao status normal no pátio.
              </p>
            </div>

          </div>

          <DialogFooter className="px-7 py-5 bg-gray-50 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={isCompleting} className="border-gray-300">
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isCompleting}
              className="bg-orange-600 hover:bg-orange-700 text-white border-none min-w-[160px]"
            >
              {isCompleting
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Finalizando...</>
                : <><CheckCircle className="w-4 h-4 mr-2" /> Confirmar Finalização</>
              }
            </Button>
          </DialogFooter>
        </form>

      </DialogContent>
    </Dialog>
  );
}
