"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";
import {
  ClipboardList,
  Clock,
  Circle,
  Building2,
  User,
  FileText,
  Truck,
  Package,
  Loader2,
} from "lucide-react";
import { ConferenciaCargaItem } from "@/types";

interface ConferenciaCargaAirportTableProps {
  items: ConferenciaCargaItem[];
  isTvMode?: boolean;
  isLoading?: boolean;
}

const modalidadeConfig: Record<
  string,
  { label: string; color: string; bgColor: string; dotColor: string }
> = {
  MARITIMO: {
    label: "MARITIMO",
    color: "text-sky-300",
    bgColor: "bg-sky-500/20 border-sky-500/30",
    dotColor: "bg-sky-400",
  },
  AEREO: {
    label: "AEREO",
    color: "text-amber-300",
    bgColor: "bg-amber-500/20 border-amber-500/30",
    dotColor: "bg-amber-400",
  },
  FERROVIARIO: {
    label: "FERROVIARIO",
    color: "text-indigo-300",
    bgColor: "bg-indigo-500/20 border-indigo-500/30",
    dotColor: "bg-indigo-400",
  },
  RODOVIARIO: {
    label: "RODOVIARIO",
    color: "text-emerald-300",
    bgColor: "bg-emerald-500/20 border-emerald-500/30",
    dotColor: "bg-emerald-400",
  },
  "N/A": {
    label: "N/A",
    color: "text-slate-300",
    bgColor: "bg-slate-500/20 border-slate-500/30",
    dotColor: "bg-slate-400",
  },
};

function toKey(modalidade: string | null | undefined) {
  const value = (modalidade ?? "N/A").toUpperCase().trim();
  return modalidadeConfig[value] ? value : "N/A";
}

function formatTime(dateStr: string | null) {
  if (!dateStr) return "--:--";
  const localDateStr = dateStr.replace("Z", "");
  const date = new Date(localDateStr);
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "--/--";
  const localDateStr = dateStr.replace("Z", "");
  const date = new Date(localDateStr);
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export function ConferenciaCargaAirportTable({
  items,
  isTvMode = false,
  isLoading = false,
}: ConferenciaCargaAirportTableProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const da = a.dtConferencia ? new Date(a.dtConferencia).getTime() : 0;
      const db = b.dtConferencia ? new Date(b.dtConferencia).getTime() : 0;
      if (db !== da) return db - da;
      return (b.conferenciaId ?? 0) - (a.conferenciaId ?? 0);
    });
  }, [items]);

  const counts = useMemo(() => {
    const base: Record<string, number> = {};
    Object.keys(modalidadeConfig).forEach((k) => (base[k] = 0));
    for (const row of items) {
      const k = toKey(row.modalidade);
      base[k] = (base[k] ?? 0) + 1;
    }
    return base;
  }, [items]);

  const cardsToShow = useMemo(() => {
    const keys = Object.keys(modalidadeConfig);
    const ordered = keys
      .filter((k) => (counts[k] ?? 0) > 0)
      .concat(keys.filter((k) => (counts[k] ?? 0) === 0));
    return ordered.slice(0, 4);
  }, [counts]);

  return (
    <div
      className={cn(
        "bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50 flex flex-col",
        isTvMode && "h-screen rounded-none border-0",
      )}
    >
      {/* Header */}
      <div className="relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-blue-600/20" />
        <div className={cn("relative px-8 py-6 border-b border-slate-700/50", isTvMode && "px-4 py-3")}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Logo src="/logo_principal.png" size="md" />
              <div className={cn("p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/25", isTvMode && "p-2")}>
                <ClipboardList className={cn("text-white", isTvMode ? "h-6 w-6" : "h-7 w-7")} />
              </div>
              <div>
                <h1 className={cn("font-bold text-white", isTvMode ? "text-lg" : "text-2xl")}>
                  Conferencia de Carga
                </h1>
                <p className={cn("text-slate-400", isTvMode ? "text-xs" : "text-sm")}>
                  Conferencias em aberto (SIAUM)
                </p>
              </div>
            </div>

            <div className="flex items-center">
              {/* Cards */}
              <div className={cn("hidden lg:flex items-center gap-4", isTvMode && "gap-2")}>
                {cardsToShow.map((key) => {
                  const config = modalidadeConfig[key];
                  return (
                    <div
                      key={key}
                      className={cn(
                        "px-4 py-2 rounded-xl border backdrop-blur-sm",
                        "h-20 w-48 flex flex-col justify-between",
                        config.bgColor,
                        isTvMode && "px-3 py-1.5 h-12 w-32",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Circle className={cn("h-2 w-2 fill-current", config.color)} />
                        <span className={cn("text-slate-400", isTvMode ? "text-xs" : "text-xs")}>
                          {config.label}
                        </span>
                      </div>

                      <p className={cn("font-bold", config.color, isTvMode ? "text-lg" : "text-2xl")}>
                        {counts[key] ?? 0}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Clock */}
              <div className={cn("flex flex-col items-end ml-4 pl-4 border-l border-slate-700", isTvMode && "ml-2 pl-2")}>
                <div className={cn("flex items-center gap-2 text-slate-500", isTvMode && "hidden")}>
                  <Clock className="h-4 w-4" />
                  <span className="text-xs">HORA ATUAL</span>
                </div>
                <p className={cn("font-mono font-bold text-white", isTvMode ? "text-xl" : "text-3xl")}>
                  {currentTime.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </p>
                <span className={cn("text-slate-500", isTvMode ? "text-[10px]" : "text-xs")}>
                  Atualizado em {currentTime.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className={cn("overflow-x-auto", isTvMode && "overflow-y-auto flex-1 min-h-0")}>
        <table className="w-full">
          <thead className="sticky top-0 z-10">
            <tr className="bg-slate-800 text-slate-400 uppercase tracking-wider border-b border-slate-700/50 text-xs">
              <th className={cn("px-4 py-3 text-left font-semibold", isTvMode && "px-3 py-2")}>
                <div className="flex items-center gap-2">
                  <span className="w-1 h-4 bg-blue-500 rounded-full" />
                  ID
                </div>
              </th>
              <th className={cn("px-4 py-3 text-center font-semibold", isTvMode && "px-3 py-2")}>
                <div className="flex items-center justify-center gap-2">
                  <Clock className="h-4 w-4" />
                  Data
                </div>
              </th>
              <th className={cn("px-4 py-3 text-left font-semibold", isTvMode && "px-3 py-2")}>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Cliente
                </div>
              </th>
              <th className={cn("px-4 py-3 text-left font-semibold", isTvMode && "px-3 py-2")}>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Despachante
                </div>
              </th>
              <th className={cn("px-4 py-3 text-center font-semibold", isTvMode && "px-3 py-2")}>
                <div className="flex items-center justify-center gap-2">
                  <FileText className="h-4 w-4" />
                  Lote
                </div>
              </th>
              <th className={cn("px-4 py-3 text-center font-semibold", isTvMode && "px-3 py-2")}>Documento</th>
              <th className={cn("px-4 py-3 text-center font-semibold", isTvMode && "px-3 py-2")}>Conhecimento</th>
              <th className={cn("px-4 py-3 text-center font-semibold", isTvMode && "px-3 py-2")}>
                <div className="flex items-center justify-center gap-2">
                  <Truck className="h-4 w-4" />
                  Modalidade
                </div>
              </th>
              <th className={cn("px-4 py-3 text-left font-semibold", isTvMode && "px-3 py-2")}>Usuario</th>
            </tr>
          </thead>
          <tbody>
            {sortedItems.map((row, index) => {
              const k = toKey(row.modalidade);
              const mod = modalidadeConfig[k];

              return (
                <tr
                  key={`${row.conferenciaId}-${row.nLote ?? "x"}-${row.nDocumento ?? "x"}-${row.nConhecimento ?? "x"}`}
                  className={cn(
                    "transition-all duration-300 border-b border-slate-800/50",
                    index % 2 === 0 ? "bg-slate-900/50" : "bg-slate-900/30",
                    "hover:bg-slate-800/50",
                  )}
                >
                  <td className={cn("px-4 py-3", isTvMode && "px-3 py-2")}>
                    <span className="font-mono font-bold text-white text-base">
                      {row.conferenciaId}
                    </span>
                  </td>

                  <td className={cn("px-4 py-3 text-center", isTvMode && "px-3 py-2")}>
                    <div className="flex flex-col items-center">
                      <span className="font-mono font-bold text-emerald-400 text-base">
                        {formatTime(row.dtConferencia)}
                      </span>
                      {!isTvMode && (
                        <span className="text-slate-500 text-xs">
                          {formatDate(row.dtConferencia)}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className={cn("px-4 py-3 max-w-[240px]", isTvMode && "px-3 py-2 max-w-[240px]")}>
                    <span className="truncate block text-sm text-white">
                      {row.cliente ?? "-"}
                    </span>
                  </td>

                  <td className={cn("px-4 py-3 max-w-[220px]", isTvMode && "px-3 py-2 max-w-[200px]")}>
                    <span className="truncate block text-sm text-slate-300">
                      {row.despachante ?? "-"}
                    </span>
                  </td>

                  <td className={cn("px-4 py-3 text-center", isTvMode && "px-3 py-2")}>
                    <span
                      className={cn(
                        "inline-block font-mono font-bold rounded-lg px-2 py-1",
                        "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300",
                        "border border-cyan-500/30 text-sm",
                      )}
                    >
                      {row.nLote ?? "-"}
                    </span>
                  </td>

                  <td className={cn("px-4 py-3 text-center", isTvMode && "px-3 py-2")}>
                    <span
                      className={cn(
                        "inline-block font-mono rounded-lg px-2 py-1",
                        "bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-300",
                        "border border-purple-500/30 text-sm",
                      )}
                    >
                      {row.nDocumento ?? "-"}
                    </span>
                  </td>

                  <td className={cn("px-4 py-3 text-center", isTvMode && "px-3 py-2")}>
                    <span
                      className={cn(
                        "inline-block font-mono rounded-lg px-2 py-1",
                        "bg-gradient-to-r from-purple-500/10 to-indigo-500/10 text-slate-200",
                        "border border-slate-600/50 text-sm",
                      )}
                    >
                      {row.nConhecimento ?? "-"}
                    </span>
                  </td>

                  <td className={cn("px-4 py-3 text-center", isTvMode && "px-3 py-2")}>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 font-bold rounded-full border text-xs px-3 py-1",
                        mod.color,
                        mod.bgColor,
                      )}
                    >
                      <span className={cn("w-1.5 h-1.5 rounded-full", mod.dotColor)} />
                      {mod.label}
                    </span>
                  </td>

                  <td className={cn("px-4 py-3 max-w-[220px]", isTvMode && "px-3 py-2 max-w-[200px]")}>
                    <span className="truncate block text-sm text-slate-300">
                      {row.usuarioCadastro ?? row.cadUser ?? "-"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Empty / Loading State */}
        {sortedItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            {isLoading ? (
              <Loader2 className="h-20 w-20 mb-6 opacity-30 animate-spin" />
            ) : (
              <Package className="h-20 w-20 mb-6 opacity-30" />
            )}
            <p className="text-xl font-medium">
              {isLoading ? "Carregando conferencias..." : "Nenhuma conferencia encontrada"}
            </p>
            {!isLoading && (
              <p className="text-sm text-slate-600 mt-2">NÃ£o hÃ¡ conferencias em aberto no momento</p>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={cn("bg-slate-800/50 px-8 py-4 border-t border-slate-700/50 shrink-0", isTvMode && "px-4 py-2")}>
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-2 text-slate-400">
            <ClipboardList className="h-4 w-4" />
            <span className="text-sm">Total de registros:</span>
            <span className={cn("font-bold text-white", isTvMode ? "text-sm" : "text-base")}>
              {items.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
