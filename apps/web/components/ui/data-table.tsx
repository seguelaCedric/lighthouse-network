"use client";

import * as React from "react";
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Check,
  Filter,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type SortDirection = "asc" | "desc" | null;

export interface Column<T> {
  id: string;
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  className?: string;
}

export interface DataTableProps<T extends { id: string | number }> {
  columns: Column<T>[];
  data: T[];
  selectable?: boolean;
  selectedIds?: (string | number)[];
  onSelectionChange?: (ids: (string | number)[]) => void;
  sortColumn?: string;
  sortDirection?: SortDirection;
  onSort?: (column: string, direction: SortDirection) => void;
  currentPage?: number;
  pageSize?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  className?: string;
}

function DataTable<T extends { id: string | number }>({
  columns,
  data,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  sortColumn,
  sortDirection,
  onSort,
  currentPage = 1,
  pageSize = 10,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  loading = false,
  emptyMessage = "No data available",
  onRowClick,
  className,
}: DataTableProps<T>) {
  const totalPages = totalItems ? Math.ceil(totalItems / pageSize) : 1;
  const allSelected = data.length > 0 && data.every((row) => selectedIds.includes(row.id));
  const someSelected = data.some((row) => selectedIds.includes(row.id)) && !allSelected;

  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    if (allSelected) {
      onSelectionChange(selectedIds.filter((id) => !data.some((row) => row.id === id)));
    } else {
      const newIds = [...new Set([...selectedIds, ...data.map((row) => row.id)])];
      onSelectionChange(newIds);
    }
  };

  const handleSelectRow = (rowId: string | number) => {
    if (!onSelectionChange) return;
    if (selectedIds.includes(rowId)) {
      onSelectionChange(selectedIds.filter((id) => id !== rowId));
    } else {
      onSelectionChange([...selectedIds, rowId]);
    }
  };

  const handleSort = (columnId: string) => {
    if (!onSort) return;
    let newDirection: SortDirection = "asc";
    if (sortColumn === columnId) {
      if (sortDirection === "asc") newDirection = "desc";
      else if (sortDirection === "desc") newDirection = null;
    }
    onSort(columnId, newDirection);
  };

  const getCellValue = (row: T, column: Column<T>): React.ReactNode => {
    if (typeof column.accessor === "function") {
      return column.accessor(row);
    }
    return row[column.accessor] as React.ReactNode;
  };

  const SortIcon = ({ columnId }: { columnId: string }) => {
    if (sortColumn !== columnId) {
      return <ChevronsUpDown className="size-4 text-gray-400" />;
    }
    if (sortDirection === "asc") {
      return <ChevronUp className="size-4 text-gold-600" />;
    }
    if (sortDirection === "desc") {
      return <ChevronDown className="size-4 text-gold-600" />;
    }
    return <ChevronsUpDown className="size-4 text-gray-400" />;
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {selectable && (
                <th className="w-12 px-4 py-3">
                  <button
                    onClick={handleSelectAll}
                    className={cn(
                      "flex size-5 items-center justify-center rounded border transition-colors",
                      allSelected
                        ? "border-gold-500 bg-gold-500 text-white"
                        : someSelected
                          ? "border-gold-500 bg-gold-100"
                          : "border-gray-300 bg-white hover:border-gray-400"
                    )}
                  >
                    {allSelected && <Check className="size-3" />}
                    {someSelected && <div className="size-2 rounded-sm bg-gold-500" />}
                  </button>
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.id}
                  className={cn(
                    "px-4 py-3 text-left font-medium text-gray-600",
                    column.width,
                    column.className
                  )}
                >
                  {column.sortable && onSort ? (
                    <button
                      onClick={() => handleSort(column.id)}
                      className="flex items-center gap-1 hover:text-navy-900 transition-colors"
                    >
                      {column.header}
                      <SortIcon columnId={column.id} />
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-4 py-12 text-center text-gray-500"
                >
                  <div className="flex items-center justify-center gap-2">
                    <div className="size-5 animate-spin rounded-full border-2 border-gold-500 border-t-transparent" />
                    Loading...
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-4 py-12 text-center text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row) => {
                const isSelected = selectedIds.includes(row.id);
                return (
                  <tr
                    key={row.id}
                    onClick={() => onRowClick?.(row)}
                    className={cn(
                      "border-b border-gray-100 transition-colors",
                      isSelected ? "bg-gold-50" : "bg-white hover:bg-gray-50",
                      onRowClick && "cursor-pointer"
                    )}
                  >
                    {selectable && (
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectRow(row.id);
                          }}
                          className={cn(
                            "flex size-5 items-center justify-center rounded border transition-colors",
                            isSelected
                              ? "border-gold-500 bg-gold-500 text-white"
                              : "border-gray-300 bg-white hover:border-gray-400"
                          )}
                        >
                          {isSelected && <Check className="size-3" />}
                        </button>
                      </td>
                    )}
                    {columns.map((column) => (
                      <td
                        key={column.id}
                        className={cn(
                          "px-4 py-3 text-navy-900",
                          column.width,
                          column.className
                        )}
                      >
                        {getCellValue(row, column)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {(onPageChange || onPageSizeChange) && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
              className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span>entries</span>
            {totalItems !== undefined && (
              <span className="ml-2 text-gray-400">
                (Total: {totalItems.toLocaleString("en-US")})
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage <= 1}
              className="flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            >
              <ChevronLeft className="size-4" />
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let page: number;
                if (totalPages <= 5) {
                  page = i + 1;
                } else if (currentPage <= 3) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i;
                } else {
                  page = currentPage - 2 + i;
                }
                return (
                  <button
                    key={page}
                    onClick={() => onPageChange?.(page)}
                    className={cn(
                      "flex size-8 items-center justify-center rounded-md text-sm font-medium transition-colors",
                      page === currentPage
                        ? "bg-gold-500 text-navy-900"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            >
              Next
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export { DataTable };
