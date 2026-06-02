import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { CheckCircle, XCircle, Shield } from 'lucide-react';
import type { ParsedData } from '../types';
import { generateBusinessScore } from '../utils/dataAnalysis';

interface Props { data: ParsedData }

function ScoreArc({ score }: { score: number }) {
  const radius = 80;
  const circumference = Math.PI * radius;
  const filled = (score / 100) * circumference;

  const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
  const label = score >= 70 ? 'Excellent' : score >= 55 ? 'Good' : score >= 40 ? 'Fair' : 'Needs Attention';

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-48 h-28">
        <svg width="192" height="112" viewBox="0 0 192 112" className="overflow-visible">
          {/* Track */}
          <path
            d="M 16 96 A 80 80 0 0 1 176 96"
            fill="none"
            stroke="#ffffff08"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Filled */}
          <path
            d="M 16 96 A 80 80 0 0 1 176 96"
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${circumference}`}
            style={{ filter: `drop-shadow(0 0 8px ${color}60)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-5xl font-bold text-white"
            style={{ color }}
          >
            {score}
          </motion.span>
          <span className="text-white/40 text-xs font-medium">{label}</span>
        </div>
      </div>
    </div>
  );
}

function DimensionBar({ label, value, delay }: { label: string; value: number; delay: number }) {
  const color = value >= 70 ? '#10b981' : value >= 40 ? '#f59e0b' : '#ef4444';
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-white/50 text-sm">{label}</span>
        <span className="text-white font-semibold text-sm" style={{ color }}>{value}</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ delay, duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(to right, ${color}80, ${color})` }}
        />
      </div>
    </div>
  );
}

export default function BusinessHealth({ data }: Props) {
  const score = useMemo(() => generateBusinessScore(data), [data]);

  const radarData = [
    { dimension: 'Growth', value: score.growth },
    { dimension: 'Profit', value: score.profitability },
    { dimension: 'Stability', value: score.stability },
    { dimension: 'Risk Mgmt', value: score.risk },
    { dimension: 'Data Quality', value: Math.min(100, (data.columnCount / 10) * 100) },
  ];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold text-white">Business Health Score</h2>
        <p className="text-white/40 text-sm mt-1">
          Composite assessment of performance, growth, and risk dimensions
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Display */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 flex flex-col items-center"
        >
          <p className="text-white/40 text-xs uppercase tracking-widest mb-6 flex items-center gap-2">
            <Shield className="w-3.5 h-3.5" />
            Overall Business Score
          </p>
          <ScoreArc score={score.overall} />

          <div className="w-full mt-8 space-y-4">
            <DimensionBar label="Growth Trajectory" value={score.growth} delay={0.4} />
            <DimensionBar label="Profitability Index" value={score.profitability} delay={0.5} />
            <DimensionBar label="Operational Stability" value={score.stability} delay={0.6} />
            <DimensionBar label="Risk Management" value={score.risk} delay={0.7} />
          </div>
        </motion.div>

        {/* Radar + Strengths/Weaknesses */}
        <div className="space-y-4">
          {/* Radar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5"
          >
            <h3 className="text-white/60 text-xs uppercase tracking-wider mb-4 text-center">Performance Radar</h3>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#ffffff10" />
                <PolarAngleAxis dataKey="dimension" tick={{ fill: '#ffffff50', fontSize: 11 }} />
                <Radar
                  name="Score"
                  dataKey="value"
                  stroke="#6C63FF"
                  fill="#6C63FF"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                <Tooltip
                  contentStyle={{ background: '#0A0F1E', border: '1px solid #ffffff15', borderRadius: '12px', fontSize: '12px' }}
                  labelStyle={{ color: '#ffffff60' }}
                  itemStyle={{ color: '#6C63FF' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Strengths */}
          {score.strengths.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5"
            >
              <h3 className="text-emerald-400 font-semibold text-sm mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Strengths
              </h3>
              <ul className="space-y-2">
                {score.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* Weaknesses */}
          {score.weaknesses.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-5"
            >
              <h3 className="text-rose-400 font-semibold text-sm mb-3 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Areas for Improvement
              </h3>
              <ul className="space-y-2">
                {score.weaknesses.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 flex-shrink-0" />
                    {w}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </div>
      </div>

      {/* Score Legend */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="grid grid-cols-4 gap-3"
      >
        {[
          { range: '80–100', label: 'Excellent', color: '#10b981', desc: 'High performance' },
          { range: '60–79', label: 'Good', color: '#22d3ee', desc: 'Solid fundamentals' },
          { range: '40–59', label: 'Fair', color: '#f59e0b', desc: 'Room to improve' },
          { range: '0–39', label: 'Critical', color: '#ef4444', desc: 'Immediate action' },
        ].map(s => (
          <div key={s.range} className="bg-white/5 border border-white/5 rounded-xl p-3 text-center">
            <div className="w-3 h-3 rounded-full mx-auto mb-2" style={{ background: s.color }} />
            <p className="text-white/60 text-xs font-semibold">{s.label}</p>
            <p className="text-white/25 text-xs">{s.range}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
