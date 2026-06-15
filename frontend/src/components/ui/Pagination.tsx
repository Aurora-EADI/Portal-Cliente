import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    page: number;
    total: number;
    limit: number;
    onPageChange: (page: number) => void;
    onLimitChange?: (limit: number) => void;
    limitOptions?: number[];
    className?: string;
}

export function Pagination({ page, total, limit, onPageChange, onLimitChange, limitOptions = [10, 20, 50, 100], className = '' }: PaginationProps) {
    const totalPages = Math.ceil(total / limit);

    if (total === 0) return null;

    return (
        <div className={`flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm ${className}`}>
            <div className="flex items-center gap-3 text-sm text-gray-600">
                {onLimitChange && (
                    <div className="flex items-center gap-2">
                        <span>Exibir</span>
                        <select
                            value={limit}
                            onChange={(e) => {
                                onLimitChange(Number(e.target.value));
                                onPageChange(1);
                            }}
                            className="px-2 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                            {limitOptions.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </div>
                )}
                <span>
                    Mostrando <span className="font-medium">{((page - 1) * limit) + 1}</span> a{' '}
                    <span className="font-medium">{Math.min(page * limit, total)}</span> de{' '}
                    <span className="font-medium">{formatNumber(total)}</span> resultados
                </span>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(page - 1)}
                    disabled={page <= 1}
                    className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronLeft size={16} />
                    Anterior
                </button>

                <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(pageNum => {
                            if (totalPages <= 7) return true;
                            if (pageNum === 1 || pageNum === totalPages) return true;
                            if (Math.abs(pageNum - page) <= 1) return true;
                            return false;
                        })
                        .map((pageNum, idx, arr) => {
                            const prevPageNum = arr[idx - 1];
                            const showEllipsis = prevPageNum && pageNum - prevPageNum > 1;

                            return (
                                <React.Fragment key={pageNum}>
                                    {showEllipsis && (
                                        <span className="px-2 text-gray-400">...</span>
                                    )}
                                    <button
                                        onClick={() => onPageChange(pageNum)}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${pageNum === page
                                            ? 'bg-primary-600 text-white'
                                            : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                </React.Fragment>
                            );
                        })}
                </div>

                <button
                    onClick={() => onPageChange(page + 1)}
                    disabled={page >= totalPages}
                    className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Próximo
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
}

// Utilitário simples para formatação de número, caso não tenha importado de @/lib/utils
function formatNumber(num: number): string {
    return new Intl.NumberFormat('pt-BR').format(num);
}
