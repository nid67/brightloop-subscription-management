import { APP_CONFIG } from '../config.js';

let currentCurrency = localStorage.getItem('brightloop_currency') || APP_CONFIG.defaultCurrency;

export function getCurrentCurrency() {
  return currentCurrency;
}

export function setCurrentCurrency(currencyCode) {
  currentCurrency = currencyCode;
  localStorage.setItem('brightloop_currency', currencyCode);
  window.dispatchEvent(new CustomEvent('currency-changed', { detail: { currency: currencyCode } }));
}

export function formatCurrency(amount, options = {}) {
  const num = Number(amount) || 0;
  const target = options.currency || currentCurrency;
  const currencyObj = APP_CONFIG.supportedCurrencies.find(c => c.code === target) || APP_CONFIG.supportedCurrencies[0];
  
  // Base numbers in DB are stored in INR
  const converted = target === 'INR' ? num : num * currencyObj.rate;

  if (target === 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: options.decimals !== undefined ? options.decimals : 0
    }).format(converted);
  } else if (target === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: options.decimals !== undefined ? options.decimals : 2
    }).format(converted);
  } else if (target === 'EUR') {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: options.decimals !== undefined ? options.decimals : 2
    }).format(converted);
  }

  return `${currencyObj.symbol}${converted.toLocaleString()}`;
}

export function getCurrencySymbol() {
  const currencyObj = APP_CONFIG.supportedCurrencies.find(c => c.code === currentCurrency);
  return currencyObj ? currencyObj.symbol : '₹';
}
