'use client';

import React, { useState, useEffect } from 'react';
import { Edit, Trash, Check, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/Badge';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Service, ServiceCostType } from '@/types';
import {
  useSimulationServices,
  useAddSimulationService,
  useRemoveSimulationService,
} from '@/hooks/useSimulations';
import { useServiceCostCurrent } from '@/hooks/useServices';

interface ServicesTabProps {
  simulationId: string;
  services: Service[];
  isLoadingServices: boolean;
  isEditable: boolean;
}

export function ServicesTab({
  simulationId,
  services,
  isLoadingServices,
  isEditable,
}: ServicesTabProps) {
  // Query for simulation services
  const { data: simulationServices, isLoading: isLoadingSimServices } =
    useSimulationServices(simulationId);

  // Mutations
  const addServiceMutation = useAddSimulationService();
  const removeServiceMutation = useRemoveSimulationService();

  // Dialog state
  const [isCustomizeDialogOpen, setIsCustomizeDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [customCost, setCustomCost] = useState<string>('');
  const [customReason, setCustomReason] = useState<string>('');
  const [costType, setCostType] = useState<ServiceCostType>(ServiceCostType.DEFAULT);

  // Get current cost for selected service
  const { data: currentCostData } = useServiceCostCurrent(selectedService?.id || '');

  // Reset dialog when opening
  useEffect(() => {
    if (selectedService && currentCostData) {
      setCustomCost(currentCostData.cost.toString());
      setCostType(ServiceCostType.DEFAULT);
      setCustomReason('');
    }
  }, [selectedService, currentCostData]);

  // Check if service is already added
  const isServiceAdded = (serviceId: string) => {
    return simulationServices?.some((ss) => ss.serviceId === serviceId);
  };

  // Get simulation service by service ID
  const getSimulationService = (serviceId: string) => {
    return simulationServices?.find((ss) => ss.serviceId === serviceId);
  };

  // Handler: Add service with default cost
  const handleAddDefault = async (service: Service) => {
    if (!currentCostData) return;

    try {
      await addServiceMutation.mutateAsync({
        simulationId,
        data: {
          serviceId: service.id,
          costType: ServiceCostType.DEFAULT,
          appliedCost: currentCostData.cost,
        },
      });
    } catch (error) {
      console.error('Error adding service:', error);
    }
  };

  // Handler: Zero service
  const handleZero = async (service: Service) => {
    try {
      await addServiceMutation.mutateAsync({
        simulationId,
        data: {
          serviceId: service.id,
          costType: ServiceCostType.ZEROED,
          appliedCost: 0,
        },
      });
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
    if (!selectedService) return;

    const isCustom = costType === ServiceCostType.CUSTOM;
    const isZeroed = costType === ServiceCostType.ZEROED;

    // Validation
    if (isCustom && !customReason.trim()) {
      alert('Informe o motivo da customização');
      return;
    }

    try {
      await addServiceMutation.mutateAsync({
        simulationId,
        data: {
          serviceId: selectedService.id,
          costType,
          appliedCost: isZeroed ? 0 : parseFloat(customCost) || 0,
          customReason: isCustom ? customReason : undefined,
        },
      });

      setIsCustomizeDialogOpen(false);
      setSelectedService(null);
    } catch (error) {
      console.error('Error customizing service:', error);
    }
  };

  // Handler: Remove service
  const handleRemove = async (serviceId: string) => {
    try {
      await removeServiceMutation.mutateAsync({
        simulationId,
        serviceId,
      });
    } catch (error) {
      console.error('Error removing service:', error);
    }
  };

  // Get cost badge variant
  const getCostBadge = (simService: any) => {
    if (simService.costType === ServiceCostType.DEFAULT) {
      return <Badge variant="outline" className="text-green-600 border-green-600">Padrão</Badge>;
    }
    if (simService.costType === ServiceCostType.ZEROED) {
      return <Badge variant="outline" className="text-gray-500 border-gray-400">Zerado</Badge>;
    }
    if (simService.costType === ServiceCostType.CUSTOM) {
      return (
        <Badge variant="outline" className="text-orange-600 border-orange-600 gap-1">
          <AlertCircle className="w-3 h-3" />
          Custom
        </Badge>
      );
    }
  };

  if (isLoadingServices || isLoadingSimServices) {
    return (
      <div className="p-12 text-center text-gray-500">
        <p>Carregando serviços...</p>
      </div>
    );
  }

  return (
    <div>
      {/* HEADER */}
      <div className="p-6 border-b border-gray-100 bg-gray-50/50">
        <h2 className="text-lg font-bold text-gray-800">Serviços Disponíveis</h2>
        <p className="text-sm text-gray-500 mt-1">
          Selecione os serviços que serão aplicados nesta simulação. Você pode usar o custo padrão,
          zerar ou customizar cada serviço.
        </p>
      </div>

      {/* TABLE */}
      <div className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Código</TableHead>
              <TableHead>Serviço</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Custo Padrão</TableHead>
              <TableHead className="text-right">Custo Aplicado</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center w-[180px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map((service) => {
              const simService = getSimulationService(service.id);
              const isAdded = !!simService;

              return (
                <TableRow key={service.id} className={isAdded ? 'bg-blue-50/30' : ''}>
                  <TableCell className="font-mono text-xs">{service.code}</TableCell>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell className="text-sm text-gray-600">{service.category || '-'}</TableCell>
                  <TableCell className="text-right font-medium">
                    R$ {simService?.originalCost || '0,00'}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {isAdded ? (
                      <span className={simService.costType === ServiceCostType.ZEROED ? 'text-gray-400' : 'text-green-600'}>
                        R$ {simService.appliedCost}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {isAdded ? getCostBadge(simService) : <span className="text-gray-400 text-sm">Não usado</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      {!isAdded ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddDefault(service)}
                            disabled={!isEditable}
                            className="text-xs"
                          >
                            <Check className="w-3 h-3 mr-1" />
                            Usar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenCustomize(service)}
                            disabled={!isEditable}
                            className="text-xs"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Customizar
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenCustomize(service)}
                            disabled={!isEditable}
                            className="text-xs"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemove(service.id)}
                            disabled={!isEditable}
                            className="text-xs text-red-600 hover:text-red-700"
                          >
                            <Trash className="w-3 h-3" />
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

        {services.length === 0 && (
          <div className="p-12 text-center text-gray-400">
            <p>Nenhum serviço cadastrado no sistema.</p>
          </div>
        )}
      </div>

      {/* DIALOG: CUSTOMIZE SERVICE */}
      <Dialog open={isCustomizeDialogOpen} onOpenChange={setIsCustomizeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Customizar Serviço</DialogTitle>
            <DialogDescription>
              Serviço: <strong>{selectedService?.name}</strong> ({selectedService?.code})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Tipo de Custo */}
            <div className="space-y-2">
              <Label htmlFor="costType">Tipo de Custo</Label>
              <Select
                value={costType}
                onValueChange={(value) => setCostType(value as ServiceCostType)}
              >
                <SelectTrigger id="costType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ServiceCostType.DEFAULT}>
                    Usar Custo Padrão (R$ {currentCostData?.cost || '0,00'})
                  </SelectItem>
                  <SelectItem value={ServiceCostType.CUSTOM}>
                    Customizar Custo
                  </SelectItem>
                  <SelectItem value={ServiceCostType.ZEROED}>
                    Zerar (Não usar serviço)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom Cost Input */}
            {costType === ServiceCostType.CUSTOM && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="customCost">Custo Customizado (R$)</Label>
                  <Input
                    id="customCost"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={customCost}
                    onChange={(e) => setCustomCost(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customReason">
                    Motivo da Customização <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="customReason"
                    placeholder="Ex: Cliente solicitou desconto de 10%"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    ⚠️ Obrigatório informar o motivo para custos customizados
                  </p>
                </div>
              </>
            )}

            {/* Preview */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm font-semibold text-gray-700 mb-2">Prévia:</p>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Custo que será aplicado:</span>
                <span className="text-lg font-bold text-gray-900">
                  R${' '}
                  {costType === ServiceCostType.ZEROED
                    ? '0,00'
                    : costType === ServiceCostType.CUSTOM
                      ? parseFloat(customCost || '0')
                      : currentCostData?.cost || '0,00'}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCustomizeDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCustom}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
