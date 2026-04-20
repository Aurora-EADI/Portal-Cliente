"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ClipboardList } from "lucide-react";
import { ConferenciaCargaItem } from "@/types";
import { ConferenciaKanbanCard } from "./ConferenciaKanbanCard";

export interface ConferenciaKanbanColumnType {
  id: string;
  title: string;
  color: string;
  items: ConferenciaCargaItem[];
}

interface ConferenciaKanbanColumnProps {
  column: ConferenciaKanbanColumnType;
  isTvMode?: boolean;
}

export function ConferenciaKanbanColumn({ column, isTvMode = false }: ConferenciaKanbanColumnProps) {
  return (
    <div className={cn("flex flex-col bg-gray-50 rounded-xl w-full flex-1", isTvMode && "min-w-[300px]")}>
      <div className={cn("p-4 rounded-t-xl", column.color)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <ClipboardList className={cn("h-5 w-5 text-white", isTvMode && "h-6 w-6")} />
            </div>
            <div>
              <h3 className={cn("font-bold text-white", isTvMode ? "text-xl" : "text-lg")}>
                {column.title}
              </h3>
              <p className={cn("text-white/80", isTvMode ? "text-base" : "text-sm")}>
                {column.items.length} {column.items.length === 1 ? "registro" : "registros"}
              </p>
            </div>
          </div>
          <div
            className={cn(
              "flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm font-bold text-white",
              isTvMode ? "w-12 h-12 text-xl" : "w-10 h-10 text-lg",
            )}
          >
            {column.items.length}
          </div>
        </div>
      </div>

      <div className={cn("flex-1 p-3 rounded-b-xl", isTvMode && "p-4")}>
        <ScrollArea className={cn("pr-2", isTvMode ? "h-[calc(100vh-280px)]" : "h-[calc(100vh-350px)]")}>
          <div className="space-y-3">
            {column.items.map((item) => (
              <ConferenciaKanbanCard
                key={`${item.conferenciaId}-${item.nLote ?? "x"}-${item.nDocumento ?? "x"}-${item.nConhecimento ?? "x"}`}
                item={item}
                isTvMode={isTvMode}
              />
            ))}

            {column.items.length === 0 && (
              <div className={cn("flex flex-col items-center justify-center py-12 text-gray-400", isTvMode && "py-16")}>
                <ClipboardList className={cn("h-12 w-12 mb-3 opacity-50", isTvMode && "h-16 w-16 mb-4")} />
                <p className={cn("text-sm", isTvMode && "text-base")}>Nenhum registro</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
