'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, History, RotateCcw } from 'lucide-react';
import { FlightHistoryRecord, FlightHistoryType } from '@/types/ccte';

interface FlightHistoryPanelProps {
  history: FlightHistoryRecord[];
}

export function FlightHistoryPanel({ history }: FlightHistoryPanelProps) {
  const [expanded, setExpanded] = useState(false);

  if (!history || history.length === 0) return null;

  return (
    <div className="border rounded-lg bg-slate-50 border-slate-200 overflow-hidden">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 h-auto text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 rounded-none"
      >
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-medium">
            Histórico de Alterações / Justificativas ({history.length})
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>

      {expanded && (
        <div className="border-t border-slate-200 px-4 py-3 space-y-3">
          {history.map((record) => {
            const date = new Date(record.createdAt);
            const dateStr = date.toLocaleDateString('pt-BR');
            const timeStr = date.toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={record.id}
                className="flex gap-3 p-3 bg-white rounded-md border border-slate-100"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {record.type === FlightHistoryType.REVERT ? (
                    <RotateCcw className="h-4 w-4 text-amber-600" />
                  ) : (
                    <History className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-muted-foreground">
                      {dateStr} as {timeStr}
                    </span>
                    {record.type === FlightHistoryType.REVERT && (
                      <Badge
                        variant="outline"
                        className="text-amber-700 border-amber-300 bg-amber-50"
                      >
                        REVERTIDO
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-foreground">{record.changes}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    <span className="font-medium">Justificativa:</span>{' '}
                    {record.reason}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
