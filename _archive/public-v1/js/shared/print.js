/**
 * print.js — Shared print mode setup/teardown
 *
 * Handles common print preparation used by both finance and pipeline print modules.
 */

/**
 * Trigger browser print dialog.
 */
function triggerPrint() {
  window.print();
}

export { triggerPrint };
