'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Printer, Building2, History, Lock, Save, ArrowLeft, Plane, CheckCircle, Send, XCircle, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/Badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCustomers } from '@/hooks/useCustomers';
import { useAuthContext } from '@/context/AuthContext';
import {
  useCreateAirSimulation,
  useUpdateAirSimulation,
  useAirSimulation,
  useCreateAirSimulationVersion,
  useAddAirSimulationService,
  useStartAirSimulationValidation,
  useChangeAirSimulationStatus,
} from '@/hooks/useAirSimulations';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAirServices, useServices } from '@/hooks/useServices';
import { SimulationStatus } from '@/types';
import { AirServicesTab } from './AirServicesTab';
import { formatCurrency, formatPercent, formatNumberBR, parseNumberBR } from '@/lib/utils';
import { calculateServiceCost } from '@/lib/calculations';
import { ServiceCostType } from '@/types';
import { exportAirSimulationToPDF } from '@/services/pdfService';

const DEFAULT_MIN_BILLING = 350; // Regra 1.1.9 - Valor mínimo para emissão de NF

export function AirSimulator() {
  const { currentUser } = useAuthContext();
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlId = searchParams.get('id');

  // Customers Data
  const { data: customersData, isLoading: isLoadingCustomers } = useCustomers();

  // Services Data
  const { data: servicesData, isLoading: isLoadingServices } = useAirServices(false);

  // Mutations
  const createSimulationMutation = useCreateAirSimulation();
  const updateSimulationMutation = useUpdateAirSimulation();
  const createVersionMutation = useCreateAirSimulationVersion();
  const addServiceMutation = useAddAirSimulationService();
  const startValidationMutation = useStartAirSimulationValidation();
  const changeStatusMutation = useChangeAirSimulationStatus();

  // State Management
  const [currentSimulationId, setCurrentSimulationId] = useState<string | null>(urlId);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [isNewVersionDialogOpen, setIsNewVersionDialogOpen] = useState(false);
  const [versionReason, setVersionReason] = useState('');
  const [isEditingVersion, setIsEditingVersion] = useState(false);

  // Form Fields
  const [cifUsd, setCifUsd] = useState<string>('');
  const [dollarRate, setDollarRate] = useState<string>('5.85');
  const [cifBrl, setCifBrl] = useState<string>('0');
  const [weightKg, setWeightKg] = useState<string>('');
  const [volumeM3, setVolumeM3] = useState<string>('');
  const [storageRate, setStorageRate] = useState<string>('0.35');
  const [discount, setDiscount] = useState<string>('0');
  const [minBillingValue, setMinBillingValue] = useState<string>(DEFAULT_MIN_BILLING.toString());
  const [auroraPeriods, setAuroraPeriods] = useState<string>('1');
  const [vinciPeriods, setVinciPeriods] = useState<string>('1');
  const [cifInputMode, setCifInputMode] = useState<'USD' | 'BRL'>('USD');

  // Local state for services before saving simulation
  const [localServices, setLocalServices] = useState<Array<{
    serviceId: string;
    costType: any;
    originalCost: number;
    appliedCost: number;
    customReason?: string;
  }>>([]);

  // Calculate CIF BRL numeric value
  const cifBrlNum = useMemo(() => {
    if (cifInputMode === 'USD') {
      const usd = parseNumberBR(cifUsd) || 0;
      const rate = parseNumberBR(dollarRate) || 0;
      return usd * rate;
    } else {
      return parseNumberBR(cifBrl) || 0;
    }
  }, [cifInputMode, cifUsd, dollarRate, cifBrl]);

  // Current Simulation Data
  const { data: currentSimulation, isLoading: isLoadingSimulation } = useAirSimulation(currentSimulationId);

  // Get effective services list
  const effectiveServicesList = useMemo(() => {
    const list = currentSimulationId ? (currentSimulation?.services || []) : localServices;
    return list;
  }, [localServices, currentSimulationId, currentSimulation?.services]);

  // Helper function to identify services excluded from minimum billing (Transporte DTA)
  const isExcludedFromMinBilling = (name: string | undefined): boolean => {
    if (!name) return false;
    const normalized = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
    return normalized.includes('transporte') && normalized.includes('dta');
  };

  // Calculate total services in real-time
  const { totalServices: calculatedTotalServices, eligibleServicesTotal, excludedServicesTotal } = useMemo(() => {
    const calcData = {
      cifBrl: cifBrlNum,
      tonnes: parseNumberBR(weightKg) / 1000,
      cntrCount: 1,
      weightKg: parseNumberBR(weightKg),
      volumeM3: parseNumberBR(volumeM3),
    };

    return effectiveServicesList.reduce((acc, s) => {
      let cost = 0;
      const serviceDef = servicesData?.find(sd => sd.id === s.serviceId);

      if (s.costType === ServiceCostType.DEFAULT) {
        if (serviceDef) {
          cost = calculateServiceCost(Number(s.originalCost || 0), serviceDef.calculationType, calcData);
        }
      } else {
        cost = Number(s.appliedCost || 0);
      }

      // Check name against service definition or snapshot name
      const sName = serviceDef?.name || (s as any).serviceName || '';
      const isExcluded = isExcludedFromMinBilling(sName);

      if (isExcluded) {
        acc.excludedServicesTotal += cost;
      } else {
        acc.eligibleServicesTotal += cost;
      }
      acc.totalServices += cost;

      return acc;
    }, { totalServices: 0, eligibleServicesTotal: 0, excludedServicesTotal: 0 });
  }, [effectiveServicesList, cifBrlNum, weightKg, servicesData, volumeM3]);

  // Count of selected services
  const servicesCount = effectiveServicesList.length;

  // Calculate costs based on rates
  const calculatedStorageCost = useMemo(() => {
    const rate = 0.35 * (parseInt(auroraPeriods) || 1);
    return (rate / 100) * (cifBrlNum || 0);
  }, [auroraPeriods, cifBrlNum]);

  // Calculate Capatazia cost
  const calculatedCapataziaCost = useMemo(() => {
    const weight = parseNumberBR(weightKg);
    if (!weight || weight <= 0) return 0;
    return Math.max(weight * 1.4737, 94.11);
  }, [weightKg]);

  // Calculate total general in real-time
  // Business Rule: Adjustment = Max(0, Threshold - (EligibleServices + Storage + Capatazia))
  // Final Total = (EligibleServices + Storage + Capatazia + Adjustment) + ExcludedServices - Discount
  const { minDiff, totalGeneral } = useMemo(() => {
    const eligibleServices = eligibleServicesTotal;
    const excludedServices = excludedServicesTotal;
    const storage = calculatedStorageCost;
    const capatazia = calculatedCapataziaCost;
    const discountValue = parseNumberBR(discount);
    const minThreshold = parseNumberBR(minBillingValue);

    const totalCurrentCosts = eligibleServices + storage + capatazia;
    const difference = totalCurrentCosts < minThreshold ? minThreshold - totalCurrentCosts : 0;

    return {
      minDiff: difference,
      totalGeneral: totalCurrentCosts + difference + excludedServices - discountValue
    };
  }, [eligibleServicesTotal, excludedServicesTotal, calculatedStorageCost, calculatedCapataziaCost, discount, minBillingValue]);

  const calculatedTotalGeneral = totalGeneral;

  // Auto-calculate CIF BRL (apenas no modo USD)
  useEffect(() => {
    if (cifInputMode === 'USD') {
      if (cifBrlNum > 0) {
        setCifBrl(formatCurrency(cifBrlNum, false));
      } else {
        setCifBrl('0,00');
      }
    }
  }, [cifBrlNum, cifInputMode]);

  // Auto-calculate CIF USD (apenas no modo BRL)
  useEffect(() => {
    if (cifInputMode === 'BRL') {
      const rate = parseNumberBR(dollarRate) || 0;
      const brl = parseNumberBR(cifBrl) || 0;
      setCifUsd(formatNumberBR(rate > 0 ? brl / rate : 0));
    }
  }, [cifBrl, dollarRate, cifInputMode]);

  // Sync currentSimulationId with URL
  useEffect(() => {
    if (urlId && urlId !== currentSimulationId) {
      setCurrentSimulationId(urlId);
    }
  }, [urlId]);

  // Auto-transition PENDING → IN_VALIDATION when simulation is opened
  useEffect(() => {
    if (
      currentSimulation &&
      currentSimulation.status === SimulationStatus.PENDING
    ) {
      startValidationMutation.mutate(currentSimulation.id);
    }
  }, [currentSimulation?.id, currentSimulation?.status]);

  // Load current simulation data
  useEffect(() => {
    if (currentSimulation) {
      setSelectedCustomerId(currentSimulation.customerId);
      setCifUsd(formatNumberBR(currentSimulation.cifUsd));
      setDollarRate(formatNumberBR(currentSimulation.dollarRate));
      setWeightKg(formatNumberBR(currentSimulation.weightKg));
      setVolumeM3(formatNumberBR(currentSimulation.volumeM3));

      // Calculate rates from saved costs for consistency
      const savedStorageCost = Number(currentSimulation.storageCost || 0);
      const savedCifBrl = Number(currentSimulation.cifBrl || 0);
      if (savedCifBrl > 0) {
        setStorageRate(formatNumberBR((savedStorageCost / savedCifBrl) * 100, 4));
      }

      setDiscount(formatNumberBR(currentSimulation.discount || 0));
      setMinBillingValue(formatNumberBR(currentSimulation.minBillingValue ?? DEFAULT_MIN_BILLING));
      setAuroraPeriods(currentSimulation.auroraPeriods?.toString() || '1');
      setVinciPeriods(currentSimulation.vinciPeriods?.toString() || '1');
    }
  }, [currentSimulation]);

  // Handler: Update customer selection (local state only)
  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomerId(customerId);
  };

  // Handlers for local services management
  const handleAddLocalService = (service: {
    serviceId: string;
    costType: any;
    originalCost: number;
    appliedCost: number;
    customReason?: string;
  }) => {
    setLocalServices((prev) => {
      const filtered = prev.filter((s) => s.serviceId !== service.serviceId);
      return [...filtered, service];
    });
  };

  const handleRemoveLocalService = (serviceId: string) => {
    setLocalServices((prev) => prev.filter((s) => s.serviceId !== serviceId));
  };

  // Handler: Save simulation (Create or Update)
  const handleSaveSimulation = async () => {
    if (!selectedCustomerId) {
      toast.error('Por favor, selecione um cliente');
      return;
    }

    if (!cifUsd || parseFloat(cifUsd) <= 0) {
      toast.error('Por favor, informe o valor CIF USD válido');
      return;
    }

    try {
      if (!currentSimulationId) {
        const newSimulation = await createSimulationMutation.mutateAsync({
          customerId: selectedCustomerId,
          cifUsd: parseNumberBR(cifUsd),
          dollarRate: parseNumberBR(dollarRate),
          weightKg: parseNumberBR(weightKg) || undefined,
          volumeM3: parseNumberBR(volumeM3) || undefined,
          storageCost: calculatedStorageCost,
          capataziaCost: calculatedCapataziaCost,
          discount: parseNumberBR(discount),
          minBillingValue: parseNumberBR(minBillingValue),
          auroraPeriods: parseInt(auroraPeriods) || 1,
          vinciPeriods: parseInt(vinciPeriods) || 1,
          initialServices: localServices,
        });

        setLocalServices([]);
        setCurrentSimulationId(newSimulation.id);
        toast.success('Simulação aérea criada com sucesso!');
        router.push('/aereo/history');
      } else {
        await updateSimulationMutation.mutateAsync({
          id: currentSimulationId,
          data: {
            customerId: selectedCustomerId,
            cifUsd: parseNumberBR(cifUsd),
            dollarRate: parseNumberBR(dollarRate),
            weightKg: parseNumberBR(weightKg) || undefined,
            volumeM3: parseNumberBR(volumeM3) || undefined,
            storageCost: calculatedStorageCost,
            capataziaCost: calculatedCapataziaCost,
            discount: parseNumberBR(discount),
            minBillingValue: parseNumberBR(minBillingValue),
            auroraPeriods: parseInt(auroraPeriods) || 1,
            vinciPeriods: parseInt(vinciPeriods) || 1,
          },
        });
        toast.success('Simulação aérea atualizada com sucesso!');
        setIsEditingVersion(false);
        router.push('/aereo/history');
      }
    } catch (error) {
      console.error('Error saving simulation:', error);
      toast.error('Erro ao salvar simulação. Por favor, tente novamente.');
    }
  };

  // Handler: Export to PDF
  const handleExportPDF = () => {
    if (!currentSimulation) {
      toast.error('Salve a simulação antes de exportar o PDF');
      return;
    }

    // Preparamos um objeto enriquecido para o PDF caso alguns dados calculados localmente não estejam no objeto retornado
    const simulationForPdf = {
      ...currentSimulation,
      // Se estivermos editando e ainda não salvamos, poderíamos usar os valores locais, 
      // mas o requisito geralmente é exportar o que foi salvo ou o estado atual se estiver bloqueado.
      // Vou passar o currentSimulation que é o que vem do hook useAirSimulation.
    };

    exportAirSimulationToPDF(simulationForPdf as any);
  };

  // Handler: Create new version
  const handleCreateNewVersion = async () => {
    if (!currentSimulation) return;

    try {
      const newVersion = await createVersionMutation.mutateAsync({
        baseSimulationId: currentSimulation.id,
        versionReason: versionReason || undefined,
        customerId: selectedCustomerId,
        cifUsd: parseNumberBR(cifUsd),
        dollarRate: parseNumberBR(dollarRate),
        weightKg: parseNumberBR(weightKg) || undefined,
        volumeM3: parseNumberBR(volumeM3) || undefined,
        storageCost: calculatedStorageCost,
        capataziaCost: calculatedCapataziaCost,
        discount: parseNumberBR(discount),
        minBillingValue: parseNumberBR(minBillingValue),
        auroraPeriods: parseInt(auroraPeriods) || 1,
        vinciPeriods: parseInt(vinciPeriods) || 1,
      });

      setCurrentSimulationId(newVersion.id);
      setIsEditingVersion(true);
      setIsNewVersionDialogOpen(false);
      setVersionReason('');

      // Atualiza a URL sem recarregar para manter o estado local de edição
      const newUrl = window.location.pathname + '?id=' + newVersion.id;
      window.history.pushState({ path: newUrl }, '', newUrl);
    } catch (error) {
      console.error('Error creating new version:', error);
    }
  };

  const isEditable = !currentSimulationId || isEditingVersion;

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Plane className="w-8 h-8 text-primary-600" />
            Simulador de Custo Aéreo
          </h1>
          <div className="flex items-center gap-4 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/aereo/history')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Histórico
            </Button>
            {currentSimulation && (
              <div className="flex items-center gap-3">
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  ID da Simulação:
                  <span className="font-mono font-bold bg-gray-100 px-2 py-0.5 rounded text-gray-700 border border-gray-200">
                    {currentSimulation.displayNumber}
                  </span>
                </p>

                {/* Seletor de Versões */}
                {currentSimulation.versions && currentSimulation.versions.length > 1 && (
                  <div className="flex items-center gap-2 px-3 border-l border-gray-200">
                    <Label className="text-[10px] uppercase font-bold text-gray-400">Versão</Label>
                    <Select
                      value={currentSimulation.id}
                      onValueChange={(value) => {
                        setIsEditingVersion(false);
                        router.push(`/aereo/simulador?id=${value}`);
                      }}
                    >
                      <SelectTrigger className="w-[110px] h-8 text-xs font-bold bg-white border-primary-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currentSimulation.versions.map((v: any) => (
                          <SelectItem key={v.id} value={v.id} className="text-xs font-medium">
                            Versão {v.version} {v.isCurrentVersion && '⭐'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {(() => {
                  const statusLabels: Record<string, { label: string; color: string }> = {
                    PENDING:       { label: 'Pendente',      color: 'bg-gray-100 text-gray-600 border-gray-200' },
                    IN_VALIDATION: { label: 'Em Validação',  color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
                    APPROVED:      { label: 'Aprovada',      color: 'bg-green-50 text-green-700 border-green-200' },
                    DRAFT:         { label: 'Rascunho',      color: 'bg-gray-100 text-gray-500 border-gray-200' },
                    SENT:          { label: 'Enviada',       color: 'bg-blue-50 text-blue-700 border-blue-200' },
                  };
                  const cfg = statusLabels[currentSimulation.status] ?? { label: currentSimulation.status, color: 'bg-gray-100 text-gray-500 border-gray-200' };
                  return (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  );
                })()}
                {!currentSimulation.isCurrentVersion && (
                  <Badge variant="outline" className="text-gray-500 bg-gray-50">
                    <Lock className="w-3 h-3 mr-1" />
                    Versão Antiga
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {/* Dropdown unificado de status */}
          {currentSimulationId && currentSimulation?.isCurrentVersion && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  Definir Status
                  <ChevronDown size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Definir Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  disabled={currentSimulation?.status === SimulationStatus.APPROVED || changeStatusMutation.isPending}
                  onClick={() => changeStatusMutation.mutate({ id: currentSimulationId, status: SimulationStatus.APPROVED })}
                  className="gap-2"
                >
                  <CheckCircle size={16} className="text-green-600" />
                  Aprovada
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={currentSimulation?.status === SimulationStatus.SENT || changeStatusMutation.isPending}
                  onClick={() => changeStatusMutation.mutate({ id: currentSimulationId, status: SimulationStatus.SENT })}
                  className="gap-2"
                >
                  <Send size={16} className="text-blue-500" />
                  Enviada
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={currentSimulation?.status === SimulationStatus.REJECTED || changeStatusMutation.isPending}
                  onClick={() => changeStatusMutation.mutate({ id: currentSimulationId, status: SimulationStatus.REJECTED })}
                  className="gap-2 text-red-600 focus:text-red-600"
                >
                  <XCircle size={16} className="text-red-500" />
                  Rejeitada
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Novo Simulado */}
          {!currentSimulationId && (
            <Button
              onClick={handleSaveSimulation}
              className="gap-2"
              disabled={createSimulationMutation.isPending}
            >
              <Save size={16} />
              Salvar Simulação
            </Button>
          )}

          {/* Simulação Existente Bloqueada */}
          {currentSimulationId && !isEditingVersion && (
            <Button
              onClick={() => setIsNewVersionDialogOpen(true)}
              variant="outline"
              className="gap-2"
              disabled={currentSimulation && !currentSimulation.isCurrentVersion}
            >
              <History size={16} />
              Nova Versão
            </Button>
          )}

          {/* Editando Versão Existente */}
          {isEditingVersion && (
            <Button
              onClick={handleSaveSimulation}
              className="gap-2"
              disabled={updateSimulationMutation.isPending}
            >
              <Save size={16} />
              Salvar Atualização
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* LEFT COLUMN - CONTENT */}
        <div className="lg:col-span-2 flex flex-col">
          <Tabs defaultValue="cliente" className="w-full flex flex-col">
            {/* TABS HEADER */}
            <div className="flex items-end">
              <TabsList className="bg-transparent h-10 p-0 gap-1 rounded-b-none">
                <TabsTrigger
                  value="cliente"
                  className="rounded-b-none border-t border-l border-r border-transparent data-[state=active]:border-gray-200 data-[state=active]:bg-white data-[state=active]:shadow-none px-6 py-2.5 text-gray-500 data-[state=active]:text-primary-700 font-semibold relative top-[1px]"
                >
                  Cliente
                </TabsTrigger>
                <TabsTrigger
                  value="carga"
                  className="rounded-b-none border-t border-l border-r border-transparent data-[state=active]:border-gray-200 data-[state=active]:bg-white data-[state=active]:shadow-none px-6 py-2.5 text-gray-500 data-[state=active]:text-primary-700 font-semibold relative top-[1px]"
                  disabled={!selectedCustomerId}
                >
                  Dados da Carga
                </TabsTrigger>
                <TabsTrigger
                  value="servico"
                  className="rounded-b-none border-t border-l border-r border-transparent data-[state=active]:border-gray-200 data-[state=active]:bg-white data-[state=active]:shadow-none px-6 py-2.5 text-gray-500 data-[state=active]:text-primary-700 font-semibold relative top-[1px]"
                  disabled={!selectedCustomerId}
                >
                  Serviço
                </TabsTrigger>
              </TabsList>
            </div>

            {/* TAB CONTENT - WRAPPED IN CARD */}
            <div className="bg-white rounded-tr-xl rounded-b-xl border border-gray-200 shadow-sm overflow-hidden min-h-[500px]">
              {/* TAB: CLIENTE */}
              <TabsContent value="cliente" className="mt-0 p-0 animate-in fade-in-50 duration-300">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary-600" />
                    Seleção de Cliente
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">Selecione o cliente para a simulação aérea</p>
                </div>

                <div className="p-8">
                  <Label htmlFor="customer" className="text-base font-semibold text-gray-700 mb-3 block">
                    Cliente
                  </Label>
                  <Select
                    value={selectedCustomerId}
                    onValueChange={handleCustomerChange}
                    disabled={!isEditable}
                  >
                    <SelectTrigger id="customer" className="w-full h-12 text-base">
                      <SelectValue placeholder="Selecione um cliente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingCustomers ? (
                        <div className="p-4 text-center text-sm text-gray-500">Carregando clientes...</div>
                      ) : (
                        customersData?.data?.map((customer: any) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
                            <span className="text-gray-400 text-xs ml-2">({customer.document})</span>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>

                  {/* Removido card redundante de cliente selecionado */}
                </div>
              </TabsContent>

              {/* TAB: DADOS DA CARGA */}
              <TabsContent value="carga" className="mt-0 p-0 animate-in fade-in-50 duration-300">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Plane className="w-5 h-5 text-primary-600" />
                    Dados da Carga Aérea
                  </h2>
                </div>

                <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* CIF Currency Mode Toggle */}
                  <div className="md:col-span-2 flex items-center gap-3 flex-wrap">
                    <Label className="text-sm font-medium text-gray-700">Moeda de entrada do CIF</Label>
                    <div className="flex rounded-lg overflow-hidden border border-gray-200">
                      <button
                        type="button"
                        onClick={() => setCifInputMode('USD')}
                        disabled={!isEditable}
                        className={`px-4 py-1.5 text-sm font-semibold transition-colors ${
                          cifInputMode === 'USD'
                            ? 'bg-primary-600 text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-50'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        USD
                      </button>
                      <button
                        type="button"
                        onClick={() => setCifInputMode('BRL')}
                        disabled={!isEditable}
                        className={`px-4 py-1.5 text-sm font-semibold transition-colors border-l border-gray-200 ${
                          cifInputMode === 'BRL'
                            ? 'bg-primary-600 text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-50'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        BRL
                      </button>
                    </div>
                    <p className="text-xs text-gray-400">
                      {cifInputMode === 'USD'
                        ? 'Informe o valor em dólares; o R$ será calculado automaticamente.'
                        : 'Informe o valor em reais; o USD será calculado automaticamente.'}
                    </p>
                  </div>

                  {/* Row 1 */}
                  <div className="space-y-2">
                    <Label htmlFor="cifUsd">Valor CIF da carga USD</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                      <Input
                        id="cifUsd"
                        placeholder="0,00"
                        value={cifUsd}
                        onChange={(e) => setCifUsd(e.target.value)}
                        onBlur={(e) => setCifUsd(formatNumberBR(parseNumberBR(e.target.value)))}
                        className={`pl-7 ${cifInputMode === 'BRL' ? 'bg-gray-50 text-gray-500' : ''}`}
                        disabled={!isEditable || cifInputMode === 'BRL'}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dollarRate">Taxa do Dólar USD</Label>
                    <Input
                      id="dollarRate"
                      value={dollarRate}
                      onChange={(e) => setDollarRate(e.target.value)}
                      onBlur={(e) => setDollarRate(formatNumberBR(parseNumberBR(e.target.value)))}
                      disabled={!isEditable}
                    />
                  </div>

                  {/* Row 2 */}
                  <div className="space-y-2">
                    <Label htmlFor="cifBrl">Valor CIF da carga R$</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">R$</span>
                      <Input
                        id="cifBrl"
                        value={cifBrl}
                        readOnly={cifInputMode === 'USD'}
                        disabled={cifInputMode === 'BRL' ? !isEditable : false}
                        onChange={cifInputMode === 'BRL' ? (e) => setCifBrl(e.target.value) : undefined}
                        onBlur={cifInputMode === 'BRL' ? (e) => setCifBrl(formatCurrency(parseNumberBR(e.target.value), false)) : undefined}
                        className={`pl-9 ${cifInputMode === 'USD' ? 'bg-gray-50 text-gray-600 font-medium' : ''}`}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="weightKg">Peso Bruto (kg)</Label>
                    <div className="relative">
                      <Input
                        id="weightKg"
                        placeholder="0,00"
                        value={weightKg}
                        onChange={(e) => setWeightKg(e.target.value)}
                        onBlur={(e) => setWeightKg(formatNumberBR(parseNumberBR(e.target.value)))}
                        disabled={!isEditable}
                        className="pr-10"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">kg</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="capatazia">Capatazia</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">R$</span>
                      <Input
                        id="capatazia"
                        value={formatNumberBR(calculatedCapataziaCost)}
                        readOnly
                        className="bg-gray-50 text-gray-600 font-medium pl-9"
                      />
                    </div>
                  </div>

                  {/* Row 3 */}
                  <div className="space-y-2">
                    <Label htmlFor="volumeM3">Volume (m³)</Label>
                    <div className="relative">
                      <Input
                        id="volumeM3"
                        placeholder="0,00"
                        value={volumeM3}
                        onChange={(e) => setVolumeM3(e.target.value)}
                        onBlur={(e) => setVolumeM3(formatNumberBR(parseNumberBR(e.target.value)))}
                        disabled={!isEditable}
                        className="pr-10"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">m³</span>
                    </div>
                  </div>

                  {/* Row 4: Storage Periods */}
                  <div className="space-y-2">
                    <Label htmlFor="auroraPeriods">Períodos Aurora (10 dias cada)</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          id="auroraPeriods"
                          type="number"
                          min="1"
                          value={auroraPeriods}
                          onChange={(e) => setAuroraPeriods(e.target.value)}
                          disabled={!isEditable}
                        />
                      </div>
                      <div className="relative flex-[1.5]">
                        <Input
                          value={formatCurrency(calculatedStorageCost)}
                          readOnly
                          className="bg-gray-50 text-gray-600 font-medium pl-9"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vinciPeriods">Períodos Vinci </Label>
                    <div className="relative">
                      <Input
                        id="vinciPeriods"
                        type="number"
                        min="1"
                        value={vinciPeriods}
                        onChange={(e) => setVinciPeriods(e.target.value)}
                        disabled={!isEditable}
                      />
                    </div>
                  </div>

                  {/* Row 6: Discount & Min Billing */}
                  <div className="space-y-2">
                    <Label htmlFor="discount">Desconto</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">R$</span>
                      <Input
                        id="discount"
                        value={discount}
                        onChange={(e) => setDiscount(e.target.value)}
                        onBlur={(e) => setDiscount(formatNumberBR(parseNumberBR(e.target.value)))}
                        className="pl-9"
                        disabled={!isEditable}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="minBillingValue">Faturamento Mínimo</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">R$</span>
                      <Input
                        id="minBillingValue"
                        value={minBillingValue}
                        onChange={(e) => setMinBillingValue(e.target.value)}
                        onBlur={(e) => setMinBillingValue(formatNumberBR(parseNumberBR(e.target.value)))}
                        className="pl-9 bg-amber-50/30 border-amber-200/50 focus-visible:ring-amber-500"
                        disabled={!isEditable}
                      />
                    </div>
                  </div>
                </CardContent>
              </TabsContent>

              {/* TAB: SERVIÇOS */}
              <TabsContent value="servico" className="mt-0 p-0">
                <AirServicesTab
                  simulationId={currentSimulationId}
                  services={servicesData || []}
                  isLoadingServices={isLoadingServices}
                  isEditable={isEditable}
                  simulationData={{
                    cifBrl: cifBrlNum,
                    weightKg: parseFloat(weightKg) || 0,
                    volumeM3: parseFloat(volumeM3) || 0,
                  }}
                  localServices={localServices}
                  onAddLocalService={handleAddLocalService}
                  onRemoveLocalService={handleRemoveLocalService}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* RIGHT COLUMN - SUMMARY */}
        <div className="lg:col-span-1 pt-10">
          <Card className="sticky top-6 shadow-md border-gray-200 overflow-hidden ring-1 ring-gray-950/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b bg-gray-50/80">
              <CardTitle className="text-lg font-bold text-gray-900">Resumo da Simulação</CardTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-gray-400 hover:text-primary-600 h-8 w-8 hover:bg-white"
                onClick={handleExportPDF}
                title="Exportar PDF"
                disabled={!currentSimulation}
              >
                <Printer size={18} />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-6 space-y-6">
                <div className="flex justify-between items-center p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                  <span className="text-blue-700 font-medium">Total Serviços</span>
                  <span className="text-lg font-bold text-blue-900">
                    {formatCurrency(calculatedTotalServices)}
                  </span>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-start group">
                    <span className="text-gray-500 group-hover:text-gray-700 transition-colors">Armazenagem</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(calculatedStorageCost)}
                    </span>
                  </div>

                  <div className="flex justify-between items-start group">
                    <span className="text-gray-500 group-hover:text-gray-700 transition-colors">Capatazia</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(calculatedCapataziaCost)}
                    </span>
                  </div>

                  <div className="flex justify-between items-start group">
                    <span className="text-gray-500 group-hover:text-gray-700 transition-colors">Desconto</span>
                    <span className="font-semibold text-red-600">
                      - {formatCurrency(parseFloat(discount || '0'))}
                    </span>
                  </div>

                  {minDiff > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-start group p-2 bg-amber-50 rounded border border-amber-100">
                        <span className="text-amber-800 text-xs font-semibold uppercase leading-tight">
                          Diferença mínima
                        </span>
                        <span className="font-bold text-amber-900">
                          {formatCurrency(minDiff)}
                        </span>
                      </div>
                    </div>
                  )}

                  <Separator className="my-2" />

                  <div className="flex justify-between items-center pt-1">
                    <span className="text-gray-600 font-medium">Serviços Diversos</span>
                    <span className="text-xs text-gray-400 italic">
                      {servicesCount} selecionados
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500 font-medium uppercase tracking-wider">Valor Total</span>
                    <span className="text-xs text-gray-400">Com impostos</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-900">
                    {formatCurrency(calculatedTotalGeneral)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* DIALOG: NOVA VERSÃO */}
      <Dialog open={isNewVersionDialogOpen} onOpenChange={setIsNewVersionDialogOpen}>
        <DialogContent onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Criar Nova Versão</DialogTitle>
            <DialogDescription>
              Você está criando uma nova versão da simulação{' '}
              <strong>{currentSimulation?.displayNumber}</strong>. Informe o motivo da alteração.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="versionReason">Motivo da Nova Versão</Label>
              <Input
                id="versionReason"
                placeholder="Ex: Ajuste no desconto solicitado pelo cliente"
                value={versionReason}
                onChange={(e) => setVersionReason(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsNewVersionDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateNewVersion}>
              Criar Nova Versão
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
