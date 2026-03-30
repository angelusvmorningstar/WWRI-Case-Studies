/**
 * format.js — Number, currency, date, and percentage formatting
 *
 * All user-facing display formatting goes through this module.
 * No toFixed(), toLocaleString(), or manual formatting elsewhere.
 */

const CURRENCY_SYMBOLS = {
  AUD: '$',
  USD: 'US$',
  EUR: '€',
  GBP: '£',
  SGD: 'S$'
};

/**
 * Format a number as currency with symbol, thousands separators, and 2 decimal places.
 * @param {number} amount - The numeric value
 * @param {string} [currency='AUD'] - Currency code (AUD, EUR, USD, GBP, SGD)
 * @returns {string} Formatted string, e.g. "$1,234.56" or "-$1,234.56"
 */
function formatCurrency(amount, currency = 'AUD') {
  const symbol = CURRENCY_SYMBOLS[currency.toUpperCase()] || '$';
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  const parts = absAmount.toFixed(2).split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const formatted = `${symbol}${intPart}.${parts[1]}`;

  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Format a decimal value as a percentage string.
 * @param {number} value - Decimal value (e.g., 0.15)
 * @returns {string} Percentage string (e.g., "15%")
 */
function formatPercent(value) {
  const pct = Math.round(value * 100);
  return `${pct}%`;
}

/**
 * Format an ISO date string as a human-readable date.
 * @param {string} isoString - ISO date string (e.g., "2026-03-30")
 * @returns {string} Formatted date (e.g., "30 Mar 2026")
 */
function formatDate(isoString) {
  if (!isoString) {
    return '—';
  }

  const date = new Date(isoString);
  if (isNaN(date.getTime())) {
    return '—';
  }

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = date.getUTCDate();
  const month = months[date.getUTCMonth()];
  const year = date.getUTCFullYear();

  return `${day} ${month} ${year}`;
}

/**
 * Format an ISO date string as short month-year (used in table column headers).
 * @param {string} isoString - ISO date string (e.g., "2026-03-30")
 * @returns {string} Short month-year (e.g., "Mar-26")
 */
function formatMonthYear(isoString) {
  if (!isoString) {
    return '—';
  }

  const date = new Date(isoString);
  if (isNaN(date.getTime())) {
    return '—';
  }

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getUTCMonth()];
  const year = String(date.getUTCFullYear()).slice(-2);

  return `${month}-${year}`;
}

/**
 * Format a number with thousands separators (no currency symbol).
 * @param {number} value - The numeric value
 * @param {number} [decimals=0] - Decimal places
 * @returns {string} Formatted number (e.g., "1,234" or "1,234.56")
 */
function formatNumber(value, decimals = 0) {
  const parts = Math.abs(value).toFixed(decimals).split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const formatted = decimals > 0 ? `${intPart}.${parts[1]}` : intPart;

  return value < 0 ? `-${formatted}` : formatted;
}

export { formatCurrency, formatPercent, formatDate, formatMonthYear, formatNumber };
