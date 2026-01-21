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
            // Excel style: ROUNDUP(val; -3) / 1000 -> Math.ceil(val / 1000)
            // Note: data.tonnes is already in tonnes (kg/1000), so we just round up.
            return rate * Math.ceil(data.tonnes);
        case ServiceCalculationType.PER_KG:
            return rate * (data.weightKg || 1);
        case ServiceCalculationType.PER_TONNE_OR_M3:
            const tonnes = (data.weightKg || 0) / 1000;
            const volumeM3 = data.volumeM3 || 0;
            return rate * Math.max(tonnes, volumeM3);
        default:
            return rate;
    }
};
