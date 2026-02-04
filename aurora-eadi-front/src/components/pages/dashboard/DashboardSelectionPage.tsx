'use client'

import React from 'react';

export function DashboardSelectionPage() {
    return (
        <div className="bg-primary-50 border border-primary-100 rounded-xl p-8 shadow-sm">
            <h1 className="text-2xl font-bold text-primary-900 mb-6 flex items-center gap-3">
                Bem-vindo ao Dashboard
            </h1>

            <div className="space-y-4 text-primary-800 text-lg leading-relaxed">
                <p>
                    Aqui você encontrará uma visão geral das principais métricas e indicadores do sistema, permitindo acompanhar o desempenho e a evolução das operações em tempo real.
                </p>
                <p>
                    Este espaço foi desenvolvido para centralizar informações estratégicas e apoiar a tomada de decisões no dia a dia.
                </p>
            </div>
        </div>
    );
}
