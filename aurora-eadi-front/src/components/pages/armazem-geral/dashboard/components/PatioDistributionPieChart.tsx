"use client";

import { useMemo } from "react";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Loader2 } from "lucide-react";

ChartJS.register(ArcElement, Tooltip, Legend);

export type PatioDistributionMode = "occupancy" | "type" | "damage";

export interface PatioDistributionDatasets {
  occupancy: { 
    full: number; 
    fullOrigin: number;
    fullOwned: number;
    empty: number; 
    emptyOrigin: number;
    emptyOwned: number;
  };
  type: { origin: number; owned: number };
  damage: { withDamage: number; withoutDamage: number };
}

function toChart(mode: PatioDistributionMode, datasets: PatioDistributionDatasets) {
  if (mode === "type") {
    return {
      labels: ["Origem", "Cedido/Próprio"],
      values: [datasets.type.origin, datasets.type.owned],
      colors: ["rgba(99, 102, 241, 0.35)", "rgba(34, 197, 94, 0.35)"],
      borders: ["rgba(99, 102, 241, 0.9)", "rgba(34, 197, 94, 0.9)"],
    };
  }

  if (mode === "damage") {
    return {
      labels: ["Com avaria", "Sem avaria"],
      values: [datasets.damage.withDamage, datasets.damage.withoutDamage],
      colors: ["rgba(239, 68, 68, 0.35)", "rgba(148, 163, 184, 0.3)"],
      borders: ["rgba(239, 68, 68, 0.9)", "rgba(148, 163, 184, 0.9)"],
    };
  }

  return {
    labels: ["Cheio (Origem)", "Cheio (Próprio)", "Vazio (Origem)", "Vazio (Próprio)"],
    values: [
      datasets.occupancy.fullOrigin,
      datasets.occupancy.fullOwned,
      datasets.occupancy.emptyOrigin,
      datasets.occupancy.emptyOwned,
    ],
    colors: [
      "rgba(245, 158, 11, 0.4)",  // Laranja médio (Full Origin)
      "rgba(180, 83, 9, 0.4)",   // Laranja escuro (Full Owned)
      "rgba(59, 130, 246, 0.3)", // Azul médio (Empty Origin)
      "rgba(29, 78, 216, 0.3)",  // Azul escuro (Empty Owned)
    ],
    borders: [
      "rgba(245, 158, 11, 0.9)",
      "rgba(180, 83, 9, 0.9)",
      "rgba(59, 130, 246, 0.9)",
      "rgba(29, 78, 216, 0.9)",
    ],
  };
}

export function PatioDistributionPieChart({
  mode,
  datasets,
  isLoading,
}: {
  mode: PatioDistributionMode;
  datasets: PatioDistributionDatasets;
  isLoading: boolean;
}) {
  const chart = useMemo(() => {
    const { labels, values, colors, borders } = toChart(mode, datasets);

    return {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: colors,
          borderColor: borders,
          borderWidth: 1,
          hoverOffset: 4,
        },
      ],
    };
  }, [mode, datasets]);

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: "65%",
      plugins: {
        legend: { position: "bottom" as const, labels: { boxWidth: 10, font: { size: 11 } } },
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
      <Doughnut data={chart} options={options as never} />
    </div>
  );
}

