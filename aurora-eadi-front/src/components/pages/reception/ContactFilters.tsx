'use client'

import React from 'react';
import { Search, FilterX } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ContactFiltersProps {
  filters: {
    name: string;
    department: string;
    position: string;
  };
  setFilters: (filters: any) => void;
  onClear: () => void;
}

export function ContactFilters({ filters, setFilters, onClear }: ContactFiltersProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 items-end">
      <div className="space-y-2">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Nome</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input
            value={filters.name}
            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
            placeholder="Buscar por nome..."
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Setor</label>
        <Input
          value={filters.department}
          onChange={(e) => setFilters({ ...filters, department: e.target.value })}
          placeholder="Todos os setores"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Função</label>
        <Input
          value={filters.position}
          onChange={(e) => setFilters({ ...filters, position: e.target.value })}
          placeholder="Todas as funções"
        />
      </div>

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1 gap-2" onClick={onClear}>
          <FilterX size={18} />
          Limpar
        </Button>
      </div>
    </div>
  );
}
