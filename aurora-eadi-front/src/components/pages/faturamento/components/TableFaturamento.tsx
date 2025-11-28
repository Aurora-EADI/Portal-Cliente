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
import { Button } from "@/components/ui/button";
import { FaturamentoPost } from "@/services/faturamento/type/type_faturamentoCutOff";

interface Props {
  data: FaturamentoPost[];
  isLoading: boolean;
  itemsPerPage?: number; // opcional, padrão 5
}

export function FaturamentoTable({ data, isLoading, itemsPerPage = 5 }: Props) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = useMemo(() => {
    return Math.ceil(data.length / itemsPerPage);
  }, [data.length, itemsPerPage]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return data.slice(start, start + itemsPerPage);
  }, [currentPage, data, itemsPerPage]);

  const skeletonRows = Array.from({ length: itemsPerPage });

  const handlePrev = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNext = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resultados</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="overflow-auto rounded border">
          <Table className="text-sm w-full">
            <TableHeader>
              <TableRow className="bg-gray-100">
                <TableHead className="p-3 text-left">ID</TableHead>
                <TableHead className="p-3 text-left">User</TableHead>
                <TableHead className="p-3 text-left">Título</TableHead>
                <TableHead className="p-3 text-left">Ações</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading
                ? skeletonRows.map((_, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="p-3">
                        <Skeleton className="h-4 w-10" />
                      </TableCell>
                      <TableCell className="p-3">
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                      <TableCell className="p-3">
                        <Skeleton className="h-4 w-40" />
                      </TableCell>
                      <TableCell className="p-3">
                        <Skeleton className="h-4 w-6" />
                      </TableCell>
                    </TableRow>
                  ))
                : paginatedData.map((item) => (
                    <TableRow key={item.id} className="border-t">
                      <TableCell className="p-3">{item.id}</TableCell>
                      <TableCell className="p-3">{item.userId}</TableCell>
                      <TableCell className="p-3">{item.title}</TableCell>
                      <TableCell className="p-3">
                        <Eye className="w-4 h-4 cursor-pointer hover:text-gray-800" />
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </div>

        {/* Paginação */}
        {!isLoading && totalPages > 1 && (
          <div className="flex justify-end items-center gap-2 mt-4">
            <Button onClick={handlePrev} disabled={currentPage === 1} variant="outline">
              Anterior
            </Button>
            <span className="text-sm text-gray-600">
              Página {currentPage} de {totalPages}
            </span>
            <Button onClick={handleNext} disabled={currentPage === totalPages} variant="outline">
              Próxima
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
