import { CURRENCIES, Currency } from '../types';

export const getDefaultCurrency = (): Currency => {
  return CURRENCIES[0]; // MYR (RM)
};

export const getCurrencyByCode = (code: string): Currency => {
  return CURRENCIES.find(c => c.code === code) || getDefaultCurrency();
};

export const convertToBaseCurrency = (
  amount: number,
  fromCurrencyCode: string
): number => {
  const currency = getCurrencyByCode(fromCurrencyCode);
  if (currency.code === 'MYR') return amount;
  // Convert from foreign currency to MYR
  return amount / currency.rate;
};

export const convertFromBaseCurrency = (
  amount: number,
  toCurrencyCode: string
): number => {
  const currency = getCurrencyByCode(toCurrencyCode);
  if (currency.code === 'MYR') return amount;
  // Convert from MYR to foreign currency
  return amount * currency.rate;
};

export const formatCurrencyWithCode = (
  amount: number,
  currencyCode: string = 'MYR'
): string => {
  const currency = getCurrencyByCode(currencyCode);
  
  // Format number based on currency
  let formattedAmount: string;
  
  if (currency.code === 'JPY' || currency.code === 'IDR') {
    // No decimal places for JPY and IDR
    formattedAmount = Math.round(amount).toLocaleString('en-US');
  } else {
    formattedAmount = amount.toFixed(2);
  }
  
  return `${currency.symbol}${formattedAmount}`;
};

export const formatMultiCurrency = (
  baseAmount: number,
  originalAmount?: number,
  originalCurrency?: string
): string => {
  const baseCurrency = getDefaultCurrency();
  const formattedBase = formatCurrencyWithCode(baseAmount, 'MYR');
  
  if (originalAmount && originalCurrency && originalCurrency !== 'MYR') {
    const formattedOriginal = formatCurrencyWithCode(originalAmount, originalCurrency);
    return `${formattedBase} (${formattedOriginal})`;
  }
  
  return formattedBase;
};

export const formatWithDisplayCurrency = (
  baseAmount: number,
  displayCurrencyCode: string
): string => {
  if (displayCurrencyCode === 'MYR') {
    return formatCurrencyWithCode(baseAmount, 'MYR');
  }
  
  // Convert from MYR to display currency
  const displayAmount = convertFromBaseCurrency(baseAmount, displayCurrencyCode);
  return formatCurrencyWithCode(displayAmount, displayCurrencyCode);
};