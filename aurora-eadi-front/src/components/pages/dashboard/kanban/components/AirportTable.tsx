"use client";

import { ContainerCard, ContainerStatus, getTimeClassification, TimeClassification } from "@/types";
import { cn } from "@/lib/utils";
import {
  Package,
  Clock,
  TrendingUp,
  TrendingDown,
  Circle,
  Truck,
  Building2,
  Timer,
  User,
  FileText
} from "lucide-react";
import { useEffect, useState } from "react";

interface AirportTableProps {
  containers: ContainerCard[];
  isTvMode?: boolean;
}

const statusConfig: Record<ContainerStatus, { label: string; color: string; bgColor: string; dotColor: string }> = {
  [ContainerStatus.FULL]: {
    label: "CHEIO",
    color: "text-sky-300",
    bgColor: "bg-sky-500/20 border-sky-500/30",
    dotColor: "bg-sky-400"
  },
  [ContainerStatus.IN_PROCESS]: {
    label: "PROCESSANDO",
    color: "text-amber-300",
    bgColor: "bg-amber-500/20 border-amber-500/30",
    dotColor: "bg-amber-400"
  },
  [ContainerStatus.EMPTY]: {
    label: "LIBERADO",
    color: "text-emerald-300",
    bgColor: "bg-emerald-500/20 border-emerald-500/30",
    dotColor: "bg-emerald-400"
  },
};

// Cores para classificação por tempo (fundo escuro)
const timeClassificationColors: Record<TimeClassification, string> = {
  normal: "text-white",
  alert: "text-yellow-400",
  critical: "text-red-400"
};

const timeClassificationBadge: Record<TimeClassification, string> = {
  normal: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  alert: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  critical: "bg-red-500/20 text-red-400 border-red-500/30 animate-pulse"
};

// Formata minutos para exibição
const formatMinutes = (minutes: number | null): string => {
  if (minutes === null) return "-";
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
};

export function AirportTable({ containers, isTvMode = false }: AirportTableProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "--:--";
    const date = new Date(dateStr);
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "--/--";
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit"
    });
  };

  // Ordena por tempo (críticos primeiro, depois alerta, depois normal)
  const sortedContainers = [...containers].sort((a, b) => {
    const classOrder: Record<TimeClassification, number> = { critical: 0, alert: 1, normal: 2 };
    const classA = getTimeClassification(a.tempoMinutos);
    const classB = getTimeClassification(b.tempoMinutos);
    if (classOrder[classA] !== classOrder[classB]) {
      return classOrder[classA] - classOrder[classB];
    }
    return new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime();
  });

  // Contagens
  const counts = {
    [ContainerStatus.FULL]: containers.filter(c => c.status === ContainerStatus.FULL).length,
    [ContainerStatus.IN_PROCESS]: containers.filter(c => c.status === ContainerStatus.IN_PROCESS).length,
    [ContainerStatus.EMPTY]: containers.filter(c => c.status === ContainerStatus.EMPTY).length,
  };

  return (
    <div className={cn(
      "bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50 flex flex-col",
      isTvMode && "h-screen rounded-none border-0"
    )}>
      {/* Header */}
      <div className="relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-blue-600/20" />
        <div className={cn(
          "relative px-8 py-6 border-b border-slate-700/50",
          isTvMode && "px-4 py-3"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                "p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/25",
                isTvMode && "p-2"
              )}>
                <Package className={cn("text-white", isTvMode ? "h-6 w-6" : "h-7 w-7")} />
              </div>
              <div>
                <h2 className={cn(
                  "font-bold text-white tracking-wide",
                  isTvMode ? "text-xl" : "text-2xl"
                )}>
                  PAINEL DE CONTAINERS
                </h2>
                <p className={cn(
                  "text-slate-400",
                  isTvMode ? "text-sm" : "text-sm"
                )}>
                  Monitoramento em tempo real
                </p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="flex items-center gap-3">
              {Object.entries(statusConfig).map(([key, config]) => (
                <div
                  key={key}
                  className={cn(
                    "px-4 py-2 rounded-xl border backdrop-blur-sm",
                    "h-20 w-48 flex flex-col justify-between",
                    config.bgColor,
                    isTvMode && "px-3 py-2 h-14 w-36"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Circle className={cn("h-2 w-2 fill-current", config.color)} />
                    <span className={cn("text-slate-400", isTvMode ? "text-xs" : "text-xs")}>
                      {config.label}
                    </span>
                  </div>

                  <p className={cn("font-bold", config.color, isTvMode ? "text-xl" : "text-2xl")}>
                    {counts[key as ContainerStatus]}
                  </p>
                </div>
              ))}

              {/* Clock */}
              <div className={cn(
                "flex flex-col items-end ml-4 pl-4 border-l border-slate-700",
                isTvMode && "ml-2 pl-2"
              )}>
                <div className="flex items-center gap-2 text-slate-500">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs">HORA ATUAL</span>
                </div>
                <p className={cn(
                  "font-mono font-bold text-white",
                  isTvMode ? "text-2xl" : "text-3xl"
                )}>
                  {currentTime.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </p>
                <span className="text-slate-500 text-xs">
                  Atualizado em {currentTime.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div
        className={cn(
          "overflow-x-auto",
          isTvMode && "overflow-y-auto flex-1 min-h-0"
        )}
      >
        <table className="w-full">
          <thead className="sticky top-0 z-10">
            <tr className={cn(
              "bg-slate-800 text-slate-400 uppercase tracking-wider border-b border-slate-700/50",
              isTvMode ? "text-sm" : "text-xs"
            )}>
              <th className={cn("px-4 py-3 text-left font-semibold", isTvMode && "px-3 py-2")}>
                <div className="flex items-center gap-2">
                  <span className="w-1 h-4 bg-blue-500 rounded-full" />
                  Entrada
                </div>
              </th>
              <th className={cn("px-4 py-3 text-left font-semibold", isTvMode && "px-3 py-2")}>Container</th>
              <th className={cn("px-4 py-3 text-left font-semibold", isTvMode && "px-3 py-2")}>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Empresa
                </div>
              </th>
              <th className={cn("px-4 py-3 text-left font-semibold", isTvMode && "px-3 py-2")}>
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Transportadora
                </div>
              </th>
              <th className={cn("px-4 py-3 text-left font-semibold", isTvMode && "px-3 py-2")}>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Motorista
                </div>
              </th>
              <th className={cn("px-4 py-3 text-center font-semibold", isTvMode && "px-3 py-2")}>Placa</th>
              <th className={cn("px-4 py-3 text-center font-semibold", isTvMode && "px-3 py-2")}>
                <div className="flex items-center justify-center gap-2">
                  <FileText className="h-4 w-4" />
                  Documento
                </div>
              </th>
              <th className={cn("px-4 py-3 text-center font-semibold", isTvMode && "px-3 py-2")}>
                <div className="flex items-center justify-center gap-2">
                  <TrendingDown className="h-4 w-4 text-emerald-500" />
                  Entrada
                </div>
              </th>
              <th className={cn("px-4 py-3 text-center font-semibold", isTvMode && "px-3 py-2")}>
                <div className="flex items-center justify-center gap-2">
                  <TrendingUp className="h-4 w-4 text-rose-500" />
                  Saida
                </div>
              </th>
              <th className={cn("px-4 py-3 text-center font-semibold", isTvMode && "px-3 py-2")}>
                <div className="flex items-center justify-center gap-2">
                  <Timer className="h-4 w-4" />
                  Tempo
                </div>
              </th>
              <th className={cn("px-4 py-3 text-center font-semibold", isTvMode && "px-3 py-2")}>Status</th>
            </tr>
          </thead>
          <tbody>
            {sortedContainers.map((container, index) => {
              const status = statusConfig[container.status];
              const timeClass = getTimeClassification(container.tempoMinutos);
              const textColor = timeClassificationColors[timeClass];
              const badgeStyle = timeClassificationBadge[timeClass];

              return (
                <tr
                  key={container.id}
                  className={cn(
                    "transition-all duration-300 border-b border-slate-800/50",
                    index % 2 === 0 ? "bg-slate-900/50" : "bg-slate-900/30",
                    "hover:bg-slate-800/50",
                    timeClass === "critical" && "bg-red-950/20",
                    timeClass === "alert" && "bg-yellow-950/20"
                  )}
                >
                  {/* Entrada */}
                  <td className={cn("px-4 py-3", isTvMode && "px-3 py-2")}>
                    <span className={cn(
                      "font-mono font-bold",
                      textColor,
                      isTvMode ? "text-base" : "text-base"
                    )}>
                      {container.entryNumber}
                    </span>
                  </td>

                  {/* Container */}
                  <td className={cn("px-4 py-3", isTvMode && "px-3 py-2")}>
                    <div>
                      <span className={cn(
                        "font-mono font-bold block",
                        textColor,
                        isTvMode ? "text-base" : "text-base"
                      )}>
                        {container.containerNumber}
                      </span>
                      <span className={cn(
                        "text-slate-500",
                        isTvMode ? "text-xs" : "text-xs"
                      )}>
                        {container.containerType}
                      </span>
                    </div>
                  </td>

                  {/* Empresa */}
                  <td className={cn("px-4 py-3 max-w-[200px]", isTvMode && "px-3 py-2 max-w-[220px]")}>
                    <span className={cn(
                      "truncate block",
                      textColor,
                      isTvMode ? "text-sm" : "text-sm"
                    )}>
                      {container.company}
                    </span>
                  </td>

                  {/* Transportadora */}
                  <td className={cn("px-4 py-3 max-w-[180px]", isTvMode && "px-3 py-2 max-w-[180px]")}>
                    <span className={cn(
                      "truncate block",
                      timeClass === "normal" ? "text-slate-400" : textColor,
                      isTvMode ? "text-sm" : "text-sm"
                    )}>
                      {container.carrier}
                    </span>
                  </td>

                  {/* Motorista */}
                  <td className={cn("px-4 py-3 max-w-[150px]", isTvMode && "px-3 py-2 max-w-[150px]")}>
                    <span className={cn(
                      "truncate block",
                      timeClass === "normal" ? "text-slate-400" : textColor,
                      isTvMode ? "text-sm" : "text-sm"
                    )}>
                      {container.motorista}
                    </span>
                  </td>

                  {/* Placa */}
                  <td className={cn("px-4 py-3 text-center", isTvMode && "px-3 py-2")}>
                    <span className={cn(
                      "inline-block font-mono font-bold px-2 py-1 rounded-lg",
                      "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300",
                      "border border-cyan-500/30",
                      isTvMode ? "text-sm" : "text-sm"
                    )}>
                      {container.licensePlate}
                    </span>
                  </td>

                  {/* Documento/Abreviatura */}
                  <td className={cn("px-4 py-3 text-center", isTvMode && "px-3 py-2")}>
                    <span className={cn(
                      "inline-block font-mono px-2 py-1 rounded-lg",
                      "bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-300",
                      "border border-purple-500/30",
                      isTvMode ? "text-sm" : "text-sm"
                    )}>
                      {container.abreviatura}
                    </span>
                  </td>

                  {/* Hora Entrada */}
                  <td className={cn("px-4 py-3 text-center", isTvMode && "px-3 py-2")}>
                    <div className="flex flex-col items-center">
                      <span className={cn(
                        "font-mono font-bold text-emerald-400",
                        isTvMode ? "text-base" : "text-base"
                      )}>
                        {formatTime(container.entryDate)}
                      </span>
                      <span className={cn(
                        "text-slate-500",
                        isTvMode ? "text-xs" : "text-xs"
                      )}>
                        {formatDate(container.entryDate)}
                      </span>
                    </div>
                  </td>

                  {/* Hora Saida */}
                  <td className={cn("px-4 py-3 text-center", isTvMode && "px-3 py-2")}>
                    <div className="flex flex-col items-center">
                      <span className={cn(
                        "font-mono font-bold",
                        container.exitDate ? "text-rose-400" : "text-slate-600",
                        isTvMode ? "text-base" : "text-base"
                      )}>
                        {formatTime(container.exitDate)}
                      </span>
                      <span className={cn(
                        "text-slate-500",
                        isTvMode ? "text-xs" : "text-xs"
                      )}>
                        {formatDate(container.exitDate)}
                      </span>
                    </div>
                  </td>

                  {/* Tempo */}
                  <td className={cn("px-4 py-3 text-center", isTvMode && "px-3 py-2")}>
                    <span className={cn(
                      "inline-flex items-center gap-1 font-mono font-bold px-2 py-1 rounded-lg border",
                      badgeStyle,
                      isTvMode ? "text-sm" : "text-sm"
                    )}>
                      <Timer className={cn("h-3 w-3", isTvMode && "h-3.5 w-3.5")} />
                      {formatMinutes(container.tempoMinutos)}
                    </span>
                  </td>

                  {/* Status */}
                  <td className={cn("px-4 py-3 text-center", isTvMode && "px-3 py-2")}>
                    <span className={cn(
                      "inline-flex items-center gap-1.5 font-bold px-3 py-1 rounded-full border",
                      status.color,
                      status.bgColor,
                      isTvMode ? "text-xs" : "text-xs"
                    )}>
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        status.dotColor,
                        container.status === ContainerStatus.IN_PROCESS && "animate-pulse"
                      )} />
                      {status.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Empty State */}
        {sortedContainers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Package className="h-20 w-20 mb-6 opacity-30" />
            <p className="text-xl font-medium">Nenhum container encontrado</p>
            <p className="text-sm text-slate-600 mt-2">Ajuste os filtros para visualizar os dados</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={cn(
        "bg-slate-800/50 px-8 py-4 border-t border-slate-700/50 shrink-0",
        isTvMode && "px-4 py-2"
      )}>
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-2 text-slate-400">
            <Package className="h-4 w-4" />
            <span className="text-sm">
              Total de registros:
            </span>
            <span className="font-bold text-white text-base">
              {containers.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
