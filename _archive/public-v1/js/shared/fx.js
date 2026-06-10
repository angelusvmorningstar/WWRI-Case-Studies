/**
 * fx.js — Currency conversion utility
 *
 * Converts foreign currency amounts to AUD using stored FX rates.
 * Rates are multipliers: amountAUD = amountForeign * rate.
 */

import { get } from './store.js';

/**
 * Convert an amount from a foreign currency to AUD.
 * @param {number} amount - Amount in the source currency
 * @param {string} fromCurrency - Source currency code (e.g., 'EUR', 'USD')
 * @returns {number} Amount in AUD
 */
function convertToAUD(amount, fromCurrency) {
  if (!amount || !fromCurrency) {
    return amount || 0;
  }

  const code = fromCurrency.toLowerCase();

  if (code === 'aud') {
    return amount;
  }

  const rates = get('fxRates');
  if (!rates) {
    return amount;
  }

  const rate = rates[code];
  if (!rate) {
    return amount;
  }

  return amount * rate;
}

export { convertToAUD };
