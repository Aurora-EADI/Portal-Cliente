'use client'

import React from 'react';

export function FaturamentoSelectionPage() {
    return (
        <div className="bg-primary-50 border border-primary-100 rounded-xl p-8 shadow-sm">
            <h1 className="text-2xl font-bold text-primary-900 mb-6 flex items-center gap-3">
                Bem-vindo ao Módulo Faturamento
            </h1>

            <div className="space-y-4 text-primary-800 text-lg leading-relaxed">
                <p>
                    Aqui você encontrará as ferramentas necessárias para acompanhamento do faturamento detalhado e geração de relatórios financeiros.
                </p>
                <p>
                    Este espaço foi desenvolvido para centralizar informações de faturamento e apoiar o controle financeiro das operações.
                </p>
            </div>
        </div>
    );
}
