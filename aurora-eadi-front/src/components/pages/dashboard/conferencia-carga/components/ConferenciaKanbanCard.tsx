"use client";

import { Card } from "@/components/ui/card";
import { ConferenciaCargaItem } from "@/types";
import { cn } from "@/lib/utils";
import { Building2, Clock, FileText, Package, User } from "lucide-react";

interface ConferenciaKanbanCardProps {
  item: ConferenciaCargaItem;
  isTvMode?: boolean;
}

type AgeClassification = "normal" | "alert" | "critical";

function getAgeClassification(dtConferencia: string | null): AgeClassification {
  if (!dtConferencia) return "normal";
  const date = new Date(dtConferencia.replace("Z", ""));
  const diffMs = Date.now() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  if (diffHours > 72) return "critical";
  if (diffHours > 24) return "alert";
  return "normal";
}

const ageStyles: Record<
  AgeClassification,
  { text: string; bg: string; badge: string }
> = {
  normal: {
    text: "text-gray-900",
    bg: "bg-gray-100",
    badge: "bg-green-100 text-green-700",
  },
  alert: {
    text: "text-yellow-600",
    bg: "bg-yellow-50",
    badge: "bg-yellow-100 text-yellow-700",
  },
  critical: {
    text: "text-red-600",
    bg: "bg-red-50",
    badge: "bg-red-100 text-red-700",
  },
};

function formatDateTime(dt: string | null) {
  if (!dt) return "-";
  const date = new Date(dt.replace("Z", ""));
  if (Number.isNaN(date.getTime())) return dt;
  return date.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function ConferenciaKanbanCard({ item, isTvMode = false }: ConferenciaKanbanCardProps) {
  const ageClass = getAgeClassification(item.dtConferencia);
  const styles = ageStyles[ageClass];

  return (
    <Card
      className={cn(
        "p-3 transition-all duration-200 hover:shadow-md border-l-4 border-l-blue-500",
        ageClass === "critical" && "bg-red-50/50",
        ageClass === "alert" && "bg-yellow-50/50",
        isTvMode && "p-4",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className={cn("font-bold", styles.text, isTvMode ? "text-lg" : "text-sm")}>
          {item.conferenciaId}
        </span>
        <span
          className={cn(
            "px-2 py-0.5 rounded text-white text-[10px] font-medium",
            "bg-blue-500",
            isTvMode && "text-xs px-2.5 py-1",
          )}
        >
          {item.modalidade ?? "N/A"}
        </span>
      </div>

      {/* Cliente */}
      <div className="flex items-center gap-2 mb-2">
        <Building2 className={cn("h-3.5 w-3.5 text-gray-400", isTvMode && "h-4 w-4")} />
        <span
          className={cn(
            "truncate",
            ageClass === "normal" ? "text-gray-700" : styles.text,
            isTvMode ? "text-sm" : "text-xs",
          )}
        >
          {item.cliente ?? "-"}
        </span>
      </div>

      {/* Despachante */}
      <div className="flex items-center gap-2 mb-2">
        <User className={cn("h-3.5 w-3.5 text-gray-400", isTvMode && "h-4 w-4")} />
        <span
          className={cn(
            "truncate",
            ageClass === "normal" ? "text-gray-600" : styles.text,
            isTvMode ? "text-sm" : "text-xs",
          )}
        >
          {item.despachante ?? "-"}
        </span>
      </div>

      {/* Documento */}
      <div className="flex items-center gap-2 mb-2">
        <FileText className={cn("h-3.5 w-3.5 text-gray-400", isTvMode && "h-4 w-4")} />
        <span
          className={cn(
            "font-mono",
            ageClass === "normal" ? "text-gray-600" : styles.text,
            isTvMode ? "text-base" : "text-xs",
          )}
        >
          {item.nDocumento ?? item.nConhecimento ?? item.nLote ?? "-"}
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex items-center gap-1.5">
          <Package className={cn("h-3.5 w-3.5 text-gray-400", isTvMode && "h-4 w-4")} />
          <span className={cn("font-mono text-gray-600", isTvMode ? "text-sm" : "text-[11px]")}>
            {item.nLote ?? "-"}
          </span>
        </div>
        <div
          className={cn(
            "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold",
            styles.badge,
            isTvMode && "text-xs px-2.5 py-1",
          )}
          title={item.dtConferencia ?? undefined}
        >
          <Clock className={cn("h-3 w-3", isTvMode && "h-3.5 w-3.5")} />
          {formatDateTime(item.dtConferencia)}
        </div>
      </div>
    </Card>
  );
}

