"use client";

import { KanbanColumn as KanbanColumnType } from "@/types";
import { KanbanCard } from "./KanbanCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Package } from "lucide-react";

interface KanbanColumnProps {
  column: KanbanColumnType;
  isTvMode?: boolean;
}

export function KanbanColumn({ column, isTvMode = false }: KanbanColumnProps) {
  return (
    <div className={cn(
      "flex flex-col bg-gray-50 rounded-xl w-full flex-1",
      isTvMode && "min-w-[300px]"
    )}>
      {/* Column Header */}
      <div className={cn(
        "p-4 rounded-t-xl",
        column.color
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Package className={cn(
                "h-5 w-5 text-white",
                isTvMode && "h-6 w-6"
              )} />
            </div>
            <div>
              <h3 className={cn(
                "font-bold text-white",
                isTvMode ? "text-xl" : "text-lg"
              )}>
                {column.title}
              </h3>
              <p className={cn(
                "text-white/80",
                isTvMode ? "text-base" : "text-sm"
              )}>
                {column.containers.length} {column.containers.length === 1 ? "container" : "containers"}
              </p>
            </div>
          </div>
          <div className={cn(
            "flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm font-bold text-white",
            isTvMode ? "w-12 h-12 text-xl" : "w-10 h-10 text-lg"
          )}>
            {column.containers.length}
          </div>
        </div>
      </div>

      {/* Column Content */}
      <div className={cn(
        "flex-1 p-3 rounded-b-xl",
        isTvMode && "p-4"
      )}>
        <ScrollArea className={cn(
          "pr-2",
          isTvMode ? "h-[calc(100vh-280px)]" : "h-[calc(100vh-350px)]"
        )}>
          <div className="space-y-3">
            {column.containers.map((container) => (
              <KanbanCard
                key={container.id}
                container={container}
                isTvMode={isTvMode}
              />
            ))}

            {column.containers.length === 0 && (
              <div className={cn(
                "flex flex-col items-center justify-center py-12 text-gray-400",
                isTvMode && "py-16"
              )}>
                <Package className={cn(
                  "h-12 w-12 mb-3 opacity-50",
                  isTvMode && "h-16 w-16 mb-4"
                )} />
                <p className={cn(
                  "text-sm",
                  isTvMode && "text-base"
                )}>
                  Nenhum container
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
