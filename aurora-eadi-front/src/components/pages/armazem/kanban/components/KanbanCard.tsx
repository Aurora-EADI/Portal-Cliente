"use client";

import { Draggable } from "@hello-pangea/dnd";
import { ContainerCard, ContainerType } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/Badge";
import {
  Package,
  Ship,
  MapPin,
  Calendar,
  Weight,
  FileText,
  Building2,
  Globe,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface KanbanCardProps {
  container: ContainerCard;
  index: number;
  isTvMode?: boolean;
}

const priorityConfig = {
  low: { label: "Baixa", variant: "secondary" as const, className: "bg-slate-100 text-slate-700" },
  medium: { label: "Media", variant: "warning" as const, className: "bg-yellow-100 text-yellow-700" },
  high: { label: "Alta", variant: "destructive" as const, className: "bg-orange-100 text-orange-700" },
  urgent: { label: "Urgente", variant: "destructive" as const, className: "bg-red-100 text-red-700 animate-pulse" }
};

const containerTypeColor: Record<ContainerType, string> = {
  [ContainerType.DRY_20]: "bg-blue-50 text-blue-700 border-blue-200",
  [ContainerType.DRY_40]: "bg-blue-50 text-blue-700 border-blue-200",
  [ContainerType.DRY_40HC]: "bg-indigo-50 text-indigo-700 border-indigo-200",
  [ContainerType.REEFER_20]: "bg-cyan-50 text-cyan-700 border-cyan-200",
  [ContainerType.REEFER_40]: "bg-cyan-50 text-cyan-700 border-cyan-200",
  [ContainerType.OPEN_TOP_20]: "bg-amber-50 text-amber-700 border-amber-200",
  [ContainerType.OPEN_TOP_40]: "bg-amber-50 text-amber-700 border-amber-200",
  [ContainerType.FLAT_RACK_20]: "bg-purple-50 text-purple-700 border-purple-200",
  [ContainerType.FLAT_RACK_40]: "bg-purple-50 text-purple-700 border-purple-200",
  [ContainerType.TANK]: "bg-rose-50 text-rose-700 border-rose-200"
};

export function KanbanCard({ container, index, isTvMode = false }: KanbanCardProps) {
  const priority = priorityConfig[container.priority];
  const typeColor = containerTypeColor[container.containerType];

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("pt-BR");
  };

  const formatWeight = (weight: number) => {
    return new Intl.NumberFormat("pt-BR").format(weight) + " kg";
  };

  return (
    <Draggable draggableId={container.id} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={cn(
            "p-3 mb-3 cursor-grab active:cursor-grabbing transition-all duration-200",
            "hover:shadow-lg hover:scale-[1.02] border-l-4",
            snapshot.isDragging && "shadow-2xl rotate-2 scale-105",
            container.priority === "urgent" && "border-l-red-500",
            container.priority === "high" && "border-l-orange-500",
            container.priority === "medium" && "border-l-yellow-500",
            container.priority === "low" && "border-l-slate-300",
            isTvMode && "p-4"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Package className={cn("h-4 w-4 text-gray-500", isTvMode && "h-5 w-5")} />
              <span className={cn(
                "font-bold text-gray-900",
                isTvMode ? "text-lg" : "text-sm"
              )}>
                {container.containerNumber}
              </span>
            </div>
            <Badge className={cn("text-xs", priority.className)}>
              {container.priority === "urgent" && (
                <AlertCircle className="h-3 w-3 mr-1" />
              )}
              {priority.label}
            </Badge>
          </div>

          {/* Container Type Badge */}
          <div className="mb-3">
            <span className={cn(
              "inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border",
              typeColor,
              isTvMode && "text-sm px-3 py-1.5"
            )}>
              {container.containerType}
            </span>
          </div>

          {/* Info Grid */}
          <div className={cn(
            "grid grid-cols-2 gap-2 text-xs",
            isTvMode && "text-sm gap-3"
          )}>
            {/* Cliente */}
            <div className="col-span-2 flex items-start gap-2 bg-gray-50 p-2 rounded">
              <Building2 className={cn("h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0", isTvMode && "h-4 w-4")} />
              <div className="min-w-0">
                <p className="text-gray-500 text-[10px] uppercase tracking-wide">Cliente</p>
                <p className="font-medium text-gray-900 truncate">{container.client}</p>
              </div>
            </div>

            {/* Navio */}
            <div className="flex items-start gap-2">
              <Ship className={cn("h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0", isTvMode && "h-4 w-4")} />
              <div className="min-w-0">
                <p className="text-gray-500 text-[10px] uppercase tracking-wide">Navio</p>
                <p className="font-medium text-gray-700 truncate text-[11px]">{container.vessel}</p>
              </div>
            </div>

            {/* Origem */}
            <div className="flex items-start gap-2">
              <Globe className={cn("h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0", isTvMode && "h-4 w-4")} />
              <div className="min-w-0">
                <p className="text-gray-500 text-[10px] uppercase tracking-wide">Origem</p>
                <p className="font-medium text-gray-700 truncate text-[11px]">{container.origin}</p>
              </div>
            </div>

            {/* Data Chegada */}
            <div className="flex items-start gap-2">
              <Calendar className={cn("h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0", isTvMode && "h-4 w-4")} />
              <div>
                <p className="text-gray-500 text-[10px] uppercase tracking-wide">Chegada</p>
                <p className="font-medium text-gray-700 text-[11px]">{formatDate(container.arrivalDate)}</p>
              </div>
            </div>

            {/* Peso */}
            <div className="flex items-start gap-2">
              <Weight className={cn("h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0", isTvMode && "h-4 w-4")} />
              <div>
                <p className="text-gray-500 text-[10px] uppercase tracking-wide">Peso</p>
                <p className="font-medium text-gray-700 text-[11px]">{formatWeight(container.grossWeight)}</p>
              </div>
            </div>

            {/* DI */}
            <div className="flex items-start gap-2">
              <FileText className={cn("h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0", isTvMode && "h-4 w-4")} />
              <div>
                <p className="text-gray-500 text-[10px] uppercase tracking-wide">DI</p>
                <p className="font-medium text-gray-700 text-[11px]">{container.diNumber}</p>
              </div>
            </div>

            {/* Local */}
            <div className="flex items-start gap-2">
              <MapPin className={cn("h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0", isTvMode && "h-4 w-4")} />
              <div className="min-w-0">
                <p className="text-gray-500 text-[10px] uppercase tracking-wide">Local</p>
                <p className="font-medium text-gray-700 truncate text-[11px]">{container.location}</p>
              </div>
            </div>
          </div>

          {/* BL Number Footer */}
          <div className={cn(
            "mt-3 pt-2 border-t border-gray-100 flex items-center justify-between",
            isTvMode && "mt-4 pt-3"
          )}>
            <span className="text-[10px] text-gray-400 uppercase">BL</span>
            <span className={cn(
              "text-xs font-mono text-gray-600",
              isTvMode && "text-sm"
            )}>
              {container.bl}
            </span>
          </div>
        </Card>
      )}
    </Draggable>
  );
}
