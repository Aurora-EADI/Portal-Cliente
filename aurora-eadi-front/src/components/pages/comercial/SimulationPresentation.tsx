import React from 'react';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/button';
import { Printer, X } from 'lucide-react';
import { formatCurrency, formatNumberBR, formatPercent } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Separator } from '@/components/ui/separator';

interface SimulationPresentationProps {
    simulation: any; // Using any for flexibility based on current usage, but could be specific type
    calculatedValues: {
        totalServices: number;
        storageCost: number;
        transportCost: number;
        minDiff: number;
        minProfitMarginPct: number;
        totalGeneral: number;
        discount: number;
        servicesCount: number;
    };
    onClose: () => void;
    customerData?: any; // Pass separate customer data if needed or included in simulation
}

export function SimulationPresentation({
    simulation,
    calculatedValues,
    onClose,
    customerData
}: SimulationPresentationProps) {

    // Combine simulation data with passed customer data if needed
    const customer = simulation?.customer || customerData;
    const services = simulation?.services || [];

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm overflow-y-auto print:overflow-visible print:bg-white print:static print:h-auto print-content">
            <div className="min-h-screen w-full flex flex-col items-center justify-start py-8 print:p-0 print:block">

                {/* Actions Bar - Hidden on Print */}
                <div className="w-full max-w-[210mm] flex justify-between items-center mb-6 print:hidden px-4">
                    <Button variant="outline" onClick={onClose} className="bg-white text-gray-700 hover:bg-gray-100">
                        <X className="w-4 h-4 mr-2" />
                        Fechar Visualização
                    </Button>
                    <Button onClick={handlePrint} className="gap-2 shadow-lg">
                        <Printer className="w-4 h-4" />
                        Imprimir / Salvar PDF
                    </Button>
                </div>

                {/* A4 Paper Layout */}
                <div className="bg-white w-full max-w-[210mm] min-h-[297mm] shadow-2xl print:shadow-none print:w-full print:max-w-none mx-auto p-[15mm] md:p-[20mm] relative text-gray-800">

                    {/* Header */}
                    <header className="flex justify-between items-start border-b-2 border-primary-800 pb-6 mb-8">
                        <Logo src="/aurora-MANAUS_logo_principal.png" size="md" />
                        <div className="text-right">
                            <h1 className="text-2xl font-bold text-gray-900 uppercase tracking-tight">Proposta comercial</h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Ref: <span className="font-mono font-medium text-gray-700">{simulation?.displayNumber || 'N/A'}</span>
                            </p>
                            <p className="text-sm text-gray-500">
                                Data: {new Date().toLocaleDateString('pt-BR')}
                            </p>
                        </div>
                    </header>

                    {/* Client Info */}
                    <section className="mb-8">
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 border-b border-gray-100 pb-1">
                            Dados do Cliente
                        </h2>
                        <div className="grid grid-cols-2 gap-y-2 text-sm">
                            <div>
                                <span className="text-gray-500 block text-xs">Razão Social / Nome</span>
                                <span className="font-semibold text-gray-900">{customer?.name || 'Cliente não identificado'}</span>
                            </div>
                            <div>
                                <span className="text-gray-500 block text-xs">CNPJ / CPF</span>
                                <span className="font-medium text-gray-900">{customer?.document || '-'}</span>
                            </div>
                            <div className="col-span-2">
                                <span className="text-gray-500 block text-xs mt-2">Código Interno</span>
                                <span className="font-mono text-gray-700 bg-gray-50 px-2 py-0.5 rounded text-xs border border-gray-100">
                                    {customer?.code || '-'}
                                </span>
                            </div>
                        </div>
                    </section>

                    {/* Cargo Info */}
                    <section className="mb-8 bg-gray-50/50 p-4 rounded-lg border border-gray-100 print:bg-transparent print:border print:border-gray-200">
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-200 pb-1">
                            Dados da Carga
                        </h2>
                        <div className="grid grid-cols-3 gap-6 text-sm">
                            <div>
                                <span className="text-gray-500 block text-xs mb-1">Valor CIF (USD)</span>
                                <span className="font-medium text-gray-900 text-base">
                                    {formatCurrency(simulation?.cifUsd || 0, true)}
                                </span>
                                <span className="text-xs text-gray-400 ml-1">
                                    (Taxa: {simulation?.dollarRate})
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-500 block text-xs mb-1">Peso (Toneladas)</span>
                                <span className="font-medium text-gray-900 text-base">
                                    {Number(simulation?.tonnes || 0) > 0 ? `${formatNumberBR(simulation.tonnes, 3)} ton` : '-'}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-500 block text-xs mb-1">Contêineres</span>
                                <span className="font-medium text-gray-900 text-base">
                                    {simulation?.cntrCount || 0}x {simulation?.cntrType ? `${simulation?.cntrType}'` : ''}
                                </span>
                            </div>
                        </div>
                    </section>

                    {/* Services Table */}
                    <section className="mb-8">
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-1">
                            Detalhamento de Serviços
                        </h2>

                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 text-left print:bg-gray-100">
                                    <th className="py-2 px-3 font-semibold text-gray-600 rounded-l-md">Serviço</th>
                                    <th className="py-2 px-3 font-semibold text-gray-600 text-right rounded-r-md">Valor Estimado (R$)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {services.length > 0 ? (
                                    services.map((service: any, index: number) => (
                                        <tr key={index} className="group">
                                            <td className="py-3 px-3 text-gray-700">
                                                {service.serviceName || service.service?.name || `Serviço ${index + 1}`}
                                            </td>
                                            <td className="py-3 px-3 text-right font-medium text-gray-900 group-hover:bg-gray-50">
                                                {formatCurrency(service.appliedCost || 0)}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={2} className="py-4 text-center text-gray-400 italic">
                                            Nenhum serviço avulso selecionado.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            <tfoot className="bg-blue-50/30 print:bg-transparent border-t border-gray-200">
                                <tr>
                                    <td className="py-2 px-3 font-semibold text-blue-800 text-right">Subtotal Serviços:</td>
                                    <td className="py-2 px-3 text-right font-bold text-blue-900">
                                        {formatCurrency(calculatedValues.totalServices)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </section>

                    {/* Costs Summary */}
                    <section className="mb-10 page-break-inside-avoid">
                        <div className="flex justify-end">
                            <div className="w-full md:w-1/2 space-y-3">
                                <div className="flex justify-between items-center py-1 border-b border-gray-100 border-dashed">
                                    <span className="text-gray-600">Armazenagem (Estimada)</span>
                                    <span className="font-medium text-gray-900">{formatCurrency(calculatedValues.storageCost)}</span>
                                </div>

                                <div className="flex justify-between items-center py-1 border-b border-gray-100 border-dashed">
                                    <span className="text-gray-600">Transporte</span>
                                    <span className="font-medium text-gray-900">{formatCurrency(calculatedValues.transportCost)}</span>
                                </div>

                                {Number(calculatedValues.discount) > 0 && (
                                    <div className="flex justify-between items-center py-1 text-red-600 bg-red-50/50 px-2 rounded">
                                        <span className="font-medium">Desconto</span>
                                        <span className="font-bold">- {formatCurrency(Number(calculatedValues.discount))}</span>
                                    </div>
                                )}

                                {calculatedValues.minDiff > 0 && (
                                    <div className="flex justify-between items-center py-2 px-2 bg-amber-50 rounded border border-amber-100 text-xs">
                                        <span className="text-amber-800 font-semibold uppercase">Diferença para Faturamento Mínimo</span>
                                        <span className="font-bold text-amber-900">{formatCurrency(calculatedValues.minDiff)}</span>
                                    </div>
                                )}

                                <Separator className="my-4" />

                                <div className="flex justify-between items-center py-3 px-4 bg-gray-900 text-white rounded-lg shadow-sm print:bg-black print:text-black print:border print:border-black print:bg-transparent print:shadow-none">
                                    <span className="font-bold text-lg uppercase tracking-wide">Total Geral</span>
                                    <span className="font-bold text-2xl print:text-black">{formatCurrency(calculatedValues.totalGeneral)}</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Footer / Notes */}
                    <footer className="mt-auto pt-10 border-t border-gray-100 text-xs text-gray-400 print:mt-8 print:pt-4 print:text-center">
                        <p className="mb-2">
                            * Obs.: Tarifa mínima de emissão de nota fiscal por contêiner - {formatCurrency(simulation?.minBillingValue ?? 5500)}.
                        </p>
                        <p className="mb-2">
                            * Esta simulação possui valores estimados e pode sofrer alterações sem aviso prévio. Os valores finais serão confirmados mediante faturamento.
                        </p>
                        <p>
                            Gerado pelo Sistema Portal Aurora em {new Date().toLocaleString('pt-BR')}
                        </p>
                    </footer>

                </div>
            </div>
        </div>
    );
}
