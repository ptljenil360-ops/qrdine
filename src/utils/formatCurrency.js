/**
 * Format a number as Indian Rupees.
 * Always displays as "Rs.XX" with no decimal places.
 *
 * @param {number} amount
 * @returns {string} Formatted currency string
 *
 * @example
 * formatCurrency(4820)  // "Rs.4,820"
 * formatCurrency(0)     // "Rs.0"
 * formatCurrency(null)  // "Rs.0"
 */
export function formatCurrency(amount) {
  if (amount == null || isNaN(amount)) return 'Rs.0'
  const value = Math.max(0, Math.round(amount))
  return `Rs.${value.toLocaleString('en-IN')}`
}

/**
 * Calculate bill totals with GST and discount.
 * From QRDine_Firebase_Setup.md Section 10.
 *
 * @param {Array<{price: number, quantity: number}>} items
 * @param {number} gstRate - 5 or 18
 * @param {number} discountAmount - flat discount in Rs.
 * @returns {{ subtotal, gstRate, gstAmount, discountAmount, grandTotal }}
 */
export function calculateBill(items, gstRate, discountAmount = 0) {
  const subtotal = items.reduce(
    (sum, item) => sum + (item.price * item.quantity), 0
  )
  const gstAmount = Math.round(subtotal * (gstRate / 100))
  const grandTotal = subtotal + gstAmount - discountAmount

  return {
    subtotal,
    gstRate,
    gstAmount,
    discountAmount,
    grandTotal: Math.max(grandTotal, 0),
  }
}
