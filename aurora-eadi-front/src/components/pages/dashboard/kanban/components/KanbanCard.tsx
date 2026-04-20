"use client";

import { ContainerCard, ContainerType, getTimeClassification } from "@/types";
import { Card } from "@/components/ui/card";
import {
  Package,
  Clock,
  Building2,
  CarFront,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";

interface KanbanCardProps {
  container: ContainerCard;
  isTvMode?: boolean;
}

const containerTypeColor: Record<ContainerType, string> = {
  [ContainerType.RECEBIMENTO]: "bg-blue-500",
  [ContainerType.RETIRADA]: "bg-amber-500",
  [ContainerType.SERVICOS]: "bg-purple-500"
};

// Cores baseadas na classificação por tempo
const timeClassificationStyles = {
  normal: {
    text: "text-gray-900",
    bg: "bg-gray-100",
    badge: "bg-green-100 text-green-700"
  },
  alert: {
    text: "text-yellow-600",
    bg: "bg-yellow-50",
    badge: "bg-yellow-100 text-yellow-700"
  },
  critical: {
    text: "text-red-600",
    bg: "bg-red-50",
    badge: "bg-red-100 text-red-700"
  }
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

export function KanbanCard({ container, isTvMode = false }: KanbanCardProps) {
  const typeColor = containerTypeColor[container.containerType] || "bg-gray-500";
  const timeClass = getTimeClassification(container.tempoMinutos);
  const styles = timeClassificationStyles[timeClass];

  return (
    <Card
      className={cn(
        "p-3 transition-all duration-200 hover:shadow-md border-l-4",
        typeColor.replace("bg-", "border-l-"),
        timeClass === "critical" && "bg-red-50/50",
        timeClass === "alert" && "bg-yellow-50/50",
        isTvMode && "p-4"
      )}
    >
      {/* Header - Entrada e Tipo */}
      <div className="flex items-center justify-between mb-2">
        <span className={cn(
          "font-bold",
          styles.text,
          isTvMode ? "text-lg" : "text-sm"
        )}>
          {container.entryNumber}
        </span>
        <span className={cn(
          "px-2 py-0.5 rounded text-white text-[10px] font-medium",
          typeColor,
          isTvMode && "text-xs px-2.5 py-1"
        )}>
          {container.containerType}
        </span>
      </div>

      {/* Container Number */}
      <div className="flex items-center gap-2 mb-2">
        <Package className={cn("h-3.5 w-3.5 text-gray-400", isTvMode && "h-4 w-4")} />
        <span className={cn(
          "font-mono",
          timeClass === "normal" ? "text-gray-600" : styles.text,
          isTvMode ? "text-base" : "text-xs"
        )}>
          {container.containerNumber}
        </span>
      </div>

      {/* Empresa */}
      <div className="flex items-center gap-2 mb-2">
        <Building2 className={cn("h-3.5 w-3.5 text-gray-400", isTvMode && "h-4 w-4")} />
        <span className={cn(
          "truncate",
          timeClass === "normal" ? "text-gray-700" : styles.text,
          isTvMode ? "text-sm" : "text-xs"
        )}>
          {container.company}
        </span>
      </div>

      {/* Motorista */}
      <div className="flex items-center gap-2 mb-2">
        <User className={cn("h-3.5 w-3.5 text-gray-400", isTvMode && "h-4 w-4")} />
        <span className={cn(
          "truncate",
          timeClass === "normal" ? "text-gray-600" : styles.text,
          isTvMode ? "text-sm" : "text-xs"
        )}>
          {container.motorista}
        </span>
      </div>

      {/* Footer - Placa e Tempo */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex items-center gap-1.5">
          <CarFront className={cn("h-3.5 w-3.5 text-gray-400", isTvMode && "h-4 w-4")} />
          <span className={cn(
            "font-mono text-gray-600",
            isTvMode ? "text-sm" : "text-[11px]"
          )}>
            {container.licensePlate}
          </span>
        </div>
        <div className={cn(
          "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold",
          styles.badge,
          isTvMode && "text-xs px-2.5 py-1"
        )}>
          <Clock className={cn("h-3 w-3", isTvMode && "h-3.5 w-3.5")} />
          {formatMinutes(container.tempoMinutos)}
        </div>
      </div>
    </Card>
  );
}
