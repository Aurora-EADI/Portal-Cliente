'use client';

import { DragDropContext, Draggable, DropResult } from '@hello-pangea/dnd';
import { LucideIcon } from 'lucide-react';
import { KanbanColumn } from './KanbanColumn';

export interface KanbanColumnConfig<T> {
  id: string;
  title: string;
  /** Classe de cor Tailwind para o header (ex: 'bg-amber-500') */
  colorClass: string;
  icon: LucideIcon;
  items: T[];
}

export interface KanbanProps<T> {
  columns: KanbanColumnConfig<T>[];
  renderCard: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string;
  isLoading?: boolean;
  /** Chamado quando um card é arrastado para outra coluna */
  onCardMove?: (itemId: string, toColumnId: string) => void;
}

export function Kanban<T>({
  columns,
  renderCard,
  keyExtractor,
  isLoading = false,
  onCardMove,
}: KanbanProps<T>) {
  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    onCardMove?.(draggableId, destination.droppableId);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex justify-center gap-5 overflow-x-auto pb-4">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            colorClass={column.colorClass}
            icon={column.icon}
            count={column.items.length}
            isLoading={isLoading}
          >
            {column.items.map((item, index) => (
              <Draggable
                key={keyExtractor(item)}
                draggableId={keyExtractor(item)}
                index={index}
                isDragDisabled={!onCardMove}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={{
                      ...provided.draggableProps.style,
                      opacity: snapshot.isDragging ? 0.85 : 1,
                    }}
                  >
                    {renderCard(item, index)}
                  </div>
                )}
              </Draggable>
            ))}
          </KanbanColumn>
        ))}
      </div>
    </DragDropContext>
  );
}
