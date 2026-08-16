/**
 * Meyar Platform - Core Utilities
 * Standardized sanitization and helper functions
 */

/**
 * Escapes unsafe HTML characters to prevent XSS injection.
 * @param {any} str - The input string or value to sanitize
 * @returns {string} Safe escaped HTML string
 */
export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  const text = String(str);
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Formats numeric quantities cleanly with fractions.
 * @param {number} val - Quantity value
 * @returns {string} Formatted quantity
 */
export function formatQuantity(val) {
  if (val === null || val === undefined || isNaN(val)) return '0';
  if (val === Math.round(val)) return val.toString();
  const fractions = { 0.125: '⅛', 0.25: '¼', 0.33: '⅓', 0.375: '⅜', 0.5: '½', 0.625: '⅝', 0.66: '⅔', 0.75: '¾', 0.875: '⅞' };
  const whole = Math.floor(val);
  const decimal = Math.round((val - whole) * 1000) / 1000;

  for (const [dec, frac] of Object.entries(fractions)) {
    if (Math.abs(decimal - parseFloat(dec)) < 0.04) {
      return whole > 0 ? `${whole} ${frac}` : frac;
    }
  }
  return val.toFixed(1);
}

/**
 * Checks whether an entity belongs to the active user.
 * @param {string} entityId - Entity identity to compare
 * @param {Object} currentUser - Active user record
 * @returns {boolean} Whether the entity belongs to the active user
 */
export function isCurrentUserId(entityId, currentUser) {
  return Boolean(entityId && currentUser?.id && entityId === currentUser.id);
}
