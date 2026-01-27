'use client'

import React from 'react';
import { useRouter } from 'next/navigation';
import { Ship, Plane, History as HistoryIcon, Calculator } from 'lucide-react';

interface SimulationCardProps {
    title: string;
    description: string;
    icon: React.ElementType;
    onClick: () => void;
    historyPath: string;
}

const SimulationCard: React.FC<SimulationCardProps> = ({
    title,
    description,
    icon: Icon,
    onClick,
    historyPath
}) => {
    const router = useRouter();

    return (
        <div className="group relative bg-white rounded-2xl border-2 border-gray-200 p-8 text-left transition-all duration-300 hover:border-primary-500 hover:shadow-xl hover:-translate-y-1 flex flex-col h-full">
            <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-primary-50 text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-all duration-300">
                    <Icon size={32} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-900 leading-tight">
                        {title}
                    </h3>
                    <p className="text-gray-500 text-sm">
                        Simulação e Histórico
                    </p>
                </div>
            </div>

            <p className="text-gray-600 text-sm leading-relaxed mb-8">
                {description}
            </p>

            <div className="grid grid-cols-2 gap-3 mt-auto">
                <button
                    onClick={onClick}
                    className="flex items-center justify-center gap-2 py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium text-sm transition-colors"
                >
                    <Calculator size={18} />
                    Simular
                </button>
                <button
                    onClick={() => router.push(historyPath)}
                    className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium text-sm transition-colors"
                >
                    <HistoryIcon size={18} />
                    Histórico
                </button>
            </div>
        </div>
    );
};

export function SimulationsSelectionPage() {
    const router = useRouter();

    return (
        <div className="fixed inset-0 flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-50 overflow-hidden">
            <header className="flex-shrink-0 bg-white/80 backdrop-blur-lg border-b border-gray-200/50 shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
                            Módulo de Simulações
                        </h1>
                        <p className="text-gray-600 max-w-2xl mx-auto text-lg">
                            Selecione a modalidade de simulação que deseja realizar ou consultar.
                        </p>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <SimulationCard
                            title="Simulação Marítima"
                            description="Realize simulações de custos para importações marítimas, considerando taxas portuárias, armazenagem e transporte rodoviário."
                            icon={Ship}
                            onClick={() => router.push('/comercial')}
                            historyPath="/comercial/history"
                        />
                        <SimulationCard
                            title="Simulação Aérea"
                            description="Calcule os custos para operações aéreas, com foco em agilidade, tarifas aeroportuárias e prazos de entrega reduzidos."
                            icon={Plane}
                            onClick={() => router.push('/aereo')}
                            historyPath="/aereo/history"
                        />
                    </div>

                    <div className="mt-12 text-center">
                        <button
                            onClick={() => router.push('/modules')}
                            className="text-gray-500 hover:text-primary-600 font-medium transition-colors flex items-center justify-center gap-2 mx-auto"
                        >
                            <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            Voltar para os Módulos
                        </button>
                    </div>
                </div>
            </main>

            <footer className="flex-shrink-0 bg-white/80 backdrop-blur-lg border-t border-gray-200/50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <p className="text-xs text-center text-gray-400">
                        © 2025 Aurora EADI | Sistema de Gestão Comercial
                    </p>
                </div>
            </footer>
        </div>
    );
}
