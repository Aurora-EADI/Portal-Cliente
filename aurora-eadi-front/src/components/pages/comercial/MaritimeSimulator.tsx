'use client';

import React, { useState, useEffect } from 'react';
import { Printer, Plus, Building2, History, Lock, Save } from 'lucide-react';
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
import { useSuppliers } from '@/hooks/useSuppliers';
import { useAuthContext } from '@/context/AuthContext';
import {
  useCreateSimulation,
  useUpdateSimulation,
  useSimulation,
  useCreateSimulationVersion,
  useAddSimulationService,
} from '@/hooks/useSimulations';
import { useServices } from '@/hooks/useServices';
import { SimulationStatus } from '@/types';
import { ServicesTab } from './ServicesTab';
import { formatCurrency, formatUSD } from '@/lib/utils';

export function MaritimeSimulator() {
  const { currentUser } = useAuthContext();

  // Suppliers Data
  const { data: suppliersData, isLoading: isLoadingSuppliers } = useSuppliers();

  // Services Data
  const { data: servicesData, isLoading: isLoadingServices } = useServices(false);

  // Mutations
  const createSimulationMutation = useCreateSimulation();
  const updateSimulationMutation = useUpdateSimulation();
  const createVersionMutation = useCreateSimulationVersion();
  const addServiceMutation = useAddSimulationService();

  // State Management
  const [currentSimulationId, setCurrentSimulationId] = useState<string | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [isNewVersionDialogOpen, setIsNewVersionDialogOpen] = useState(false);
  const [versionReason, setVersionReason] = useState('');

  // Local state for services before saving simulation
  const [localServices, setLocalServices] = useState<Array<{
    serviceId: string;
    costType: any;
    appliedCost: number;
    customReason?: string;
  }>>([]);

  // Current Simulation Data
  const { data: currentSimulation, isLoading: isLoadingSimulation } = useSimulation(currentSimulationId);

  // Form Fields
  const [cifUsd, setCifUsd] = useState<string>('');
  const [dollarRate, setDollarRate] = useState<string>('5.85');
  const [cifBrl, setCifBrl] = useState<string>('0');
  const [tonnes, setTonnes] = useState<string>('');
  const [cntrCount, setCntrCount] = useState<string>('');
  const [cntrType, setCntrType] = useState<string>('');
  const [storageCost, setStorageCost] = useState<string>('0');
  const [transportCost, setTransportCost] = useState<string>('1700');
  const [discount, setDiscount] = useState<string>('0');

  // Auto-calculate CIF BRL
  useEffect(() => {
    const usd = parseFloat(cifUsd) || 0;
    const rate = parseFloat(dollarRate) || 0;
    setCifBrl(formatCurrency((usd * rate), false));
  }, [cifUsd, dollarRate]);

  // Load current simulation data
  useEffect(() => {
    if (currentSimulation) {
      setSelectedSupplierId(currentSimulation.supplierId);
      setCifUsd(currentSimulation.cifUsd.toString());
      setDollarRate(currentSimulation.dollarRate.toString());
      setTonnes(currentSimulation.tonnes?.toString() || '');
      setCntrCount(currentSimulation.cntrCount?.toString() || '');
      setCntrType(currentSimulation.cntrType || '');
      setStorageCost(currentSimulation.storageCost?.toString() || '0');
      setTransportCost(currentSimulation.transportCost?.toString() || '0');
      setDiscount(currentSimulation.discount?.toString() || '0');
    }
  }, [currentSimulation]);

  // Handler: Update supplier selection (local state only)
  const handleSupplierChange = (supplierId: string) => {
    setSelectedSupplierId(supplierId);
  };

  // Handlers for local services management
  const handleAddLocalService = (service: {
    serviceId: string;
    costType: any;
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
    if (!selectedSupplierId) {
      toast.error('Por favor, selecione um fornecedor');
      return;
    }

    if (!cifUsd || parseFloat(cifUsd) <= 0) {
      toast.error('Por favor, informe o valor CIF USD válido');
      return;
    }

    try {
      if (!currentSimulationId) {
        // Create new simulation
        const newSimulation = await createSimulationMutation.mutateAsync({
          supplierId: selectedSupplierId,
          cifUsd: parseFloat(cifUsd) || 0,
          dollarRate: parseFloat(dollarRate) || 5.85,
          tonnes: tonnes ? parseFloat(tonnes) : undefined,
          cntrCount: cntrCount ? parseInt(cntrCount) : undefined,
          cntrType: cntrType || undefined,
          storageCost: storageCost ? parseFloat(storageCost) : 0,
          transportCost: transportCost ? parseFloat(transportCost) : 0,
          discount: discount ? parseFloat(discount) : 0,
        });

        // Add local services to the newly created simulation
        if (localServices.length > 0) {
          for (const service of localServices) {
            await addServiceMutation.mutateAsync({
              simulationId: newSimulation.id,
              data: service,
            });
          }
          // Clear local services after saving
          setLocalServices([]);
        }

        setCurrentSimulationId(newSimulation.id);
        toast.success('Simulação criada com sucesso!');
      } else {
        // Update existing simulation
        await updateSimulationMutation.mutateAsync({
          id: currentSimulationId,
          data: {
            supplierId: selectedSupplierId,
            cifUsd: parseFloat(cifUsd) || 0,
            dollarRate: parseFloat(dollarRate) || 0,
            tonnes: tonnes ? parseFloat(tonnes) : undefined,
            cntrCount: cntrCount ? parseInt(cntrCount) : undefined,
            cntrType: cntrType || undefined,
            storageCost: storageCost ? parseFloat(storageCost) : 0,
            transportCost: transportCost ? parseFloat(transportCost) : 0,
            discount: discount ? parseFloat(discount) : 0,
          },
        });
        toast.success('Simulação atualizada com sucesso!');
      }
    } catch (error) {
      console.error('Error saving simulation:', error);
      toast.error('Erro ao salvar simulação. Por favor, tente novamente.');
    }
  };

  // Handler: Create new version
  const handleCreateNewVersion = async () => {
    if (!currentSimulation) return;

    try {
      const newVersion = await createVersionMutation.mutateAsync({
        baseSimulationId: currentSimulation.id,
        versionReason: versionReason || undefined,
        supplierId: selectedSupplierId,
        cifUsd: parseFloat(cifUsd) || 0,
        dollarRate: parseFloat(dollarRate) || 0,
        tonnes: tonnes ? parseFloat(tonnes) : undefined,
        cntrCount: cntrCount ? parseInt(cntrCount) : undefined,
        cntrType: cntrType || undefined,
        storageCost: storageCost ? parseFloat(storageCost) : 0,
        transportCost: transportCost ? parseFloat(transportCost) : 0,
        discount: discount ? parseFloat(discount) : 0,
      });

      setCurrentSimulationId(newVersion.id);
      setIsNewVersionDialogOpen(false);
      setVersionReason('');
    } catch (error) {
      console.error('Error creating new version:', error);
    }
  };

  const isEditable = !currentSimulation || currentSimulation.status === SimulationStatus.DRAFT;

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Simulador de Custo EADI
          </h1>
          {currentSimulation && (
            <div className="flex items-center gap-3 mt-2">
              <p className="text-sm text-gray-500 flex items-center gap-2">
                ID da Simulação:
                <span className="font-mono font-bold bg-gray-100 px-2 py-0.5 rounded text-gray-700 border border-gray-200">
                  {currentSimulation.displayNumber}
                </span>
              </p>
              <Badge variant={currentSimulation.status === SimulationStatus.DRAFT ? 'secondary' : 'default'}>
                {currentSimulation.status}
              </Badge>
              {!currentSimulation.isCurrentVersion && (
                <Badge variant="outline" className="text-gray-500">
                  <Lock className="w-3 h-3 mr-1" />
                  Versão Antiga
                </Badge>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {isEditable && (
            <Button
              onClick={handleSaveSimulation}
              className="gap-2"
              disabled={createSimulationMutation.isPending || updateSimulationMutation.isPending}
            >
              <Save size={16} />
              {!currentSimulationId ? 'Salvar Simulação' : 'Atualizar Simulação'}
            </Button>
          )}
          {currentSimulation && isEditable && (
            <Button
              onClick={() => setIsNewVersionDialogOpen(true)}
              variant="outline"
              className="gap-2"
            >
              <History size={16} />
              Nova Versão
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
                  disabled={!selectedSupplierId}
                >
                  Dados da Carga
                </TabsTrigger>
                <TabsTrigger
                  value="servico"
                  className="rounded-b-none border-t border-l border-r border-transparent data-[state=active]:border-gray-200 data-[state=active]:bg-white data-[state=active]:shadow-none px-6 py-2.5 text-gray-500 data-[state=active]:text-primary-700 font-semibold relative top-[1px]"
                  disabled={!selectedSupplierId}
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
                  <p className="text-sm text-gray-500 mt-1">Selecione o fornecedor/empresa para a simulação</p>
                </div>

                <div className="p-8">
                  <Label htmlFor="supplier" className="text-base font-semibold text-gray-700 mb-3 block">
                    Fornecedor
                  </Label>
                  <Select
                    value={selectedSupplierId}
                    onValueChange={handleSupplierChange}
                    disabled={!isEditable}
                  >
                    <SelectTrigger id="supplier" className="w-full h-12 text-base">
                      <SelectValue placeholder="Selecione um fornecedor..." />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingSuppliers ? (
                        <div className="p-4 text-center text-sm text-gray-500">Carregando fornecedores...</div>
                      ) : (
                        suppliersData?.data?.map((item: any) => (
                          <SelectItem key={item.company.id} value={item.company.id}>
                            {item.company.fantasyName || item.company.socialReason}
                            <span className="text-gray-400 text-xs ml-2">({item.company.cnpj})</span>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>

                  {selectedSupplierId && !currentSimulation && (
                    <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-sm text-yellow-800">
                        <strong>Fornecedor selecionado.</strong> Preencha os dados da carga e clique em{' '}
                        <strong>"Salvar Simulação"</strong> para continuar.
                      </p>
                    </div>
                  )}

                  {selectedSupplierId && currentSimulation && (
                    <div className="mt-6 p-4 bg-primary-50 rounded-lg border border-primary-100">
                      <h3 className="font-semibold text-primary-800 mb-2">Empresa Selecionada</h3>
                      <div className="text-sm text-primary-700 space-y-1">
                        <p><strong>Nome:</strong> {currentSimulation.supplier?.fantasyName || currentSimulation.supplier?.socialReason}</p>
                        <p><strong>CNPJ:</strong> {currentSimulation.supplier?.cnpj}</p>
                        <div className="flex items-center">
                          <strong>Status:</strong>{' '}
                          <Badge className="ml-2" variant={isEditable ? 'default' : 'secondary'}>
                            {isEditable ? 'Editável' : 'Bloqueada'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}
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
                  {/* Row 1 */}
                  <div className="space-y-2">
                    <Label htmlFor="cifUsd">Valor CIF da carga USD</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                      <Input
                        id="cifUsd"
                        placeholder="0.00"
                        value={cifUsd}
                        onChange={(e) => setCifUsd(e.target.value)}
                        className="pl-7"
                        disabled={!isEditable}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dollarRate">Taxa do Dólar USD</Label>
                    <Input
                      id="dollarRate"
                      value={dollarRate}
                      onChange={(e) => setDollarRate(e.target.value)}
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
                        readOnly
                        className="bg-gray-50 text-gray-600 font-medium pl-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tonnes">Tonelada</Label>
                    <Input
                      id="tonnes"
                      placeholder="0.000"
                      value={tonnes}
                      onChange={(e) => setTonnes(e.target.value)}
                      disabled={!isEditable}
                    />
                  </div>

                  {/* Row 3 */}
                  <div className="space-y-2">
                    <Label htmlFor="cntrCount">Qnt. De CNTR</Label>
                    <Input
                      id="cntrCount"
                      placeholder="0"
                      value={cntrCount}
                      onChange={(e) => setCntrCount(e.target.value)}
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

                  {/* Row 4 */}
                  <div className="space-y-2">
                    <Label htmlFor="storageCost">Armazenagem R$ (2º Período de 15)</Label>
                    <Input
                      id="storageCost"
                      value={storageCost}
                      onChange={(e) => setStorageCost(e.target.value)}
                      disabled={!isEditable}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="transportCost">Transporte de DTA + Devolução</Label>
                    <Input
                      id="transportCost"
                      value={transportCost}
                      onChange={(e) => setTransportCost(e.target.value)}
                      disabled={!isEditable}
                    />
                  </div>

                  {/* Row 5 */}
                  <div className="space-y-2">
                    <Label htmlFor="discount">Desconto</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">R$</span>
                      <Input
                        id="discount"
                        value={discount}
                        onChange={(e) => setDiscount(e.target.value)}
                        className="pl-9"
                        disabled={!isEditable}
                      />
                    </div>
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
                    cifBrl: parseFloat(cifBrl) || 0,
                    tonnes: parseFloat(tonnes) || 0,
                    cntrCount: parseInt(cntrCount) || 0,
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
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-primary-600 h-8 w-8 hover:bg-white">
                <Printer size={18} />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-6 space-y-6">
                <div className="flex justify-between items-center p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                  <span className="text-blue-700 font-medium">Total Serviços</span>
                  <span className="text-lg font-bold text-blue-900">
                    {formatCurrency(currentSimulation?.totalServices || 0)}
                  </span>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-start group">
                    <span className="text-gray-500 group-hover:text-gray-700 transition-colors">Armazenagem</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(parseFloat(storageCost || '0'))}
                    </span>
                  </div>

                  <div className="flex justify-between items-start group">
                    <span className="text-gray-500 group-hover:text-gray-700 transition-colors">Transporte</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(parseFloat(transportCost || '0'))}
                    </span>
                  </div>

                  <div className="flex justify-between items-start group">
                    <span className="text-gray-500 group-hover:text-gray-700 transition-colors">Desconto</span>
                    <span className="font-semibold text-red-600">
                      - {formatCurrency(parseFloat(discount || '0'))}
                    </span>
                  </div>

                  <Separator className="my-2" />

                  <div className="flex justify-between items-center pt-1">
                    <span className="text-gray-600 font-medium">Serviços Diversos</span>
                    <span className="text-xs text-gray-400 italic">
                      {currentSimulation?._count?.services || 0} selecionados
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
                    {formatCurrency(currentSimulation?.totalGeneral || 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* DIALOG: NOVA VERSÃO */}
      <Dialog open={isNewVersionDialogOpen} onOpenChange={setIsNewVersionDialogOpen}>
        <DialogContent>
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
