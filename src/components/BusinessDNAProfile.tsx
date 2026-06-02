import { motion } from 'framer-motion';
import { Building2, TrendingUp, Shield, Sparkles, Database, Brain, Gauge, Layers, Zap } from 'lucide-react';
import type { BusinessDNA } from '../types';

interface Props {
  dna: BusinessDNA;
}

export default function BusinessDNAProfile({ dna }: Props) {
  const qualityColor = dna.dataQuality >= 80 ? 'text-emerald-400' : dna.dataQuality >= 60 ? 'text-amber-400' : 'text-red-400';
  const riskColor = dna.riskLevel === 'Low' ? 'text-emerald-400' : dna.riskLevel === 'Moderate' ? 'text-amber-400' : 'text-red-400';
  const healthColor = dna.healthScore >= 70 ? '#22c55e' : dna.healthScore >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-[#6C63FF]/20 bg-gradient-to-r from-[#6C63FF]/8 via-[#0A0F1E] to-[#00E5FF]/8 backdrop-blur-xl"
    >
      {/* Subtle animated border glow */}
      <div className="absolute inset-0 rounded-2xl animate-border-glow pointer-events-none" />

      <div className="relative p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6C63FF] to-[#00E5FF] flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">Business DNA</h3>
              <p className="text-white/30 text-xs">AI-powered identity analysis</p>
            </div>
          </div>

          {/* Health Score Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: `${healthColor}15`, border: `1px solid ${healthColor}30` }}>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: healthColor }} />
            <span className="text-xs font-bold" style={{ color: healthColor }}>{dna.healthScore}</span>
            <span className="text-xs" style={{ color: `${healthColor}99` }}>Health</span>
          </div>
        </div>

        {/* Identity Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-4">
          <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Building2 className="w-3 h-3 text-[#6C63FF]" />
              <span className="text-white/30 text-[10px] uppercase tracking-wider">Industry</span>
            </div>
            <p className="text-white font-semibold text-sm leading-tight">{dna.industry}</p>
          </div>

          <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
            <div className="flex items-center gap-1.5 mb-1.5">
              <TrendingUp className="w-3 h-3 text-[#00E5FF]" />
              <span className="text-white/30 text-[10px] uppercase tracking-wider">Model</span>
            </div>
            <p className="text-white font-semibold text-sm leading-tight">{dna.businessModel}</p>
          </div>

          <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Gauge className="w-3 h-3 text-[#A855F7]" />
              <span className="text-white/30 text-[10px] uppercase tracking-wider">Stage</span>
            </div>
            <p className="text-white font-semibold text-sm leading-tight">{dna.growthStage}</p>
          </div>

          <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Shield className={`w-3 h-3 ${riskColor}`} />
              <span className="text-white/30 text-[10px] uppercase tracking-wider">Risk</span>
            </div>
            <p className={`font-semibold text-sm leading-tight ${riskColor}`}>{dna.riskLevel}</p>
          </div>
        </div>

        {/* Score Indicators */}
        <div className="grid grid-cols-4 gap-2.5">
          {/* Data Quality */}
          <div className="bg-white/[0.03] rounded-xl p-2.5 text-center">
            <div className="relative w-10 h-10 mx-auto mb-1.5">
              <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
                <circle cx="20" cy="20" r="16" fill="none" stroke="#ffffff08" strokeWidth="3" />
                <circle
                  cx="20" cy="20" r="16" fill="none"
                  stroke="#6C63FF" strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 16 * (dna.dataQuality / 100)} ${2 * Math.PI * 16}`}
                />
              </svg>
              <span className={`absolute inset-0 flex items-center justify-center text-[10px] font-bold ${qualityColor}`}>
                {dna.dataQuality}
              </span>
            </div>
            <div className="flex items-center justify-center gap-1">
              <Database className="w-2.5 h-2.5 text-white/30" />
              <span className="text-white/30 text-[10px]">Quality</span>
            </div>
          </div>

          {/* AI Confidence */}
          <div className="bg-white/[0.03] rounded-xl p-2.5 text-center">
            <div className="relative w-10 h-10 mx-auto mb-1.5">
              <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
                <circle cx="20" cy="20" r="16" fill="none" stroke="#ffffff08" strokeWidth="3" />
                <circle
                  cx="20" cy="20" r="16" fill="none"
                  stroke="#00E5FF" strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 16 * (dna.aiConfidence / 100)} ${2 * Math.PI * 16}`}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[#00E5FF]">
                {dna.aiConfidence}
              </span>
            </div>
            <div className="flex items-center justify-center gap-1">
              <Brain className="w-2.5 h-2.5 text-white/30" />
              <span className="text-white/30 text-[10px]">Confidence</span>
            </div>
          </div>

          {/* Health Score */}
          <div className="bg-white/[0.03] rounded-xl p-2.5 text-center">
            <div className="relative w-10 h-10 mx-auto mb-1.5">
              <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
                <circle cx="20" cy="20" r="16" fill="none" stroke="#ffffff08" strokeWidth="3" />
                <circle
                  cx="20" cy="20" r="16" fill="none"
                  stroke={healthColor} strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 16 * (dna.healthScore / 100)} ${2 * Math.PI * 16}`}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold" style={{ color: healthColor }}>
                {dna.healthScore}
              </span>
            </div>
            <div className="flex items-center justify-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-white/30" />
              <span className="text-white/30 text-[10px]">Health</span>
            </div>
          </div>

          {/* Dimensions */}
          <div className="bg-white/[0.03] rounded-xl p-2.5 text-center">
            <div className="w-10 h-10 mx-auto mb-1.5 rounded-full bg-[#A855F7]/15 flex items-center justify-center">
              <span className="text-sm font-bold text-[#A855F7]">{dna.dimensions}</span>
            </div>
            <div className="flex items-center justify-center gap-1">
              <Layers className="w-2.5 h-2.5 text-white/30" />
              <span className="text-white/30 text-[10px]">Dimensions</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[10px]">
          <span className="text-white/25">Primary: <span className="text-[#00E5FF]">{dna.primaryMetric}</span></span>
          <span className="text-white/25">{dna.recordsAnalyzed.toLocaleString()} records</span>
        </div>
      </div>
    </motion.div>
  );
}
