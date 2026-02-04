'use client';

import React, { useState, useEffect } from 'react';
import { Edit, Trash, Check, X, AlertCircle, DollarSign, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
import { Service, ServiceCostType, ServiceCalculationType, ServiceModal } from '@/types';
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

const calculateFinalCostGlobal = (rate: number, service: Service, simulationData: any): number => {
  const calcData = {
    cifBrl: simulationData.cifBrl,
    tonnes: simulationData.weightKg / 1000, 
    cntrCount: 1,
    weightKg: simulationData.weightKg,
    volumeM3: simulationData.volumeM3,
  };
  return calculateServiceCost(rate, service.calculationType, calcData);
};

function ServiceDefaultCost({ service, simulationData }: { service: Service; simulationData: any }) {
  const { data: costData, isLoading } = useServiceCostCurrent(service.id);
  if (isLoading) return <span className="text-gray-400">...</span>;
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
  const isLocalMode = !simulationId;
  const { data: simulationServices, isLoading: isLoadingSimServices } = useAirSimulationServices(simulationId || '');
  const addServiceMutation = useAddAirSimulationService();
  const removeServiceMutation = useRemoveAirSimulationService();

  const [isCustomizeDialogOpen, setIsCustomizeDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [customRate, setCustomRate] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');

  const { data: currentCostData } = useServiceCostCurrent(selectedService?.id || '');

  const calculateFinalCost = (rate: number, service: Service): number => {
    return calculateFinalCostGlobal(rate, service, simulationData);
  };

  const getCalculationFormula = (service: Service, rate: number): string => {
    const calcData = {
      cifBrl: simulationData.cifBrl,
      tonnes: simulationData.weightKg / 1000,
      cntrCount: 1,
      weightKg: simulationData.weightKg,
      volumeM3: simulationData.volumeM3,
    };

    switch (service.calculationType) {
      case ServiceCalculationType.FIXED:
        return formatCurrency(rate);
      case ServiceCalculationType.PERCENTAGE_CIF:
        return `${formatPercent(rate)} × ${formatCurrency(simulationData.cifBrl)} (CIF BRL)`;
      case ServiceCalculationType.PER_KG:
        return `${formatCurrency(rate)} × ${simulationData.weightKg} kg`;
      case ServiceCalculationType.PER_TONNE:
        const t = (simulationData.weightKg || 0) / 1000;
        const v = simulationData.volumeM3 || 0;
        const unit = Math.ceil(Math.max(t, v));
        return `${formatCurrency(rate)} × ${unit} ton/m³ (arred.)`;
      default:
        return formatCurrency(rate);
    }
  };

  const getInputLabel = (calculationType: ServiceCalculationType): string => {
    switch (calculationType) {
      case ServiceCalculationType.FIXED:
        return 'Valor Fixo (R$)';
      case ServiceCalculationType.PERCENTAGE_CIF:
        return 'Percentual sobre CIF (%)';
      case ServiceCalculationType.PER_KG:
        return 'Valor por KG (R$)';
      case ServiceCalculationType.PER_TONNE:
        return 'Valor por Ton/M3 (R$)';
      default:
        return 'Valor (R$)';
    }
  };

  const activeServices = isLocalMode ? localServices : (simulationServices || []);
  const getServiceById = (serviceId: string) => activeServices.find((ss) => ss.serviceId === serviceId);

  useEffect(() => {
    if (selectedService && currentCostData) {
      const existingService = getServiceById(selectedService.id);
      if (existingService) {
        setCustomRate(existingService.originalCost.toString());
        setCustomReason(existingService.customReason || '');
      } else {
        setCustomRate(currentCostData.cost.toString());
        setCustomReason('');
      }
    }
  }, [selectedService, currentCostData, activeServices]);

  const handleUseDefault = async (service: Service) => {
    try {
      const costData = await serviceCostService.getCurrent(service.id);
      if (!costData) return;
      const data = {
        serviceId: service.id,
        costType: ServiceCostType.DEFAULT,
        originalCost: costData.cost,
        appliedCost: calculateFinalCost(costData.cost, service),
      };
      if (isLocalMode) onAddLocalService?.(data);
      else await addServiceMutation.mutateAsync({ simulationId: simulationId!, data });
      toast.success('Serviço adicionado');
    } catch (e) { toast.error('Erro ao adicionar'); }
  };

  const handleZero = async (service: Service) => {
    try {
      const data = {
        serviceId: service.id,
        costType: ServiceCostType.ZEROED,
        originalCost: 0,
        appliedCost: 0,
      };
      if (isLocalMode) onAddLocalService?.(data);
      else await addServiceMutation.mutateAsync({ simulationId: simulationId!, data });
      toast.success('Serviço zerado');
    } catch (e) { toast.error('Erro ao zerar'); }
  };

  const handleOpenCustomize = (service: Service) => {
    setSelectedService(service);
    setIsCustomizeDialogOpen(true);
  };

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
      const data = {
        serviceId: selectedService.id,
        costType: rateValue === defaultRate ? ServiceCostType.DEFAULT : ServiceCostType.CUSTOM,
        originalCost: rateValue,
        appliedCost: finalCost,
        customReason: rateValue !== defaultRate ? customReason : undefined,
      };
      if (isLocalMode) onAddLocalService?.(data);
      else await addServiceMutation.mutateAsync({ simulationId: simulationId!, data });
      setIsCustomizeDialogOpen(false);
      setSelectedService(null);
      setCustomRate('');
      setCustomReason('');
      toast.success('Serviço customizado');
    } catch (e) { toast.error('Erro ao customizar'); }
  };

  const handleRemove = async (serviceId: string) => {
    if (isLocalMode) onRemoveLocalService?.(serviceId);
    else await removeServiceMutation.mutateAsync({ simulationId: simulationId!, serviceId });
  };

  if (isLoadingServices || (!isLocalMode && isLoadingSimServices)) {
    return <div className="p-12 text-center text-gray-500 italic">Carregando...</div>;
  }

  const filteredServices = services.filter(
    (s) => s.modal === ServiceModal.AIR || s.modal === ServiceModal.BOTH
  );

  return (
    <div>
      <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-blue-600" />
          Serviços Disponíveis
        </h2>
      </div>

      <div className="p-6">
        <div className="rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-left w-[500px]">Serviço</TableHead>
                <TableHead className="text-center w-[120px]">Padrão</TableHead>
                <TableHead className="text-center w-[160px]">Aplicado</TableHead>
                <TableHead className="text-center w-[280px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredServices.map((service) => {
                const simService = getServiceById(service.id);
                const isAdded = !!simService;
                return (
                  <TableRow key={service.id} className={isAdded ? 'bg-blue-50/50' : ''}>
                    <TableCell className="font-medium text-gray-900">{service.name}</TableCell>
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
                          {formatCurrency(simService.appliedCost)}
                        </span>
                      ) : <span className="text-gray-400">-</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        {!isAdded ? (
                          <>
                            <Button size="sm" onClick={() => handleUseDefault(service)} disabled={!isEditable} className="bg-green-600 hover:bg-green-700 h-8 text-xs">
                              <Check className="w-3 h-3 mr-1" /> Usar Padrão
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleZero(service)} disabled={!isEditable} className="h-8 text-xs text-gray-600 hover:text-gray-700">
                              <XCircle className="w-3 h-3 mr-1" /> Zerar
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleOpenCustomize(service)} disabled={!isEditable} className="h-8 text-xs text-orange-600 hover:text-orange-700 border-orange-300">
                              <Edit className="w-3 h-3 mr-1" /> Customizar
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" variant="outline" onClick={() => handleOpenCustomize(service)} disabled={!isEditable} className="h-8 text-xs">
                              <Edit className="w-3 h-3 mr-1" /> Editar
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleRemove(service.id)} disabled={!isEditable} className="h-8 text-xs text-red-600 border-red-200">
                              <Trash className="w-3 h-3 mr-1" /> Remover
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
      </div>

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

          <div className="overflow-y-auto flex-1 pr-2 space-y-3">
            {selectedService && currentCostData && (
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-gray-100 rounded-md border border-gray-300">
                  <p className="text-[10px] text-gray-600 font-medium uppercase mb-0.5">Tipo</p>
                  <p className="text-xs text-gray-900 font-semibold">
                    {selectedService.calculationType === ServiceCalculationType.FIXED && '💵 Fixo'}
                    {selectedService.calculationType === ServiceCalculationType.PERCENTAGE_CIF && '📊 % CIF'}
                    {selectedService.calculationType === ServiceCalculationType.PER_KG && '⚖️ /KG'}
                    {selectedService.calculationType === ServiceCalculationType.PER_TONNE && '📦 /Ton ou M3'}
                  </p>
                </div>

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

            {selectedService && currentCostData && (
              <div className="p-2 bg-blue-50/50 rounded-md border border-blue-100">
                <p className="text-[10px] text-blue-600 font-medium mb-1">Cálculo Padrão:</p>
                <p className="text-xs text-blue-800 font-medium">
                  {getCalculationFormula(selectedService, parseFloat(currentCostData.cost.toString()))}
                  <span className="text-blue-900 font-bold ml-1">
                    = {formatCurrency(calculateFinalCost(parseFloat(currentCostData.cost.toString()), selectedService))}
                  </span>
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="customRate" className="text-sm font-semibold">
                  {selectedService && getInputLabel(selectedService.calculationType)}
                </Label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
                    {selectedService?.calculationType === ServiceCalculationType.PERCENTAGE_CIF ? '%' : 'R$'}
                  </span>
                  <Input
                    id="customRate"
                    type="number"
                    step={selectedService?.calculationType === ServiceCalculationType.PERCENTAGE_CIF ? '0.001' : '0.01'}
                    placeholder="0.00"
                    value={customRate}
                    onChange={(e) => setCustomRate(e.target.value)}
                    className="pl-8 h-9 font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-sm font-semibold text-orange-600">Valor Final</Label>
                <div className="h-9 flex items-center justify-end px-3 bg-orange-50 rounded-md border-2 border-orange-200">
                  <span className="text-base font-bold text-orange-600">
                    {selectedService && formatCurrency(calculateFinalCost(parseFloat(customRate || '0'), selectedService))}
                  </span>
                </div>
              </div>
            </div>

            {selectedService && customRate && (
              <div className="p-2 bg-orange-50/50 rounded-md border border-orange-100">
                <p className="text-[10px] text-orange-600 font-medium">
                  {getCalculationFormula(selectedService, parseFloat(customRate))}
                </p>
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="customReason" className="text-sm font-semibold flex items-center gap-1">
                Motivo <span className="text-red-500 text-xs">*</span>
                <span className="text-[10px] text-gray-500 font-normal">(obrigatório se diferente do padrão)</span>
              </Label>
              <Textarea
                id="customReason"
                placeholder="Ex: Cliente solicitou desconto..."
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
                setSelectedService(null);
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
                disabled={customRate === '' || parseFloat(customRate) < 0}
              >
              Aplicar Valor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}