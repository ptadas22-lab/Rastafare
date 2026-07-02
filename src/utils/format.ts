/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Formats a number as Indian Rupees (INR) with proper grouping (e.g., ₹ 1,50,000.00)
 */
export function formatINR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₹ 0.00';
  }
  
  // Format to 2 decimal places first
  const fixedAmt = amount.toFixed(2);
  const parts = fixedAmt.split('.');
  let lastThree = parts[0].substring(parts[0].length - 3);
  const otherParts = parts[0].substring(0, parts[0].length - 3);
  
  if (otherParts !== '') {
    lastThree = ',' + lastThree;
  }
  
  const formattedInt = otherParts.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;
  return `₹ ${formattedInt}.${parts[1]}`;
}

/**
 * Formats a date into a clean, human-readable format
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch (e) {
    return dateStr;
  }
}
