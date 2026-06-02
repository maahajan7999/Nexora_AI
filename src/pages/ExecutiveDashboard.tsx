import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import type { ParsedData } from '../types';
import { generateKPIs, getChartData, getTrendData, detectCategoryColumns, detectNumericColumns, getColumnStats, groupByColumn } from '../utils/dataAnalysis';
import { formatTooltipINR, formatCompactIndian, formatINRSmart } from '../utils/formatters';
import KPICard from '../components/KPICard';

interface Props { data: ParsedData }

const COLORS = ['#6C63FF', '#00E5FF', '#A855F7', '#22D3EE', '#818CF8', '#67e8f9', '#c084fc', '#6ee7b7'];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0A0F1E]/95 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-xl">
      <p className="text-white/50 text-xs mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-medium" style={{ color: p.color }}>
          {p.name}: {formatTooltipINR(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function ExecutiveDashboard({ data }: Props) {
  const kpis = useMemo(() => generateKPIs(data), [data]);
  const chartData = useMemo(() => getChartData(data), [data]);
  const trendData = useMemo(() => getTrendData(data), [data]);

  const catCols = useMemo(() => detectCategoryColumns(data), [data]);
  const numCols = useMemo(() => detectNumericColumns(data), [data]);

  const pieData = useMemo(() => {
    if (catCols.length === 0 || numCols.length === 0) return [];
    const groups = groupByColumn(data, catCols[0], numCols[0]);
    return Object.entries(groups)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name: name.length > 10 ? name.slice(0, 10) + '...' : name, value: Math.abs(value) }));
  }, [data, catCols, numCols]);

  const mainCol = numCols[0] ?? 'Value';
  const colStats = useMemo(() => numCols[0] ? getColumnStats(data, numCols[0]) : null, [data, numCols]);

  const hasCategories = catCols.length > 0;
  const hasMultipleNumerics = numCols.length >= 2;
  const hasPieData = pieData.length > 0;
  const hasStats = colStats !== null;

  return (
    <div className="space-y-5">
      {kpis.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {kpis.map((kpi, i) => <KPICard key={kpi.label} kpi={kpi} index={i} />)}
        </div>
      ) : (
        <div className="bg-white/[0.03] rounded-2xl p-8 text-center border border-white/10">
          <p className="text-white/40">No numeric columns detected for KPI generation.</p>
          <p className="text-white/20 text-sm mt-2">Add numeric columns like revenue, quantity, or price to enable KPIs.</p>
        </div>
      )}

      {chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/[0.03] backdrop-blur-xl border border-white/8 rounded-2xl p-5"
          >
            <h3 className="text-white font-semibold mb-0.5 text-sm">
              {hasCategories ? `${mainCol} by ${catCols[0]}` : `${mainCol} Distribution`}
            </h3>
            <p className="text-white/25 text-xs mb-4">Top segments ranked by value</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff06" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#ffffff30', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#ffffff30', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCompactIndian(v)} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name={mainCol} radius={[4, 4, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={`url(#barGrad${i % 3})`} />
                  ))}
                </Bar>
                <defs>
                  {[0, 1, 2].map(i => (
                    <linearGradient key={i} id={`barGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS[i]} stopOpacity="0.9" />
                      <stop offset="100%" stopColor={COLORS[i]} stopOpacity="0.4" />
                    </linearGradient>
                  ))}
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/[0.03] backdrop-blur-xl border border-white/8 rounded-2xl p-5"
          >
            <h3 className="text-white font-semibold mb-0.5 text-sm">Performance Trend</h3>
            <p className="text-white/25 text-xs mb-4">Rolling average vs actual values</p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6C63FF" stopOpacity="0.25" />
                    <stop offset="95%" stopColor="#6C63FF" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="avgGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00E5FF" stopOpacity="0.15" />
                    <stop offset="95%" stopColor="#00E5FF" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff06" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#ffffff30', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#ffffff30', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCompactIndian(v)} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '10px', color: '#ffffff50' }} />
                <Area type="monotone" dataKey="value" name={mainCol} stroke="#6C63FF" fill="url(#trendGrad)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="avg" name="Rolling Avg" stroke="#00E5FF" fill="url(#avgGrad)" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      )}

      {(hasPieData || hasStats) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {hasPieData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/[0.03] backdrop-blur-xl border border-white/8 rounded-2xl p-5"
            >
              <h3 className="text-white font-semibold mb-0.5 text-sm">Category Breakdown</h3>
              <p className="text-white/25 text-xs mb-4">Share of total {mainCol}</p>
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="60%" height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {pieData.map((d, i) => {
                    const total = pieData.reduce((a, b) => a + b.value, 0);
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="text-white/50 text-xs truncate flex-1">{d.name}</span>
                        <span className="text-white/30 text-xs">{((d.value / total) * 100).toFixed(0)}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {colStats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white/[0.03] backdrop-blur-xl border border-white/8 rounded-2xl p-5"
            >
              <h3 className="text-white font-semibold mb-0.5 text-sm">Statistical Analysis</h3>
              <p className="text-white/25 text-xs mb-4">{mainCol} — distribution metrics</p>
              <div className="space-y-3">
                {[
                  { label: 'Total', value: colStats.sum, pct: 100 },
                  { label: 'Mean', value: colStats.mean, pct: (colStats.mean / colStats.max) * 100 },
                  { label: 'Median', value: colStats.median, pct: (colStats.median / colStats.max) * 100 },
                  { label: 'Maximum', value: colStats.max, pct: 100 },
                  { label: 'Minimum', value: colStats.min, pct: (colStats.min / colStats.max) * 100 },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/35">{item.label}</span>
                      <span className="text-white/70 font-mono text-[11px]">{formatINRSmart(item.value)}</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#6C63FF] to-[#00E5FF]" style={{ width: `${Math.min(100, Math.max(0, item.pct))}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}

      {hasMultipleNumerics && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white/[0.03] backdrop-blur-xl border border-white/8 rounded-2xl p-5"
        >
          <h3 className="text-white font-semibold mb-0.5 text-sm">Multi-Metric Comparison</h3>
          <p className="text-white/25 text-xs mb-4">Comparing top numeric metrics over record sequence</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.rows.filter((_, i) => i % Math.max(1, Math.floor(data.rows.length / 30)) === 0).slice(0, 30).map((r, i) => ({
              name: `${i + 1}`,
              ...Object.fromEntries(numCols.slice(0, 3).map(c => [c, typeof r[c] === 'number' ? r[c] : parseFloat(String(r[c])) || 0]))
            }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff06" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#ffffff30', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#ffffff30', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCompactIndian(v)} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '10px', color: '#ffffff50' }} />
              {numCols.slice(0, 3).map((col, i) => (
                <Line key={col} type="monotone" dataKey={col} stroke={COLORS[i]} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </div>
  );
}
