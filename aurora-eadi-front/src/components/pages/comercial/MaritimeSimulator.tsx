'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Printer, Plus, Building2, History, Lock, Save, ArrowLeft, CheckCircle, Send, XCircle, ChevronDown } from 'lucide-react';
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
  useCreateSimulation,
  useUpdateSimulation,
  useSimulation,
  useCreateSimulationVersion,
  useAddSimulationService,
  useStartSimulationValidation,
  useChangeSimulationStatus,
} from '@/hooks/useSimulations';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMaritimeServices } from '@/hooks/useServices';
import { SimulationStatus } from '@/types';
import { ServicesTab } from './ServicesTab';
import { formatCurrency, formatUSD, formatPercent, formatNumberBR, parseNumberBR } from '@/lib/utils';
import { calculateServiceCost } from '@/lib/calculations';
import { ServiceCostType } from '@/types';
import { exportMaritimeSimulationToPDF } from '@/services/pdfService';
import { SimulationPresentation } from './SimulationPresentation';

const DEFAULT_MIN_BILLING = 5500;

export function MaritimeSimulator() {
  const { currentUser } = useAuthContext();
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlId = searchParams.get('id');

  // Customers Data
  const { data: customersData, isLoading: isLoadingCustomers } = useCustomers();

  // Services Data
  const { data: servicesData, isLoading: isLoadingServices } = useMaritimeServices(false);

  // Mutations
  const createSimulationMutation = useCreateSimulation();
  const updateSimulationMutation = useUpdateSimulation();
  const createVersionMutation = useCreateSimulationVersion();
  const addServiceMutation = useAddSimulationService();
  const startValidationMutation = useStartSimulationValidation();
  const changeStatusMutation = useChangeSimulationStatus();

  // State Management
  const [currentSimulationId, setCurrentSimulationId] = useState<string | null>(urlId);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [isNewVersionDialogOpen, setIsNewVersionDialogOpen] = useState(false);
  const [versionReason, setVersionReason] = useState('');
  const [isEditingVersion, setIsEditingVersion] = useState(false);
  const [showPresentation, setShowPresentation] = useState(false);

  // Form Fields
  const [cifUsd, setCifUsd] = useState<string>('');
  const [dollarRate, setDollarRate] = useState<string>('5,85');
  const [cifBrl, setCifBrl] = useState<string>('0');
  const [tonnes, setTonnes] = useState<string>('');
  const [cntrCount, setCntrCount] = useState<string>('');
  const [cntrType, setCntrType] = useState<string>('');

  const [discount, setDiscount] = useState<string>('0');
  const [hasStripping, setHasStripping] = useState<boolean>(false);
  const [hasLCL, setHasLCL] = useState<boolean>(false);
  const [minBillingValue, setMinBillingValue] = useState<string>(DEFAULT_MIN_BILLING.toString());
  const [auroraPeriods, setAuroraPeriods] = useState<string>('1');
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
  const { data: currentSimulation, isLoading: isLoadingSimulation } = useSimulation(currentSimulationId);

  // Filter services based on stripping status and LCL
  const effectiveServicesList = useMemo(() => {
    // Agora os serviços vêm da tabela SimulationService (relacional)
    const list = currentSimulationId ? (currentSimulation?.services || []) : localServices;
    
    return list.filter(s => {
      const serviceDef = servicesData?.find(sd => sd.id === s.serviceId);
      const serviceName = serviceDef?.name || (s as any).serviceName || '';
      const isLCLService = serviceName.toUpperCase().includes('LCL');

      // Filter by stripping
      if (!hasStripping) {
        // Se for snapshot, já temos o hasStripping nele
        if ('hasStripping' in s && s.hasStripping) return false;

        if (serviceDef?.hasStripping) return false;
      }

      // Filter by LCL: Hide LCL services by default, show only when hasLCL is true
      if (isLCLService && !hasLCL) return false;
      
      // If hasLCL is true, show ONLY LCL services
      if (hasLCL && !isLCLService) return false;

      return true;
    });
  }, [localServices, currentSimulationId, currentSimulation?.services, hasStripping, hasLCL, servicesData]);

  // Helper function to identify services excluded from minimum billing (Transporte DTA)
  const isExcludedFromMinBilling = (name: string | undefined): boolean => {
    if (!name) return false;
    const normalized = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
    // Rule: Anything containing "transporte" and "dta" is excluded from the minimum billing floor calculation
    return normalized.includes('transporte') && normalized.includes('dta');
  };

  // Calculate storage cost based on periods
  const calculatedStorageCost = useMemo(() => {
    const rate = 0.35 * (parseInt(auroraPeriods) || 1);
    return (rate / 100) * (cifBrlNum || 0);
  }, [auroraPeriods, cifBrlNum]);

  // Calculate total services in real-time
  const { totalServices: calculatedTotalServices, eligibleServicesTotal, excludedServicesTotal } = useMemo(() => {
    const calcData = {
      cifBrl: cifBrlNum,
      tonnes: parseNumberBR(tonnes || '0'),
      cntrCount: parseInt(cntrCount || '0'),
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
  }, [effectiveServicesList, cifBrlNum, tonnes, cntrCount, servicesData]);

  // Count of selected services
  const servicesCount = effectiveServicesList.length;

  // Calculate total general in real-time
  // Business Rule: Adjustment = Max(0, Threshold - EligibleTotal)
  // Final Total = (EligibleTotal + Adjustment) + ExcludedTotal - Discount
  const { minDiff, totalGeneral } = useMemo(() => {
    const eligible = eligibleServicesTotal;
    const excluded = excludedServicesTotal;
    const discountValue = parseNumberBR(discount || '0');
    const count = parseInt(cntrCount || '0');
    const minThreshold = parseNumberBR(minBillingValue) || 0;

    const minBillingThreshold = minThreshold * count;
    
    // MATHEMATICAL GUARANTEE: Only "eligible" services reduce the difference to the minimum floor.
    // Excluded services (Transporte DTA) are added ON TOP, never reducing this adjustment.
    const difference = (count > 0 && eligible < minBillingThreshold) ? minBillingThreshold - eligible : 0;
    
    return {
      minDiff: difference,
      totalGeneral: eligible + difference + excluded + calculatedStorageCost - discountValue
    };
  }, [eligibleServicesTotal, excludedServicesTotal, discount, cntrCount, minBillingValue]);

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
      setTonnes(formatNumberBR(currentSimulation.tonnes));
      setCntrCount(currentSimulation.cntrCount?.toString() || '');
      setCntrType(currentSimulation.cntrType || '');


      setDiscount(formatNumberBR(currentSimulation.discount || 0));
      setHasStripping(currentSimulation.hasStripping || false);
      setMinBillingValue(formatNumberBR(currentSimulation.minBillingValue || DEFAULT_MIN_BILLING));
      setAuroraPeriods(currentSimulation.auroraPeriods?.toString() || '1');
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
      // Remove if already exists
      const filtered = prev.filter((s) => s.serviceId !== service.serviceId);
      // Add new service
      return [...filtered, service];
    });
  };

  const handleRemoveLocalService = (serviceId: string) => {
    setLocalServices((prev) => prev.filter((s) => s.serviceId !== serviceId));
  };

  // Handler: Save simulation (Create or Update)
  const handleSaveSimulation = async () => {
    // Validações
    if (!selectedCustomerId) {
      toast.error('Por favor, selecione um cliente');
      return;
    }

    if (!cifUsd || parseNumberBR(cifUsd) <= 0) {
      toast.error('Por favor, informe o valor CIF USD válido');
      return;
    }

    try {
      if (!currentSimulationId) {
        // Create new simulation with initial services
        const newSimulation = await createSimulationMutation.mutateAsync({
          customerId: selectedCustomerId,
          cifUsd: parseNumberBR(cifUsd) || 0,
          dollarRate: parseNumberBR(dollarRate) || 5.85,
          tonnes: tonnes ? parseNumberBR(tonnes) : undefined,
          cntrCount: cntrCount ? parseInt(cntrCount) : undefined,
          cntrType: cntrType || undefined,
          discount: discount ? parseNumberBR(discount) : 0,
          hasStripping,
          minBillingValue: parseNumberBR(minBillingValue) || DEFAULT_MIN_BILLING,
          auroraPeriods: parseInt(auroraPeriods) || 1,
          storageCost: calculatedStorageCost,
          initialServices: localServices,
        });

        // Clear local services after saving
        setLocalServices([]);
        setCurrentSimulationId(newSimulation.id);
        toast.success('Simulação criada com sucesso!');
        router.push('/comercial/history');
      } else {
        // Update existing simulation
        await updateSimulationMutation.mutateAsync({
          id: currentSimulationId,
          data: {
            customerId: selectedCustomerId,
            cifUsd: parseNumberBR(cifUsd) || 0,
            dollarRate: parseNumberBR(dollarRate) || 0,
            tonnes: tonnes ? parseNumberBR(tonnes) : undefined,
            cntrCount: cntrCount ? parseInt(cntrCount) : undefined,
            cntrType: cntrType || undefined,
            discount: discount ? parseNumberBR(discount) : 0,
            hasStripping,
            minBillingValue: parseNumberBR(minBillingValue) || DEFAULT_MIN_BILLING,
            auroraPeriods: parseInt(auroraPeriods) || 1,
            storageCost: calculatedStorageCost,
          },
        });
        toast.success('Simulação atualizada com sucesso!');
        setIsEditingVersion(false);
        router.push('/comercial/history');
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

    exportMaritimeSimulationToPDF(currentSimulation as any);
  };

  // Handler: Create new version
  const handleCreateNewVersion = async () => {
    if (!currentSimulation) return;

    try {
      const newVersion = await createVersionMutation.mutateAsync({
        baseSimulationId: currentSimulation.id,
        versionReason: versionReason || undefined,
        customerId: selectedCustomerId,
        cifUsd: parseNumberBR(cifUsd) || 0,
        dollarRate: parseNumberBR(dollarRate) || 0,
        tonnes: tonnes ? parseNumberBR(tonnes) : undefined,
        cntrCount: cntrCount ? parseInt(cntrCount) : undefined,
        cntrType: cntrType || undefined,
        discount: discount ? parseNumberBR(discount) : 0,
        hasStripping,
        minBillingValue: parseNumberBR(minBillingValue) || DEFAULT_MIN_BILLING,
        auroraPeriods: parseInt(auroraPeriods) || 1,
        storageCost: calculatedStorageCost,
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
          <h1 className="text-3xl font-bold text-gray-900">
            Simulador de Custo EADI
          </h1>
          <div className="flex items-center gap-4 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/comercial/history')}
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
                        router.push(`/comercial/simulador?id=${value}`);
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
                  <Badge variant="outline" className="text-gray-500">
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
                  <p className="text-sm text-gray-500 mt-1">Selecione o cliente para a simulação</p>
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

                  {selectedCustomerId && !currentSimulation && (
                    <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-sm text-yellow-800">
                        <strong>Cliente selecionado.</strong> Preencha os dados da carga e clique em{' '}
                        <strong>"Salvar Simulação"</strong> para continuar.
                      </p>
                    </div>
                  )}

                  {/* Removido card redundante de cliente selecionado */}
                </div>
              </TabsContent>

              {/* TAB: DADOS DA CARGA */}
              <TabsContent value="carga" className="mt-0 p-0 animate-in fade-in-50 duration-300">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <span className="w-1 h-6 bg-primary-500 rounded-full inline-block"></span>
                    Dados da Carga
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
                    <Label htmlFor="tonnes">Tonelada</Label>
                    <Input
                      id="tonnes"
                      placeholder="0,000"
                      value={tonnes}
                      onChange={(e) => setTonnes(e.target.value)}
                      onBlur={(e) => setTonnes(formatNumberBR(parseNumberBR(e.target.value), 3))}
                      disabled={!isEditable}
                    />
                  </div>

                  {/* Row 3 */}
                  <div className="space-y-2">
                    <Label htmlFor="cntrCount">Quantidade de CNTR</Label>
                    <Input
                      id="cntrCount"
                      placeholder="0"
                      value={cntrCount}
                      onChange={(e) => {
                        // Allow only integers
                        const value = e.target.value.replace(/\D/g, '');
                        setCntrCount(value);
                      }}
                      disabled={!isEditable}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cntrType">Tipo de CNTR (TU's)</Label>
                    <Select
                      value={cntrType}
                      onValueChange={(value) => setCntrType(value)}
                      disabled={!isEditable}
                    >
                      <SelectTrigger id="cntrType">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="40">40</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Row 4: Storage - Removed as per request */}
                  {/* Row 5: Transport - Removed as per request */}

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
                    <Label htmlFor="minBillingValue">Faturamento Mínimo por CNTR</Label>
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


                  {/* Row 7: Desova */}
                  <div className="md:col-span-2 flex items-center gap-3 bg-blue-50/50 p-4 rounded-xl border border-blue-100/50">
                    <input
                      type="checkbox"
                      id="hasStripping"
                      checked={hasStripping}
                      onChange={(e) => setHasStripping(e.target.checked)}
                      disabled={!isEditable}
                      className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                    />
                    <Label htmlFor="hasStripping" className="font-semibold text-blue-900 cursor-pointer select-none">
                      Desova?
                      <p className="text-xs text-blue-700/70 font-normal">
                        Marque esta opção se a carga precisar ser desovada para filtrar os serviços específicos.
                      </p>
                    </Label>
                  </div>

                  {/* Row 8: Carga Solta (LCL) */}
                  <div className="md:col-span-2 flex items-center gap-3 bg-green-50/50 p-4 rounded-xl border border-green-100/50">
                    <input
                      type="checkbox"
                      id="hasLCL"
                      checked={hasLCL}
                      onChange={(e) => setHasLCL(e.target.checked)}
                      disabled={!isEditable}
                      className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                    />
                    <Label htmlFor="hasLCL" className="font-semibold text-green-900 cursor-pointer select-none">
                      Carga Solta?
                      <p className="text-xs text-green-700/70 font-normal">
                        Marque esta opção para exibir apenas os serviços LCL (Less than Container Load).
                      </p>
                    </Label>
                  </div>
                </CardContent>
              </TabsContent>

              {/* TAB: SERVIÇOS */}
              <TabsContent value="servico" className="mt-0 p-0">
                <ServicesTab
                  simulationId={currentSimulationId}
                  services={servicesData || []}
                  isLoadingServices={isLoadingServices}
                  isEditable={isEditable}
                  simulationData={{
                    cifBrl: cifBrlNum,
                    tonnes: parseNumberBR(tonnes) || 0,
                    cntrCount: parseInt(cntrCount) || 0,
                  }}
                  localServices={localServices}
                  onAddLocalService={handleAddLocalService}
                  onRemoveLocalService={handleRemoveLocalService}
                  hasStripping={hasStripping}
                  hasLCL={hasLCL}
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
                onClick={() => setShowPresentation(true)}
                title="Exportar PDF"
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
                    <span className="text-gray-500 group-hover:text-gray-700 transition-colors">Desconto</span>
                    <span className="font-semibold text-red-600">
                      - {formatCurrency(parseNumberBR(discount || '0'))}
                    </span>
                  </div>

                  {minDiff > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-start group p-2 bg-amber-50 rounded border border-amber-100">
                        <span className="text-amber-800 text-xs font-semibold uppercase leading-tight">
                          Diferença mínima a ser cobrada para emissão de Nota Fiscal por contêiner
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
      </div >

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
      {/* PRESENTATION VIEW OVERLAY */}
      {showPresentation && (
        <SimulationPresentation
          simulation={currentSimulation || {
            // Fallback for draft/new simulation data
            customer: customersData?.data?.find((c: any) => c.id === selectedCustomerId),
            cifUsd: parseFloat(cifUsd) || 0,
            dollarRate: parseFloat(dollarRate) || 0,
            tonnes: parseFloat(tonnes) || 0,
            cntrCount: parseInt(cntrCount) || 0,
            cntrType: cntrType,
            services: effectiveServicesList,
            displayNumber: 'RASCUNHO'
          }}
          calculatedValues={{
            totalServices: calculatedTotalServices,
            storageCost: calculatedStorageCost,
            transportCost: 0,
            minDiff: minDiff,
            minProfitMarginPct: 0,
            totalGeneral: calculatedTotalGeneral,
            discount: parseFloat(discount) || 0,
            servicesCount: servicesCount
          }}
          onClose={() => setShowPresentation(false)}
        />
      )}
    </div>
  );
}
