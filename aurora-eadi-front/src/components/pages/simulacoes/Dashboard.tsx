'use client';

import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useSimulations } from '@/hooks/useSimulations';
import { useAirSimulations } from '@/hooks/useAirSimulations';
import { SimulationStatus } from '@/types/simulation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Send, XCircle, Loader2, Ship, Plane } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function getLast12Months(): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(
      d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
    );
  }
  return months;
}

function getMonthKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getLast12MonthKeys(): string[] {
  const keys: string[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return keys;
}

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

interface StatusCardProps {
  label: string;
  count: number;
  icon: React.ReactNode;
  colorClass: string;
}

function StatusCard({ label, count, icon, colorClass }: StatusCardProps) {
  return (
    <Card className="flex-1 min-w-0">
      <CardContent className="flex items-center gap-4 pt-5 pb-5">
        <div className={`p-3 rounded-full ${colorClass}`}>{icon}</div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold">{count}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

export function Dashboard() {
  const { data: maritimas = [], isLoading: loadMar, isError: errMar } = useSimulations();
  const { data: aereas = [], isLoading: loadAer, isError: errAer } = useAirSimulations();

  const isLoading = loadMar || loadAer;
  const isError = errMar || errAer;

  // Extrair versão corrente de cada simulação
  const maritimasCurrent = useMemo(
    () =>
      maritimas
        .map((sim) => {
          const v = sim.versions?.find((v) => v.isCurrentVersion);
          return v ? { status: v.status, totalGeneral: v.totalGeneral, createdAt: v.createdAt, customerName: sim.customer?.name ?? '' } : null;
        })
        .filter(Boolean) as { status: SimulationStatus; totalGeneral: number; createdAt: string; customerName: string }[],
    [maritimas]
  );

  const areasCurrent = useMemo(
    () =>
      aereas
        .map((sim) => {
          const v = sim.versions?.find((v) => v.isCurrentVersion);
          return v ? { status: v.status, totalGeneral: v.totalGeneral, createdAt: v.createdAt, customerName: sim.customer?.name ?? '' } : null;
        })
        .filter(Boolean) as { status: SimulationStatus; totalGeneral: number; createdAt: string; customerName: string }[],
    [aereas]
  );

  // ── Cards de status ──────────────────────────
  const marCount = useMemo(() => ({
    approved: maritimasCurrent.filter((s) => s.status === SimulationStatus.APPROVED).length,
    sent: maritimasCurrent.filter((s) => s.status === SimulationStatus.SENT).length,
    rejected: maritimasCurrent.filter((s) => s.status === SimulationStatus.REJECTED).length,
  }), [maritimasCurrent]);

  const aerCount = useMemo(() => ({
    approved: areasCurrent.filter((s) => s.status === SimulationStatus.APPROVED).length,
    sent: areasCurrent.filter((s) => s.status === SimulationStatus.SENT).length,
    rejected: areasCurrent.filter((s) => s.status === SimulationStatus.REJECTED).length,
  }), [areasCurrent]);

  // ── Gráfico de linha — Total Geral (Aprovadas) por mês ──────
  const monthKeys = getLast12MonthKeys();
  const monthLabels = getLast12Months();

  const marPerMonth = useMemo(() => {
    const map: Record<string, number> = {};
    maritimasCurrent
      .filter((s) => s.status === SimulationStatus.APPROVED)
      .forEach((s) => {
        const k = getMonthKey(s.createdAt);
        map[k] = (map[k] ?? 0) + Number(s.totalGeneral ?? 0);
      });
    return monthKeys.map((k) => map[k] ?? 0);
  }, [maritimasCurrent, monthKeys]);

  const aerPerMonth = useMemo(() => {
    const map: Record<string, number> = {};
    areasCurrent
      .filter((s) => s.status === SimulationStatus.APPROVED)
      .forEach((s) => {
        const k = getMonthKey(s.createdAt);
        map[k] = (map[k] ?? 0) + Number(s.totalGeneral ?? 0);
      });
    return monthKeys.map((k) => map[k] ?? 0);
  }, [areasCurrent, monthKeys]);

  const lineData = {
    labels: monthLabels,
    datasets: [
      {
        label: 'Marítimas',
        data: marPerMonth,
        borderColor: '#f97316',
        backgroundColor: '#f9731620',
        tension: 0.3,
        pointRadius: 4,
      },
      {
        label: 'Aéreas',
        data: aerPerMonth,
        borderColor: '#3b82f6',
        backgroundColor: '#3b82f620',
        tension: 0.3,
        pointRadius: 4,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) => `${ctx.dataset.label}: ${formatBRL(ctx.parsed.y)}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: any) => formatBRL(Number(value)),
        },
      },
    },
  };

  // ── Ranking top 10 clientes — apenas Aprovadas ──
  const rankingMar = useMemo(() => {
    const map: Record<string, number> = {};
    maritimasCurrent
      .filter((s) => s.status === SimulationStatus.APPROVED)
      .forEach((s) => {
        if (!s.customerName) return;
        map[s.customerName] = (map[s.customerName] ?? 0) + Number(s.totalGeneral ?? 0);
      });
    return Object.entries(map).sort(([, a], [, b]) => b - a).slice(0, 10);
  }, [maritimasCurrent]);

  const rankingAer = useMemo(() => {
    const map: Record<string, number> = {};
    areasCurrent
      .filter((s) => s.status === SimulationStatus.APPROVED)
      .forEach((s) => {
        if (!s.customerName) return;
        map[s.customerName] = (map[s.customerName] ?? 0) + Number(s.totalGeneral ?? 0);
      });
    return Object.entries(map).sort(([, a], [, b]) => b - a).slice(0, 10);
  }, [areasCurrent]);

  // ── Render ───────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Carregando dashboard...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-destructive">Erro ao carregar dados. Tente novamente.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 overflow-y-auto h-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard de Cotações</h1>
        <p className="text-muted-foreground text-sm mt-1">Visão consolidada de cotações marítimas e aéreas</p>
      </div>

      {/* Cards Marítimas */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          <Ship className="h-4 w-4" />
          Marítimas
        </div>
        <div className="flex gap-4">
          <StatusCard
            label="Aprovadas"
            count={marCount.approved}
            icon={<CheckCircle className="h-5 w-5 text-green-600" />}
            colorClass="bg-green-100"
          />
          <StatusCard
            label="Enviadas"
            count={marCount.sent}
            icon={<Send className="h-5 w-5 text-blue-600" />}
            colorClass="bg-blue-100"
          />
          <StatusCard
            label="Rejeitadas"
            count={marCount.rejected}
            icon={<XCircle className="h-5 w-5 text-red-600" />}
            colorClass="bg-red-100"
          />
        </div>
      </section>

      {/* Cards Aéreas */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          <Plane className="h-4 w-4" />
          Aéreas
        </div>
        <div className="flex gap-4">
          <StatusCard
            label="Aprovadas"
            count={aerCount.approved}
            icon={<CheckCircle className="h-5 w-5 text-green-600" />}
            colorClass="bg-green-100"
          />
          <StatusCard
            label="Enviadas"
            count={aerCount.sent}
            icon={<Send className="h-5 w-5 text-blue-600" />}
            colorClass="bg-blue-100"
          />
          <StatusCard
            label="Rejeitadas"
            count={aerCount.rejected}
            icon={<XCircle className="h-5 w-5 text-red-600" />}
            colorClass="bg-red-100"
          />
        </div>
      </section>

      {/* Gráfico de linha */}
      <section>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total Geral por Modal — Aprovadas (últimos 12 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <Line data={lineData} options={lineOptions} />
          </CardContent>
        </Card>
      </section>

      {/* Ranking top 10 — duas tabelas lado a lado */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Ship className="h-4 w-4 text-orange-500" />
              Top 10 Clientes — Marítimas (Aprovadas)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rankingMar.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum dado disponível.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 w-8">#</th>
                    <th className="text-left py-2">Cliente</th>
                    <th className="text-right py-2">Total Geral</th>
                  </tr>
                </thead>
                <tbody>
                  {rankingMar.map(([name, total], i) => (
                    <tr key={name} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                      <td className="py-2 font-medium text-muted-foreground">{i + 1}</td>
                      <td className="py-2 font-medium truncate max-w-[160px]" title={name}>{name}</td>
                      <td className="py-2 text-right font-semibold text-orange-500">{formatBRL(total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Plane className="h-4 w-4 text-blue-500" />
              Top 10 Clientes — Aéreas (Aprovadas)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rankingAer.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum dado disponível.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 w-8">#</th>
                    <th className="text-left py-2">Cliente</th>
                    <th className="text-right py-2">Total Geral</th>
                  </tr>
                </thead>
                <tbody>
                  {rankingAer.map(([name, total], i) => (
                    <tr key={name} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                      <td className="py-2 font-medium text-muted-foreground">{i + 1}</td>
                      <td className="py-2 font-medium truncate max-w-[160px]" title={name}>{name}</td>
                      <td className="py-2 text-right font-semibold text-blue-500">{formatBRL(total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
