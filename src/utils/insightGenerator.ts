import type { ParsedData, Insight, Recommendation } from '../types';
import { detectNumericColumns, detectCategoryColumns, getColumnStats, groupByColumn } from './dataAnalysis';
import { formatINRSmart, formatINRAbbreviated, formatIndianNumber } from './formatters';

export function generateInsights(data: ParsedData): Insight[] {
  const insights: Insight[] = [];
  const numCols = detectNumericColumns(data);
  const catCols = detectCategoryColumns(data);

  if (numCols.length === 0) {
    insights.push({ type: 'summary', title: 'Dataset Overview', description: `Your dataset contains ${formatIndianNumber(data.rowCount)} records across ${data.columnCount} columns. All columns appear to be categorical or text-based.`, impact: 'medium' });
    return insights;
  }

  const mainCol = numCols[0];
  const stats = getColumnStats(data, mainCol);
  if (!stats) return insights;

  const halfPoint = Math.floor(stats.values.length / 2);
  const firstSum = stats.values.slice(0, halfPoint).reduce((a, b) => a + b, 0);
  const secondSum = stats.values.slice(halfPoint).reduce((a, b) => a + b, 0);
  const growthPct = firstSum !== 0 ? ((secondSum - firstSum) / Math.abs(firstSum)) * 100 : 0;

  insights.push({
    type: 'summary',
    title: 'Executive Summary',
    description: `Your dataset spans ${formatIndianNumber(data.rowCount)} records with a total ${mainCol} of ${formatINRAbbreviated(stats.sum)}. The average per record is ${formatINRSmart(stats.mean)}, with performance ${growthPct >= 0 ? 'growing' : 'declining'} at ${Math.abs(growthPct).toFixed(1)}% across the dataset lifecycle.`,
    impact: 'high',
    value: formatINRAbbreviated(stats.sum),
  });

  if (growthPct > 10) {
    insights.push({
      type: 'driver',
      title: 'Strong Growth Momentum',
      description: `${mainCol} shows a ${growthPct.toFixed(1)}% increase in the second half of your dataset. This positive trajectory suggests effective execution and favorable market conditions. The growth rate exceeds typical benchmarks.`,
      impact: 'high',
      value: `+${growthPct.toFixed(1)}%`,
    });
  } else if (growthPct < -10) {
    insights.push({
      type: 'risk',
      title: 'Declining Performance Trend',
      description: `${mainCol} has declined ${Math.abs(growthPct).toFixed(1)}% in the later portion of your dataset. Immediate action is recommended to identify root causes and reverse this trend before it compounds further.`,
      impact: 'high',
      value: `${growthPct.toFixed(1)}%`,
    });
  } else {
    insights.push({
      type: 'finding',
      title: 'Stable Performance Pattern',
      description: `${mainCol} shows relatively stable performance with a modest ${growthPct >= 0 ? '+' : ''}${growthPct.toFixed(1)}% change. Stability can be a strength, but watch for opportunities to accelerate growth.`,
      impact: 'medium',
    });
  }

  const cv = stats.stdDev / (stats.mean || 1);
  if (cv > 1.5) {
    insights.push({
      type: 'outlier',
      title: 'High Performance Variance Detected',
      description: `The coefficient of variation is ${(cv * 100).toFixed(0)}%, indicating extreme spread in ${mainCol} values. Range: ${formatINRSmart(stats.min)} to ${formatINRAbbreviated(stats.max)}. This volatility may signal inconsistent performance or data quality issues.`,
      impact: 'high',
      value: `CV: ${(cv * 100).toFixed(0)}%`,
    });
  }

  if (catCols.length > 0) {
    const groups = groupByColumn(data, catCols[0], mainCol);
    const sorted = Object.entries(groups).sort((a, b) => b[1] - a[1]);

    if (sorted.length >= 2) {
      const top = sorted[0];
      const bottom = sorted[sorted.length - 1];
      const topShare = (top[1] / stats.sum) * 100;

      insights.push({
        type: 'finding',
        title: `Top Performer: ${top[0]}`,
        description: `"${top[0]}" leads all ${catCols[0]} segments with ${formatINRAbbreviated(top[1])} — representing ${topShare.toFixed(1)}% of total ${mainCol}. This concentration ${topShare > 40 ? 'creates dependency risk' : 'demonstrates clear market leadership'}.`,
        impact: topShare > 50 ? 'high' : 'medium',
        value: formatINRAbbreviated(top[1]),
      });

      if (sorted.length >= 3) {
        const upliftPotential = stats.median - bottom[1];
        insights.push({
          type: 'opportunity',
          title: `Growth Opportunity: ${bottom[0]}`,
          description: `"${bottom[0]}" is the lowest performing ${catCols[0]} segment at ${formatINRAbbreviated(bottom[1])}. If elevated to the median (${formatINRSmart(stats.median)}), total ${mainCol} could increase by ${formatINRAbbreviated(upliftPotential)} — a ${(((upliftPotential) / stats.sum) * 100).toFixed(1)}% overall gain.`,
          impact: 'medium',
          value: `+${formatINRAbbreviated(upliftPotential)}`,
        });
      }
    }
  }

  if (numCols.length >= 2) {
    const col2Stats = getColumnStats(data, numCols[1]);
    if (col2Stats) {
      const ratio = stats.sum !== 0 ? (col2Stats.sum / stats.sum) * 100 : 0;
      insights.push({
        type: 'finding',
        title: `Secondary Metric: ${numCols[1]}`,
        description: `${numCols[1]} totals ${formatINRAbbreviated(col2Stats.sum)} with an average of ${formatINRSmart(col2Stats.mean)} per record. The ${numCols[1]}/${mainCol} ratio is ${ratio.toFixed(1)}%, providing context for relative performance.`,
        impact: 'medium',
        value: formatINRAbbreviated(col2Stats.sum),
      });
    }
  }

  const top5Sum = stats.values.slice().sort((a, b) => b - a).slice(0, 5).reduce((a, b) => a + b, 0);
  const top5Pct = (top5Sum / stats.sum) * 100;
  if (top5Pct > 40) {
    insights.push({
      type: 'risk',
      title: 'Concentration Risk: Top 5 Records',
      description: `The top 5 records by ${mainCol} account for ${top5Pct.toFixed(1)}% of the total (${formatINRAbbreviated(top5Sum)}). This Pareto-style concentration signals significant dependency on a small number of drivers.`,
      impact: top5Pct > 60 ? 'high' : 'medium',
      value: `${top5Pct.toFixed(1)}%`,
    });
  }

  return insights.slice(0, 8);
}

export function generateRecommendations(data: ParsedData): Recommendation[] {
  const recs: Recommendation[] = [];
  const numCols = detectNumericColumns(data);
  const catCols = detectCategoryColumns(data);

  if (numCols.length === 0) {
    recs.push({
      priority: 'medium',
      title: 'Enrich Dataset with Numeric Metrics',
      description: 'Your current dataset lacks numeric columns for deep analysis. Adding quantitative metrics will unlock full analytical capabilities.',
      metric: 'Data Quality',
      action: 'Add columns for revenue, quantity, cost, or performance scores',
      expectedImpact: 'Enable 6x more analytical depth',
    });
    return recs;
  }

  const mainCol = numCols[0];
  const stats = getColumnStats(data, mainCol);
  if (!stats) return recs;

  const halfPoint = Math.floor(stats.values.length / 2);
  const firstSum = stats.values.slice(0, halfPoint).reduce((a, b) => a + b, 0);
  const secondSum = stats.values.slice(halfPoint).reduce((a, b) => a + b, 0);
  const growthPct = firstSum !== 0 ? ((secondSum - firstSum) / Math.abs(firstSum)) * 100 : 0;

  if (catCols.length > 0) {
    const groups = groupByColumn(data, catCols[0], mainCol);
    const sorted = Object.entries(groups).sort((a, b) => b[1] - a[1]);

    if (sorted.length >= 2) {
      const topSegment = sorted[0];
      const uplift = topSegment[1] * 0.2;
      recs.push({
        priority: 'critical',
        title: `Double Down on ${topSegment[0]}`,
        description: `"${topSegment[0]}" is your highest-performing ${catCols[0]} segment with ${formatINRAbbreviated(topSegment[1])}. Increasing investment here by 20% could yield disproportionate returns given its proven track record.`,
        metric: `${mainCol}: ${formatINRAbbreviated(topSegment[1])}`,
        action: `Allocate additional resources to ${topSegment[0]} — increase budget, headcount, or marketing spend`,
        expectedImpact: `Potential ${formatINRAbbreviated(uplift)} incremental ${mainCol}`,
      });

      if (sorted.length >= 3) {
        const bottom = sorted[sorted.length - 1];
        const belowAvg = sorted.filter(([, v]) => v < stats.mean);
        const upliftTotal = belowAvg.reduce((a, [, v]) => a + (stats.mean - v), 0);
        recs.push({
          priority: 'high',
          title: `Optimize Underperforming Segments`,
          description: `${belowAvg.length} segment(s) including "${bottom[0]}" are below average performance (${formatINRSmart(stats.mean)}). These represent either turnaround opportunities or candidates for resource reallocation.`,
          metric: `${belowAvg.length} segments below avg`,
          action: `Conduct root cause analysis for "${bottom[0]}" — identify barriers, test new approaches, or reallocate to stronger segments`,
          expectedImpact: `Raising bottom segments to average adds ${formatINRAbbreviated(upliftTotal)}`,
        });
      }
    }
  }

  if (growthPct < 0) {
    recs.push({
      priority: 'critical',
      title: 'Reverse Declining Trend Immediately',
      description: `The ${growthPct.toFixed(1)}% decline detected in the dataset requires urgent intervention. Each period of inaction compounds the gap to recovery.`,
      metric: `Trend: ${growthPct.toFixed(1)}%`,
      action: 'Identify top 3 causes of decline, implement corrective measures, and establish weekly tracking',
      expectedImpact: 'Stop decline within 30 days, return to growth within 90 days',
    });
  }

  const cv = stats.stdDev / (stats.mean || 1);
  if (cv > 1) {
    const bottomQuartile = stats.values.slice().sort((a, b) => a - b)[Math.floor(stats.values.length * 0.25)];
    const upliftPotential = (stats.mean - bottomQuartile) * Math.floor(stats.values.length * 0.25);
    recs.push({
      priority: 'high',
      title: 'Standardize Performance Across Records',
      description: `High variance (CV: ${(cv * 100).toFixed(0)}%) indicates inconsistent performance. Bringing bottom-quartile records up to median (${formatINRSmart(stats.median)}) would significantly improve overall results.`,
      metric: `Std Dev: ${formatINRSmart(stats.stdDev)}`,
      action: 'Identify attributes of top-quartile records and replicate those conditions for underperformers',
      expectedImpact: `${formatINRAbbreviated(upliftPotential)} from bottom-quartile uplift`,
    });
  }

  recs.push({
    priority: 'medium',
    title: 'Implement Predictive Monitoring',
    description: 'Set up automated alerts for when key metrics deviate more than 2 standard deviations from their rolling average to catch issues before they escalate.',
    metric: `Alert threshold: ±${formatINRSmart(stats.mean + 2 * stats.stdDev)}`,
    action: 'Configure monitoring dashboards with threshold alerts and weekly executive reporting',
    expectedImpact: 'Reduce reaction time to performance issues by 60%',
  });

  if (numCols.length >= 2) {
    recs.push({
      priority: 'medium',
      title: `Optimize ${numCols[1]} to ${mainCol} Ratio`,
      description: `Analyzing the relationship between ${numCols[1]} and ${mainCol} can reveal efficiency gains and help prioritize high-ROI activities.`,
      metric: `${numCols[1]} / ${mainCol} correlation`,
      action: `Rank all records by ${mainCol}/${numCols[1]} ratio and focus on improving the bottom 20%`,
      expectedImpact: '10-15% efficiency improvement in resource allocation',
    });
  }

  return recs.slice(0, 5);
}
