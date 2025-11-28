"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";

interface Props {
  filters: {
    busca: string;
    userId: string;
  };
  setFilters: (value: any) => void;
}

export function FaturamentoFilters({ filters, setFilters }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5" />
          Filtros
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Buscar por título..."
            value={filters.busca}
            onChange={(e) => setFilters((p: any) => ({ ...p, busca: e.target.value }))}
          />

          <Select
            value={filters.userId}
            onValueChange={(val) => setFilters((p: any) => ({ ...p, userId: val }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="User ID" />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4].map((id) => (
                <SelectItem key={id} value={String(id)}>
                  {id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end mt-4">
          <Button
            variant="secondary"
            onClick={() => setFilters({ busca: "", userId: "" })}
          >
            Limpar Filtros
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
