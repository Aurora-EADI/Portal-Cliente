'use client'

import React from 'react';
import { useRouter } from 'next/navigation';
import { Calculator } from 'lucide-react';

export function SimulationsSelectionPage() {
    const router = useRouter();

    return (
        <div className="bg-primary-50 border border-primary-100 rounded-xl p-8 shadow-sm">
            <h1 className="text-2xl font-bold text-primary-900 mb-6 flex items-center gap-3">
                 Bem-vindo ao Módulo Comercial
            </h1>
            
            <div className="space-y-4 text-primary-800 text-lg leading-relaxed">
                <p>
                    Aqui você encontrará as ferramentas e informações necessárias para apoiar as atividades do setor comercial, incluindo gestão de clientes, acompanhamento de oportunidades, propostas e indicadores de desempenho.
                </p>
                <p>
                    Este espaço foi desenvolvido para otimizar processos, centralizar dados e apoiar a tomada de decisões no dia a dia.
                </p>
            </div>
        </div>
    );
}
