// Utility functions for month-based booking validation (Nepal-style room renting)

/**
 * Calculate number of months between two YYYY-MM strings
 * @param {string} startMonth - Format: "YYYY-MM"
 * @param {string} endMonth - Format: "YYYY-MM"
 * @returns {number} Number of months (minimum 1)
 */
export function calculateMonths(startMonth, endMonth) {
  const [startYear, startMonthNum] = startMonth.split('-').map(Number);
  const [endYear, endMonthNum] = endMonth.split('-').map(Number);
  
  const monthsDiff = (endYear - startYear) * 12 + (endMonthNum - startMonthNum);
  return Math.max(1, monthsDiff);
}

/**
 * Check if two month ranges overlap
 * @param {string} start1 - Start month of range 1 (YYYY-MM)
 * @param {string} end1 - End month of range 1 (YYYY-MM)
 * @param {string} start2 - Start month of range 2 (YYYY-MM)
 * @param {string} end2 - End month of range 2 (YYYY-MM)
 * @returns {boolean} True if ranges overlap
 */
export function monthsOverlap(start1, end1, start2, end2) {
  // Compare months as strings (YYYY-MM format allows lexicographic comparison)
  return start1 <= end2 && start2 <= end1;
}

/**
 * Validate month string format (YYYY-MM)
 * @param {string} month - Month string to validate
 * @returns {boolean} True if valid format
 */
export function isValidMonthFormat(month) {
  const regex = /^\d{4}-\d{2}$/;
  if (!regex.test(month)) return false;
  
  const [year, monthNum] = month.split('-').map(Number);
  return year >= 2000 && year <= 2100 && monthNum >= 1 && monthNum <= 12;
}

