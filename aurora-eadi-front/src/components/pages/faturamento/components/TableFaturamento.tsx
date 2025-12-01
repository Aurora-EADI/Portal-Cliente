"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Eye } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FaturamentoDetalhado } from "@/services/faturamento/type/type_faturamentoDetalhado";

type ColumnDefinition = {
  label: string;
  field: keyof FaturamentoDetalhado;
};

interface Props {
  data: FaturamentoDetalhado[];
  isLoading: boolean;
  itemsPerPage?: number;
}

export function FaturamentoTable({
  data,
  isLoading,
  itemsPerPage = 20,
}: Props) {
  const [currentPage, setCurrentPage] = useState(1);

const columns: ColumnDefinition[] = [
    { label: "Código Cliente", field: "cod_cli" },
    { label: "Nº Fatura", field: "n_fatura" },
    { label: "Cliente", field: "cliente" },
    { label: "Endereço", field: "endereco" },
    { label: "Bairro", field: "bairro" },
    { label: "Cidade", field: "cidade" },
    { label: "UF", field: "uf" },
    { label: "CEP", field: "cep" },
    { label: "CGC", field: "cgc" },
    { label: "Inscrição Estadual", field: "inscr_esta" },
    { label: "Inscrição Municipal", field: "inscr_munic" },
    { label: "RPS", field: "rps" },
    { label: "Tipo Nota", field: "tp_nota" },
    { label: "Valor Extenso", field: "vl_extenso" },
    { label: "Valor Fatura", field: "valor_fatura" },
    { label: "Valor Serviços", field: "valor_servicos" },
    { label: "Data Fatura", field: "dt_fatura" },
    { label: "Data Vencimento", field: "dt_vencimento" },
    { label: "ISS a Cobrar", field: "iss_cobrar" },
    { label: "Valor ISS", field: "iss_valor" },
    { label: "Percentual ISS", field: "iss_percentual" },
    { label: "II Valor", field: "ii_valor" },
    { label: "Observação", field: "observacao" },
    { label: "Modalidade", field: "modalidade" },
    { label: "Despachante", field: "despachante" },
    { label: "Valor CIF", field: "valor_cif" },
    { label: "Nº DA", field: "n_da" },
    { label: "Nº DI", field: "n_di" },
    { label: "Nº Lote", field: "n_lote" },
    { label: "Nº Conhecimento", field: "n_conhecimento" },
    { label: "Nº Documento", field: "n_documento" },
    { label: "TX Dólar", field: "tx_dolar" },
    { label: "Data Entrada", field: "dt_entrada" },
    { label: "Período Inicial", field: "nr_periodo_i" },
    { label: "Período Final", field: "nr_periodo_f" },
    { label: "Data Período Final", field: "dt_periodo_f" },
    { label: "Qt Volumes", field: "qt_volumes" },
    { label: "Peso Bruto", field: "peso_bruto" },
    { label: "M³", field: "m3" },
    { label: "Tributação", field: "tributacao_msg" },
    { label: "Quantidade", field: "quantidade" },
    { label: "Serviço ID", field: "servico_id" },
    { label: "Serviço", field: "servico" },
    { label: "Valor", field: "valor" },
    { label: "Modalidade Texto", field: "modalidade_txt" },
    { label: "Cliente RPS", field: "cliente_rps" }  ];

  const totalPages = useMemo(
    () => Math.ceil(data.length / itemsPerPage),
    [data.length, itemsPerPage]
  );

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return data.slice(start, start + itemsPerPage);
  }, [currentPage, data, itemsPerPage]);

  const skeletonRows = Array.from({ length: itemsPerPage });

  const handlePrev = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNext = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Faturamento</CardTitle>
      </CardHeader>

      <CardContent>
        {data.length === 0 && !isLoading && (
          <p className="text-gray-600 text-sm">
            Nenhum dado carregado. Clique em <b>Buscar Dados</b> acima.
          </p>
        )}

        {data.length > 0 && (
          <>
            <div className="overflow-auto rounded border max-h-[70vh]">
              <Table className="text-xs w-full">
                <TableHeader>
                  <TableRow className="bg-gray-100">
                    {columns.map((col) => (
                      <TableHead key={col.field} className="p-2 whitespace-nowrap">
                        {col.label}
                      </TableHead>
                    ))}
                    <TableHead className="p-2">Ações</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {isLoading
                    ? skeletonRows.map((_, idx) => (
                        <TableRow key={idx}>
                          {columns.map((_, i) => (
                            <TableCell key={i} className="p-2">
                              <Skeleton className="h-4 w-full" />
                            </TableCell>
                          ))}
                          <TableCell className="p-2">
                            <Skeleton className="h-4 w-4" />
                          </TableCell>
                        </TableRow>
                      ))
                    : paginatedData.map((item) => (
                        <TableRow key={item.id} className="border-t hover:bg-gray-50">
                          {columns.map((col) => (
                            <TableCell key={col.field} className="p-2 whitespace-nowrap">
                              {String(item[col.field] ?? "")}
                            </TableCell>
                          ))}
                          <TableCell className="p-2">
                            <Eye className="w-4 h-4 cursor-pointer hover:text-gray-800" />
                          </TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </div>

            {!isLoading && totalPages > 1 && (
              <div className="flex justify-end items-center gap-2 mt-4">
                <button onClick={handlePrev} disabled={currentPage === 1}>
                  Anterior
                </button>
                <span className="text-sm text-gray-600">
                  Página {currentPage} de {totalPages}
                </span>
                <button onClick={handleNext} disabled={currentPage === totalPages}>
                  Próxima
                </button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
