import { Service, ServiceCalculationType } from '@/types';

export interface CalculationData {
    cifBrl: number;
    tonnes: number;
    cntrCount: number;
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
            return rate * Math.ceil(data.tonnes / 1000);
        default:
            return rate;
    }
};
