"use client";

import { useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { FaturamentoDetalhado } from "@/services/faturamento/types/type_faturamentoDetalhado";
import { Loader2, X } from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

type Metric = "cif" | "bruto";

interface Props {
  yearData: FaturamentoDetalhado[];
  prevYearData: FaturamentoDetalhado[];
  isLoading: boolean;
  currentYear: number;
  prevYear: number;
  onClose: () => void;
}

const ALL_MONTHS = ["01","02","03","04","05","06","07","08","09","10","11","12"];
const MONTH_LABELS: Record<string, string> = {
  "01": "Jan", "02": "Fev", "03": "Mar", "04": "Abr",
  "05": "Mai", "06": "Jun", "07": "Jul", "08": "Ago",
  "09": "Set", "10": "Out", "11": "Nov", "12": "Dez",
};

function groupByMonth(
  items: FaturamentoDetalhado[],
  metric: Metric
): Map<string, number> {
  const monthMap = new Map<string, { rpsSet: Set<string>; total: number }>(
    ALL_MONTHS.map((m) => [m, { rpsSet: new Set(), total: 0 }])
  );

  items.forEach((item) => {
    const dt = item.dt_fatura;
    if (!dt) return;
    const month = dt.split("T")[0].split("-")[1];
    if (!monthMap.has(month)) return;

    const entry = monthMap.get(month)!;

    if (metric === "cif") {
      const rps = item.rps && String(item.rps).trim() !== "" ? item.rps : null;
      if (rps) {
        if (entry.rpsSet.has(rps)) return;
        entry.rpsSet.add(rps);
      }
      const val = typeof item.valor_cif === "number"
        ? item.valor_cif
        : parseFloat(String(item.valor_cif ?? "0").replace(",", ".")) || 0;
      entry.total += val;
    } else {
      const val = typeof item.valor === "number"
        ? item.valor
        : parseFloat(String(item.valor ?? "0").replace(",", ".")) || 0;
      entry.total += val;
    }
  });

  return new Map(Array.from(monthMap.entries()).map(([k, v]) => [k, Math.round(v.total)]));
}

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(v);

const fmtCompact = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    maximumFractionDigits: 1,
  } as Intl.NumberFormatOptions).format(v);

export function CifLineChart({
  yearData,
  prevYearData,
  isLoading,
  currentYear,
  prevYear,
  onClose,
}: Props) {
  const [metric, setMetric] = useState<Metric>("cif");

  const currentTotals = useMemo(() => groupByMonth(yearData, metric), [yearData, metric]);
  const prevTotals = useMemo(() => groupByMonth(prevYearData, metric), [prevYearData, metric]);

  const labels = ALL_MONTHS.map((m) => MONTH_LABELS[m]);

  const chartConfig = {
    labels,
    datasets: [
      {
        label: String(currentYear),
        data: ALL_MONTHS.map((m) => currentTotals.get(m) ?? 0),
        borderColor: metric === "cif" ? "#ca8a04" : "#7c3aed",
        backgroundColor: metric === "cif" ? "rgba(202,138,4,0.08)" : "rgba(124,58,237,0.08)",
        pointBackgroundColor: metric === "cif" ? "#ca8a04" : "#7c3aed",
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.3,
        fill: true,
      },
      {
        label: String(prevYear),
        data: ALL_MONTHS.map((m) => prevTotals.get(m) ?? 0),
        borderColor: "#94a3b8",
        backgroundColor: "rgba(148,163,184,0.06)",
        pointBackgroundColor: "#94a3b8",
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.3,
        borderDash: [5, 4],
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index" as const, intersect: false },
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
        labels: { boxWidth: 12, font: { size: 11 } },
      },
      tooltip: {
        callbacks: {
          label: (ctx: { dataset: { label?: string }; parsed: { y: number } }) =>
            `${ctx.dataset.label}: ${fmt(ctx.parsed.y ?? 0)}`,
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: (value: number | string) => fmtCompact(Number(value)),
        },
      },
    },
  };

  const metricLabel = metric === "cif" ? "Total CIF" : "Valor Bruto";

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">
            {metricLabel} por Mês — {currentYear} vs {prevYear}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {metric === "cif" ? "Sem RPS repetidas · " : ""}valores arredondados
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Toggle métrica */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
            <button
              onClick={() => setMetric("cif")}
              className={`px-3 py-1.5 transition-colors ${
                metric === "cif"
                  ? "bg-yellow-500 text-white font-medium"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              Total CIF
            </button>
            <button
              onClick={() => setMetric("bruto")}
              className={`px-3 py-1.5 transition-colors border-l border-gray-200 ${
                metric === "bruto"
                  ? "bg-violet-600 text-white font-medium"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              Valor Bruto
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center gap-2 text-gray-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Carregando dados...
        </div>
      ) : (
        <div className="h-64">
          <Line data={chartConfig} options={options as never} />
        </div>
      )}
    </div>
  );
}
