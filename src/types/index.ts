export interface ParsedData {
  headers: string[];
  rows: Record<string, string | number>[];
  fileName: string;
  fileSize: number;
  uploadTime: Date;
  rowCount: number;
  columnCount: number;
}

export interface KPI {
  label: string;
  value: number | string;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  sparkline: number[];
  explanation: string;
  prefix?: string;
  suffix?: string;
}

export interface Insight {
  type: 'summary' | 'finding' | 'driver' | 'risk' | 'opportunity' | 'outlier';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  value?: string;
}

export interface Recommendation {
  priority: 'critical' | 'high' | 'medium';
  title: string;
  description: string;
  metric: string;
  action: string;
  expectedImpact: string;
}

export interface BusinessScore {
  overall: number;
  growth: number;
  profitability: number;
  stability: number;
  risk: number;
  strengths: string[];
  weaknesses: string[];
}

export interface ComparisonItem {
  name: string;
  metrics: Record<string, number>;
}

export type PageId = 'dashboard' | 'insights' | 'recommendations' | 'health' | 'comparison' | 'export' | 'forecast' | 'ceo';

export interface AnalysisHistory {
  id: string;
  fileName: string;
  uploadTime: Date;
  rowCount: number;
  columnCount: number;
  overallScore: number;
  totalRevenue: string;
}

export interface ForecastData {
  name: string;
  actual: number;
  forecast: number;
  upper: number;
  lower: number;
}

export interface BusinessDNA {
  industry: string;
  businessModel: string;
  growthStage: string;
  riskLevel: string;
  dataQuality: number;
  aiConfidence: number;
  healthScore: number;
  primaryMetric: string;
  dimensions: number;
  recordsAnalyzed: number;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
