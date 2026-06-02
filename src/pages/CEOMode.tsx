import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Crown, Target, AlertTriangle, Lightbulb, TrendingUp, ArrowRight, CheckCircle, Building2, Calendar, Zap } from 'lucide-react';
import type { ParsedData } from '../types';
import { generateKPIs, generateBusinessScore, detectCategoryColumns } from '../utils/dataAnalysis';
import { generateInsights, generateRecommendations } from '../utils/insightGenerator';
import { generateBusinessDNA, getIndustryInsights } from '../utils/businessUnderstanding';

interface Props { data: ParsedData }

export default function CEOMode({ data }: Props) {
  const kpis = useMemo(() => generateKPIs(data), [data]);
  const score = useMemo(() => generateBusinessScore(data), [data]);
  const insights = useMemo(() => generateInsights(data), [data]);
  const recommendations = useMemo(() => generateRecommendations(data), [data]);
  const dna = useMemo(() => generateBusinessDNA(data), [data]);
  const industryInsights = useMemo(() => getIndustryInsights(dna), [dna]);
  const catCols = useMemo(() => detectCategoryColumns(data), [data]);

  const topPriorities = useMemo(() => {
    const priorities: { title: string; description: string; urgency: 'critical' | 'high' | 'medium' }[] = [];
    const decliningKpis = kpis.filter(k => k.change < 0);
    if (decliningKpis.length > 0) {
      priorities.push({
        title: `Address Declining ${decliningKpis[0].label}`,
        description: `${decliningKpis[0].label} has dropped ${Math.abs(decliningKpis[0].change)}%. Immediate attention required to reverse the trend.`,
        urgency: 'critical',
      });
    }
    const riskInsights = insights.filter(i => i.type === 'risk');
    if (riskInsights.length > 0) {
      priorities.push({ title: riskInsights[0].title, description: riskInsights[0].description, urgency: 'high' });
    }
    if (score.overall < 50) {
      priorities.push({ title: 'Business Health Under Threshold', description: `Overall health score of ${score.overall}/100 indicates significant improvement areas.`, urgency: 'critical' });
    }
    const oppInsights = insights.filter(i => i.type === 'opportunity');
    if (oppInsights.length > 0) {
      priorities.push({ title: oppInsights[0].title, description: oppInsights[0].description, urgency: 'medium' });
    }
    while (priorities.length < 3) {
      const rec = recommendations[priorities.length];
      if (rec) {
        priorities.push({ title: rec.title, description: rec.action, urgency: rec.priority === 'critical' ? 'critical' : rec.priority === 'high' ? 'high' : 'medium' });
      } else break;
    }
    return priorities.slice(0, 3);
  }, [kpis, insights, score, recommendations]);

  const topRisks = useMemo(() => {
    const risks: { title: string; impact: string; probability: string }[] = [];
    if (score.stability < 40) risks.push({ title: 'High Performance Volatility', impact: 'Revenue instability', probability: 'High' });
    if (score.risk < 50) risks.push({ title: 'Risk Exposure Increasing', impact: 'Financial exposure', probability: 'Medium' });
    risks.push(...score.weaknesses.slice(0, 2).map(w => ({ title: w, impact: 'Operational', probability: 'Medium' })));
    return risks.slice(0, 3);
  }, [score]);

  const topOpportunities = useMemo(() => {
    const opps: { title: string; potential: string; timeframe: string }[] = [];
    if (score.growth > 60) opps.push({ title: 'Scale Growth Trajectory', potential: `+${Math.round((score.growth - 50) / 2)}% improvement`, timeframe: 'Q1-Q2' });
    if (catCols.length >= 2) opps.push({ title: `Expand into New ${catCols[0]} Segment`, potential: 'Market expansion', timeframe: 'Q2-Q3' });
    opps.push(...score.strengths.slice(0, 2).map(s => ({ title: s, potential: 'Competitive advantage', timeframe: 'Immediate' })));
    return opps.slice(0, 3);
  }, [score, catCols]);

  const next30DayAction = useMemo(() => {
    if (topPriorities.length > 0 && topPriorities[0].urgency === 'critical') {
      return { title: topPriorities[0].title, action: topPriorities[0].description, impact: 'Critical path to stability' };
    }
    if (recommendations.length > 0) {
      return { title: recommendations[0].title, action: recommendations[0].action, impact: recommendations[0].expectedImpact };
    }
    return { title: 'Establish Baseline Metrics', action: 'Track key performance indicators consistently for the next 30 days', impact: 'Foundation for data-driven decisions' };
  }, [topPriorities, recommendations]);

  // 30-Day Strategic Plan
  const strategicPlan = useMemo(() => {
    const days = [
      { phase: 'Days 1-7', title: 'Assess & Stabilize', actions: [
        topPriorities[0]?.title || 'Review current performance metrics',
        'Identify root causes of declining trends',
        'Establish daily monitoring cadence',
      ]},
      { phase: 'Days 8-14', title: 'Quick Wins', actions: [
        topOpportunities[0]?.title || 'Capitalize on top-performing segments',
        'Implement immediate cost optimizations',
        'Address highest-priority risk factors',
      ]},
      { phase: 'Days 15-21', title: 'Build Momentum', actions: [
        recommendations[0]?.title || 'Scale successful initiatives',
        'Expand into new growth segments',
        'Strengthen operational stability',
      ]},
      { phase: 'Days 22-30', title: 'Sustain & Scale', actions: [
        'Review progress against 30-day targets',
        'Document processes for repeatability',
        'Plan next quarter strategic initiatives',
      ]},
    ];
    return days;
  }, [topPriorities, topOpportunities, recommendations]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
          <Crown className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">CEO Mode</h2>
          <p className="text-white/40 text-sm">If I Were The CEO — Strategic Command</p>
        </div>
      </motion.div>

      {/* Most Important 30-Day Action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gradient-to-r from-amber-500/8 to-orange-500/8 border-2 border-amber-500/25 rounded-2xl p-5"
      >
        <div className="flex items-start gap-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-shrink-0">
            <Target className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-amber-400 font-bold text-base mb-1">Most Important Action — Next 30 Days</h3>
            <p className="text-white font-semibold text-sm mb-1.5">{next30DayAction.title}</p>
            <p className="text-white/50 text-xs mb-2">{next30DayAction.action}</p>
            <div className="flex items-center gap-2">
              <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-400 text-xs font-medium">{next30DayAction.impact}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Three Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top 3 Priorities */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-[#6C63FF]" />
            <h3 className="text-white font-semibold text-sm">Top 3 Priorities</h3>
          </div>
          <div className="space-y-2.5">
            {topPriorities.map((p, i) => (
              <div key={i} className={`p-3 rounded-xl ${p.urgency === 'critical' ? 'bg-red-500/8 border border-red-500/15' : p.urgency === 'high' ? 'bg-amber-500/8 border border-amber-500/15' : 'bg-white/[0.03] border border-white/5'}`}>
                <div className="flex items-start gap-2 mb-1">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 ${p.urgency === 'critical' ? 'bg-red-500' : p.urgency === 'high' ? 'bg-amber-500' : 'bg-[#6C63FF]'}`}>
                    {i + 1}
                  </span>
                  <p className="text-white font-medium text-xs leading-tight">{p.title}</p>
                </div>
                <p className="text-white/35 text-[10px] ml-7">{p.description.slice(0, 80)}{p.description.length > 80 ? '...' : ''}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Top 3 Risks */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <h3 className="text-white font-semibold text-sm">Top 3 Risks</h3>
          </div>
          <div className="space-y-2.5">
            {topRisks.map((r, i) => (
              <div key={i} className="p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                <div className="flex items-start justify-between mb-1">
                  <span className="text-white font-medium text-xs">{r.title}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 ml-2 ${r.probability === 'High' ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'}`}>
                    {r.probability}
                  </span>
                </div>
                <p className="text-white/35 text-[10px]">Impact: {r.impact}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Top 3 Opportunities */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-4 h-4 text-[#00E5FF]" />
            <h3 className="text-white font-semibold text-sm">Top 3 Opportunities</h3>
          </div>
          <div className="space-y-2.5">
            {topOpportunities.map((o, i) => (
              <div key={i} className="p-3 rounded-xl bg-[#00E5FF]/5 border border-[#00E5FF]/10">
                <p className="text-white font-medium text-xs mb-1">{o.title}</p>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-[#00E5FF]">{o.potential}</span>
                  <span className="text-white/25">{o.timeframe}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* 30-Day Strategic Plan */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-5">
          <Calendar className="w-4 h-4 text-[#A855F7]" />
          <h3 className="text-white font-semibold text-sm">30-Day Strategic Plan</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {strategicPlan.map((phase, i) => (
            <div key={i} className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white ${i === 0 ? 'bg-red-500' : i === 1 ? 'bg-amber-500' : i === 2 ? 'bg-[#6C63FF]' : 'bg-emerald-500'}`}>
                  {i + 1}
                </div>
                <div>
                  <p className="text-white/30 text-[10px]">{phase.phase}</p>
                  <p className="text-white font-semibold text-xs">{phase.title}</p>
                </div>
              </div>
              <div className="space-y-1.5">
                {phase.actions.map((action, j) => (
                  <div key={j} className="flex items-start gap-1.5">
                    <CheckCircle className="w-3 h-3 text-white/20 flex-shrink-0 mt-0.5" />
                    <p className="text-white/50 text-[10px] leading-tight">{action}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Strategic Recommendations */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-[#A855F7]" />
          <h3 className="text-white font-semibold text-sm">Strategic Recommendations</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {recommendations.slice(0, 4).map((rec, i) => (
            <div key={i} className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-bold text-white ${rec.priority === 'critical' ? 'bg-red-500' : rec.priority === 'high' ? 'bg-amber-500' : 'bg-[#6C63FF]'}`}>
                  {i + 1}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${rec.priority === 'critical' ? 'bg-red-500/15 text-red-400' : rec.priority === 'high' ? 'bg-amber-500/15 text-amber-400' : 'bg-[#6C63FF]/15 text-[#6C63FF]'}`}>
                  {rec.priority.toUpperCase()}
                </span>
              </div>
              <h4 className="text-white font-medium text-xs mb-1">{rec.title}</h4>
              <p className="text-white/40 text-[10px] mb-1.5">{rec.action}</p>
              <div className="flex items-center gap-1.5 text-[#00E5FF] text-[10px]">
                <CheckCircle className="w-3 h-3" />
                <span>{rec.expectedImpact}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Industry Best Practices */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="bg-gradient-to-r from-[#6C63FF]/8 to-[#00E5FF]/8 border border-[#6C63FF]/15 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="w-4 h-4 text-[#6C63FF]" />
          <h3 className="text-white font-semibold text-xs">{dna.industry} — Industry Best Practices</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {industryInsights.map((insight, i) => (
            <div key={i} className="flex items-start gap-2 p-2.5 rounded-xl bg-white/[0.03]">
              <CheckCircle className="w-3.5 h-3.5 text-[#00E5FF] flex-shrink-0 mt-0.5" />
              <p className="text-white/55 text-[10px]">{insight}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
