'use client';

import { Droppable } from '@hello-pangea/dnd';
import { LucideIcon, Inbox } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  id: string;
  title: string;
  /** Classe de cor Tailwind para o header (ex: 'bg-amber-500') */
  colorClass: string;
  icon: LucideIcon;
  count: number;
  isLoading?: boolean;
  children: React.ReactNode;
}

export function KanbanColumn({
  id,
  title,
  colorClass,
  icon: Icon,
  count,
  isLoading = false,
  children,
}: KanbanColumnProps) {
  return (
    <div className="flex flex-col bg-slate-50 rounded-xl w-80 flex-shrink-0">
      {/* Header */}
      <div className={cn('p-4 rounded-t-xl', colorClass)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm leading-tight">{title}</h3>
              <p className="text-white/75 text-xs">
                {count} {count === 1 ? 'proposta' : 'propostas'}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm font-bold text-white text-sm">
            {count}
          </div>
        </div>
      </div>

      {/* Drop Zone */}
      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              'flex-1 rounded-b-xl transition-colors duration-200',
              snapshot.isDraggingOver ? 'bg-slate-100' : 'bg-slate-50',
            )}
          >
            <ScrollArea className="h-[calc(100vh-320px)] px-3 py-3">
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="h-28 bg-slate-200 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : count === 0 && !snapshot.isDraggingOver ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-300">
                  <Inbox className="h-10 w-10 mb-2" />
                  <p className="text-xs">Nenhuma proposta</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {children}
                  {provided.placeholder}
                </div>
              )}
              {/* placeholder fora do condicional para o DnD funcionar corretamente */}
              {count > 0 && provided.placeholder}
            </ScrollArea>
          </div>
        )}
      </Droppable>
    </div>
  );
}
