import { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { ParsedData, PageId } from './types';
import DataUniverse from './components/DataUniverse';
import UploadScreen from './components/UploadScreen';
import Navigation from './components/Navigation';
import BusinessDNAProfile from './components/BusinessDNAProfile';
import AIBusinessCopilot from './components/AIBusinessCopilot';
import ExecutiveDashboard from './pages/ExecutiveDashboard';
import CEOMode from './pages/CEOMode';
import InsightEngine from './pages/InsightEngine';
import RecommendationEngine from './pages/RecommendationEngine';
import BusinessHealth from './pages/BusinessHealth';
import ComparisonLab from './pages/ComparisonLab';
import ExportCenter from './pages/ExportCenter';
import Forecasting from './pages/Forecasting';
import { generateBusinessDNA, generateDashboardName } from './utils/businessUnderstanding';

export default function App() {
  const [data, setData] = useState<ParsedData | null>(null);
  const [activePage, setActivePage] = useState<PageId>('dashboard');

  const dna = useMemo(() => data ? generateBusinessDNA(data) : null, [data]);
  const dashboardTitle = useMemo(() => dna ? generateDashboardName(dna) : 'Executive Dashboard', [dna]);

  const handleDataReady = (parsed: ParsedData) => {
    setData(parsed);
    setActivePage('dashboard');
  };

  const handleReset = () => {
    setData(null);
    setActivePage('dashboard');
  };

  return (
    <div className="min-h-screen bg-[#0A0F1E] overflow-x-hidden">
      {/* Animated background */}
      <DataUniverse data={data} phase={data ? 'active' : 'idle'} />

      {/* Depth overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 20% 50%, rgba(108,99,255,0.05) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(0,229,255,0.04) 0%, transparent 50%)',
          zIndex: 1,
        }}
      />

      <AnimatePresence mode="wait">
        {!data ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4 }}
            className="relative z-10"
          >
            <UploadScreen onDataReady={handleDataReady} />
          </motion.div>
        ) : (
          <motion.div
            key="app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="relative z-10"
          >
            <Navigation
              activePage={activePage}
              onPageChange={setActivePage}
              onReset={handleReset}
              fileName={data.fileName}
            />

            <main className="pt-14 pb-8">
              <div className="max-w-7xl mx-auto px-4">
                {/* Business DNA Profile */}
                {dna && activePage !== 'export' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-5"
                  >
                    <BusinessDNAProfile dna={dna} />
                  </motion.div>
                )}

                {/* Dynamic Dashboard Title */}
                {activePage === 'dashboard' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mb-5"
                  >
                    <h1 className="text-2xl font-bold nexora-gradient-primary">
                      {dashboardTitle}
                    </h1>
                    <p className="text-white/35 text-xs mt-1">
                      {dna?.industry} · {dna?.businessModel} · {dna?.growthStage}
                    </p>
                  </motion.div>
                )}

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activePage}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25 }}
                  >
                    {activePage === 'dashboard' && <ExecutiveDashboard data={data} />}
                    {activePage === 'ceo' && <CEOMode data={data} />}
                    {activePage === 'insights' && <InsightEngine data={data} />}
                    {activePage === 'recommendations' && <RecommendationEngine data={data} />}
                    {activePage === 'health' && <BusinessHealth data={data} />}
                    {activePage === 'comparison' && <ComparisonLab data={data} />}
                    {activePage === 'forecast' && <Forecasting data={data} />}
                    {activePage === 'export' && <ExportCenter data={data} />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </main>

            {/* AI Business Copilot */}
            <AIBusinessCopilot data={data} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
