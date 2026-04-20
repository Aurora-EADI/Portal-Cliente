/**
 * Utility to parse date strings from the API (ISO or BR format) 
 * and return a local Date object representing the calendar day,
 * avoiding timezone shifts.
 */
export const parseLocaleDate = (dateStr: string | null | undefined): Date | null => {
    if (!dateStr) return null;

    // 1. Try to match YYYY-MM-DD (ISO date part)
    const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
        const [, y, m, d] = isoMatch;
        return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    }

    // 2. Try to match DD/MM/YYYY (PT-BR format)
    const brMatch = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (brMatch) {
        const [, d, m, y] = brMatch;
        return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    }

    // Fallback (forces local day by removing timezone then adding T12:00:00)
    const datePart = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const date = new Date(datePart + 'T12:00:00');
    return isNaN(date.getTime()) ? null : date;
};

/**
 * Formats a date string or Date object to DD/MM/YYYY
 */
export const formatDateBR = (date: string | Date | null | undefined): string => {
    if (!date) return '-';
    const dateObj = typeof date === 'string' ? parseLocaleDate(date) : date;

    if (!dateObj || isNaN(dateObj.getTime())) return typeof date === 'string' ? date : '-';

    return dateObj.toLocaleDateString('pt-BR');
};
