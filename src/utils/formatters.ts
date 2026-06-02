/**
 * Indian Financial Formatting Utilities
 * Uses Indian numbering system: Lakhs (1,00,000) and Crores (1,00,00,000)
 */

/**
 * Format number using Indian numbering system with commas
 * Examples: 1,000 | 10,000 | 1,00,000 | 10,00,000 | 1,00,00,000
 */
export function formatIndianNumber(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

/**
 * Format as Indian currency with ₹ symbol
 * Examples: ₹1,000 | ₹10,000 | ₹1,00,000 | ₹10,00,000
 */
export function formatINR(value: number, showPaise = false): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: showPaise ? 2 : 0,
    minimumFractionDigits: showPaise ? 2 : 0,
  }).format(value);
}

/**
 * Format large numbers with Indian abbreviations (Lakh/Cr)
 * Examples:
 *   45,000 → ₹45,000
 *   4,50,000 → ₹4.5 Lakh
 *   1,20,00,000 → ₹1.2 Cr
 *   18,40,00,000 → ₹18.4 Cr
 */
export function formatINRAbbreviated(value: number): string {
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  // Less than 1 Lakh - show full number
  if (absValue < 1_00_000) {
    return `${sign}₹${formatIndianNumber(absValue)}`;
  }

  // 1 Lakh to 99.99 Lakhs - show as Lakhs
  if (absValue < 1_00_00_000) {
    const lakhs = absValue / 1_00_000;
    const formatted = lakhs % 1 === 0 ? lakhs.toFixed(0) : lakhs.toFixed(1);
    return `${sign}₹${formatted} Lakh`;
  }

  // 1 Crore and above - show as Crores
  const crores = absValue / 1_00_00_000;
  const formatted = crores % 1 === 0 ? crores.toFixed(0) : crores.toFixed(1);
  return `${sign}₹${formatted} Cr`;
}

/**
 * Smart format - chooses abbreviated or full based on context
 * Use abbreviated for large values, full for smaller values
 */
export function formatINRSmart(value: number, threshold = 1_00_000): string {
  const absValue = Math.abs(value);
  if (absValue >= threshold) {
    return formatINRAbbreviated(value);
  }
  return formatINR(value);
}

/**
 * Format value with appropriate suffix (no symbol)
 * Useful for chart axes and compact displays
 */
export function formatCompactIndian(value: number): string {
  const absValue = Math.abs(value);

  if (absValue >= 1_00_00_000) {
    const crores = absValue / 1_00_00_000;
    return `${crores.toFixed(1)} Cr`;
  }
  if (absValue >= 1_00_000) {
    const lakhs = absValue / 1_00_000;
    return `${lakhs.toFixed(1)} L`;
  }
  if (absValue >= 1000) {
    const thousands = absValue / 1000;
    return `${thousands.toFixed(1)}K`;
  }
  return absValue.toFixed(0);
}

/**
 * Format for chart tooltips with full Indian formatting
 */
export function formatTooltipINR(value: number): string {
  const absValue = Math.abs(value);
  if (absValue >= 1_00_00_000) {
    const crores = absValue / 1_00_00_000;
    return `₹${crores.toFixed(2)} Cr`;
  }
  if (absValue >= 1_00_000) {
    const lakhs = absValue / 1_00_000;
    return `₹${lakhs.toFixed(2)} Lakh`;
  }
  return formatINR(absValue);
}

/**
 * Format percentage with Indian style decimals
 */
export function formatPercentage(value: number, decimals = 1): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

/**
 * Parse Indian number string back to number
 * Handles both comma-separated and Lakh/Cr abbreviations
 */
export function parseIndianNumber(str: string): number {
  const cleaned = str.replace(/[₹,\s]/g, '').toLowerCase();

  if (cleaned.includes('cr')) {
    const num = parseFloat(cleaned.replace('cr', ''));
    return isNaN(num) ? 0 : num * 1_00_00_000;
  }
  if (cleaned.includes('lakh') || cleaned.includes('l')) {
    const num = parseFloat(cleaned.replace(/lakh|l/g, ''));
    return isNaN(num) ? 0 : num * 1_00_000;
  }
  if (cleaned.includes('k')) {
    const num = parseFloat(cleaned.replace('k', ''));
    return isNaN(num) ? 0 : num * 1000;
  }

  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Get magnitude descriptor for educational purposes
 */
export function getMagnitudeLabel(value: number): string {
  const absValue = Math.abs(value);
  if (absValue >= 1_00_00_000) return 'Crore';
  if (absValue >= 1_00_000) return 'Lakh';
  if (absValue >= 1000) return 'Thousand';
  return '';
}

/**
 * Format difference with "more/less" phrasing
 * Example: "₹12.5 Lakh more" or "₹50,000 less"
 */
export function formatDifference(value: number): string {
  const formatted = formatINRAbbreviated(Math.abs(value));
  const direction = value >= 0 ? 'more' : 'less';
  return `${formatted} ${direction}`;
}

/**
 * Format revenue/growth with context
 */
export function formatRevenue(value: number, context: 'total' | 'average' | 'growth' = 'total'): { formatted: string; label: string } {
  return {
    formatted: formatINRSmart(value),
    label: context === 'total' ? 'Total Revenue' : context === 'average' ? 'Average Revenue' : 'Revenue Growth',
  };
}
