import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { GitCompare, Trophy, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import type { ParsedData } from '../types';
import { generateComparisonItems, detectNumericColumns, detectCategoryColumns } from '../utils/dataAnalysis';
import { formatTooltipINR, formatCompactIndian, formatINRSmart, formatINRAbbreviated, formatDifference } from '../utils/formatters';

interface Props { data: ParsedData }

const COLORS = ['#6C63FF', '#00E5FF', '#A855F7', '#22D3EE'];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0A0F1E]/95 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-xl">
      <p className="text-white/60 text-xs mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-medium" style={{ color: p.color }}>
          {p.name}: {formatTooltipINR(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function ComparisonLab({ data }: Props) {
  const items = useMemo(() => generateComparisonItems(data), [data]);
  const numCols = useMemo(() => detectNumericColumns(data), [data]);
  const catCols = useMemo(() => detectCategoryColumns(data), [data]);

  const [selected, setSelected] = useState<[string, string]>(['', '']);
  const [activeMetric, setActiveMetric] = useState('');

  const allNames = items.map(i => i.name);
  const metrics = items[0] ? Object.keys(items[0].metrics) : [];
  const metric = activeMetric || metrics[0] || '';

  const itemA = items.find(i => i.name === selected[0]) ?? items[0];
  const itemB = items.find(i => i.name === selected[1]) ?? items[1];

  const aVal = itemA?.metrics[metric] ?? 0;
  const bVal = itemB?.metrics[metric] ?? 0;
  const diff = bVal - aVal;
  const diffPct = aVal !== 0 ? ((diff / Math.abs(aVal)) * 100) : 0;
  const winner = aVal > bVal ? itemA?.name : bVal > aVal ? itemB?.name : null;

  const comparisonChartData = metrics.slice(0, 5).map(m => ({
    name: m.length > 14 ? m.slice(0, 14) : m,
    [itemA?.name ?? 'A']: itemA?.metrics[m] ?? 0,
    [itemB?.name ?? 'B']: itemB?.metrics[m] ?? 0,
  }));

  const rankingData = items
    .map(item => ({ name: item.name.length > 12 ? item.name.slice(0, 12) + '..' : item.name, value: item.metrics[metric] ?? 0 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  if (items.length < 2) {
    return (
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h2 className="text-2xl font-bold text-white">Comparison Lab</h2>
          <p className="text-white/40 text-sm mt-1">Side-by-side segment analysis</p>
        </motion.div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
          <GitCompare className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/40 font-medium">Not enough segments for comparison</p>
          <p className="text-white/20 text-sm mt-2">
            Your dataset needs at least one categorical column with 2+ unique values.
            {catCols.length === 0 && ' No category columns detected.'}
            {numCols.length === 0 && ' No numeric columns detected.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold text-white">Comparison Lab</h2>
        <p className="text-white/40 text-sm mt-1">
          Compare {catCols[0] ?? 'segments'} side-by-side across all metrics
        </p>
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <div className="bg-white/5 border border-[#6C63FF]/20 rounded-xl p-3">
          <p className="text-[#6C63FF] text-xs mb-2 font-medium">Segment A</p>
          <select
            value={selected[0] || itemA?.name}
            onChange={e => setSelected([e.target.value, selected[1]])}
            className="w-full bg-transparent text-white text-sm outline-none cursor-pointer"
          >
            {allNames.map(n => <option key={n} value={n} className="bg-[#0A0F1E]">{n}</option>)}
          </select>
        </div>
        <div className="bg-white/5 border border-[#00E5FF]/20 rounded-xl p-3">
          <p className="text-[#00E5FF] text-xs mb-2 font-medium">Segment B</p>
          <select
            value={selected[1] || itemB?.name}
            onChange={e => setSelected([selected[0], e.target.value])}
            className="w-full bg-transparent text-white text-sm outline-none cursor-pointer"
          >
            {allNames.map(n => <option key={n} value={n} className="bg-[#0A0F1E]">{n}</option>)}
          </select>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-3">
          <p className="text-white/40 text-xs mb-2 font-medium">Metric</p>
          <select
            value={metric}
            onChange={e => setActiveMetric(e.target.value)}
            className="w-full bg-transparent text-white text-sm outline-none cursor-pointer"
          >
            {metrics.map(m => <option key={m} value={m} className="bg-[#0A0F1E]">{m}</option>)}
          </select>
        </div>
      </motion.div>

      {/* Head-to-head */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${itemA?.name}-${itemB?.name}-${metric}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="grid grid-cols-3 gap-4"
        >
          {/* A */}
          <div className={`bg-white/5 border rounded-2xl p-6 text-center ${winner === itemA?.name ? 'border-[#6C63FF]/40 shadow-[0_0_20px_rgba(108,99,255,0.1)]' : 'border-white/10'}`}>
            {winner === itemA?.name && (
              <div className="flex items-center justify-center gap-1 mb-2">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-400 text-xs font-bold">WINNER</span>
              </div>
            )}
            <p className="text-white/40 text-xs mb-1 truncate">{itemA?.name}</p>
            <p className="text-white text-3xl font-bold text-[#6C63FF]">
              {formatINRSmart(aVal)}
            </p>
            <p className="text-white/30 text-xs mt-1">{metric}</p>
          </div>

          {/* Diff */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center flex flex-col items-center justify-center">
            <div className={`flex items-center gap-1 text-lg font-bold mb-1 ${diff > 0 ? 'text-emerald-400' : diff < 0 ? 'text-rose-400' : 'text-white/40'}`}>
              {diff > 0 ? <ArrowUp className="w-4 h-4" /> : diff < 0 ? <ArrowDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
              {Math.abs(diffPct).toFixed(1)}%
            </div>
            <p className="text-white/30 text-xs">
              {diff !== 0 ? (
                <>
                  {diff > 0 ? 'B' : 'A'} leads by {formatINRAbbreviated(Math.abs(diff))}
                </>
              ) : 'Tied'}
            </p>
          </div>

          {/* B */}
          <div className={`bg-white/5 border rounded-2xl p-6 text-center ${winner === itemB?.name ? 'border-[#00E5FF]/40 shadow-[0_0_20px_rgba(0,229,255,0.1)]' : 'border-white/10'}`}>
            {winner === itemB?.name && (
              <div className="flex items-center justify-center gap-1 mb-2">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-400 text-xs font-bold">WINNER</span>
              </div>
            )}
            <p className="text-white/40 text-xs mb-1 truncate">{itemB?.name}</p>
            <p className="text-white text-3xl font-bold text-[#00E5FF]">
              {formatINRSmart(bVal)}
            </p>
            <p className="text-white/30 text-xs mt-1">{metric}</p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Multi-metric comparison chart */}
      {comparisonChartData.length > 0 && itemA && itemB && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-5"
        >
          <h3 className="text-white font-semibold text-sm mb-1">Multi-Metric Breakdown</h3>
          <p className="text-white/30 text-xs mb-4">All metrics compared side-by-side</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={comparisonChartData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#ffffff40', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#ffffff40', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCompactIndian(v)} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey={itemA.name} fill="#6C63FF" fillOpacity={0.8} radius={[3, 3, 0, 0]} barSize={16} />
              <Bar dataKey={itemB.name} fill="#00E5FF" fillOpacity={0.8} radius={[3, 3, 0, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-[#6C63FF]" /><span className="text-white/40 text-xs">{itemA.name}</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-[#00E5FF]" /><span className="text-white/40 text-xs">{itemB.name}</span></div>
          </div>
        </motion.div>
      )}

      {/* Full ranking */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white/5 border border-white/10 rounded-2xl p-5"
      >
        <h3 className="text-white font-semibold text-sm mb-1">Full Segment Ranking</h3>
        <p className="text-white/30 text-xs mb-4">All segments ranked by {metric}</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={rankingData} layout="vertical" barSize={14}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" horizontal={false} />
            <XAxis type="number" tick={{ fill: '#ffffff40', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCompactIndian(v)} />
            <YAxis type="category" dataKey="name" tick={{ fill: '#ffffff50', fontSize: 10 }} axisLine={false} tickLine={false} width={80} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" name={metric} radius={[0, 4, 4, 0]}>
              {rankingData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.name === (itemA?.name.slice(0, 12)) ? '#6C63FF' : entry.name === (itemB?.name.slice(0, 12)) ? '#00E5FF' : COLORS[i % COLORS.length]}
                  fillOpacity={0.7}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Strategic recommendation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20 rounded-2xl p-5"
      >
        <div className="flex items-start gap-3">
          <Trophy className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-amber-400 font-semibold text-sm mb-1">Strategic Recommendation</h4>
            <p className="text-white/50 text-sm leading-relaxed">
              {winner
                ? `"${winner}" outperforms in ${metric} by ${formatINRAbbreviated(Math.abs(diff))}. Prioritize resources, budget, and strategic focus toward this segment to maximize returns. Consider investigating what drives ${winner}'s superior performance and replicating those factors.`
                : `Both segments perform equally on ${metric}. Analyze other dimensions for differentiation opportunities.`
              }
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
