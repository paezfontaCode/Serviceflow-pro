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
    return new Intl.NumberFormat('es-VE', {
        style: 'currency',
        currency: 'VES',
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
