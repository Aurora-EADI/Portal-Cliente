'use client'

import React from 'react';
import { Package } from 'lucide-react';

export function ArmazemGeralHomePage() {
    return (
        <div className="bg-primary-50 border border-primary-100 rounded-xl p-8 shadow-sm">
            <h1 className="text-2xl font-bold text-primary-900 mb-6 flex items-center gap-3">
                <Package className="text-primary-600" size={32} />
                Bem-vindo ao Armazém Geral
            </h1>

            <div className="space-y-4 text-primary-800 text-lg leading-relaxed">
                <p>
                    Este módulo centraliza as operações do recinto, fornecendo a gestão e o controle completo das cargas e containers armazenados.
                </p>
                <p>
                    Navegue através do menu lateral para acompanhar e cadastrar entradas, avarias, movimentações internas, relatórios analíticos e a ocupação em pátio.
                </p>
            </div>
        </div>
    );
}

