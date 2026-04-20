'use client'

import React from 'react';

export function InspecaoContainerSelectionPage() {
    return (
        <div className="bg-primary-50 border border-primary-100 rounded-xl p-8 shadow-sm">
            <h1 className="text-2xl font-bold text-primary-900 mb-6 flex items-center gap-3">
                Bem-vindo ao Módulo Inspeção Container
            </h1>
            <div className="space-y-4 text-primary-800 text-lg leading-relaxed">
                <p>
                    Aqui você encontrará todas as vistorias realizadas pelo aplicativo mobile, com acesso ao checklist completo, fotos e assinatura do inspetor.
                </p>
                <p>
                    Este espaço foi desenvolvido para centralizar o acompanhamento das inspeções de containers, facilitando o controle de qualidade e conformidade das operações.
                </p>
            </div>
        </div>
    );
}
