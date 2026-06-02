import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { KPI } from '../types';

interface Props {
  kpi: KPI;
  index: number;
}

export default function KPICard({ kpi, index }: Props) {
  const isUp = kpi.trend === 'up';
  const isDown = kpi.trend === 'down';

  const sparkMax = Math.max(...kpi.sparkline, 1);
  const sparkMin = Math.min(...kpi.sparkline);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5 }}
      className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:border-[#6C63FF]/30 hover:bg-white/[0.07] transition-all duration-300 group overflow-hidden"
    >
      {/* Glow on hover */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(108,99,255,0.08) 0%, transparent 70%)' }} />

      <div className="flex items-start justify-between mb-3">
        <p className="font-caption text-white/40">{kpi.label}</p>
        <div className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full
          ${isUp ? 'text-emerald-400 bg-emerald-400/10' : isDown ? 'text-red-400 bg-red-400/10' : 'text-white/40 bg-white/5'}`}>
          {isUp ? <TrendingUp className="w-3 h-3" /> : isDown ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
          {kpi.change !== 0 ? `${kpi.change > 0 ? '+' : ''}${kpi.change}%` : 'Stable'}
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-data-lg text-white">
            {kpi.value}{kpi.suffix ?? ''}
          </p>
          <p className="text-white/30 text-xs mt-1">{kpi.explanation}</p>
        </div>

        {/* Sparkline */}
        <svg width="64" height="32" className="flex-shrink-0 ml-3">
          <defs>
            <linearGradient id={`spark-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={isUp ? '#10b981' : isDown ? '#ef4444' : '#6C63FF'} stopOpacity="0.6" />
              <stop offset="100%" stopColor={isUp ? '#10b981' : isDown ? '#ef4444' : '#00E5FF'} stopOpacity="1" />
            </linearGradient>
          </defs>
          <polyline
            points={kpi.sparkline.map((v, i) => {
              const x = (i / (kpi.sparkline.length - 1)) * 60 + 2;
              const y = 30 - ((v - sparkMin) / (sparkMax - sparkMin || 1)) * 26;
              return `${x},${y}`;
            }).join(' ')}
            fill="none"
            stroke={`url(#spark-${index})`}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </motion.div>
  );
}
