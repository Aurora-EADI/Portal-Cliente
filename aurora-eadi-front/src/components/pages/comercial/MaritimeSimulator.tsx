'use client';

import React, { useState, useEffect } from 'react';
import { Printer, Plus, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useSuppliers } from '@/hooks/useSuppliers';

export function MaritimeSimulator() {
    // Suppliers Data
    const { data: suppliersData, isLoading: isLoadingSuppliers } = useSuppliers();
    const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');

    // Simulation ID State
    const [simulationId, setSimulationId] = useState<string>('');

    // Generate unique Simulation ID on mount
    useEffect(() => {
        // ID Format: SIM-YYYYMMDD-XXXX
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        setSimulationId(`SIM-${dateStr}-${random}`);
    }, []);

    // State for form fields
    const [cifUsd, setCifUsd] = useState<number | string>('');
    const [dollarRate, setDollarRate] = useState<number | string>(5.85); // Default from image
    const [cifBrl, setCifBrl] = useState<number | string>(0);

    const [tonnes, setTonnes] = useState<string>('');
    const [cntrCount, setCntrCount] = useState<string>('');
    const [cntrType, setCntrType] = useState<string>('');
    const [dateRate, setDateRate] = useState<string>('14/12/2025 14:29'); // Mock default

    const [storageCost, setStorageCost] = useState<string>('0,00');
    const [transportCost, setTransportCost] = useState<string>('1.700,00');
    const [discount, setDiscount] = useState<string>('0.00');

    // Calculations
    useEffect(() => {
        const usd = parseFloat(cifUsd.toString()) || 0;
        const rate = parseFloat(dollarRate.toString()) || 0;
        setCifBrl((usd * rate).toFixed(2));
    }, [cifUsd, dollarRate]);

    return (
        <div className="container mx-auto py-8 max-w-7xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Simulador de Custo EADI
                    </h1>
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                        ID da Simulação:
                        <span className="font-mono font-bold bg-gray-100 px-2 py-0.5 rounded text-gray-700 border border-gray-200">
                            {simulationId}
                        </span>
                    </p>
                </div>
                <Button
                    className="bg-primary-600 hover:bg-primary-700 text-white gap-2 shadow-sm"
                >
                    <Plus size={16} />
                    Adicionar Serviço
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* LEFT COLUMN - CONTENT */}
                <div className="lg:col-span-2 flex flex-col">
                    <Tabs defaultValue="cliente" className="w-full flex flex-col">
                        {/* TABS HEADER - Attached to Card */}
                        <div className="flex items-end">
                            <TabsList className="bg-transparent h-10 p-0 gap-1 rounded-b-none">
                                <TabsTrigger
                                    value="cliente"
                                    className="rounded-b-none border-t border-l border-r border-transparent data-[state=active]:border-gray-200 data-[state=active]:bg-white data-[state=active]:shadow-none px-6 py-2.5 text-gray-500 data-[state=active]:text-primary-700 font-semibold relative top-[1px]"
                                >
                                    Cliente
                                </TabsTrigger>
                                <TabsTrigger
                                    value="carga"
                                    className="rounded-b-none border-t border-l border-r border-transparent data-[state=active]:border-gray-200 data-[state=active]:bg-white data-[state=active]:shadow-none px-6 py-2.5 text-gray-500 data-[state=active]:text-primary-700 font-semibold relative top-[1px]"
                                >
                                    Dados da Carga
                                </TabsTrigger>
                                <TabsTrigger
                                    value="servico"
                                    className="rounded-b-none border-t border-l border-r border-transparent data-[state=active]:border-gray-200 data-[state=active]:bg-white data-[state=active]:shadow-none px-6 py-2.5 text-gray-500 data-[state=active]:text-primary-700 font-semibold relative top-[1px]"
                                >
                                    Serviço
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* TAB CONTENT - WRAPPED IN CARD */}
                        <div className="bg-white rounded-tr-xl rounded-b-xl border border-gray-200 shadow-sm overflow-hidden min-h-[500px]">

                            <TabsContent value="cliente" className="mt-0 p-0 animate-in fade-in-50 duration-300">
                                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                        <Building2 className="w-5 h-5 text-primary-600" />
                                        Seleção de Cliente
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-1">Selecione o fornecedor/empresa para a simulação</p>
                                </div>

                                <div className="p-8">
                                    <Label htmlFor="supplier" className="text-base font-semibold text-gray-700 mb-3 block">Fornecedor</Label>
                                    <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                                        <SelectTrigger id="supplier" className="w-full h-12 text-base">
                                            <SelectValue placeholder="Selecione um fornecedor..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {isLoadingSuppliers ? (
                                                <div className="p-4 text-center text-sm text-gray-500">Carregando fornecedores...</div>
                                            ) : (
                                                suppliersData?.map((item: any) => (
                                                    <SelectItem key={item.company.id} value={item.company.id}>
                                                        {item.company.fantasyName || item.company.socialReason}
                                                        <span className="text-gray-400 text-xs ml-2">({item.company.cnpj})</span>
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>

                                    {selectedSupplierId && (
                                        <div className="mt-6 p-4 bg-primary-50 rounded-lg border border-primary-100">
                                            <h3 className="font-semibold text-primary-800 mb-2">Empresa Selecionada</h3>
                                            <div className="text-sm text-primary-700 space-y-1">
                                                <p>ID: {selectedSupplierId}</p>
                                                <p>Status: <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Ativo</span></p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="carga" className="mt-0 p-0 animate-in fade-in-50 duration-300">
                                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                        <span className="w-1 h-6 bg-primary-500 rounded-full inline-block"></span>
                                        Dados da Carga
                                    </h2>
                                </div>

                                <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Row 1 */}
                                    <div className="space-y-2">
                                        <Label htmlFor="cifUsd">Valor CIF da carga USD</Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                                            <Input
                                                id="cifUsd"
                                                placeholder="0.00"
                                                value={cifUsd}
                                                onChange={(e) => setCifUsd(e.target.value)}
                                                className="pl-7"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="dollarRate">Taxa do Dólar USD</Label>
                                        <Input
                                            id="dollarRate"
                                            value={dollarRate}
                                            onChange={(e) => setDollarRate(e.target.value)}
                                        />
                                    </div>

                                    {/* Row 2 */}
                                    <div className="space-y-2">
                                        <Label htmlFor="cifBrl">Valor CIF da carga R$</Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">R$</span>
                                            <Input
                                                id="cifBrl"
                                                value={cifBrl}
                                                readOnly
                                                className="bg-gray-50 text-gray-600 font-medium pl-9"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="tonnes">Tonelada</Label>
                                        <Input
                                            id="tonnes"
                                            placeholder="0.000"
                                            value={tonnes}
                                            onChange={(e) => setTonnes(e.target.value)}
                                        />
                                    </div>

                                    {/* Row 3 */}
                                    <div className="space-y-2">
                                        <Label htmlFor="cntrCount">Qnt. De CNTR</Label>
                                        <Input
                                            id="cntrCount"
                                            placeholder="0"
                                            value={cntrCount}
                                            onChange={(e) => setCntrCount(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="cntrType">Tipo de CNTR (TU's)</Label>
                                        <Select value={cntrType} onValueChange={setCntrType}>
                                            <SelectTrigger id="cntrType">
                                                <SelectValue placeholder="Selecione..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="20">20</SelectItem>
                                                <SelectItem value="40">40</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Row 4 */}
                                    <div className="space-y-2">
                                        <Label htmlFor="dateRate">Data Taxa do USD</Label>
                                        <Input
                                            id="dateRate"
                                            value={dateRate}
                                            readOnly
                                            className="bg-gray-50 text-gray-500"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="storageCost">Armazenagem R$ (2º Período de 15)</Label>
                                        <Input
                                            id="storageCost"
                                            value={`R$ ${storageCost}`}
                                            readOnly
                                            className="bg-gray-50 text-gray-500"
                                        />
                                    </div>

                                    {/* Row 5 */}
                                    <div className="space-y-2">
                                        <Label htmlFor="transportCost">Transporte de DTA + Devolução</Label>
                                        <Input
                                            id="transportCost"
                                            value={`R$ ${transportCost}`}
                                            readOnly
                                            className="bg-gray-50 text-gray-500"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="discount">Desconto</Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">R$</span>
                                            <Input
                                                id="discount"
                                                value={discount}
                                                onChange={(e) => setDiscount(e.target.value)}
                                                className="pl-9"
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </TabsContent>

                            <TabsContent value="servico" className="mt-0 p-0">
                                <div className="p-12 text-center text-gray-500">
                                    <p>Conteúdo da aba Serviço</p>
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>

                {/* RIGHT COLUMN - SUMMARY */}
                <div className="lg:col-span-1 pt-10">
                    <Card className="sticky top-6 shadow-md border-gray-200 overflow-hidden ring-1 ring-gray-950/5">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b bg-gray-50/80">
                            <CardTitle className="text-lg font-bold text-gray-900">Resumo da Simulação</CardTitle>
                            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-primary-600 h-8 w-8 hover:bg-white">
                                <Printer size={18} />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="p-6 space-y-6">
                                <div className="flex justify-between items-center p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                                    <span className="text-blue-700 font-medium">Total Serviços</span>
                                    <span className="text-lg font-bold text-blue-900">R$ 1.700,00</span>
                                </div>

                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between items-start group">
                                        <span className="text-gray-500 group-hover:text-gray-700 transition-colors">Armazenagem (2º P/15)</span>
                                        <span className="font-semibold text-gray-900">R$ 0,00</span>
                                    </div>

                                    <div className="flex justify-between items-start group">
                                        <span className="text-gray-500 group-hover:text-gray-700 transition-colors">Transporte DTA + Devolução</span>
                                        <span className="font-semibold text-gray-900">R$ 1.700,00</span>
                                    </div>

                                    <Separator className="my-2" />

                                    <div className="flex justify-between items-center pt-1">
                                        <span className="text-gray-600 font-medium">Serviços Diversos</span>
                                        <span className="text-xs text-gray-400 italic">Nenhum selecionado</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-gray-50 border-t border-gray-100">
                                <div className="flex justify-between items-center">
                                    <div className="flex flex-col">
                                        <span className="text-sm text-gray-500 font-medium uppercase tracking-wider">Valor Total</span>
                                        <span className="text-xs text-gray-400">Com impostos</span>
                                    </div>
                                    <span className="text-2xl font-bold text-gray-900">R$ 1.700,00</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
