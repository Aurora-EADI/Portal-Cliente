"use client";

import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { UserCircle, Calendar as CalendarIcon, Search, X } from "lucide-react";
import { useCustomers } from "@/hooks/useCustomers";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

interface ReportFiltersProps {
  selectedCustomers: string[];
  onCustomersChange: (customers: string[]) => void;
  startDate: string;
  onStartDateChange: (date: string) => void;
  endDate: string;
  onEndDateChange: (date: string) => void;
  onClear: () => void;
}

export function ReportFilters({
  selectedCustomers,
  onCustomersChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onClear,
}: ReportFiltersProps) {
  const [showFilters, setShowFilters] = useState(true);
  const { data: customersData, isLoading } = useCustomers();

  const customerOptions: MultiSelectOption[] = useMemo(() => {
    const customers = Array.isArray(customersData) 
      ? customersData 
      : (customersData as any)?.data || [];
      
    return customers.map((c: any) => ({
      value: String(c.id),
      label: c.name,
    }));
  }, [customersData]);

  const hasActiveFilters = selectedCustomers.length > 0 || startDate || endDate;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5 text-slate-400" />
              Filtros
            </CardTitle>
            {hasActiveFilters && (
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                Filtros ativos
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="toggle-filters-reports" className="text-sm text-gray-600 cursor-pointer">
              {showFilters ? "Ocultar" : "Mostrar"}
            </Label>
            <Switch
              id="toggle-filters-reports"
              checked={showFilters}
              onCheckedChange={setShowFilters}
            />
          </div>
        </div>
      </CardHeader>

      {showFilters && (
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-in slide-in-from-top-2 duration-300">
              <div className="md:col-span-2 space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <UserCircle className="w-4 h-4 text-slate-400" />
                  Clientes
                </Label>
                <MultiSelect
                  options={customerOptions}
                  selected={selectedCustomers}
                  onChange={onCustomersChange}
                  placeholder="Todos os clientes"
                  searchPlaceholder="Buscar cliente pelo nome..."
                  emptyMessage={isLoading ? "Carregando clientes..." : "Nenhum cliente encontrado."}
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-slate-400" />
                  Data Início
                </Label>
                <Input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => onStartDateChange(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-slate-400" />
                  Data Fim
                </Label>
                <Input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => onEndDateChange(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-between mt-6 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={onClear} 
                className="gap-2"
                disabled={!hasActiveFilters}
              >
                <X className="w-4 h-4" />
                Limpar Filtros
              </Button>
              <div />
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
