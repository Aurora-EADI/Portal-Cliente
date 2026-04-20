"use client";

import { ModuleRouteShell } from "@/components/layout/ModuleRouteShell";
import { PageHeader } from "@/components/ui/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, ArrowDownUp, LayoutGrid, ArrowRight } from "lucide-react";
import Link from "next/link";

const REPORT_CARDS = [
  {
    title: "Visão Geral (Dashboard)",
    description: "Indicadores operacionais, gráficos de ocupação e performance.",
    icon: BarChart3,
    href: "/armazem-geral/relatorios/dashboard",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    title: "Entrada e Saída",
    description: "Relatório detalhado de movimentação de containers por período.",
    icon: ArrowDownUp,
    href: "/armazem-geral/relatorios/movimentacao",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
  {
    title: "Posição de Pátio",
    description: "Inventário atual e localização de todas as unidades no recinto.",
    icon: LayoutGrid,
    href: "/armazem-geral/relatorios/patio",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
];

export default function Page() {
  return (
    <ModuleRouteShell guard={{ moduleRoute: "/armazem-geral", requiredPermissions: [] }}>
      <div className="flex-1 space-y-6 p-8 pt-6 animate-in fade-in duration-500">
        <PageHeader
          title="Central de Relatórios"
          description="Selecione abaixo o relatório ou visão analítica que deseja consultar."
        />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {REPORT_CARDS.map((report) => (
            <Link key={report.href} href={report.href}>
              <Card className="group hover:border-orange-200 hover:shadow-md transition-all cursor-pointer h-full border-slate-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className={`p-2 rounded-lg ${report.bgColor} ${report.color}`}>
                    <report.icon className="h-5 w-5" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                </CardHeader>
                <CardContent className="pt-4">
                  <CardTitle className="text-lg font-bold text-slate-800 mb-2">
                    {report.title}
                  </CardTitle>
                  <p className="text-sm text-slate-500 line-clamp-2">
                    {report.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </ModuleRouteShell>
  );
}
