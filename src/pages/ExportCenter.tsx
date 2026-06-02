import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, History, Trash2, Clock, CheckCircle, Loader2, BarChart3, Brain, FileSpreadsheet, Activity, X, TrendingUp, Heart, Presentation, Scale } from 'lucide-react';
import type { ParsedData } from '../types';
import { generateKPIs, generateBusinessScore } from '../utils/dataAnalysis';
import { generateInsights, generateRecommendations } from '../utils/insightGenerator';
import { formatIndianNumber } from '../utils/formatters';
import { generateExecutivePDF, generateKPIPDF, generateInsightsPDF, generateFullReport, generateBoardReportPDF, generateInvestorReportPDF, generateForecastPDF, generateHealthPDF, generateComparisonPDF } from '../utils/pdfGenerator';
import { getHistory, clearHistory, saveToHistory } from '../utils/historyManager';
import type { AnalysisHistory } from '../types';

interface Props { data: ParsedData }

type ExportStatus = 'idle' | 'loading' | 'done' | 'error';

interface PDFOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  included: string[];
  category: 'essential' | 'advanced';
}

const PDF_OPTIONS: PDFOption[] = [
  {
    id: 'executive',
    title: 'Executive Summary Report',
    description: 'Complete business overview with KPIs, insights, and health score',
    icon: <FileSpreadsheet className="w-6 h-6" />,
    included: ['Cover Page', 'Executive Summary', 'KPIs', 'Insights', 'Recommendations', 'Conclusion'],
    category: 'essential',
  },
  {
    id: 'kpi',
    title: 'KPI Performance Report',
    description: 'Detailed performance metrics and health dimension analysis',
    icon: <BarChart3 className="w-6 h-6" />,
    included: ['Cover Page', 'KPI Dashboard', 'Health Dimensions', 'Trend Analysis'],
    category: 'essential',
  },
  {
    id: 'insights',
    title: 'Insights & Recommendations Report',
    description: 'AI-generated business intelligence and action items',
    icon: <Brain className="w-6 h-6" />,
    included: ['Cover Page', 'Business Insights', 'Strategic Recommendations', 'Priority Actions'],
    category: 'essential',
  },
  {
    id: 'health',
    title: 'Business Health Report',
    description: 'Comprehensive health score analysis with improvement roadmap',
    icon: <Heart className="w-6 h-6" />,
    included: ['Cover Page', 'Health Score', 'Strengths', 'Weaknesses', 'Action Plan'],
    category: 'advanced',
  },
  {
    id: 'forecast',
    title: 'Forecast Report',
    description: 'Projections with confidence intervals and trend analysis',
    icon: <TrendingUp className="w-6 h-6" />,
    included: ['Cover Page', 'Trend Analysis', 'Forecasts', 'Confidence Bands', 'Outlook'],
    category: 'advanced',
  },
  {
    id: 'comparison',
    title: 'Comparison Report',
    description: 'Segment comparison with winner analysis and insights',
    icon: <Scale className="w-6 h-6" />,
    included: ['Cover Page', 'Segment Rankings', 'Winner Analysis', 'Strategic Insights'],
    category: 'advanced',
  },
  {
    id: 'board',
    title: 'Board Meeting Report',
    description: 'Executive summary formatted for board presentations',
    icon: <Presentation className="w-6 h-6" />,
    included: ['Cover Page', 'Executive Summary', 'Key Metrics', 'Strategic Priorities', 'Risk Assessment'],
    category: 'advanced',
  },
  {
    id: 'investor',
    title: 'Investor Report',
    description: 'Professional investor-ready business analysis',
    icon: <Activity className="w-6 h-6" />,
    included: ['Cover Page', 'Business Overview', 'Performance Highlights', 'Growth Opportunities', 'Risk Factors'],
    category: 'advanced',
  },
];

// Toast notification component
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl border backdrop-blur-xl
        ${type === 'success'
          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
          : 'bg-red-500/20 border-red-500/40 text-red-300'
        }`}
    >
      {type === 'success' ? (
        <CheckCircle className="w-5 h-5 flex-shrink-0" />
      ) : (
        <X className="w-5 h-5 flex-shrink-0" />
      )}
      <span className="font-medium text-sm">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 hover:opacity-70 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

export default function ExportCenter({ data }: Props) {
  const [statuses, setStatuses] = useState<Record<string, ExportStatus>>({});
  const [history, setHistory] = useState<AnalysisHistory[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  const setStatus = (id: string, status: ExportStatus) => {
    setStatuses(prev => ({ ...prev, [id]: status }));
  };

  const getStatus = (id: string): ExportStatus => {
    return statuses[id] ?? 'idle';
  };

  const handleDownloadPDF = async (type: string) => {
    console.log(`${type.toUpperCase()} PDF button clicked`);
    setStatus(type, 'loading');
    try {
      await new Promise(r => setTimeout(r, 500));

      const kpis = generateKPIs(data);
      const insights = generateInsights(data);
      const recommendations = generateRecommendations(data);
      const score = generateBusinessScore(data);

      switch (type) {
        case 'executive':
          generateExecutivePDF(data, kpis, insights, recommendations, score);
          break;
        case 'kpi':
          generateKPIPDF(data, kpis, score);
          break;
        case 'insights':
          generateInsightsPDF(data, insights, recommendations);
          break;
        case 'health':
          generateHealthPDF(data, score);
          break;
        case 'forecast':
          generateForecastPDF(data, kpis);
          break;
        case 'comparison':
          generateComparisonPDF(data, kpis);
          break;
        case 'board':
          generateBoardReportPDF(data, kpis, insights, recommendations, score);
          break;
        case 'investor':
          generateInvestorReportPDF(data, kpis, insights, score);
          break;
        case 'full':
          generateFullReport(data, kpis, insights, recommendations, score);
          break;
      }

      setStatus(type, 'done');
      showToast('PDF downloaded successfully', 'success');

      const entry = saveToHistory(data);
      setHistory(prev => [entry, ...prev.filter(h => h.id !== entry.id)].slice(0, 10));

      setTimeout(() => setStatus(type, 'idle'), 2000);
    } catch (e) {
      console.error('PDF generation error:', e);
      setStatus(type, 'error');
      showToast('Failed to generate PDF', 'error');
      setTimeout(() => setStatus(type, 'idle'), 2000);
    }
  };

  const handleClearHistory = () => {
    clearHistory();
    setHistory([]);
  };

  const totalExports = Object.values(statuses).filter(s => s === 'done').length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold text-white">Download Center</h2>
        <p className="text-white/40 text-sm mt-1">
          Download professional executive reports in PDF format
        </p>
      </motion.div>

      {totalExports > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3"
        >
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <p className="text-emerald-300 text-sm">{totalExports} report{totalExports !== 1 ? 's' : ''} downloaded successfully</p>
        </motion.div>
      )}

      {/* Essential Reports */}
      <div>
        <h3 className="text-white/60 text-xs uppercase tracking-wider mb-4">Essential Reports</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PDF_OPTIONS.filter(o => o.category === 'essential').map((option, idx) => {
            const status = getStatus(option.id);
            const isLoading = status === 'loading';
            const isDone = status === 'done';
            const isError = status === 'error';

            return (
              <motion.div
                key={option.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl p-5 hover:border-[#6C63FF]/30 transition-all duration-300"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#6C63FF]/20 flex items-center justify-center text-white">
                    {option.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-sm">{option.title}</h3>
                    <p className="text-white/40 text-xs mt-0.5">{option.description}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {option.included.slice(0, 4).map(section => (
                    <span key={section} className="px-1.5 py-0.5 rounded bg-white/5 text-white/30 text-[9px]">
                      {section}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => handleDownloadPDF(option.id)}
                  disabled={isLoading}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all
                    ${isDone
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                      : isError
                        ? 'bg-red-500/20 border border-red-500/30 text-red-400'
                        : isLoading
                          ? 'bg-[#6C63FF]/50 text-white/70 cursor-wait'
                          : 'bg-[#6C63FF] text-white hover:bg-[#5A52E0] shadow-lg shadow-[#6C63FF]/20'
                    }`}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isDone ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : isError ? (
                    <X className="w-4 h-4" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  {isLoading ? 'Generating...' : isDone ? 'Done' : isError ? 'Failed' : 'Download'}
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Advanced Reports */}
      <div>
        <h3 className="text-white/60 text-xs uppercase tracking-wider mb-4">Advanced Reports</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PDF_OPTIONS.filter(o => o.category === 'advanced').map((option, idx) => {
            const status = getStatus(option.id);
            const isLoading = status === 'loading';
            const isDone = status === 'done';
            const isError = status === 'error';

            return (
              <motion.div
                key={option.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + idx * 0.05 }}
                className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-[#00E5FF]/30 transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-[#00E5FF]/10 flex items-center justify-center text-[#00E5FF]">
                    {option.icon}
                  </div>
                  <h3 className="text-white font-medium text-xs">{option.title}</h3>
                </div>

                <button
                  onClick={() => handleDownloadPDF(option.id)}
                  disabled={isLoading}
                  className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all
                    ${isDone
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : isLoading
                        ? 'bg-white/5 text-white/50 cursor-wait'
                        : 'bg-white/10 text-white hover:bg-white/15 border border-white/10'
                    }`}
                >
                  {isLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : isDone ? (
                    <CheckCircle className="w-3 h-3" />
                  ) : (
                    <Download className="w-3 h-3" />
                  )}
                  {isLoading ? '...' : isDone ? 'Done' : 'PDF'}
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Primary CTA - Full Report */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-r from-[#6C63FF]/10 to-[#00E5FF]/10 border-2 border-[#6C63FF]/40 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between gap-6">
          <div>
            <h3 className="text-white font-bold text-lg">Complete Business Intelligence Package</h3>
            <p className="text-white/50 text-sm mt-1">All sections in one comprehensive executive-grade report</p>
          </div>
          <button
            onClick={() => handleDownloadPDF('full')}
            disabled={getStatus('full') === 'loading'}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all whitespace-nowrap
              ${getStatus('full') === 'done'
                ? 'bg-emerald-500 text-white'
                : getStatus('full') === 'loading'
                  ? 'bg-[#6C63FF]/50 text-white/70 cursor-wait'
                  : 'bg-[#6C63FF] text-white hover:bg-[#5A52E0] shadow-lg shadow-[#6C63FF]/30'
              }`}
          >
            {getStatus('full') === 'loading' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : getStatus('full') === 'done' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            {getStatus('full') === 'loading' ? 'Generating...' : getStatus('full') === 'done' ? 'Downloaded!' : 'Download Full Report'}
          </button>
        </div>
      </motion.div>

      {/* History */}
      {history.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <History className="w-5 h-5 text-white/40" />
              <h3 className="text-white font-semibold text-sm">Analysis History</h3>
              <span className="text-white/30 text-xs">({history.length})</span>
            </div>
            <button
              onClick={handleClearHistory}
              className="text-white/30 hover:text-red-400 text-xs flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar">
            {history.slice(0, 5).map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[#6C63FF]/10 flex items-center justify-center text-xs text-[#6C63FF] font-bold">
                    {entry.overallScore}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white/80 text-xs font-medium truncate">{entry.fileName}</p>
                    <p className="text-white/30 text-xs flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {new Date(entry.uploadTime).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white/50 text-xs">{formatIndianNumber(entry.rowCount)} rows</p>
                  <p className="text-emerald-400/70 text-xs">{entry.totalRevenue}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-white/5 border border-white/10 rounded-2xl p-5"
      >
        <h3 className="text-white/60 text-xs uppercase tracking-wider mb-4">Dataset Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'File Name', value: data.fileName },
            { label: 'File Size', value: `${(data.fileSize / 1024).toFixed(1)} KB` },
            { label: 'Total Rows', value: formatIndianNumber(data.rowCount) },
            { label: 'Columns', value: data.columnCount.toString() },
          ].map(item => (
            <div key={item.label} className="text-center">
              <p className="text-white/70 font-semibold text-sm truncate">{item.value}</p>
              <p className="text-white/30 text-xs mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
