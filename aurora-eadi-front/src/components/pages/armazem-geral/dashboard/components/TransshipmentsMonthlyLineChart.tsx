"use client";

import { useMemo } from "react";
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
import { Loader2 } from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

export interface TransshipmentsMonthlyPoint {
  month: string; // YYYY-MM
  total: number;
}

function monthLabel(monthKey: string) {
  const [, mm] = monthKey.split("-");
  const map: Record<string, string> = {
    "01": "Jan",
    "02": "Fev",
    "03": "Mar",
    "04": "Abr",
    "05": "Mai",
    "06": "Jun",
    "07": "Jul",
    "08": "Ago",
    "09": "Set",
    "10": "Out",
    "11": "Nov",
    "12": "Dez",
  };

  return map[mm] ?? monthKey;
}

export function TransshipmentsMonthlyLineChart({
  data,
  isLoading,
}: {
  data: TransshipmentsMonthlyPoint[];
  isLoading: boolean;
}) {
  const chart = useMemo(() => {
    const labels = data.map((d) => monthLabel(d.month));
    const values = data.map((d) => d.total);

    return {
      labels,
      datasets: [
        {
          label: "Transbordos",
          data: values,
          borderColor: "rgba(124, 58, 237, 0.95)",
          backgroundColor: "rgba(124, 58, 237, 0.10)",
          pointBackgroundColor: "rgba(124, 58, 237, 0.95)",
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.35,
          fill: true,
        },
      ],
    };
  }, [data]);

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index" as const, intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { precision: 0 },
        },
      },
    }),
    [],
  );

  if (isLoading) {
    return (
      <div className="h-72 flex items-center justify-center gap-2 text-gray-400 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        Carregando...
      </div>
    );
  }

  return (
    <div className="h-72">
      <Line data={chart} options={options as never} />
    </div>
  );
}

