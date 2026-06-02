import type { ParsedData, KPI, BusinessScore, ComparisonItem } from '../types';
import { formatINRSmart, formatIndianNumber, formatINRAbbreviated } from './formatters';

function isNumeric(val: string | number): boolean {
  if (typeof val === 'number') return !isNaN(val) && isFinite(val);
  const cleaned = String(val).replace(/[$,%\s]/g, '');
  return cleaned !== '' && !isNaN(Number(cleaned)) && isFinite(Number(cleaned));
}

function toNumber(val: string | number): number {
  if (typeof val === 'number') return val;
  return parseFloat(String(val).replace(/[$,%\s]/g, '')) || 0;
}

export function detectNumericColumns(data: ParsedData): string[] {
  return data.headers.filter(h =>
    data.rows.slice(0, 20).filter(r => isNumeric(r[h])).length > data.rows.slice(0, 20).length * 0.6
  );
}

export function detectCategoryColumns(data: ParsedData): string[] {
  const numCols = new Set(detectNumericColumns(data));
  return data.headers.filter(h => {
    if (numCols.has(h)) return false;
    const unique = new Set(data.rows.map(r => r[h]));
    return unique.size > 1 && unique.size <= Math.min(50, data.rows.length * 0.5);
  });
}

export function detectDateColumns(data: ParsedData): string[] {
  return data.headers.filter(h =>
    data.rows.slice(0, 10).filter(r => {
      const v = String(r[h]);
      return !isNaN(Date.parse(v)) && v.length > 4;
    }).length >= 3
  );
}

export function getColumnStats(data: ParsedData, col: string) {
  const vals = data.rows.map(r => toNumber(r[col])).filter(v => !isNaN(v) && isFinite(v));
  if (vals.length === 0) return null;
  const sum = vals.reduce((a, b) => a + b, 0);
  const mean = sum / vals.length;
  const sorted = [...vals].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const variance = vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / vals.length;
  const stdDev = Math.sqrt(variance);
  return { sum, mean, median, min, max, stdDev, count: vals.length, values: vals };
}

export function groupByColumn(data: ParsedData, catCol: string, valCol: string): Record<string, number> {
  const groups: Record<string, number> = {};
  data.rows.forEach(r => {
    const cat = String(r[catCol] ?? 'Unknown');
    const val = toNumber(r[valCol]);
    if (!isNaN(val) && isFinite(val)) {
      groups[cat] = (groups[cat] || 0) + val;
    }
  });
  return groups;
}

function generateSparkline(values: number[], points = 8): number[] {
  if (values.length === 0) return Array(points).fill(0);
  if (values.length <= points) {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    return values.map(v => ((v - min) / range) * 100);
  }
  const step = values.length / points;
  const result: number[] = [];
  for (let i = 0; i < points; i++) {
    const idx = Math.floor(i * step);
    result.push(values[idx]);
  }
  const min = Math.min(...result);
  const max = Math.max(...result);
  const range = max - min || 1;
  return result.map(v => ((v - min) / range) * 100);
}

export function generateKPIs(data: ParsedData): KPI[] {
  const numCols = detectNumericColumns(data);
  const kpis: KPI[] = [];

  const colKeywords: Record<string, string[]> = {
    revenue: ['revenue', 'sales', 'income', 'turnover', 'amount', 'total', 'price', 'gross'],
    profit: ['profit', 'net', 'earnings', 'margin', 'gain', 'ebitda'],
    orders: ['order', 'quantity', 'count', 'units', 'transactions', 'volume'],
    customers: ['customer', 'client', 'user', 'buyer', 'contact', 'account'],
    growth: ['growth', 'increase', 'change', 'delta'],
    cost: ['cost', 'expense', 'spend', 'payment', 'fee'],
  };

  const matched: Record<string, string> = {};
  for (const [kpiType, keywords] of Object.entries(colKeywords)) {
    for (const col of numCols) {
      const lower = col.toLowerCase();
      if (keywords.some(k => lower.includes(k)) && !matched[kpiType]) {
        matched[kpiType] = col;
        break;
      }
    }
  }

  const mainValueCol = matched.revenue || matched.profit || matched.orders || numCols[0];

  if (!mainValueCol) return kpis;

  const stats = getColumnStats(data, mainValueCol);
  if (!stats) return kpis;

  const halfPoint = Math.floor(data.rows.length / 2);
  const firstHalf = data.rows.slice(0, halfPoint).map(r => toNumber(r[mainValueCol])).filter(isFinite);
  const secondHalf = data.rows.slice(halfPoint).map(r => toNumber(r[mainValueCol])).filter(isFinite);
  const firstSum = firstHalf.reduce((a, b) => a + b, 0);
  const secondSum = secondHalf.reduce((a, b) => a + b, 0);
  const growthPct = firstSum !== 0 ? ((secondSum - firstSum) / Math.abs(firstSum)) * 100 : 0;

  const isRevenueOrProfit = !!(matched.revenue || matched.profit);

  // Total Revenue/Value KPI
  kpis.push({
    label: matched.revenue ? 'Total Revenue' : matched.profit ? 'Total Profit' : 'Total Value',
    value: formatINRSmart(stats.sum),
    change: parseFloat(growthPct.toFixed(1)),
    trend: growthPct >= 0 ? 'up' : 'down',
    sparkline: generateSparkline(stats.values),
    explanation: `Across ${data.rowCount} records`,
  });

  // Profit Margin KPI (if separate profit column exists)
  if (matched.profit && matched.profit !== mainValueCol) {
    const pStats = getColumnStats(data, matched.profit);
    if (pStats) {
      const margin = stats.sum !== 0 ? (pStats.sum / stats.sum) * 100 : 0;
      kpis.push({
        label: 'Profit Margin',
        value: margin.toFixed(1),
        change: parseFloat((margin - 20).toFixed(1)),
        trend: margin > 20 ? 'up' : 'down',
        sparkline: generateSparkline(pStats.values),
        explanation: 'Net profit as % of revenue',
        suffix: '%',
      });
    }
  }

  // Average Value KPI
  kpis.push({
    label: 'Average Value',
    value: formatINRSmart(stats.mean),
    change: parseFloat((((stats.mean - stats.median) / stats.median) * 100).toFixed(1)),
    trend: stats.mean >= stats.median ? 'up' : 'down',
    sparkline: generateSparkline(stats.values.slice(0, 30)),
    explanation: `Median: ${formatINRSmart(stats.median)}`,
  });

  // Peak Performance KPI
  kpis.push({
    label: 'Peak Performance',
    value: formatINRSmart(stats.max),
    change: parseFloat((((stats.max - stats.mean) / stats.mean) * 100).toFixed(1)),
    trend: 'up',
    sparkline: generateSparkline(stats.values),
    explanation: `${((stats.max / stats.sum) * 100).toFixed(1)}% of total`,
  });

  // Orders KPI or Total Records
  if (matched.orders) {
    const oStats = getColumnStats(data, matched.orders);
    if (oStats) {
      kpis.push({
        label: 'Total Orders',
        value: formatIndianNumber(oStats.sum),
        change: parseFloat(growthPct.toFixed(1)),
        trend: growthPct >= 0 ? 'up' : 'down',
        sparkline: generateSparkline(oStats.values),
        explanation: `Avg ${formatIndianNumber(oStats.mean)} per record`,
      });
    }
  } else {
    kpis.push({
      label: 'Total Records',
      value: data.rowCount.toString(),
      change: 0,
      trend: 'neutral',
      sparkline: Array(8).fill(50),
      explanation: `${data.columnCount} data fields`,
    });
  }

  // Top Segment KPI
  const catCols = detectCategoryColumns(data);
  if (catCols.length > 0) {
    const groups = groupByColumn(data, catCols[0], mainValueCol);
    const groupVals = Object.values(groups);
    const topVal = Math.max(...groupVals);
    const topCat = Object.entries(groups).find(([, v]) => v === topVal)?.[0] ?? '';
    kpis.push({
      label: 'Top Segment',
      value: topCat.length > 12 ? topCat.slice(0, 12) + '...' : topCat,
      change: parseFloat(((topVal / stats.sum) * 100).toFixed(1)),
      trend: 'up',
      sparkline: groupVals.slice(0, 8).map(v => (v / topVal) * 100),
      explanation: `${((topVal / stats.sum) * 100).toFixed(1)}% of total (${formatINRAbbreviated(topVal)})`,
    });
  }

  return kpis.slice(0, 6);
}

export function generateBusinessScore(data: ParsedData): BusinessScore {
  const numCols = detectNumericColumns(data);
  const catCols = detectCategoryColumns(data);

  if (numCols.length === 0) {
    return { overall: 50, growth: 50, profitability: 50, stability: 50, risk: 50, strengths: ['Data uploaded successfully'], weaknesses: ['Limited numeric data for analysis'] };
  }

  const mainCol = numCols[0];
  const stats = getColumnStats(data, mainCol);
  if (!stats) return { overall: 50, growth: 50, profitability: 50, stability: 50, risk: 50, strengths: [], weaknesses: [] };

  const halfPoint = Math.floor(stats.values.length / 2);
  const firstHalfSum = stats.values.slice(0, halfPoint).reduce((a, b) => a + b, 0);
  const secondHalfSum = stats.values.slice(halfPoint).reduce((a, b) => a + b, 0);
  const growthRate = firstHalfSum !== 0 ? ((secondHalfSum - firstHalfSum) / Math.abs(firstHalfSum)) * 100 : 0;

  const cv = stats.stdDev / (stats.mean || 1);

  const growthScore = Math.min(100, Math.max(0, 50 + growthRate * 2));
  const stabilityScore = Math.min(100, Math.max(0, 100 - cv * 50));
  const profitabilityScore = Math.min(100, Math.max(0, (stats.mean / (stats.max || 1)) * 100));
  const diversityScore = catCols.length > 0 ? Math.min(100, catCols.length * 20) : 40;
  const riskScore = Math.min(100, Math.max(0, 100 - (cv * 40) + (growthRate > 0 ? 10 : 0)));

  const overall = Math.round((growthScore + stabilityScore + profitabilityScore + diversityScore + riskScore) / 5);

  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (growthRate > 5) strengths.push(`Strong growth trajectory (+${growthRate.toFixed(1)}%)`);
  else if (growthRate < -5) weaknesses.push(`Declining trend (${growthRate.toFixed(1)}%)`);

  if (stabilityScore > 65) strengths.push('Consistent performance with low volatility');
  else weaknesses.push('High variability in key metrics');

  if (profitabilityScore > 60) strengths.push('Healthy value distribution across records');
  else weaknesses.push('Uneven value distribution suggests concentration risk');

  if (catCols.length >= 2) strengths.push(`Diversified across ${catCols.length} dimensions`);
  else if (catCols.length === 0) weaknesses.push('Limited categorical segmentation');

  if (stats.max / (stats.mean || 1) > 5) weaknesses.push('Extreme outliers detected in data');
  else strengths.push('Balanced range without extreme outliers');

  return {
    overall,
    growth: Math.round(growthScore),
    profitability: Math.round(profitabilityScore),
    stability: Math.round(stabilityScore),
    risk: Math.round(riskScore),
    strengths,
    weaknesses,
  };
}

export function generateComparisonItems(data: ParsedData): ComparisonItem[] {
  const catCols = detectCategoryColumns(data);
  const numCols = detectNumericColumns(data);

  if (catCols.length === 0 || numCols.length === 0) return [];

  const catCol = catCols[0];
  const categories = [...new Set(data.rows.map(r => String(r[catCol])))].slice(0, 10);

  return categories.map(cat => {
    const catRows = data.rows.filter(r => String(r[catCol]) === cat);
    const metrics: Record<string, number> = {};
    numCols.slice(0, 5).forEach(col => {
      const vals = catRows.map(r => toNumber(r[col])).filter(v => isFinite(v));
      metrics[col] = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) : 0;
    });
    metrics['Count'] = catRows.length;
    return { name: cat, metrics };
  });
}

export function getChartData(data: ParsedData): { name: string; value: number; secondary?: number }[] {
  const numCols = detectNumericColumns(data);
  const catCols = detectCategoryColumns(data);

  if (catCols.length > 0 && numCols.length > 0) {
    const groups = groupByColumn(data, catCols[0], numCols[0]);
    return Object.entries(groups)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([name, value]) => ({ name: name.length > 14 ? name.slice(0, 14) : name, value: parseFloat(value.toFixed(2)) }));
  }

  if (numCols.length > 0) {
    const step = Math.max(1, Math.floor(data.rows.length / 20));
    return data.rows
      .filter((_, i) => i % step === 0)
      .slice(0, 20)
      .map((row, i) => ({ name: `R${i + 1}`, value: toNumber(row[numCols[0]]) }));
  }

  return [];
}

export function getTrendData(data: ParsedData): { name: string; value: number; avg: number }[] {
  const numCols = detectNumericColumns(data);
  if (numCols.length === 0) return [];

  const col = numCols[0];
  const vals = data.rows.map(r => toNumber(r[col])).filter(isFinite);
  const bucketSize = Math.max(1, Math.floor(vals.length / 15));
  const buckets: number[] = [];

  for (let i = 0; i < vals.length; i += bucketSize) {
    const bucket = vals.slice(i, i + bucketSize);
    buckets.push(bucket.reduce((a, b) => a + b, 0) / bucket.length);
  }

  const runningAvg = buckets.map((_, i) => {
    const window = buckets.slice(Math.max(0, i - 2), i + 3);
    return window.reduce((a, b) => a + b, 0) / window.length;
  });

  return buckets.map((v, i) => ({
    name: `P${i + 1}`,
    value: parseFloat(v.toFixed(2)),
    avg: parseFloat(runningAvg[i].toFixed(2)),
  }));
}
