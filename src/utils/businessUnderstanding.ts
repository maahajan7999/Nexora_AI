import type { ParsedData, BusinessDNA } from '../types';
import { detectNumericColumns, detectCategoryColumns, getColumnStats } from './dataAnalysis';

/**
 * Detect industry type from column names and data patterns
 */
export function detectIndustry(data: ParsedData): string {
  const headers = data.headers.map(h => h.toLowerCase());
  const headerStr = headers.join(' ');

  // E-commerce/Retail
  if (headerStr.match(/product|sku|inventory|cart|order|shipping|delivery|customer|sales/)) {
    if (headerStr.match(/product|sku|inventory/)) return 'Retail & E-Commerce';
    return 'Commerce & Sales';
  }

  // Finance
  if (headerStr.match(/transaction|account|balance|credit|debit|loan|interest|investment|portfolio/)) {
    return 'Financial Services';
  }

  // Marketing
  if (headerStr.match(/campaign|channel|impressions|clicks|ctr|conversion|leads|acquisition/)) {
    return 'Marketing & Advertising';
  }

  // HR/Workforce
  if (headerStr.match(/employee|salary|department|hire|attendance|performance|team|workforce|staff/)) {
    return 'Human Resources';
  }

  // Healthcare
  if (headerStr.match(/patient|diagnosis|treatment|hospital|clinic|medical|health|insurance claim/)) {
    return 'Healthcare';
  }

  // Manufacturing
  if (headerStr.match(/production|factory|machine|output|materials|supply chain|warehouse/)) {
    return 'Manufacturing & Operations';
  }

  // Real Estate
  if (headerStr.match(/property|rent|lease|square feet|bedroom|bathroom|listing|real estate/)) {
    return 'Real Estate';
  }

  // Education
  if (headerStr.match(/student|course|grade|enrollment|class|teacher|school|university/)) {
    return 'Education';
  }

  // SaaS/Technology
  if (headerStr.match(/subscription|user|mrr|churn|feature|api|endpoint|server|traffic/)) {
    return 'Technology & SaaS';
  }

  // Logistics
  if (headerStr.match(/shipment|tracking|route|vehicle|driver|distance|freight|logistics/)) {
    return 'Logistics & Supply Chain';
  }

  return 'Business Operations';
}

/**
 * Detect business model from data structure
 */
export function detectBusinessModel(data: ParsedData): string {
  const headers = data.headers.map(h => h.toLowerCase());
  const headerStr = headers.join(' ');

  // Transaction-based
  if (headerStr.match(/transaction|order|invoice|purchase|sale/)) {
    return 'Transaction-Based';
  }

  // Subscription
  if (headerStr.match(/subscription|recurring|monthly|annual|membership/)) {
    return 'Subscription';
  }

  // Marketplace
  if (headerStr.match(/seller|buyer|listing|commission|platform/)) {
    return 'Marketplace';
  }

  // Service-based
  if (headerStr.match(/service|project|hour|rate|client|contract/)) {
    return 'Service-Based';
  }

  // Retail
  if (headerStr.match(/product|quantity|inventory|sku|store/)) {
    return 'Retail';
  }

  return 'Mixed Revenue';
}

/**
 * Assign growth stage based on data characteristics
 */
export function detectGrowthStage(data: ParsedData): string {
  const numCols = detectNumericColumns(data);
  if (numCols.length === 0) return 'Early Stage';

  const stats = getColumnStats(data, numCols[0]);
  if (!stats) return 'Early Stage';

  const cv = stats.stdDev / (stats.mean || 1);

  // High variance + moderate size = growth stage
  if (cv > 0.8 && data.rowCount >= 100) return 'Growth Stage';
  if (cv > 0.5 && data.rowCount >= 200) return 'Scaling';
  if (cv < 0.3 && data.rowCount >= 500) return 'Mature';
  if (data.rowCount < 50) return 'Early Stage';

  return 'Established';
}

/**
 * Calculate data quality score
 */
export function calculateDataQuality(data: ParsedData): number {
  let score = 100;

  // Penalize for low row count
  if (data.rowCount < 50) score -= 20;
  else if (data.rowCount < 100) score -= 10;

  // Penalize for low column count
  if (data.columnCount < 4) score -= 15;
  else if (data.columnCount < 6) score -= 5;

  // Check for missing values
  const numCols = detectNumericColumns(data);
  const catCols = detectCategoryColumns(data);

  if (numCols.length === 0) score -= 25;
  if (catCols.length === 0) score -= 15;

  // Check numeric data quality
  if (numCols.length > 0) {
    const stats = getColumnStats(data, numCols[0]);
    if (stats) {
      // Penalize for extreme outliers
      const outlierRatio = stats.values.filter(v => Math.abs(v - stats.mean) > 3 * stats.stdDev).length / stats.values.length;
      if (outlierRatio > 0.1) score -= 10;
    }
  }

  // Check for empty/placeholder values
  let emptyCount = 0;
  data.rows.slice(0, 50).forEach(row => {
    Object.values(row).forEach(val => {
      if (val === null || val === undefined || val === '' || String(val).toLowerCase() === 'null') {
        emptyCount++;
      }
    });
  });

  const emptyRatio = emptyCount / (50 * data.columnCount);
  if (emptyRatio > 0.2) score -= 15;
  else if (emptyRatio > 0.1) score -= 5;

  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate AI confidence based on data richness
 */
export function calculateAIConfidence(data: ParsedData): number {
  let confidence = 50;

  const numCols = detectNumericColumns(data);
  const catCols = detectCategoryColumns(data);

  // More numeric columns = higher confidence
  confidence += Math.min(20, numCols.length * 5);

  // More categorical columns = better segmentation
  confidence += Math.min(15, catCols.length * 4);

  // More data points = better insights
  if (data.rowCount >= 500) confidence += 15;
  else if (data.rowCount >= 200) confidence += 10;
  else if (data.rowCount >= 100) confidence += 5;

  // Cap at 100
  return Math.min(100, confidence);
}

/**
 * Generate complete Business DNA profile
 */
export function generateBusinessDNA(data: ParsedData): BusinessDNA {
  const industry = detectIndustry(data);
  const businessModel = detectBusinessModel(data);
  const growthStage = detectGrowthStage(data);
  const dataQuality = calculateDataQuality(data);
  const aiConfidence = calculateAIConfidence(data);

  const numCols = detectNumericColumns(data);
  const catCols = detectCategoryColumns(data);

  // Calculate health score
  let healthScore = 50;
  if (numCols.length > 0) {
    const stats = getColumnStats(data, numCols[0]);
    if (stats) {
      const half = Math.floor(stats.values.length / 2);
      const firstHalf = stats.values.slice(0, half).reduce((a, b) => a + b, 0);
      const secondHalf = stats.values.slice(half).reduce((a, b) => a + b, 0);
      const growth = firstHalf > 0 ? ((secondHalf - firstHalf) / firstHalf) * 100 : 0;

      healthScore = Math.min(100, Math.max(0, 50 + growth));
    }
  }

  // Determine risk level
  let riskLevel = 'Moderate';
  if (dataQuality < 60 || healthScore < 40) riskLevel = 'High';
  else if (dataQuality > 85 && healthScore > 70) riskLevel = 'Low';

  return {
    industry,
    businessModel,
    growthStage,
    riskLevel,
    dataQuality,
    aiConfidence,
    healthScore,
    primaryMetric: numCols[0] || 'Value',
    dimensions: catCols.length,
    recordsAnalyzed: data.rowCount,
  };
}

/**
 * Generate dynamic dashboard name based on business type
 */
export function generateDashboardName(dna: BusinessDNA): string {
  const names: Record<string, string[]> = {
    'Retail & E-Commerce': ['Retail Intelligence Hub', 'Commerce Command Center', 'Sales Operations Tower', 'Merchandise Analytics Hub'],
    'Commerce & Sales': ['Sales Command Center', 'Revenue Operations Hub', 'Business War Room', 'Growth Command Center'],
    'Financial Services': ['Financial Control Tower', 'Finance Operations Hub', 'Investment Intelligence Center', 'Treasury Command'],
    'Marketing & Advertising': ['Growth Intelligence Center', 'Marketing Operations Hub', 'Campaign Command Center', 'Acelligence Hub'],
    'Human Resources': ['Workforce Command Center', 'HR Intelligence Hub', 'Talent Operations Tower', 'People Analytics Center'],
    'Healthcare': ['Health Operations Hub', 'Patient Intelligence Center', 'Clinical Command Center', 'Care Analytics Tower'],
    'Manufacturing & Operations': ['Operations Command Center', 'Production Intelligence Hub', 'Factory Control Tower', 'Manufacturing Nexus'],
    'Real Estate': ['Property Intelligence Hub', 'Real Estate Command Center', 'Portfolio Analytics Tower', 'Asset Management Center'],
    'Education': ['Learning Analytics Hub', 'Education Intelligence Center', 'Academic Operations Tower', 'Student Success Center'],
    'Technology & SaaS': ['Growth Operations Center', 'SaaS Intelligence Hub', 'Product Analytics Tower', 'Tech Command Center'],
    'Logistics & Supply Chain': ['Logistics Command Center', 'Supply Chain Intelligence Hub', 'Distribution Tower', 'Fleet Operations Center'],
    'Business Operations': ['Business Command Center', 'Operations Intelligence Hub', 'Executive Performance Tower', 'Analytics Command'],
  };

  const options = names[dna.industry] || names['Business Operations'];
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * Generate industry-specific recommendations
 */
export function getIndustryInsights(dna: BusinessDNA): string[] {
  const insights: Record<string, string[]> = {
    'Retail & E-Commerce': [
      'Monitor inventory turnover rates to optimize stock levels',
      'Track customer acquisition cost vs lifetime value ratio',
      'Analyze seasonal trends for demand forecasting',
    ],
    'Financial Services': [
      'Track portfolio performance against benchmarks',
      'Monitor risk-adjusted returns across asset classes',
      'Analyze transaction patterns for fraud detection',
    ],
    'Marketing & Advertising': [
      'Optimize channel mix based on ROI analysis',
      'Track customer journey touchpoints for conversion optimization',
      'Monitor CAC trends across acquisition channels',
    ],
    'Human Resources': [
      'Track employee retention by department and tenure',
      'Monitor time-to-hire metrics for recruitment optimization',
      'Analyze performance distribution for talent development',
    ],
    'Technology & SaaS': [
      'Monitor MRR growth and churn rates closely',
      'Track feature adoption for product optimization',
      'Analyze user engagement patterns for retention insights',
    ],
  };

  return insights[dna.industry] || [
    'Track key performance indicators consistently',
    'Monitor trends and anomalies in your data',
    'Use insights to drive strategic decisions',
  ];
}
