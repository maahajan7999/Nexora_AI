import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Zap, ArrowRight, Target, TrendingUp, AlertOctagon, ChevronRight } from 'lucide-react';
import type { ParsedData, Recommendation } from '../types';
import { generateRecommendations } from '../utils/insightGenerator';

interface Props { data: ParsedData }

const PRIORITY_CONFIG: Record<Recommendation['priority'], { color: string; bg: string; border: string; icon: React.ReactNode; label: string }> = {
  critical: { color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/30', icon: <AlertOctagon className="w-4 h-4" />, label: 'CRITICAL' },
  high: { color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/30', icon: <TrendingUp className="w-4 h-4" />, label: 'HIGH' },
  medium: { color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/30', icon: <Target className="w-4 h-4" />, label: 'MEDIUM' },
};

function RecCard({ rec, index }: { rec: Recommendation; index: number }) {
  const cfg = PRIORITY_CONFIG[rec.priority];
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.12 }}
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 hover:bg-white/[0.07] transition-all duration-300 group"
    >
      <div className="flex items-start gap-4">
        {/* Priority indicator */}
        <div className={`w-10 h-10 rounded-2xl ${cfg.bg} border ${cfg.border} flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
          {cfg.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
              {cfg.label} PRIORITY
            </span>
            <span className="text-xs text-white/30 font-mono bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
              {rec.metric}
            </span>
          </div>

          <h3 className="text-white font-bold text-base mb-2">{rec.title}</h3>
          <p className="text-white/50 text-sm leading-relaxed mb-4">{rec.description}</p>

          {/* Action + Impact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <ArrowRight className="w-3 h-3 text-[#6C63FF]" />
                <p className="text-[#6C63FF] text-xs font-semibold uppercase tracking-wider">Recommended Action</p>
              </div>
              <p className="text-white/60 text-xs leading-relaxed">{rec.action}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Zap className="w-3 h-3 text-[#00E5FF]" />
                <p className="text-[#00E5FF] text-xs font-semibold uppercase tracking-wider">Expected Impact</p>
              </div>
              <p className="text-white/60 text-xs leading-relaxed">{rec.expectedImpact}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function RecommendationEngine({ data }: Props) {
  const recs = useMemo(() => generateRecommendations(data), [data]);
  const critical = recs.filter(r => r.priority === 'critical');
  const high = recs.filter(r => r.priority === 'high');
  const medium = recs.filter(r => r.priority === 'medium');

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold text-white">Recommendation Engine</h2>
        <p className="text-white/40 text-sm mt-1">
          Data-driven actions prioritized by business impact
        </p>
      </motion.div>

      {/* Priority summary */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-4"
      >
        {[
          { label: 'Critical', count: critical.length, color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/20' },
          { label: 'High Priority', count: high.length, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' },
          { label: 'Medium Priority', count: medium.length, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl p-4 text-center`}>
            <p className={`text-3xl font-bold ${s.color}`}>{s.count}</p>
            <p className="text-white/30 text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Recommendations */}
      {recs.length > 0 ? (
        <div className="space-y-4">
          {recs.map((rec, i) => <RecCard key={i} rec={rec} index={i} />)}
        </div>
      ) : (
        <div className="bg-white/5 rounded-2xl p-12 text-center border border-white/10">
          <p className="text-white/40">No recommendations could be generated from this dataset.</p>
          <p className="text-white/20 text-sm mt-2">Try uploading data with numeric columns and category dimensions.</p>
        </div>
      )}

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="bg-gradient-to-r from-[#6C63FF]/10 via-transparent to-[#00E5FF]/10 border border-[#6C63FF]/20 rounded-2xl p-5 flex items-center justify-between"
      >
        <div>
          <p className="text-white font-semibold text-sm">Ready to take action?</p>
          <p className="text-white/40 text-xs mt-1">Export these recommendations as a PDF action plan</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#6C63FF]/20 border border-[#6C63FF]/30 text-[#6C63FF] rounded-xl text-sm font-medium hover:bg-[#6C63FF]/30 transition-colors">
          Export Plan
          <ChevronRight className="w-4 h-4" />
        </button>
      </motion.div>
    </div>
  );
}
