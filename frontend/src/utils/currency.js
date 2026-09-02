export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar ($)' },
  { code: 'EUR', symbol: '€', name: 'Euro (€)' },
  { code: 'GBP', symbol: '£', name: 'British Pound (£)' },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso (₱)' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen (¥)' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won (₩)' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar (CA$)' },
  { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar (AU$)' },
  { code: 'SGD', symbol: 'SG$', name: 'Singapore Dollar (SG$)' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar (HK$)' },
  { code: 'TWD', symbol: 'NT$', name: 'New Taiwan Dollar (NT$)' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee (₹)' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht (฿)' },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong (₫)' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit (RM)' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah (Rp)' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real (R$)' },
  { code: 'MXN', symbol: 'Mex$', name: 'Mexican Peso (Mex$)' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc (CHF)' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham (AED)' },
  { code: 'SAR', symbol: 'SAR', name: 'Saudi Riyal (SAR)' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar (NZ$)' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona (kr)' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone (kr)' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Zloty (zł)' },
];

export function getCurrencySymbol(code = 'USD') {
  if (!code) return '$';
  const cleanCode = code.trim().toUpperCase();
  const match = CURRENCIES.find((c) => c.code === cleanCode);
  if (match) return match.symbol;

  // Fallback if ISO code is valid 3 letters
  try {
    const formatter = new Intl.NumberFormat('en', { style: 'currency', currency: cleanCode });
    const parts = formatter.formatToParts(0);
    const sym = parts.find((p) => p.type === 'currency');
    return sym ? sym.value : cleanCode;
  } catch {
    return cleanCode;
  }
}

export function formatMoney(amount = 0, currencyCode = 'USD') {
  const symbol = getCurrencySymbol(currencyCode);
  const num = Number(amount) || 0;
  
  // Currencies without decimals (e.g. JPY, KRW, VND)
  const noDecimalCurrencies = ['JPY', 'KRW', 'VND', 'IDR'];
  if (noDecimalCurrencies.includes((currencyCode || '').toUpperCase())) {
    return `${symbol}${Math.round(num).toLocaleString()}`;
  }

  return `${symbol}${num.toFixed(2)}`;
}
