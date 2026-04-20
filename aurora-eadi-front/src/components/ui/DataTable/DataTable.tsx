import React from 'react';
import { Loader2 } from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';

export interface Column<T> {
    key: string;
    header: string;
    align?: 'left' | 'center' | 'right';
    render: (item: T) => React.ReactNode;
}

export interface DataTableProps<T> {
    columns: Column<T>[];
    data: T[];
    keyExtractor: (item: T) => string | number;
    isLoading?: boolean;
    isError?: boolean;
    errorMessage?: string;
    emptyMessage?: string;
    pagination?: {
        page: number;
        total: number;
        limit: number;
        onPageChange: (page: number) => void;
        onLimitChange?: (limit: number) => void;
        limitOptions?: number[];
    };
    rowClassName?: (item: T) => string;
    onRowClick?: (item: T) => void;
}

export function DataTable<T>({
    columns,
    data,
    keyExtractor,
    isLoading = false,
    isError = false,
    errorMessage = 'Erro ao carregar dados.',
    emptyMessage = 'Nenhum registro encontrado.',
    pagination,
    rowClassName,
    onRowClick,
}: DataTableProps<T>) {
    if (isLoading) {
        return (
            <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="rounded-md bg-red-50 p-4 text-center text-red-600">
                {errorMessage}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
                        <tr>
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    className={`px-3 py-3 text-xs whitespace-nowrap ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : ''}`}
                                >
                                    {column.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {data && data.length > 0 ? (
                            data.map((item) => (
                                <tr
                                    key={keyExtractor(item)}
                                    onClick={() => onRowClick?.(item)}
                                    className={`hover:bg-gray-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''} ${rowClassName ? rowClassName(item) : ''}`}
                                >
                                    {columns.map((column) => (
                                        <td
                                            key={column.key}
                                            className={`px-3 py-2.5 ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : ''}`}
                                        >
                                            {column.render(item)}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-400">
                                    {emptyMessage}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
                </div>
            </div>

            {pagination && pagination.total > 0 && (
                <div className="mt-4">
                    <Pagination
                        page={pagination.page}
                        total={pagination.total}
                        limit={pagination.limit}
                        onPageChange={pagination.onPageChange}
                        onLimitChange={pagination.onLimitChange}
                        limitOptions={pagination.limitOptions}
                        className="rounded-b-xl border-t-0 rounded-t-none"
                    />
                </div>
            )}
        </div>
    );
}
