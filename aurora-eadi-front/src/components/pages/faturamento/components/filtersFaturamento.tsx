"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";

interface FiltersProps {
  cliente: string;
  cod_cli: string;
  n_fatura: string;
  n_di: string;
  n_lote: string;
  modalidade_txt: string;
}

interface Props {
  filters: FiltersProps;
  setFilters: React.Dispatch<React.SetStateAction<FiltersProps>>;
  onFetch: () => void;
}

export function FaturamentoFilters({ filters, setFilters, onFetch }: Props) {
  const clearFilters = () =>
    setFilters({
      cliente: "",
      cod_cli: "",
      n_fatura: "",
      n_di: "",
      n_lote: "",
      modalidade_txt: "",
    });

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

          {/* Cliente */}
          <Input
            placeholder="Cliente"
            value={filters.cliente}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, cliente: e.target.value }))
            }
          />

          {/* Código Cliente */}
          <Input
            placeholder="Código Cliente"
            value={filters.cod_cli}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, cod_cli: e.target.value }))
            }
          />

          {/* Nº Fatura */}
          <Input
            placeholder="Nº Fatura"
            value={filters.n_fatura}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, n_fatura: e.target.value }))
            }
          />

          {/* Nº DI */}
          <Input
            placeholder="Nº DI"
            value={filters.n_di}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, n_di: e.target.value }))
            }
          />

          {/* Nº Lote */}
          <Input
            placeholder="Nº Lote"
            value={filters.n_lote}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, n_lote: e.target.value }))
            }
          />

          {/* Modalidade Texto */}
          <Input
            placeholder="Modalidade (Marítimo, Aéreo)"
            value={filters.modalidade_txt}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, modalidade_txt: e.target.value }))
            }
          />
        </div>

        {/* Botões */}
        <div className="flex justify-between mt-4">
          <Button variant="secondary" onClick={clearFilters}>
            Limpar Filtros
          </Button>

          <Button onClick={onFetch}>
            Buscar Dados
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
