/**
 * Currency Utility for Serviceflow Pro
 * Handles formatting for USD and VES with dual-display support
 */

export const formatUSD = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
};

export const formatVES = (amount: number) => {
    // Specifically force Venezuelan format: 1.234,56
    return new Intl.NumberFormat('es-VE', {
        style: 'currency',
        currency: 'VES',
        minimumFractionDigits: 2,
    }).format(amount);
};

export const formatDual = (amountUSD: number, rate: number) => {
    const amountVES = amountUSD * rate;
    return `${formatUSD(amountUSD)} | ${formatVES(amountVES)}`;
};

export const calculateToVES = (amountUSD: number, rate: number) => {
    return amountUSD * rate;
};

export const calculateToUSD = (amountVES: number, rate: number) => {
    return amountVES / rate;
};

/**
 * Formats exchange rate for display, ensuring dot for thousands and comma for decimals
 */
export const formatExchangeRate = (rate: number) => {
    return new Intl.NumberFormat('es-VE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4, // rates often have more decimals
    }).format(rate);
};

/**
 * Parses a string that may contain a comma as decimal separator.
 * Useful for manual rate inputs in the frontend.
 */
export const parseLocaleNumber = (stringNumber: string | number): number => {
    if (stringNumber === null || stringNumber === undefined || stringNumber === '') return 0;
    if (typeof stringNumber === 'number') return stringNumber;

    // 1. Remove any whitespace
    let clean = stringNumber.toString().trim();

    // 2. Identify separators
    const hasComma = clean.includes(',');
    const hasDot = clean.includes('.');

    // Case A: Both dot and comma are present (e.g., 1.234,56 or 1,234.56)
    if (hasComma && hasDot) {
        const lastCommaIndex = clean.lastIndexOf(',');
        const lastDotIndex = clean.lastIndexOf('.');

        if (lastCommaIndex > lastDotIndex) {
            // Probably 1.234,56 -> remove dots, replace comma with dot
            clean = clean.replace(/\./g, '').replace(',', '.');
        } else {
            // Probably 1,234.56 -> remove commas
            clean = clean.replace(/,/g, '');
        }
    }
    // Case B: Only one dot (simple decimal or thousand separator?)
    else if (hasDot && !hasComma) {
        // If it looks like 390.000 it might be thousands. 
        // But if it's 390.00 it's definitely decimals.
        // Heuristic: If there are 3 digits after the dot AND no other punctuation, it's ambiguous.
        // For ServiceFlow Exchange rates, they usually have 2-4 decimals.
        const parts = clean.split('.');
        if (parts[1].length === 3 && parts[0].length >= 1) {
            // Ambiguous, but in many Latin American contexts "1.000" is 1 thousand.
            // However, most JS users type "." as decimal.
            // We'll trust the dot as decimal unless it looks exactly like thousands only.
        }
    }
    // Case C: Only comma (definitely decimal in Latin context)
    else if (hasComma && !hasDot) {
        clean = clean.replace(',', '.');
    }

    const result = parseFloat(clean);
    return isNaN(result) ? 0 : result;
};
