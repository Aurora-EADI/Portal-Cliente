import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Package,
  Lock,
  Clock,
  CheckCircle,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Users,
  UserCircle,
  ArrowRight,
  Container,
  StickyNote,
} from 'lucide-react';
import { WarehouseTransshipment, TransshipmentReason } from '@/types/armazem-geral';
import { Badge } from '@/components/ui/Badge';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const REASON_CONFIG: Record<TransshipmentReason, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  CONTAINER_DAMAGE: { label: 'Avaria no Container', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
  CARGO_REGROUPING: { label: 'Reagrupamento de Carga', icon: RefreshCw, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
  CLIENT_REQUEST: { label: 'Solicitação do Cliente', icon: Users, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
  OTHER: { label: 'Outro Motivo', icon: FileText, color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200' },
};

function DetailField({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">{label}</p>
      <div className="text-sm font-semibold text-gray-800">{value}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────
interface TransshipmentDetailsCardProps {
  transshipment: WarehouseTransshipment;
  onClose: () => void;
}

export function TransshipmentDetailsCard({ transshipment, onClose }: TransshipmentDetailsCardProps) {
  const isCompleted = transshipment.status === 'COMPLETED';
  const reasonCfg = transshipment.reason ? REASON_CONFIG[transshipment.reason] : null;
  const ReasonIcon = reasonCfg?.icon ?? FileText;

  return (
    <Dialog open={!!transshipment} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-0 overflow-hidden rounded-2xl border-none shadow-2xl">

        {/* Header decorativo */}
        <div
          className="px-8 py-6 text-white bg-orange-600"
        >
          <DialogHeader>
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-md">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-white leading-tight">
                  Detalhes do Transbordo
                </DialogTitle>
                <p className="text-white/70 text-xs font-mono mt-0.5">ID: {transshipment.id}</p>
              </div>
            </div>
          </DialogHeader>

          {/* Status */}
          <div className="mt-4 flex items-center gap-3">
            <Badge
              variant="warning"
              className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg bg-white/20 border-white/20 text-white"
            >
              {isCompleted ? '✓ Concluído' : 'PENDENTE'}
            </Badge>

            {/* Datas inline */}
            <span className="text-white/60 text-xs flex items-center gap-1">
              <Calendar size={12} />
              {new Date(transshipment.createdAt).toLocaleString('pt-BR')}
            </span>
            {isCompleted && (
              <>
                <ArrowRight size={12} className="text-white/40" />
                <span className="text-white/60 text-xs flex items-center gap-1">
                  <CheckCircle size={12} />
                  {new Date(transshipment.updatedAt).toLocaleString('pt-BR')}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="p-6 space-y-5 bg-white">

          {/* ── Motivo ────────────────────────────────── */}
          {reasonCfg && (
            <div className={`flex items-center gap-3 p-4 rounded-xl border ${reasonCfg.bg}`}>
              <ReasonIcon className={`w-5 h-5 ${reasonCfg.color} shrink-0`} />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Motivo do Transbordo</p>
                <p className={`text-sm font-bold ${reasonCfg.color}`}>{reasonCfg.label}</p>
              </div>
            </div>
          )}

          {/* ── Carga e Container Origem ──────────────── */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
              <div className="flex items-center gap-2 text-orange-600">
                <Package size={16} className="stroke-[2.5]" />
                <h3 className="text-[10px] font-black uppercase tracking-widest">Origem</h3>
              </div>

              {transshipment.cargo && (
                <DetailField
                  label="Carga"
                  value={<span className="text-xs">{transshipment.cargo.description}</span>}
                />
              )}

              <DetailField
                label="Container de Origem"
                value={
                  <span className="font-mono text-base">
                    {transshipment.container?.containerNumber ?? '—'}
                  </span>
                }
              />

              <DetailField
                label="Lacre de Origem"
                value={
                  <span className="flex items-center gap-1.5 font-mono">
                    <Lock size={13} className="text-gray-400" />
                    {transshipment.originalSeal || 'Não registrado'}
                  </span>
                }
              />
            </div>

            {/* ── Container Destino ──────────────────── */}
            <div className={`p-4 rounded-xl border space-y-3 ${isCompleted ? 'bg-orange-50/50 border-orange-100' : 'bg-gray-50 border-gray-100'}`}>
              <div className={`flex items-center gap-2 ${isCompleted ? 'text-orange-600' : 'text-orange-600'}`}>
                <Container size={16} className="stroke-[2.5]" />
                <h3 className="text-[10px] font-black uppercase tracking-widest">Destino</h3>
              </div>

              <DetailField
                label="Container Destino"
                value={
                  <span className="font-mono text-base">
                    {transshipment.destinationContainerNumber ?? '—'}
                  </span>
                }
              />

              <DetailField
                label="Lacre Aurora (Novo)"
                value={
                  <span className={`flex items-center gap-1.5 font-mono ${isCompleted ? 'text-orange-800' : transshipment.newSeal ? 'text-orange-800' : 'text-gray-400 italic'}`}>
                    <Lock size={13} className={isCompleted ? 'text-orange-500' : 'text-orange-400'} />
                    {transshipment.newSeal || 'Aguardando finalização'}
                  </span>
                }
              />
            </div>
          </div>

          {/* ── Conferente Responsável ────────────────── */}
          {transshipment.responsibleName ? (
            <div className="flex items-start gap-3 p-4 bg-orange-50/50 rounded-xl border border-orange-100">
              <UserCircle className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Conferente Responsável</p>
                <p className="text-sm font-bold text-gray-800">{transshipment.responsibleName}</p>
                <div className="flex gap-4 mt-1">
                  {transshipment.responsibleMatricula && (
                    <p className="text-xs text-gray-500">Matrícula: <span className="font-semibold">{transshipment.responsibleMatricula}</span></p>
                  )}
                  {transshipment.responsibleCpf && (
                    <p className="text-xs text-gray-500">CPF: <span className="font-semibold">{transshipment.responsibleCpf}</span></p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 text-gray-400">
              <UserCircle size={16} />
              <p className="text-xs italic">Nenhum conferente responsável informado.</p>
            </div>
          )}

          {/* ── Observações ──────────────────────────── */}
          {transshipment.observations && (
            <div className="flex items-start gap-3 p-4 bg-amber-50/60 rounded-xl border border-amber-100">
              <StickyNote className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Observações</p>
                <p className="text-sm text-gray-700 leading-relaxed">{transshipment.observations}</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="bg-gray-50 px-6 py-4 flex justify-end border-t border-gray-100">
          <Button
            variant="outline"
            onClick={onClose}
            className="px-8 rounded-xl border-gray-200 text-gray-500 font-bold hover:bg-white transition-all shadow-sm"
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
