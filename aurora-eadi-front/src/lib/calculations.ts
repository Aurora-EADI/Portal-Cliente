import { ServiceCalculationType } from '@/types';

export interface CalculationData {
    cifBrl: number;
    tonnes: number;
    cntrCount: number;
    weightKg?: number;
    volumeM3?: number;
}

export const calculateServiceCost = (
    rate: number,
    calculationType: ServiceCalculationType,
    data: CalculationData
): number => {
    switch (calculationType) {
        case ServiceCalculationType.FIXED:
            return rate;
        case ServiceCalculationType.PERCENTAGE_CIF:
            return (rate / 100) * data.cifBrl;
        case ServiceCalculationType.PER_CONTAINER:
            return rate * data.cntrCount;
        case ServiceCalculationType.PER_TONNE:
            // Regra: Maior entre toneladas (peso/1000) e volume (m3), sempre arredondando a unidade para cima (tonelada/m3 ou fração)
            const t = data.tonnes || (data.weightKg ? data.weightKg / 1000 : 0);
            const v = data.volumeM3 || 0;
            const unit = Math.max(t, v);
            return rate * Math.ceil(unit);
        case ServiceCalculationType.PER_KG:
            return rate * (data.weightKg || 1);
        default:
            return rate;
    }
};
