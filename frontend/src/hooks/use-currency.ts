import { useAuthStore } from '@/lib/auth-store';

export function useCurrency() {
    const { tenant } = useAuthStore();

    // Extract currency and country from tenant settings, defaulting if not set
    const currencyCode = tenant?.settings?.currency || 'USD';
    const countryCode = tenant?.settings?.country || 'US';

    // Determine locale based on country for proper formatting (e.g. en-IN vs en-US)
    const getLocale = (country: string) => {
        switch (country.toUpperCase()) {
            case 'IN': return 'en-IN';
            case 'UK':
            case 'GB': return 'en-GB';
            case 'AE': return 'en-AE'; // Using English-UAE for cleaner 'AED' symbol in English UI
            case 'EU': return 'de-DE'; // Generic EU fallback
            case 'US':
            default: return 'en-US';
        }
    };

    const locale = getLocale(countryCode);

    const format = (amount: number | string | undefined | null) => {
        if (amount === undefined || amount === null) return '';
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;

        if (isNaN(num)) return '';

        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currencyCode,
            minimumFractionDigits: 2,
        }).format(num);
    };

    return { format, currency: currencyCode, country: countryCode };
}
