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
export const parseLocaleNumber = (stringNumber: string): number => {
    if (!stringNumber) return 0;
    // Replace comma with dot for standard parseFloat
    const cleanNumber = stringNumber.replace(',', '.');
    return parseFloat(cleanNumber);
};
