'use client'

import React from 'react';

export function DtaSelectionPage() {
    return (
        <div className="bg-primary-50 border border-primary-100 rounded-xl p-8 shadow-sm">
            <h1 className="text-2xl font-bold text-primary-900 mb-6 flex items-center gap-3">
                Bem-vindo ao Módulo CT-e
            </h1>

            <div className="space-y-4 text-primary-800 text-lg leading-relaxed">
                <p>
                    Aqui você encontrará as ferramentas necessárias para consulta, gestão e exportação de conhecimentos de transporte eletrônicos (CT-e).
                </p>
                <p>
                    Este espaço foi desenvolvido para centralizar as operações de transporte aéreo e maritimo para facilitar o acompanhamento dos processos.
                </p>
            </div>
        </div>
    );
}
