import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, TrendingUp, Lightbulb, Search, Target, Zap, FileText } from 'lucide-react';
import type { ParsedData, Insight } from '../types';
import { generateInsights } from '../utils/insightGenerator';

interface Props { data: ParsedData }

const TYPE_CONFIG: Record<Insight['type'], { icon: React.ReactNode; color: string; bg: string; border: string; label: string }> = {
  summary: { icon: <FileText className="w-4 h-4" />, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20', label: 'Executive Summary' },
  finding: { icon: <Search className="w-4 h-4" />, color: 'text-[#00E5FF]', bg: 'bg-[#00E5FF]/10', border: 'border-[#00E5FF]/20', label: 'Key Finding' },
  driver: { icon: <TrendingUp className="w-4 h-4" />, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', label: 'Growth Driver' },
  risk: { icon: <AlertTriangle className="w-4 h-4" />, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20', label: 'Risk Area' },
  opportunity: { icon: <Lightbulb className="w-4 h-4" />, color: 'text-[#6C63FF]', bg: 'bg-[#6C63FF]/10', border: 'border-[#6C63FF]/20', label: 'Opportunity' },
  outlier: { icon: <Zap className="w-4 h-4" />, color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/20', label: 'Outlier' },
};

const IMPACT_BADGE: Record<Insight['impact'], string> = {
  high: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
  medium: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  low: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
};

function InsightCard({ insight, index }: { insight: Insight; index: number }) {
  const cfg = TYPE_CONFIG[insight.type];
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`bg-white/5 backdrop-blur-xl border ${cfg.border} rounded-2xl p-5 hover:bg-white/[0.07] transition-all duration-300 group`}
    >
      <div className="flex items-start gap-4">
        <div className={`w-9 h-9 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
          {cfg.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
              {cfg.label}
            </span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${IMPACT_BADGE[insight.impact]}`}>
              {insight.impact.toUpperCase()} IMPACT
            </span>
            {insight.value && (
              <span className="text-xs font-mono text-white/60 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                {insight.value}
              </span>
            )}
          </div>
          <h3 className="text-white font-semibold text-sm mb-2">{insight.title}</h3>
          <p className="text-white/50 text-sm leading-relaxed">{insight.description}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function InsightEngine({ data }: Props) {
  const insights = useMemo(() => generateInsights(data), [data]);

  const byType = useMemo(() => ({
    summary: insights.filter(i => i.type === 'summary'),
    finding: insights.filter(i => i.type === 'finding'),
    driver: insights.filter(i => i.type === 'driver'),
    risk: insights.filter(i => i.type === 'risk'),
    opportunity: insights.filter(i => i.type === 'opportunity'),
    outlier: insights.filter(i => i.type === 'outlier'),
  }), [insights]);

  const highCount = insights.filter(i => i.impact === 'high').length;
  const riskCount = insights.filter(i => i.type === 'risk').length;
  const opportunityCount = insights.filter(i => i.type === 'opportunity').length;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold text-white">Insight Engine</h2>
        <p className="text-white/40 text-sm mt-1">
          AI-generated business intelligence from your data
        </p>
      </motion.div>

      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-4"
      >
        {[
          { label: 'Total Insights', value: insights.length, color: 'text-[#6C63FF]' },
          { label: 'High Impact', value: highCount, color: 'text-rose-400' },
          { label: 'Risks Flagged', value: riskCount, color: 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-white/30 text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </motion.div>

      {/* All insights ordered by impact */}
      <div className="space-y-3">
        {/* Summary first */}
        {byType.summary.map((i, idx) => <InsightCard key={idx} insight={i} index={idx} />)}
        {/* Drivers */}
        {byType.driver.map((i, idx) => <InsightCard key={idx} insight={i} index={byType.summary.length + idx} />)}
        {/* Key Findings */}
        {byType.finding.map((i, idx) => <InsightCard key={idx} insight={i} index={byType.summary.length + byType.driver.length + idx} />)}
        {/* Risks */}
        {byType.risk.map((i, idx) => <InsightCard key={idx} insight={i} index={byType.summary.length + byType.driver.length + byType.finding.length + idx} />)}
        {/* Opportunities */}
        {byType.opportunity.map((i, idx) => <InsightCard key={idx} insight={i} index={byType.summary.length + byType.driver.length + byType.finding.length + byType.risk.length + idx} />)}
        {/* Outliers */}
        {byType.outlier.map((i, idx) => <InsightCard key={idx} insight={i} index={insights.length - byType.outlier.length + idx} />)}
      </div>

      {opportunityCount > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-r from-[#6C63FF]/10 to-[#00E5FF]/10 border border-[#6C63FF]/20 rounded-2xl p-5"
        >
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-5 h-5 text-[#00E5FF]" />
            <h3 className="text-white font-semibold">Strategic Focus</h3>
          </div>
          <p className="text-white/50 text-sm leading-relaxed">
            Your dataset reveals {opportunityCount} actionable {opportunityCount === 1 ? 'opportunity' : 'opportunities'} and {riskCount} area{riskCount !== 1 ? 's' : ''} requiring attention.
            Review the Recommendation Engine for prioritized action plans based on these findings.
          </p>
        </motion.div>
      )}
    </div>
  );
}
