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
  ArrowLeftRight,
  Save,
  Loader2,
  Package,
  Lock,
  Search,
  AlertTriangle,
  Users,
  RefreshCw,
  UserCircle,
  ChevronDown,
  Plus,
  X,
  FileText,
  CheckCircle2,
  Container,
  Truck,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
} from 'lucide-react';
import { useCreateTransshipment } from '@/hooks/armazem-geral/useTransshipments';
import { useCargoList } from '@/hooks/armazem-geral/useCargo';
import { useOwnedContainersList } from '@/hooks/armazem-geral/useOwnedContainers';
import { useContainersList } from '@/hooks/armazem-geral/useContainers';
import { useConferentesList, useCreateConferente } from '@/hooks/armazem-geral/useConferentes';
import {
  ConferenteResponsavel,
  TransshipmentReason,
  WarehouseCargo,
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

interface RegisterTransshipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RegisterTransshipmentModal({ isOpen, onClose }: RegisterTransshipmentModalProps) {
  const [step, setStep] = useState(1);
  const { mutateAsync: createTransshipment, isPending: isCreating } = useCreateTransshipment();

  const [cargoSearch, setCargoSearch] = useState('');
  const { data: cargosData, isLoading: isLoadingCargos } = useCargoList({
    search: cargoSearch || undefined,
    limit: 6,
  });

  const [containerDestSearch, setContainerDestSearch] = useState('');
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
  const [openDestCb, setOpenDestCb] = useState(false);

  const [selectedCargo, setSelectedCargo] = useState<WarehouseCargo | null>(null);
  const [reason, setReason] = useState<TransshipmentReason | ''>('');
  const [destinationContainerId, setDestinationContainerId] = useState('');
  const [destinationContainerNumber, setDestinationContainerNumber] = useState('');
  const [auroraNewSeal, setAuroraNewSeal] = useState('');
  const [selectedConferenteId, setSelectedConferenteId] = useState('');
  const [showAddConferente, setShowAddConferente] = useState(false);
  const [observations, setObservations] = useState('');

  const [openCargoCb, setOpenCargoCb] = useState(false);

  const [errors, setErrors] = useState<{
    cargo?: string;
    reason?: string;
    destinationContainer?: string;
    auroraNewSeal?: string;
  }>({});

  const resetForm = () => {
    setStep(1);
    setCargoSearch('');
    setSelectedCargo(null);
    setReason('');
    setDestinationContainerId('');
    setDestinationContainerNumber('');
    setAuroraNewSeal('');
    setSelectedConferenteId('');
    setShowAddConferente(false);
    setObservations('');
    setErrors({});
    setContainerDestSearch('');
    setOpenDestCb(false);
  };

  useEffect(() => {
    if (!isOpen) resetForm();
  }, [isOpen]);

  const originContainerNumber = selectedCargo?.container?.containerNumber ?? selectedCargo?.entryContainer?.containerNumber ?? '';
  const originSeal = (selectedCargo?.container as any)?.originalSeal ?? '';

  const handleNext = () => {
    if (step === 1) {
      if (!selectedCargo) {
        setErrors({ ...errors, cargo: 'Selecione uma carga para iniciar o transbordo.' });
        return;
      }
      setErrors({ ...errors, cargo: undefined });
    }
    if (step === 2) {
      let isOk = true;
      const e: typeof errors = {};
      if (!reason) { e.reason = 'Informe o motivo do transbordo.'; isOk = false; }
      if (!destinationContainerId) { e.destinationContainer = 'Selecione o container destino.'; isOk = false; }
      if (!auroraNewSeal.trim()) { e.auroraNewSeal = 'Informe o Lacre Aurora do container destino.'; isOk = false; }
      setErrors({ ...errors, ...e });
      if (!isOk) return;
    }
    setStep((s) => s + 1);
  };

  const handlePrev = () => setStep((s) => s - 1);

  const selectedConferente = ALL_CONFERENTES.find((c) => c.id === selectedConferenteId) ?? null;

  const handleSelectOwnedContainer = (id: string, number: string) => {
    setDestinationContainerId(id);
    setDestinationContainerNumber(number);
    setErrors({ ...errors, destinationContainer: undefined });
  };

  const handleSubmit = async () => {
    if (!selectedCargo) return;

    const originContainerId = selectedCargo.containerId ?? selectedCargo.entryContainerId ?? '';

    if (!originContainerId) {
      toast.error('A carga selecionada não possui container de origem vinculado.');
      return;
    }

    try {
      await createTransshipment({
        containerId: originContainerId,
        cargoId: selectedCargo.id,
        originalSeal: originSeal || undefined,
        newSeal: auroraNewSeal.trim(),
        reason: reason as TransshipmentReason,
        destinationContainerId,
        destinationContainerNumber,
        responsibleName: selectedConferente?.name,
        responsibleMatricula: selectedConferente?.matricula,
        responsibleCpf: selectedConferente?.cpf,
        observations: observations.trim() || undefined,
      });
      toast.success('Transbordo registrado com sucesso!');
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Falha ao registrar transbordo.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden gap-0 border-none shadow-2xl">
        <div className="bg-orange-600 px-8 py-6">
          <DialogTitle className="text-2xl font-bold text-white">Registrar Transbordo</DialogTitle>
          <p className="text-orange-100 mt-1">
            {step === 1
              ? "Selecione a carga e valide a origem"
              : step === 2
                ? "Motivo e Destino da movimentação"
                : "Selecione o responsável e observações"}
          </p>
        </div>

        <div className="p-8 space-y-6 bg-white shrink-0">
          {/* Progress Indicator */}
          <div className="mb-10">
            <div className="flex items-center justify-between">
              <div className="flex flex-col items-center flex-1">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${step >= 1 ? "bg-orange-600 border-orange-600" : "border-gray-300 bg-white"}`}>
                  <Package className={step >= 1 ? "text-white" : "text-gray-400"} size={20} />
                </div>
                <p className={`text-sm font-medium mt-3 text-center transition-colors ${step >= 1 ? "text-orange-600" : "text-gray-400"}`}>1. Carga</p>
              </div>
              <div className="flex-1 flex items-center px-1" style={{ maxWidth: "120px", marginTop: "-30px" }}>
                <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-500 ease-in-out ${step >= 2 ? "bg-orange-600 w-full" : "bg-orange-600 w-0"}`} />
                </div>
              </div>
              <div className="flex flex-col items-center flex-1">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${step >= 2 ? "bg-orange-600 border-orange-600" : "border-gray-300 bg-white"}`}>
                  <Truck className={step >= 2 ? "text-white" : "text-gray-400"} size={20} />
                </div>
                <p className={`text-sm font-medium mt-3 text-center transition-colors ${step >= 2 ? "text-orange-600" : "text-gray-400"}`}>2. Destino</p>
              </div>
              <div className="flex-1 flex items-center px-1" style={{ maxWidth: "120px", marginTop: "-30px" }}>
                <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-500 ease-in-out ${step >= 3 ? "bg-orange-600 w-full" : "bg-orange-600 w-0"}`} />
                </div>
              </div>
              <div className="flex flex-col items-center flex-1">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${step >= 3 ? "bg-orange-600 border-orange-600" : "border-gray-300 bg-white"}`}>
                  <ShieldCheck className={step >= 3 ? "text-white" : "text-gray-400"} size={20} />
                </div>
                <p className={`text-sm font-medium mt-3 text-center transition-colors ${step >= 3 ? "text-orange-600" : "text-gray-400"}`}>3. Confirmação</p>
              </div>
            </div>
          </div>

          <div className="max-h-[50vh] overflow-y-auto px-1 pb-1">
            {step === 1 && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div>
                  <FieldLabel required>Selecionar Carga para Transbordo</FieldLabel>
                  <Popover open={openCargoCb} onOpenChange={setOpenCargoCb}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" className={cn("w-full justify-between bg-white h-auto py-2.5 px-3 border-gray-300", !selectedCargo && "text-gray-400 font-normal")}>
                        {selectedCargo ? (
                          <div className="flex items-center gap-2 truncate text-left w-full">
                            <Package className="w-4 h-4 shrink-0 text-orange-600" />
                            <span className="truncate flex-1 text-gray-800 font-medium">{selectedCargo.description}</span>
                          </div>
                        ) : "Buscar por descrição, documento, cliente..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-gray-400" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[500px] p-0" align="start">
                      <Command shouldFilter={false} className="max-h-[300px]">
                        <CommandInput placeholder="Buscar por descrição, documento, cliente..." value={cargoSearch} onValueChange={setCargoSearch} />
                        <CommandList>
                          <CommandEmpty>{isLoadingCargos ? "Buscando cargas..." : "Nenhuma carga encontrada."}</CommandEmpty>
                          <CommandGroup>
                            {cargosData?.data?.map((cargo) => (
                              <CommandItem key={cargo.id} onSelect={() => { setSelectedCargo(cargo); setOpenCargoCb(false); setErrors({ ...errors, cargo: undefined }); }} className="cursor-pointer">
                                <CheckCircle2 className={cn("mr-2 h-4 w-4", selectedCargo?.id === cargo.id ? "opacity-100 text-orange-600" : "opacity-0")} />
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-gray-800 text-sm truncate">{cargo.description}</p>
                                  <p className="text-[11px] text-gray-400 truncate">{cargo.customer?.name ?? 'Sem cliente'}</p>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FieldError msg={errors.cargo} />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div>
                  <FieldLabel required>Motivo do Transbordo</FieldLabel>
                  <Select value={reason} onValueChange={(v) => { setReason(v as TransshipmentReason); setErrors({...errors, reason: undefined}) }}>
                    <SelectTrigger className="h-11"><SelectValue placeholder="Selecione o motivo..." /></SelectTrigger>
                    <SelectContent>
                      {REASON_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex items-center gap-2"><opt.icon className={`w-4 h-4 ${opt.color}`} /><span>{opt.label}</span></div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError msg={errors.reason} />
                </div>
                <div>
                  <FieldLabel required>Container Destino</FieldLabel>
                  <Popover open={openDestCb} onOpenChange={setOpenDestCb}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-between h-auto py-2.5 px-3", !destinationContainerId && "text-gray-400")}>
                        {destinationContainerId ? destinationContainerNumber : "Buscar por container..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-gray-400" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[500px] p-0" align="start">
                      <Command shouldFilter={false} className="max-h-[300px]">
                        <CommandInput placeholder="Número do container..." value={containerDestSearch} onValueChange={setContainerDestSearch} />
                        <CommandList>
                          <CommandEmpty>Nenhum container encontrado.</CommandEmpty>
                          <CommandGroup>
                            {allDestContainers.map((c) => (
                              <CommandItem key={c.id} onSelect={() => { handleSelectOwnedContainer(c.id, c.number || ''); setOpenDestCb(false); }} className="cursor-pointer px-3 py-2">
                                <CheckCircle2 className={cn("mr-2 h-4 w-4 shrink-0", destinationContainerId === c.id ? "opacity-100 text-orange-600" : "opacity-0")} />
                                <div className="flex-1 truncate"><p className="font-semibold text-sm">{c.number}</p></div>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-700">{c.type}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FieldError msg={errors.destinationContainer} />
                </div>
                <div>
                  <FieldLabel required>Lacre Aurora</FieldLabel>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input type="text" placeholder="Lacre final" value={auroraNewSeal} onChange={(e) => setAuroraNewSeal(e.target.value.toUpperCase())} className="w-full pl-10 pr-3 py-2 text-sm border rounded-lg font-mono focus:ring-2 focus:ring-orange-400" />
                  </div>
                  <FieldError msg={errors.auroraNewSeal} />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div>
                  <FieldLabel required>Conferente Responsável</FieldLabel>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Select value={selectedConferenteId || undefined} onValueChange={setSelectedConferenteId}>
                        <SelectTrigger className="h-11"><SelectValue placeholder="Selecione o conferente" /></SelectTrigger>
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
                    <button type="button" onClick={() => setShowAddConferente(!showAddConferente)} className={`flex items-center justify-center w-10 h-10 rounded-lg border-2 ${showAddConferente ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-orange-600 border-orange-300'}`}>
                      {showAddConferente ? <X size={16} /> : <Plus size={16} />}
                    </button>
                  </div>
                  {showAddConferente && <AddConferenteForm onSuccess={(id) => { setSelectedConferenteId(id); setShowAddConferente(false); }} onCancel={() => setShowAddConferente(false)} />}
                  {selectedConferente && (
                    <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-800">
                      <CheckCircle2 size={14} className="text-orange-600 shrink-0" />
                      <span className="font-semibold">{selectedConferente.name}</span>
                      <span className="text-orange-600 opacity-70">{selectedConferente.matricula} · {selectedConferente.cpf}</span>
                    </div>
                  )}
                </div>
                <div>
                  <FieldLabel>Observações</FieldLabel>
                  <textarea value={observations} onChange={(e) => setObservations(e.target.value)} placeholder="Detalhes da conferência..." rows={4} className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-orange-400 resize-none" />
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="p-6 bg-gray-50 border-t">
          <div className="flex justify-between w-full items-center">
            <Button variant="ghost" onClick={handlePrev} disabled={step === 1}><ChevronLeft size={16} /> Voltar</Button>
            {step < 3 ? (
              <Button onClick={handleNext} disabled={step === 1 && !selectedCargo}>Próximo <ChevronRight size={16} /></Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isCreating} className="bg-orange-600 hover:bg-orange-700 text-white min-w-[150px]">
                {isCreating ? "Registrando..." : <><Save size={16} className="mr-2" /> Finalizar Transbordo</>}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
