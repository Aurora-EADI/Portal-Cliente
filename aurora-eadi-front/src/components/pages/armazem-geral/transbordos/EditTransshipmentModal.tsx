'use client';

import React, { useState, useEffect, useId } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  Save,
  Loader2,
  Package,
  Lock,
  AlertTriangle,
  Users,
  RefreshCw,
  UserCircle,
  Plus,
  X,
  FileText,
  CheckCircle2,
  Container,
  ChevronsUpDown,
  Truck,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useUpdateTransshipment } from '@/hooks/armazem-geral/useTransshipments';
import { useOwnedContainersList } from '@/hooks/armazem-geral/useOwnedContainers';
import { useContainersList } from '@/hooks/armazem-geral/useContainers';
import { useConferentesList, useCreateConferente } from '@/hooks/armazem-geral/useConferentes';
import {
  ConferenteResponsavel,
  TransshipmentReason,
  WarehouseTransshipment,
} from '@/types/armazem-geral';
import { toast } from 'sonner';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const REASON_OPTIONS: { value: TransshipmentReason; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'CONTAINER_DAMAGE', label: 'Avaria no Container', icon: AlertTriangle, color: 'text-red-500' },
  { value: 'CARGO_REGROUPING', label: 'Reagrupamento de Carga', icon: RefreshCw, color: 'text-blue-500' },
  { value: 'CLIENT_REQUEST', label: 'Solicitação do Cliente', icon: Users, color: 'text-orange-500' },
  { value: 'OTHER', label: 'Outro', icon: FileText, color: 'text-gray-500' },
];

function maskCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {children} {required && <span className="text-red-500">*</span>}
    </label>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-[11px] text-red-500 mt-1">{msg}</p>;
}

// ─────────────────────────────────────────────────────────────
// Sub-component: Add Conferente inline panel
// ─────────────────────────────────────────────────────────────
interface AddConferenteFormProps {
  onSuccess: (id: string) => void;
  onCancel: () => void;
}

function AddConferenteForm({ onSuccess, onCancel }: AddConferenteFormProps) {
  const uid = useId();
  const [name, setName] = useState('');
  const [matricula, setMatricula] = useState('');
  const [cpf, setCpf] = useState('');
  const [formErrors, setFormErrors] = useState<{ name?: string; matricula?: string; cpf?: string }>({});
  
  const { mutateAsync: createConferente, isPending } = useCreateConferente();

  const validate = () => {
    const e: typeof formErrors = {};
    if (!name.trim()) e.name = 'Nome obrigatório';
    if (!matricula.trim()) e.matricula = 'Matrícula obrigatória';
    if (cpf.replace(/\D/g, '').length !== 11) e.cpf = 'CPF inválido';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAdd = async () => {
    if (!validate()) return;
    try {
      const newConf = await createConferente({
        name: name.trim(),
        matricula: matricula.trim(),
        cpf: cpf.trim(),
      });
      toast.success('Conferente cadastrado e selecionado!');
      onSuccess(newConf.id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao cadastrar conferente.');
    }
  };

  return (
    <div className="mt-2 p-4 border border-orange-200 bg-orange-50/60 rounded-xl space-y-3 animate-in slide-in-from-top-2 duration-200">
      <p className="text-xs font-bold text-orange-700 uppercase tracking-wider flex items-center gap-2">
        <UserCircle size={14} />
        Novo Conferente Persistente
      </p>

      <div className="grid grid-cols-1 gap-2">
        <div>
          <label htmlFor={`${uid}-name`} className="block text-xs font-medium text-gray-600 mb-1">
            Nome Completo <span className="text-red-500">*</span>
          </label>
          <input
            id={`${uid}-name`}
            type="text"
            disabled={isPending}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: João da Silva"
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white ${formErrors.name ? 'border-red-400' : 'border-gray-300'}`}
          />
          {formErrors.name && <p className="text-[11px] text-red-500 mt-0.5">{formErrors.name}</p>}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor={`${uid}-mat`} className="block text-xs font-medium text-gray-600 mb-1">
              Matrícula <span className="text-red-500">*</span>
            </label>
            <input
              id={`${uid}-mat`}
              type="text"
              disabled={isPending}
              value={matricula}
              onChange={(e) => setMatricula(e.target.value)}
              placeholder="Ex: 00123"
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white ${formErrors.matricula ? 'border-red-400' : 'border-gray-300'}`}
            />
            {formErrors.matricula && <p className="text-[11px] text-red-500 mt-0.5">{formErrors.matricula}</p>}
          </div>

          <div>
            <label htmlFor={`${uid}-cpf`} className="block text-xs font-medium text-gray-600 mb-1">
              CPF <span className="text-red-500">*</span>
            </label>
            <input
              id={`${uid}-cpf`}
              type="text"
              disabled={isPending}
              value={cpf}
              onChange={(e) => setCpf(maskCpf(e.target.value))}
              placeholder="000.000.000-00"
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white ${formErrors.cpf ? 'border-red-400' : 'border-gray-300'}`}
            />
            {formErrors.cpf && <p className="text-[11px] text-red-500 mt-0.5">{formErrors.cpf}</p>}
          </div>
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <Button type="button" size="sm" disabled={isPending} onClick={handleAdd} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white text-xs h-8">
          {isPending ? <Loader2 size={13} className="animate-spin" /> : <><CheckCircle2 size={13} className="mr-1.5" /> Confirmar</>}
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={isPending} onClick={onCancel} className="text-xs h-8 border-gray-300">
          <X size={13} className="mr-1" /> Cancelar
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────
interface EditTransshipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  transshipment: WarehouseTransshipment;
}

export function EditTransshipmentModal({ isOpen, onClose, transshipment }: EditTransshipmentModalProps) {
  const { mutateAsync: updateTransshipment, isPending } = useUpdateTransshipment();

  const [step, setStep] = useState(1);

  // State
  const [reason, setReason] = useState<TransshipmentReason | ''>('');
  const [destinationContainerId, setDestinationContainerId] = useState('');
  const [destinationContainerNumber, setDestinationContainerNumber] = useState('');
  const [auroraNewSeal, setAuroraNewSeal] = useState('');

  const [selectedConferenteId, setSelectedConferenteId] = useState('');
  const [isAddingConferente, setIsAddingConferente] = useState(false);

  const [observations, setObservations] = useState('');
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  // Container Search
  const [containerDestSearch, setContainerDestSearch] = useState('');
  const [openDestCb, setOpenDestCb] = useState(false);

  const { data: ownedContainersData, isLoading: isLoadingOwnedContainers } = useOwnedContainersList({
    search: containerDestSearch || undefined,
    status: 'AVAILABLE',
    limit: 6,
  });
  const { data: originContainersData, isLoading: isLoadingOriginContainers } = useContainersList({
    search: containerDestSearch || undefined,
    limit: 6,
  });

  const { data: conferentesData } = useConferentesList({ limit: 100 });
  const ALL_CONFERENTES = conferentesData?.data || [];

  const allDestContainers = [
    ...(ownedContainersData?.data || []).map(c => ({
      id: c.id,
      number: c.containerNumber ?? c.code,
      type: 'Próprio/Aurora',
    })),
    ...(originContainersData?.data || []).map(c => ({
      id: c.id,
      number: c.containerNumber,
      type: 'Origem/Pátio',
    })),
  ];

  const isLoadingDestContainers = isLoadingOwnedContainers || isLoadingOriginContainers;

  // Initialize fields
  useEffect(() => {
    if (isOpen && transshipment) {
      setStep(1);
      setReason(transshipment.reason || '');
      setDestinationContainerId(transshipment.destinationContainerId || '');
      setDestinationContainerNumber(transshipment.destinationContainerNumber || '');
      setAuroraNewSeal(transshipment.newSeal || '');
      setObservations(transshipment.observations || '');

      // Try to find matching conferente in the list by matricula + name
      if (transshipment.responsibleName) {
        const match = ALL_CONFERENTES.find(c => 
          c.matricula === transshipment.responsibleMatricula && 
          c.name === transshipment.responsibleName
        );
        if (match) {
          setSelectedConferenteId(match.id);
        } else {
            // If no match in persistent list, we can't select by ID
            // In a real app we might want to "link" them, but for now we'll leave empty 
            // or the user selects a persistent one. 
            setSelectedConferenteId('');
        }
      } else {
        setSelectedConferenteId('');
      }
      
      setIsAddingConferente(false);
      setErrors({});
      setContainerDestSearch('');
      setOpenDestCb(false);
    }
  }, [isOpen, transshipment, ALL_CONFERENTES.length]); // Re-run when list loads

  const handleSelectContainer = (id: string, number: string) => {
    if (destinationContainerId === id) {
      setDestinationContainerId('');
      setDestinationContainerNumber('');
    } else {
      setDestinationContainerId(id);
      setDestinationContainerNumber(number);
      setErrors({ ...errors, destinationContainer: undefined });
    }
  };

  const handleNext = () => {
    if (step === 1) {
      const e: Record<string, string | undefined> = {};
      if (!reason) e.reason = 'Informe o motivo do transbordo.';
      if (!destinationContainerId) e.destinationContainer = 'Selecione o container de destino.';
      if (!auroraNewSeal.trim()) e.auroraNewSeal = 'Informe o Lacre Aurora do container destino.';
      setErrors(e);
      const hasErrors = Object.values(e).some(Boolean);
      if (hasErrors) return;
    }
    setStep((s) => s + 1);
  };

  const handlePrev = () => setStep((s) => s - 1);

  const handleSave = async () => {
    const conf = ALL_CONFERENTES.find(c => c.id === selectedConferenteId);

    try {
      await updateTransshipment({
        id: transshipment.id,
        data: {
          reason: reason as TransshipmentReason,
          destinationContainerId,
          destinationContainerNumber,
          newSeal: auroraNewSeal.trim(),
          responsibleName: conf?.name ?? transshipment.responsibleName ?? undefined,
          responsibleMatricula: conf?.matricula ?? transshipment.responsibleMatricula ?? undefined,
          responsibleCpf: conf?.cpf ?? transshipment.responsibleCpf ?? undefined,
          observations: observations.trim() || undefined,
        },
      });
      toast.success('Transbordo atualizado com sucesso!');
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Falha ao atualizar transbordo.');
    }
  };

  const selectedConferente = ALL_CONFERENTES.find(c => c.id === selectedConferenteId) ?? null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden gap-0 border-none shadow-2xl">

        {/* Header */}
        <div className="bg-orange-600 px-8 py-6">
          <DialogTitle className="text-2xl font-bold text-white">Editar Transbordo</DialogTitle>
          <p className="text-orange-50 mt-1">
            {step === 1
              ? 'Motivo, destino e lacre da movimentação'
              : 'Confirme o responsável e observações'}
          </p>
        </div>

        <div className="p-8 space-y-6 bg-white shrink-0">

          {/* Stepper */}
          <div className="mb-2">
            <div className="flex items-center justify-between">
              <div className="flex flex-col items-center flex-1">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${step >= 1 ? 'bg-orange-600 border-orange-600' : 'border-gray-300 bg-white'}`}>
                  <Truck className={step >= 1 ? 'text-white' : 'text-gray-400'} size={20} />
                </div>
                <p className={`text-sm font-medium mt-3 text-center transition-colors ${step >= 1 ? 'text-orange-600' : 'text-gray-400'}`}>1. Destino</p>
              </div>
              <div className="flex-1 flex items-center px-1" style={{ maxWidth: '120px', marginTop: '-30px' }}>
                <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-500 ease-in-out ${step >= 2 ? 'bg-orange-600 w-full' : 'bg-orange-600 w-0'}`} />
                </div>
              </div>
              <div className="flex flex-col items-center flex-1">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${step >= 2 ? 'bg-orange-600 border-orange-600' : 'border-gray-300 bg-white'}`}>
                  <ShieldCheck className={step >= 2 ? 'text-white' : 'text-gray-400'} size={20} />
                </div>
                <p className={`text-sm font-medium mt-3 text-center transition-colors ${step >= 2 ? 'text-orange-600' : 'text-gray-400'}`}>2. Confirmação</p>
              </div>
            </div>
          </div>

          <div className="max-h-[50vh] overflow-y-auto px-1 pb-1">
            {step === 1 && (
              <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Lock size={12} className="text-gray-400" /> Informações fixas de origem</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div><FieldLabel>Carga</FieldLabel><div className="relative"><Package className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" /><input readOnly value={transshipment?.cargo?.description || '—'} className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-100 text-gray-600 truncate focus:outline-none" /></div></div>
                    <div><FieldLabel>Container Origem</FieldLabel><div className="relative"><Container className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" /><input readOnly value={transshipment?.container?.containerNumber || '—'} className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-100 text-gray-600 font-mono focus:outline-none" /></div></div>
                    <div><FieldLabel>Lacre de Origem</FieldLabel><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" /><input readOnly value={transshipment?.container?.originalSeal || transshipment?.originalSeal || '—'} className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-100 text-gray-600 font-mono focus:outline-none" /></div></div>
                  </div>
                </div>
                <div>
                  <FieldLabel required>Motivo do Transbordo</FieldLabel>
                  <Select value={reason} onValueChange={(v) => { setReason(v as TransshipmentReason); setErrors({ ...errors, reason: undefined }); }}>
                    <SelectTrigger className="h-11"><SelectValue placeholder="Selecione o motivo..." /></SelectTrigger>
                    <SelectContent>{REASON_OPTIONS.map((opt) => (<SelectItem key={opt.value} value={opt.value}><div className="flex items-center gap-2"><opt.icon className={`w-4 h-4 ${opt.color}`} /><span>{opt.label}</span></div></SelectItem>))}</SelectContent>
                  </Select>
                  <FieldError msg={errors.reason} />
                </div>
                <div className="grid gap-2">
                  <FieldLabel required>Container Destino</FieldLabel>
                  <Popover open={openDestCb} onOpenChange={setOpenDestCb}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" className={cn('w-full justify-between bg-white h-auto py-2.5 px-3 border-gray-300 shadow-sm', !destinationContainerId && 'text-gray-400')}>{destinationContainerId ? destinationContainerNumber : "Buscar por container..."}<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-gray-400" /></Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[500px] p-0" align="start">
                      <Command shouldFilter={false} className="max-h-[300px]">
                        <CommandInput placeholder="Número do container..." value={containerDestSearch} onValueChange={setContainerDestSearch} />
                        <CommandList>
                          <CommandEmpty>{isLoadingDestContainers ? "Buscando containers..." : 'Nenhum container encontrado.'}</CommandEmpty>
                          <CommandGroup>{allDestContainers.map((c) => (<CommandItem key={c.id} onSelect={() => { handleSelectContainer(c.id, c.number || ''); setOpenDestCb(false); }} className="cursor-pointer px-3 py-2"><CheckCircle2 className={cn('mr-2 h-4 w-4', destinationContainerId === c.id ? 'opacity-100 text-orange-600' : 'opacity-0')} /><div className="flex-1 truncate"><p className="font-semibold text-sm">{c.number}</p></div><span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-700">{c.type}</span></CommandItem>))}</CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FieldError msg={errors.destinationContainer} />
                </div>
                <div>
                  <FieldLabel required>Lacre Aurora</FieldLabel>
                  <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" /><input type="text" placeholder="Lacre final" value={auroraNewSeal} onChange={(e) => setAuroraNewSeal(e.target.value.toUpperCase())} className="w-full pl-10 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-orange-400 font-mono" /></div>
                  <FieldError msg={errors.auroraNewSeal} />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                <div>
                  <FieldLabel required>Conferente Responsável</FieldLabel>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Select value={selectedConferenteId || undefined} onValueChange={setSelectedConferenteId}>
                        <SelectTrigger className="h-11 bg-white"><SelectValue placeholder="Selecione o conferente" /></SelectTrigger>
                        <SelectContent>
                          {ALL_CONFERENTES.length === 0 ? (
                            <SelectItem value="none" disabled>Nenhum conferente cadastrado</SelectItem>
                          ) : (
                            ALL_CONFERENTES.map((c) => (
                              <SelectItem key={c.id} value={c.id}>{c.name} (Mat. {c.matricula})</SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <button type="button" onClick={() => setIsAddingConferente(!isAddingConferente)} className={`flex items-center justify-center w-10 h-10 rounded-lg border-2 ${isAddingConferente ? 'bg-orange-600 text-white border-orange-600 shadow-md' : 'bg-white text-orange-600 border-orange-300 hover:bg-orange-50'}`}>
                      {isAddingConferente ? <X size={16} /> : <Plus size={16} />}
                    </button>
                  </div>
                  {isAddingConferente && <AddConferenteForm onCancel={() => setIsAddingConferente(false)} onSuccess={(id) => { setSelectedConferenteId(id); setIsAddingConferente(false); }} />}
                  {selectedConferente ? (
                    <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-800">
                      <CheckCircle2 size={14} className="text-orange-600 shrink-0" />
                      <span className="font-semibold">{selectedConferente.name}</span>
                      <span className="text-orange-600 opacity-70">{selectedConferente.matricula} · {selectedConferente.cpf}</span>
                    </div>
                  ) : transshipment.responsibleName && (
                    <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 italic">
                      <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                      <span>{transshipment.responsibleName} (Não vinculado ao cadastro fixo)</span>
                    </div>
                  )}
                </div>
                <div><FieldLabel>Observações</FieldLabel><textarea value={observations} onChange={(e) => setObservations(e.target.value)} placeholder="Detalhes ou ressalvas..." rows={4} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 bg-white resize-none" /></div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="p-6 bg-gray-50 border-t">
          <div className="flex justify-between w-full items-center">
            <button type="button" onClick={step === 1 ? onClose : handlePrev} className="text-gray-500 hover:text-gray-900 text-sm font-medium flex items-center gap-1">
              {step === 1 ? 'Cancelar' : <><ChevronLeft size={16} /> Voltar</>}
            </button>
            {step < 2 ? (
              <Button type="button" onClick={handleNext} className="bg-orange-600 hover:bg-orange-700 text-white min-w-[120px]">Próximo <ChevronRight size={16} /></Button>
            ) : (
              <Button type="button" onClick={handleSave} disabled={isPending} className="bg-orange-600 hover:bg-orange-700 text-white min-w-[150px]">
                {isPending ? 'Salvando...' : <><Save size={16} className="mr-2" /> Salvar Alterações</>}
              </Button>
            )}
          </div>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}
