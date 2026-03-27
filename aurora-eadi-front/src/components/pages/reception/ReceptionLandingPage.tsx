'use client'

import React from 'react';
import { Users } from 'lucide-react';

export function ReceptionLandingPage() {
    return (
        <div className="bg-primary-50 border border-primary-100 rounded-xl p-8 shadow-sm">
            <h1 className="text-2xl font-bold text-primary-900 mb-6 flex items-center gap-3">
                <Users className="text-primary-600" size={32} />
                Bem-vindo ao Módulo de RH
            </h1>

            <div className="space-y-4 text-primary-800 text-lg leading-relaxed">
                <p>
                    Este módulo foi desenvolvido para centralizar e facilitar o acesso às informações de contato interno da Aurora EADI.
                </p>
                <p>
                    Aqui você pode consultar ramais, e-mails corporativos e gerenciar o catálogo de colaboradores de forma rápida e eficiente.
                </p>
            </div>
        </div>
    );
}
