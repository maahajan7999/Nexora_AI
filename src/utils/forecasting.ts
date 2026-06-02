import type { ParsedData, ForecastData } from '../types';
import { detectNumericColumns, getColumnStats } from './dataAnalysis';
import { formatINRSmart, formatINRAbbreviated } from './formatters';

/**
 * Simple linear regression forecasting
 * y = mx + b where m is slope and b is intercept
 */
function linearRegression(data: number[]): { slope: number; intercept: number } {
  const n = data.length;
  if (n === 0) return { slope: 0, intercept: 0 };

  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

  data.forEach((y, x) => {
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  });

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX) || 0;
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

/**
 * Calculate standard deviation for confidence intervals
 */
function standardDeviation(data: number[]): number {
  if (data.length === 0) return 0;
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const squareDiffs = data.map(value => Math.pow(value - mean, 2));
  return Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / data.length);
}

/**
 * Generate forecast for a numeric column
 */
export function generateForecast(data: ParsedData, periodsAhead = 6): ForecastData[] {
  const numCols = detectNumericColumns(data);
  if (numCols.length === 0) return [];

  const mainCol = numCols.includes('Revenue') ? 'Revenue' :
                  numCols.includes('Profit') ? 'Profit' : numCols[0];

  const stats = getColumnStats(data, mainCol);
  if (!stats) return [];

  const values = stats.values;
  if (values.length < 3) return [];

  const { slope, intercept } = linearRegression(values);
  const stdDev = standardDeviation(values);
  const confidence = stdDev * 1.5;

  // Use last actual values for historical, forecast for future
  const historicalPoints = Math.min(6, values.length);
  const result: ForecastData[] = [];

  // Historical data points
  const step = Math.max(1, Math.floor(values.length / historicalPoints));
  for (let i = 0; i < values.length; i += step) {
    const x = i + values.length; // Offset to align with forecast
    result.push({
      name: `P${Math.floor(i / step) + 1}`,
      actual: values[i],
      forecast: 0,
      upper: 0,
      lower: 0,
    });
  }

  // Forecast periods
  const lastIdx = values.length;
  for (let i = 1; i <= periodsAhead; i++) {
    const x = lastIdx + i - 1;
    const forecastValue = Math.max(0, slope * x + intercept);
    result.push({
      name: `F${i}`,
      actual: 0,
      forecast: forecastValue,
      upper: Math.max(0, forecastValue + confidence),
      lower: Math.max(0, forecastValue - confidence),
    });
  }

  return result;
}

/**
 * Generate forecast summary text
 */
export function generateForecastSummary(data: ParsedData): {
  revenueGrowth: string;
  profitGrowth: string;
  confidence: string;
  recommendation: string;
} {
  const numCols = detectNumericColumns(data);
  if (numCols.length === 0) {
    return {
      revenueGrowth: 'N/A',
      profitGrowth: 'N/A',
      confidence: 'Low - Insufficient data',
      recommendation: 'Upload more data to enable forecasting',
    };
  }

  const revenueCol = numCols.includes('Revenue') ? 'Revenue' : numCols[0];
  const profitCol = numCols.includes('Profit') ? 'Profit' : null;

  const revenueStats = getColumnStats(data, revenueCol);
  const profitStats = profitCol ? getColumnStats(data, profitCol) : null;

  if (!revenueStats) {
    return {
      revenueGrowth: 'N/A',
      profitGrowth: 'N/A',
      confidence: 'Low - Data quality issues',
      recommendation: 'Check data for missing or invalid values',
    };
  }

  const revenueReg = linearRegression(revenueStats.values);
  const nextRevenue = Math.max(0, revenueReg.slope * revenueStats.values.length + revenueReg.intercept);
  const currentRevenue = revenueStats.values[revenueStats.values.length - 1];
  const revenueGrowthPct = currentRevenue !== 0 ? ((nextRevenue - currentRevenue) / Math.abs(currentRevenue)) * 100 : 0;

  const profitGrowthPct = profitStats ? (() => {
    const profitReg = linearRegression(profitStats.values);
    const nextProfit = Math.max(0, profitReg.slope * profitStats.values.length + profitReg.intercept);
    const currentProfit = profitStats.values[profitStats.values.length - 1];
    return currentProfit !== 0 ? ((nextProfit - currentProfit) / Math.abs(currentProfit)) * 100 : 0;
  })() : 0;

  const stdDev = standardDeviation(revenueStats.values);
  const mean = revenueStats.mean;
  const cv = mean !== 0 ? (stdDev / mean) : 0;
  const confidenceLevel = cv < 0.3 ? 'High' : cv < 0.6 ? 'Medium' : 'Low';

  let recommendation = '';
  if (revenueGrowthPct > 10) {
    recommendation = `Revenue is trending upward with ${revenueGrowthPct.toFixed(0)}% projected growth. Consider expanding inventory and marketing spend to capitalize on momentum.`;
  } else if (revenueGrowthPct < -10) {
    recommendation = `Revenue shows declining trend (${revenueGrowthPct.toFixed(0)}%). Immediate action recommended: analyze customer churn, reduce costs, and identify new revenue streams.`;
  } else {
    recommendation = `Revenue is stable with modest ${revenueGrowthPct >= 0 ? '+' : ''}${revenueGrowthPct.toFixed(1)}% projected change. Focus on incremental improvements and efficiency gains.`;
  }

  return {
    revenueGrowth: `${revenueGrowthPct >= 0 ? '+' : ''}${revenueGrowthPct.toFixed(1)}% (${formatINRAbbreviated(Math.abs(nextRevenue - currentRevenue))})`,
    profitGrowth: profitStats ? `${profitGrowthPct >= 0 ? '+' : ''}${profitGrowthPct.toFixed(1)}%` : 'N/A',
    confidence: `${confidenceLevel} confidence (CV: ${(cv * 100).toFixed(0)}%)`,
    recommendation,
  };
}

/**
 * Get forecast metrics for KPI tabs
 */
export function getForecastMetrics(data: ParsedData): { label: string; value: string; trend: 'up' | 'down' | 'neutral' }[] {
  const numCols = detectNumericColumns(data);
  if (numCols.length === 0) return [];

  const metrics: { label: string; value: string; trend: 'up' | 'down' | 'neutral' }[] = [];

  const revenueCol = numCols.includes('Revenue') ? 'Revenue' : numCols[0];
  const revenueStats = getColumnStats(data, revenueCol);

  if (revenueStats) {
    const reg = linearRegression(revenueStats.values);
    const forecast = Math.max(0, reg.slope * revenueStats.values.length + reg.intercept);
    const current = revenueStats.values[revenueStats.values.length - 1];
    const growth = current !== 0 ? ((forecast - current) / Math.abs(current)) * 100 : 0;

    metrics.push({
      label: 'Revenue Forecast (Next Month)',
      value: formatINRSmart(forecast),
      trend: growth >= 0 ? 'up' : 'down',
    });

    metrics.push({
      label: 'Projected Growth',
      value: `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`,
      trend: growth >= 0 ? 'up' : 'down',
    });
  }

  if (numCols.includes('Profit')) {
    const profitStats = getColumnStats(data, 'Profit');
    if (profitStats) {
      const reg = linearRegression(profitStats.values);
      const forecast = Math.max(0, reg.slope * profitStats.values.length + reg.intercept);
      const current = profitStats.values[profitStats.values.length - 1];
      const growth = current !== 0 ? ((forecast - current) / Math.abs(current)) * 100 : 0;

      metrics.push({
        label: 'Profit Forecast (Next Month)',
        value: formatINRSmart(forecast),
        trend: growth >= 0 ? 'up' : 'down',
      });
    }
  }

  return metrics;
}
