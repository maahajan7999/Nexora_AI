import type { AnalysisHistory, ParsedData } from '../types';
import { generateKPIs, generateBusinessScore } from './dataAnalysis';
import { formatINRAbbreviated } from './formatters';

const HISTORY_KEY = 'data_commander_history';

/**
 * Generate unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Save analysis to history
 */
export function saveToHistory(data: ParsedData): AnalysisHistory {
  const history = getHistory();
  const kpis = generateKPIs(data);
  const score = generateBusinessScore(data);

  const revenueKpi = kpis.find(k => k.label.includes('Revenue'));

  const entry: AnalysisHistory = {
    id: generateId(),
    fileName: data.fileName,
    uploadTime: new Date(),
    rowCount: data.rowCount,
    columnCount: data.columnCount,
    overallScore: score.overall,
    totalRevenue: revenueKpi ? String(revenueKpi.value) : 'N/A',
  };

  // Keep only last 10 entries
  history.unshift(entry);
  if (history.length > 10) {
    history.pop();
  }

  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  return entry;
}

/**
 * Get analysis history
 */
export function getHistory(): AnalysisHistory[] {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return parsed.map((h: AnalysisHistory) => ({
      ...h,
      uploadTime: new Date(h.uploadTime),
    }));
  } catch {
    return [];
  }
}

/**
 * Clear history
 */
export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}

/**
 * Delete specific history entry
 */
export function deleteHistoryEntry(id: string): void {
  const history = getHistory().filter(h => h.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}
