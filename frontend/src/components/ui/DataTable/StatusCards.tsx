import React from 'react';
import { LucideIcon, CheckCircle } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

export interface StatusCardConfig {
    status: string;
    label: string;
    icon: LucideIcon;
    bgColor: string;
    textColor: string;
}

export interface StatusCardsProps {
    cards: StatusCardConfig[];
    statusCounts: Record<string, number>;
    activeStatus: string;
    onStatusClick: (status: string) => void;
    columns?: number;
}

export function StatusCards({
    cards,
    statusCounts,
    activeStatus,
    onStatusClick,
    columns = 4,
}: StatusCardsProps) {
    const gridCols = {
        2: 'md:grid-cols-2',
        3: 'md:grid-cols-3',
        4: 'md:grid-cols-4',
        5: 'md:grid-cols-5',
    }[columns] || 'md:grid-cols-4';

    return (
        <div className={`grid grid-cols-1 ${gridCols} gap-4`}>
            {cards.map((card) => {
                const count = statusCounts[card.status] || 0;
                const isActive = activeStatus === card.status;
                const Icon = card.icon;

                return (
                    <button
                        key={card.status}
                        onClick={() => onStatusClick(card.status)}
                        className={`bg-white p-6 rounded-xl border shadow-sm flex items-center gap-4 transition-all hover:shadow-md ${
                            isActive
                                ? 'border-primary-500 ring-2 ring-primary-200'
                                : 'border-gray-200'
                        }`}
                    >
                        <div className={`p-3 ${card.bgColor} ${card.textColor} rounded-lg`}>
                            <Icon size={16} />
                        </div>
                        <div className="text-left">
                            <p className="text-sm text-gray-500">{card.label}</p>
                            <p className="text-xl font-bold text-gray-900">{formatNumber(count)}</p>
                        </div>
                        {isActive && (
                            <div className="ml-auto">
                                <CheckCircle size={20} className="text-primary-600" />
                            </div>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
