import { motion } from 'framer-motion';
import { LayoutDashboard, Brain, Lightbulb, Activity, GitCompare, Download, Upload, TrendingUp, Crown, Zap } from 'lucide-react';
import type { PageId } from '../types';

interface Props {
  activePage: PageId;
  onPageChange: (page: PageId) => void;
  onReset: () => void;
  fileName: string;
}

const PAGES: { id: PageId; label: string; icon: React.ReactNode; short: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, short: 'Dash' },
  { id: 'ceo', label: 'CEO Mode', icon: <Crown className="w-4 h-4" />, short: 'CEO' },
  { id: 'insights', label: 'Insights', icon: <Brain className="w-4 h-4" />, short: 'Intel' },
  { id: 'recommendations', label: 'Actions', icon: <Lightbulb className="w-4 h-4" />, short: 'Act' },
  { id: 'health', label: 'Health', icon: <Activity className="w-4 h-4" />, short: 'Health' },
  { id: 'comparison', label: 'Compare', icon: <GitCompare className="w-4 h-4" />, short: 'Cmp' },
  { id: 'forecast', label: 'Forecast', icon: <TrendingUp className="w-4 h-4" />, short: 'Fcst' },
  { id: 'export', label: 'Export', icon: <Download className="w-4 h-4" />, short: 'Export' },
];

export default function Navigation({ activePage, onPageChange, onReset, fileName }: Props) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="backdrop-blur-xl bg-[#0A0F1E]/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#6C63FF] to-[#00E5FF] flex items-center justify-center shadow-lg shadow-[#6C63FF]/20">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-white font-bold text-sm tracking-wide hidden sm:block">
              <span className="nexora-gradient-primary">NEXORA</span>
              <span className="text-white/40 ml-0.5">AI</span>
            </span>
          </div>

          {/* Divider */}
          <div className="w-px h-5 bg-white/10 flex-shrink-0" />

          {/* File badge */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 flex-shrink-0 max-w-[140px]">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
            <span className="text-white/50 text-xs truncate font-mono">{fileName}</span>
          </div>

          {/* Nav tabs */}
          <nav className="flex-1 flex items-center justify-center gap-0.5 overflow-x-auto no-scrollbar">
            {PAGES.map(page => (
              <button
                key={page.id}
                onClick={() => onPageChange(page.id)}
                className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors duration-200 flex-shrink-0
                  ${activePage === page.id
                    ? 'text-white'
                    : 'text-white/35 hover:text-white/60'
                  }`}
              >
                {activePage === page.id && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-lg bg-[#6C63FF]/20 border border-[#6C63FF]/30"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{page.icon}</span>
                <span className="relative z-10 hidden lg:block">{page.label}</span>
                <span className="relative z-10 lg:hidden">{page.short}</span>
              </button>
            ))}
          </nav>

          {/* Reset button */}
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-white/25 hover:text-white/60 hover:bg-white/5 transition-all text-xs flex-shrink-0"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:block">New</span>
          </button>
        </div>
      </div>
    </header>
  );
}
