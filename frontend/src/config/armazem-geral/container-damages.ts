import { MultiSelectGroup } from "@/components/ui/GroupedMultiSelect";

type DamageOption = { value: string; label: string };

const structuralDamages = ["Amassado", "Furado", "Cortado", "Corrosão"] as const;
const looseOrMissingDamages = ["Amassado", "Quebrado", "Solto", "Faltando"] as const;
const rubberDamages = ["Quebrado", "Cortado", "Solto", "Faltando"] as const;

function makeOption(group: string, subgroup: string, damage: string): DamageOption {
  const label = `${group} - ${subgroup}: ${damage}`;
  return { value: label, label };
}

function makeSubgroup(group: string, subgroup: string, damages: readonly string[]) {
  return {
    label: subgroup,
    options: damages.map((damage) => makeOption(group, subgroup, damage)),
  };
}

export const CONTAINER_DAMAGE_GROUPS: MultiSelectGroup[] = [
  {
    label: "Esquerdo",
    subgroups: [
      makeSubgroup("Esquerdo", "Painel", structuralDamages),
      makeSubgroup("Esquerdo", "Longarina Inf.", structuralDamages),
      makeSubgroup("Esquerdo", "Longarina Sup.", structuralDamages),
      makeSubgroup("Esquerdo", "Montante", structuralDamages),
      makeSubgroup("Esquerdo", 'Barra "J"', structuralDamages),
      makeSubgroup("Esquerdo", "Supor. Ventilação", looseOrMissingDamages),
      makeSubgroup("Esquerdo", "Teto", structuralDamages),
    ],
  },
  {
    label: "Traseira",
    subgroups: [
      makeSubgroup("Traseira", "Porta", structuralDamages),
      makeSubgroup("Traseira", "Borracha", rubberDamages),
      makeSubgroup("Traseira", "Longarina Inf.", structuralDamages),
      makeSubgroup("Traseira", "Longarina Sup.", structuralDamages),
      makeSubgroup("Traseira", "Batedor de Porta", looseOrMissingDamages),
      makeSubgroup("Traseira", "Alavanca", looseOrMissingDamages),
      makeSubgroup("Traseira", "Painel", structuralDamages),
    ],
  },
  {
    label: "Frontal",
    subgroups: [
      makeSubgroup("Frontal", "Painel", structuralDamages),
      makeSubgroup("Frontal", "Longarina Inf.", structuralDamages),
      makeSubgroup("Frontal", "Longarina Sup.", structuralDamages),
      makeSubgroup("Frontal", "Trava da Alavanca", looseOrMissingDamages),
      makeSubgroup("Frontal", "Haste", looseOrMissingDamages),
      makeSubgroup("Frontal", "Suporte da Haste", looseOrMissingDamages),
    ],
  },
  {
    label: "Direito",
    subgroups: [
      makeSubgroup("Direito", "Painel", structuralDamages),
      makeSubgroup("Direito", "Longarina Inf.", structuralDamages),
      makeSubgroup("Direito", "Longarina Sup.", structuralDamages),
      makeSubgroup("Direito", "Montante", structuralDamages),
      makeSubgroup("Direito", 'Barra "J"', structuralDamages),
      makeSubgroup("Direito", "Supor. Ventilação", looseOrMissingDamages),
      makeSubgroup("Direito", "Teto", structuralDamages),
    ],
  },
];

