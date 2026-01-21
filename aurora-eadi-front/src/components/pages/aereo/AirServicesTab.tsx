'use client';

import React, { useState, useEffect } from 'react';
import { Edit, Trash, Check, X, AlertCircle, DollarSign, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Service, ServiceCostType, ServiceCalculationType } from '@/types';
import {
  useAirSimulationServices,
  useAddAirSimulationService,
  useRemoveAirSimulationService,
} from '@/hooks/useAirSimulations';
import { useServiceCostCurrent } from '@/hooks/useServices';
import { serviceCostService } from '@/services/serviceService';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { calculateServiceCost } from '@/lib/calculations';
import { toast } from 'sonner';

interface LocalService {
  serviceId: string;
  costType: ServiceCostType;
  originalCost: number;
  appliedCost: number;
  customReason?: string;
}

interface AirServicesTabProps {
  simulationId: string | null;
  services: Service[];
  isLoadingServices: boolean;
  isEditable: boolean;
  simulationData: {
    cifBrl: number;
    weightKg: number;
    volumeM3: number;
  };
  localServices?: LocalService[];
  onAddLocalService?: (service: LocalService) => void;
  onRemoveLocalService?: (serviceId: string) => void;
}

// Helper to calculate final cost based on calculationType
const calculateFinalCostGlobal = (rate: number, service: Service, simulationData: { cifBrl: number; weightKg: number; volumeM3: number }): number => {
  // Convert air simulation data to format expected by calculateServiceCost
  const calcData = {
    cifBrl: simulationData.cifBrl,
    tonnes: simulationData.weightKg / 1000, 
    cntrCount: 1,
    weightKg: simulationData.weightKg,
    volumeM3: simulationData.volumeM3,
  };
  return calculateServiceCost(rate, service.calculationType, calcData);
};

// Component to fetch and display service default cost
function ServiceDefaultCost({
  service,
  simulationData
}: {
  service: Service;
  simulationData: { cifBrl: number; weightKg: number; volumeM3: number }
}) {
  const { data: costData, isLoading } = useServiceCostCurrent(service.id);

  if (isLoading) {
    return <span className="text-gray-400">...</span>;
  }

  const baseCost = costData?.cost || 0;

  return (
    <span className="font-medium text-gray-700">
      {service.calculationType === ServiceCalculationType.PERCENTAGE_CIF
        ? formatPercent(baseCost)
        : formatCurrency(baseCost)}
    </span>
  );
}

export function AirServicesTab({
  simulationId,
  services,
  isLoadingServices,
  isEditable,
  simulationData,
  localServices = [],
  onAddLocalService,
  onRemoveLocalService,
}: AirServicesTabProps) {
  // Working mode: local (before save) or saved (with simulationId)
  const isLocalMode = !simulationId;

  // Query for simulation services (only if simulation exists)
  const { data: simulationServices, isLoading: isLoadingSimServices } =
    useAirSimulationServices(simulationId || '');

  // Mutations (only used in saved mode)
  const addServiceMutation = useAddAirSimulationService();
  const removeServiceMutation = useRemoveAirSimulationService();

  // Get active services list based on mode
  const activeServices = isLocalMode ? localServices : (simulationServices || []);

  // Dialog state
  const [isCustomizeDialogOpen, setIsCustomizeDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [customRate, setCustomRate] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');

  // Get current cost for selected service
  const { data: currentCostData } = useServiceCostCurrent(selectedService?.id || '');

  // Calculate final cost based on calculationType
  const calculateFinalCost = (rate: number, service: Service): number => {
    return calculateFinalCostGlobal(rate, service, simulationData);
  };

  // Get calculation formula display
  const getCalculationFormula = (service: Service, rate: number): string => {
    switch (service.calculationType) {
      case ServiceCalculationType.FIXED:
        return formatCurrency(rate);
      case ServiceCalculationType.PERCENTAGE_CIF:
        return `${formatPercent(rate)} × ${formatCurrency(simulationData.cifBrl)} (CIF BRL)`;
      case ServiceCalculationType.PER_CONTAINER:
        return formatCurrency(rate);
      case ServiceCalculationType.PER_TONNE:
        const roundedTonnes = Math.ceil(simulationData.weightKg / 1000);
        return `${formatCurrency(rate)} × ${roundedTonnes} ton (arr.)`;
      case ServiceCalculationType.PER_KG:
        return `${formatCurrency(rate)} × ${simulationData.weightKg} kg`;
      case ServiceCalculationType.PER_TONNE_OR_M3:
        const t = simulationData.weightKg / 1000;
        const v = simulationData.volumeM3;
        const max = Math.max(t, v);
        return `${formatCurrency(rate)} × ${max.toFixed(3)} (maior entre ${t.toFixed(3)} ton e ${v.toFixed(3)} m³)`;
      default:
        return formatCurrency(rate);
    }
  };

  // Get input label based on calculation type
  const getInputLabel = (calculationType: ServiceCalculationType): string => {
    switch (calculationType) {
      case ServiceCalculationType.FIXED:
        return 'Valor Fixo (R$)';
      case ServiceCalculationType.PERCENTAGE_CIF:
        return 'Percentual sobre CIF (%)';
      case ServiceCalculationType.PER_CONTAINER:
        return 'Valor por Embarque (R$)';
      case ServiceCalculationType.PER_TONNE:
        return 'Valor por Tonelada (R$)';
      case ServiceCalculationType.PER_KG:
        return 'Valor por Quilograma (R$)';
      case ServiceCalculationType.PER_TONNE_OR_M3:
        return 'Valor por Ton/M³ (R$)';
      default:
        return 'Valor (R$)';
    }
  };

  // Get service by service ID (works in both modes)
  const getServiceById = (serviceId: string) => {
    return activeServices.find((ss) => ss.serviceId === serviceId);
  };

  // Reset dialog when opening
  useEffect(() => {
    if (selectedService && currentCostData) {
      const existingService = getServiceById(selectedService.id);
      if (existingService) {
        setCustomRate(currentCostData.cost.toString());
        setCustomReason(existingService.customReason || '');
      } else {
        setCustomRate(currentCostData.cost.toString());
        setCustomReason('');
      }
    }
  }, [selectedService, currentCostData, activeServices]);

  // Handler: Add service with default cost
  const handleUseDefault = async (service: Service) => {
    try {
      const costData = await serviceCostService.getCurrent(service.id);
      if (!costData) {
        console.error('No cost data found for service:', service.id);
        return;
      }

      const finalCost = calculateFinalCost(costData.cost, service);

      const serviceData = {
        serviceId: service.id,
        costType: ServiceCostType.DEFAULT,
        originalCost: costData.cost,
        appliedCost: finalCost,
      };

      if (isLocalMode) {
        onAddLocalService?.(serviceData);
      } else {
        await addServiceMutation.mutateAsync({
          simulationId: simulationId!,
          data: serviceData,
        });
      }
    } catch (error) {
      console.error('Error adding service:', error);
    }
  };

  // Handler: Zero service
  const handleZero = async (service: Service) => {
    try {
      const serviceData = {
        serviceId: service.id,
        costType: ServiceCostType.ZEROED,
        originalCost: 0,
        appliedCost: 0,
      };

      if (isLocalMode) {
        onAddLocalService?.(serviceData);
      } else {
        await addServiceMutation.mutateAsync({
          simulationId: simulationId!,
          data: serviceData,
        });
      }
    } catch (error) {
      console.error('Error zeroing service:', error);
    }
  };

  // Handler: Open customize dialog
  const handleOpenCustomize = (service: Service) => {
    setSelectedService(service);
    setIsCustomizeDialogOpen(true);
  };

  // Handler: Save customized cost
  const handleSaveCustom = async () => {
    if (!selectedService || !currentCostData) return;

    const rateValue = parseFloat(customRate) || 0;
    const defaultRate = parseFloat(currentCostData.cost.toString());

    const finalCost = calculateFinalCost(rateValue, selectedService);

    if (rateValue !== defaultRate && !customReason.trim()) {
      toast.error('Por favor, informe o motivo da customização');
      return;
    }

    try {
      const serviceData = {
        serviceId: selectedService.id,
        costType: rateValue === defaultRate ? ServiceCostType.DEFAULT : ServiceCostType.CUSTOM,
        originalCost: rateValue,
        appliedCost: finalCost,
        customReason: rateValue !== defaultRate ? customReason : undefined,
      };

      if (isLocalMode) {
        onAddLocalService?.(serviceData);
      } else {
        await addServiceMutation.mutateAsync({
          simulationId: simulationId!,
          data: serviceData,
        });
      }

      setIsCustomizeDialogOpen(false);
      setSelectedService(null);
      setCustomRate('');
      setCustomReason('');
    } catch (error) {
      console.error('Error customizing service:', error);
    }
  };

  // Handler: Remove service
  const handleRemove = async (serviceId: string) => {
    try {
      if (isLocalMode) {
        onRemoveLocalService?.(serviceId);
      } else {
        await removeServiceMutation.mutateAsync({
          simulationId: simulationId!,
          serviceId,
        });
      }
    } catch (error) {
      console.error('Error removing service:', error);
    }
  };


  if (isLoadingServices || (!isLocalMode && isLoadingSimServices)) {
    return (
      <div className="p-12 text-center text-gray-500">
        <p>Carregando serviços...</p>
      </div>
    );
  }

  // Filter services for air simulation (exclude stripping-related services and incompatible calculation types like containers)
  const filteredServices = services.filter(
    (service) =>
      !service.hasStripping &&
      service.calculationType !== ServiceCalculationType.PER_CONTAINER
  );

  return (
    <div>
      {/* HEADER */}
      <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-blue-600" />
          Serviços Disponíveis
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Selecione os serviços para esta simulação aérea. Os valores padrão são carregados automaticamente.
        </p>
      </div>

      {/* TABLE */}
      <div className="p-6">
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="text-left w-[500px] font-semibold">Serviço</TableHead>
                <TableHead className="text-center w-[120px] font-semibold">Valor Padrão</TableHead>
                <TableHead className="text-center w-[160px] font-semibold">Valor Aplicado</TableHead>
                <TableHead className="text-center w-[280px] font-semibold">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredServices.map((service) => {
                const simService = getServiceById(service.id);
                const isAdded = !!simService;

                return (
                  <TableRow
                    key={service.id}
                    className={isAdded ? 'bg-blue-50/50 hover:bg-blue-50/70' : 'hover:bg-gray-50'}
                  >
                    <TableCell className="font-medium text-gray-900">
                      {service.name}
                    </TableCell>
                    <TableCell className="text-right">
                      <ServiceDefaultCost service={service} simulationData={simulationData} />
                    </TableCell>
                    <TableCell className="text-right">
                      {isAdded ? (
                        <span className={
                          simService.costType === ServiceCostType.ZEROED
                            ? 'font-bold text-gray-500'
                            : simService.costType === ServiceCostType.CUSTOM
                              ? 'font-bold text-orange-600'
                              : 'font-bold text-green-600'
                        }>
                          {formatCurrency(
                            simService.costType === ServiceCostType.DEFAULT
                              ? calculateFinalCostGlobal(Number(simService.originalCost), service, simulationData)
                              : simService.appliedCost
                          )}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        {!isAdded ? (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleUseDefault(service)}
                              disabled={!isEditable}
                              className="text-xs h-8 bg-green-600 hover:bg-green-700"
                            >
                              <Check className="w-3 h-3 mr-1" />
                              Usar Padrão
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleZero(service)}
                              disabled={!isEditable}
                              className="text-xs h-8 text-gray-600 hover:text-gray-700"
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Zerar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenCustomize(service)}
                              disabled={!isEditable}
                              className="text-xs h-8 text-orange-600 hover:text-orange-700 border-orange-300"
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Customizar
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenCustomize(service)}
                              disabled={!isEditable}
                              className="text-xs h-8"
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRemove(service.id)}
                              disabled={!isEditable}
                              className="text-xs h-8 text-red-600 hover:text-red-700 border-red-300 hover:bg-red-50"
                            >
                              <Trash className="w-3 h-3 mr-1" />
                              Remover
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {filteredServices.length === 0 && (
          <div className="p-12 text-center text-gray-400">
            <p>Nenhum serviço compatível com modal aéreo disponível.</p>
          </div>
        )}
      </div>

      {/* DIALOG: CUSTOMIZE SERVICE */}
      <Dialog open={isCustomizeDialogOpen} onOpenChange={setIsCustomizeDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="pb-3">
            <DialogTitle className="text-lg flex items-center gap-2">
              <Edit className="w-5 h-5 text-orange-600" />
              Customizar Serviço
            </DialogTitle>
            <DialogDescription className="text-sm">
              <strong className="text-gray-900">{selectedService?.name}</strong>
              <span className="text-gray-500 ml-2">({selectedService?.code})</span>
            </DialogDescription>
          </DialogHeader>

          {/* Scrollable Content */}
          <div className="overflow-y-auto flex-1 pr-2 space-y-3">
            {/* Calculation Type & Default Rate - Combined */}
            {selectedService && currentCostData && (
              <div className="grid grid-cols-2 gap-2">
                {/* Calculation Type */}
                <div className="p-2 bg-gray-100 rounded-md border border-gray-300">
                  <p className="text-[10px] text-gray-600 font-medium uppercase mb-0.5">Tipo</p>
                  <p className="text-xs text-gray-900 font-semibold text-wrap">
                    {selectedService.calculationType === ServiceCalculationType.FIXED && '💵 Fixo'}
                    {selectedService.calculationType === ServiceCalculationType.PERCENTAGE_CIF && '📊 % CIF'}
                    {selectedService.calculationType === ServiceCalculationType.PER_CONTAINER && '📦 /Embarque'}
                    {selectedService.calculationType === ServiceCalculationType.PER_TONNE && '⚖️ /Tonelada'}
                    {selectedService.calculationType === ServiceCalculationType.PER_KG && '⚖️ /KG'}
                    {selectedService.calculationType === ServiceCalculationType.PER_TONNE_OR_M3 && '⚖️ /Ton-M³ (Maior)'}
                  </p>
                </div>

                {/* Default Rate */}
                <div className="p-2 bg-blue-50 rounded-md border border-blue-200">
                  <p className="text-[10px] text-blue-600 font-medium uppercase mb-0.5">Taxa Padrão</p>
                  <p className="text-sm font-bold text-blue-900">
                    {selectedService.calculationType === ServiceCalculationType.PERCENTAGE_CIF
                      ? formatPercent(parseFloat(currentCostData.cost.toString()))
                      : formatCurrency(parseFloat(currentCostData.cost.toString()))}
                  </p>
                </div>
              </div>
            )}

            {/* Formula Display */}
            {selectedService && currentCostData && (
              <div className="p-2 bg-blue-50/50 rounded-md border border-blue-100">
                <p className="text-[10px] text-blue-600 font-medium mb-1">Cálculo Padrão:</p>
                <div className="text-xs text-blue-800 font-medium">
                  {getCalculationFormula(selectedService, parseFloat(currentCostData.cost.toString()))}
                  <span className="text-blue-900 font-bold ml-1">
                    = {formatCurrency(calculateFinalCost(parseFloat(currentCostData.cost.toString()), selectedService))}
                  </span>
                </div>
              </div>
            )}

            {/* Input Section - Compact Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Custom Rate Input */}
              <div className="space-y-1">
                <Label htmlFor="customRate" className="text-sm font-semibold">
                  {selectedService && getInputLabel(selectedService.calculationType)}
                </Label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
                    {selectedService?.calculationType === ServiceCalculationType.PERCENTAGE_CIF ? '%' : 'R$'}
                  </span>
                  <input
                    id="customRate"
                    type="number"
                    step={selectedService?.calculationType === ServiceCalculationType.PERCENTAGE_CIF ? '0.001' : '0.01'}
                    placeholder="0.00"
                    value={customRate}
                    onChange={(e) => setCustomRate(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pl-8 font-semibold"
                  />
                </div>
              </div>

              {/* Preview Result */}
              <div className="space-y-1">
                <Label className="text-sm font-semibold text-orange-600">Valor Final</Label>
                <div className="h-9 flex items-center justify-end px-3 bg-orange-50 rounded-md border-2 border-orange-200">
                  <span className="text-base font-bold text-orange-600">
                    {selectedService && formatCurrency(calculateFinalCost(parseFloat(customRate || '0'), selectedService))}
                  </span>
                </div>
              </div>
            </div>

            {/* Formula Preview - Compact */}
            {selectedService && customRate && (
              <div className="p-2 bg-orange-50/50 rounded-md border border-orange-100">
                <p className="text-[10px] text-orange-600 font-medium">
                  {getCalculationFormula(selectedService, parseFloat(customRate))}
                </p>
              </div>
            )}

            {/* Comparison - Compact */}
            {selectedService && currentCostData && customRate && (
              <div className="p-2 bg-gradient-to-r from-green-50 to-red-50 rounded-md border border-gray-300">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Diferença:</span>
                  <span className={`font-bold text-base ${calculateFinalCost(parseFloat(customRate || '0'), selectedService) >
                    calculateFinalCost(parseFloat(currentCostData.cost.toString()), selectedService)
                    ? 'text-red-600'
                    : calculateFinalCost(parseFloat(customRate || '0'), selectedService) <
                      calculateFinalCost(parseFloat(currentCostData.cost.toString()), selectedService)
                      ? 'text-green-600'
                      : 'text-gray-600'
                    }`}>
                    {calculateFinalCost(parseFloat(customRate || '0'), selectedService) >
                      calculateFinalCost(parseFloat(currentCostData.cost.toString()), selectedService) && '+'}
                    {formatCurrency(
                      calculateFinalCost(parseFloat(customRate || '0'), selectedService) -
                      calculateFinalCost(parseFloat(currentCostData.cost.toString()), selectedService)
                    )}
                  </span>
                </div>
              </div>
            )}

            {/* Reason Input - Compact */}
            <div className="space-y-1">
              <Label htmlFor="customReason" className="text-sm font-semibold flex items-center gap-1">
                Motivo <span className="text-red-500 text-xs">*</span>
                <span className="text-[10px] text-gray-500 font-normal">(obrigatório se diferente do padrão)</span>
              </Label>
              <Textarea
                id="customReason"
                placeholder="Ex: Cliente solicitou desconto devido ao volume..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                rows={2}
                className="resize-none text-sm"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-3 border-t mt-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsCustomizeDialogOpen(false);
                setCustomRate('');
                setCustomReason('');
              }}
              size="sm"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveCustom}
              size="sm"
              className="bg-orange-600 hover:bg-orange-700"
              disabled={!customRate || parseFloat(customRate) < 0}
            >
              Aplicar Valor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
