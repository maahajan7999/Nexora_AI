import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { TrendingUp, TrendingDown, Activity, Target, AlertTriangle, BarChart3 } from 'lucide-react';
import type { ParsedData } from '../types';
import { generateForecast, generateForecastSummary, getForecastMetrics } from '../utils/forecasting';
import { detectNumericColumns, getColumnStats } from '../utils/dataAnalysis';
import { formatTooltipINR, formatCompactIndian, formatINRSmart } from '../utils/formatters';

interface Props { data: ParsedData }

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0A0F1E]/95 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-xl">
      <p className="text-white/60 text-xs mb-1">{label}</p>
      {payload.map((p, i) => {
        if (p.name === 'upper' || p.name === 'lower') return null;
        return (
          <p key={i} className="text-sm font-medium" style={{ color: p.color }}>
            {p.name}: {formatTooltipINR(p.value)}
          </p>
        );
      })}
    </div>
  );
};

export default function Forecasting({ data }: Props) {
  const forecastData = useMemo(() => generateForecast(data), [data]);
  const summary = useMemo(() => generateForecastSummary(data), [data]);
  const metrics = useMemo(() => getForecastMetrics(data), [data]);
  const numCols = useMemo(() => detectNumericColumns(data), [data]);

  if (numCols.length === 0) {
    return (
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h2 className="text-2xl font-bold text-white">Revenue Forecasting</h2>
          <p className="text-white/40 text-sm mt-1">Predict future performance based on historical trends</p>
        </motion.div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
          <Activity className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/40 font-medium">No numeric data available for forecasting</p>
          <p className="text-white/20 text-sm mt-2">Upload data with revenue or value columns to enable forecasting</p>
        </div>
      </div>
    );
  }

  const mainCol = numCols.includes('Revenue') ? 'Revenue' : numCols[0];
  const stats = getColumnStats(data, mainCol);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold text-white">Revenue Forecasting</h2>
        <p className="text-white/40 text-sm mt-1">
          Predictive analytics powered by your data — {forecastData.length} period projection
        </p>
      </motion.div>

      {/* Forecast Metrics */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {metrics.map((m, i) => (
          <div key={i} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-white/40 text-xs uppercase tracking-wider">{m.label}</p>
              {m.trend === 'up' ? (
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              ) : m.trend === 'down' ? (
                <TrendingDown className="w-4 h-4 text-rose-400" />
              ) : null}
            </div>
            <p className="text-white text-xl font-bold">{m.value}</p>
          </div>
        ))}
      </motion.div>

      {/* Forecast Chart */}
      {forecastData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-semibold text-sm">{mainCol} Forecast</h3>
              <p className="text-white/30 text-xs mt-1">Historical data + 6-month projection with confidence interval</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 bg-[#6C63FF]" />
                <span className="text-white/40">Actual</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 bg-[#00E5FF]" style={{ borderBottom: '2px dashed #00E5FF' }} />
                <span className="text-white/40">Forecast</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-2 bg-[#00E5FF]/20 rounded" />
                <span className="text-white/40">Confidence</span>
              </div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={forecastData}>
              <defs>
                <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00E5FF" stopOpacity="0.2" />
                  <stop offset="95%" stopColor="#00E5FF" stopOpacity="0" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#ffffff40', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#ffffff40', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCompactIndian(v)} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="upper" stroke="none" fill="url(#forecastGrad)" />
              <Area type="monotone" dataKey="lower" stroke="none" fill="#0A0F1E" fillOpacity={1} />
              <Line type="monotone" dataKey="actual" name="Actual" stroke="#6C63FF" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="forecast" name="Forecast" stroke="#00E5FF" strokeWidth={2} strokeDasharray="5 3" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Revenue Growth */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-[#6C63FF]/10 to-transparent border border-[#6C63FF]/20 rounded-2xl p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-[#6C63FF]" />
            <h4 className="text-white font-semibold text-sm">Revenue Projection</h4>
          </div>
          <p className="text-white text-2xl font-bold mb-1">{summary.revenueGrowth}</p>
          <p className="text-white/40 text-xs">Projected change next period</p>
        </motion.div>

        {/* Profit Growth */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-[#00E5FF]" />
            <h4 className="text-white font-semibold text-sm">Profit Projection</h4>
          </div>
          <p className="text-white text-2xl font-bold mb-1">{summary.profitGrowth}</p>
          <p className="text-white/40 text-xs">Expected profit trajectory</p>
        </motion.div>

        {/* Confidence */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-amber-400" />
            <h4 className="text-white font-semibold text-sm">Forecast Confidence</h4>
          </div>
          <p className="text-white text-2xl font-bold mb-1">{summary.confidence.split(' ')[0]}</p>
          <p className="text-white/40 text-xs">{summary.confidence.split(' ').slice(1).join(' ')}</p>
        </motion.div>
      </div>

      {/* Recommendation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20 rounded-2xl p-5"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-amber-400 font-semibold text-sm mb-1">Strategic Recommendation</h4>
            <p className="text-white/50 text-sm leading-relaxed">{summary.recommendation}</p>
          </div>
        </div>
      </motion.div>

      {/* Methodology */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="bg-white/5 border border-white/10 rounded-2xl p-4"
      >
        <p className="text-white/30 text-xs font-mono">
          Methodology: Linear regression with {stats?.values.length || 0} data points. Confidence interval = 1.5 standard deviations. Forecast is based on historical trend and assumes similar market conditions.
        </p>
      </motion.div>
    </div>
  );
}
