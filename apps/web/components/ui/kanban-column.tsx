"use client";

import * as React from "react";
import { GripVertical, Plus, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export interface KanbanCard {
  id: string;
  content: React.ReactNode;
}

export interface KanbanColumnProps {
  id: string;
  title: string;
  cards: KanbanCard[];
  count?: number;
  color?: string;
  onAddCard?: () => void;
  onCardClick?: (cardId: string) => void;
  onCardDragStart?: (cardId: string) => void;
  onCardDragEnd?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, columnId: string) => void;
  draggingCardId?: string | null;
  headerActions?: React.ReactNode;
  className?: string;
}

const KanbanColumn = React.forwardRef<HTMLDivElement, KanbanColumnProps>(
  (
    {
      id,
      title,
      cards,
      count,
      color = "#B49A5E",
      onAddCard,
      onCardClick,
      onCardDragStart,
      onCardDragEnd,
      onDragOver,
      onDrop,
      draggingCardId,
      headerActions,
      className,
    },
    ref
  ) => {
    const displayCount = count ?? cards.length;

    return (
      <div
        ref={ref}
        className={cn(
          "flex w-72 flex-shrink-0 flex-col rounded-lg bg-gray-50/80 border border-gray-300/60",
          className
        )}
        onDragOver={(e) => {
          e.preventDefault();
          onDragOver?.(e);
        }}
        onDrop={(e) => onDrop?.(e, id)}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-300/60">
          <div className="flex items-center gap-2">
            <div
              className="size-3 rounded-full"
              style={{ backgroundColor: color }}
            />
            <h3 className="font-semibold text-navy-900 font-inter">{title}</h3>
            <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
              {displayCount}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {headerActions}
            {onAddCard && (
              <button
                onClick={onAddCard}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
              >
                <Plus className="size-4" />
              </button>
            )}
          </div>
        </div>

        {/* Cards */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {cards.map((card) => (
            <div
              key={card.id}
              draggable={!!onCardDragStart}
              onDragStart={() => onCardDragStart?.(card.id)}
              onDragEnd={onCardDragEnd}
              onClick={() => onCardClick?.(card.id)}
              className={cn(
                "group rounded-lg border border-gray-300/60 bg-white p-3 shadow-[0px_2px_4px_rgba(26,24,22,0.06)] transition-shadow duration-250 ease-out",
                onCardClick && "cursor-pointer hover:shadow-[0px_4px_8px_rgba(26,24,22,0.08)]",
                onCardDragStart && "cursor-grab active:cursor-grabbing",
                draggingCardId === card.id && "opacity-50 border-dashed border-gold-400"
              )}
            >
              {onCardDragStart && (
                <div className="mb-2 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="size-4 text-gray-300" />
                </div>
              )}
              {card.content}
            </div>
          ))}
          {cards.length === 0 && (
            <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-gray-300/60 text-sm text-[#7D796F] font-inter">
              No items
            </div>
          )}
        </div>
      </div>
    );
  }
);
KanbanColumn.displayName = "KanbanColumn";

export { KanbanColumn };
