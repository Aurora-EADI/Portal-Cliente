"use client";

import { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Loader2 } from "lucide-react";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export interface TopCustomersBarChartItem {
  label: string;
  value: number;
}

export function TopCustomersBarChart({
  data,
  isLoading,
}: {
  data: TopCustomersBarChartItem[];
  isLoading: boolean;
}) {
  const chart = useMemo(() => {
    const labels = data.map((d) => d.label);
    const values = data.map((d) => d.value);

    return {
      labels,
      datasets: [
        {
          label: "Containers",
          data: values,
          backgroundColor: "rgba(59, 130, 246, 0.25)",
          borderColor: "rgba(59, 130, 246, 0.9)",
          borderWidth: 1,
          borderRadius: 8,
        },
      ],
    };
  }, [data]);

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 11 } },
        },
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
      <Bar data={chart} options={options as never} />
    </div>
  );
}

