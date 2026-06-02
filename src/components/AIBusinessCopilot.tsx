import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User, Sparkles, Zap } from 'lucide-react';
import type { ParsedData, Message } from '../types';
import { generateKPIs, generateBusinessScore, detectNumericColumns, detectCategoryColumns, groupByColumn } from '../utils/dataAnalysis';
import { generateInsights } from '../utils/insightGenerator';
import { generateBusinessDNA } from '../utils/businessUnderstanding';
import { formatINRSmart, formatIndianNumber } from '../utils/formatters';

interface Props {
  data: ParsedData;
}

const SUGGESTED_QUESTIONS = [
  "What is driving growth?",
  "Which segment performs best?",
  "What should we focus on?",
  "What are the main risks?",
];

export default function AIBusinessCopilot({ data }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const kpis = generateKPIs(data);
  const score = generateBusinessScore(data);
  const insights = generateInsights(data);
  const dna = generateBusinessDNA(data);
  const numCols = detectNumericColumns(data);
  const catCols = detectCategoryColumns(data);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const generateResponse = (question: string): string => {
    const q = question.toLowerCase();

    if (q.includes('growth') || q.includes('driving') || q.includes('increasing')) {
      const growthKpis = kpis.filter(k => k.change > 0);
      const growthInsights = insights.filter(i => i.type === 'driver' || i.type === 'opportunity');
      if (growthKpis.length > 0) {
        return `Based on your data, here's what's driving growth:\n\n**Top Growth Drivers:**\n${growthKpis.slice(0, 3).map(k => `  ${k.label}: +${k.change}% (Value: ${k.value})`).join('\n')}\n\n${growthInsights.length > 0 ? `**Key Insight:** ${growthInsights[0].title} — ${growthInsights[0].description.slice(0, 100)}` : ''}\n\nFocus on scaling these positive trends for maximum impact.`;
      }
      return `Current growth analysis shows mixed signals. ${score.strengths.length > 0 ? score.strengths[0] : 'Focus on optimizing your top-performing segments.'}`;
    }

    if (q.includes('perform') || q.includes('best') || q.includes('top') || q.includes('segment')) {
      if (catCols.length > 0 && numCols.length > 0) {
        const groups = groupByColumn(data, catCols[0], numCols[0]);
        const sorted = Object.entries(groups).sort((a, b) => b[1] - a[1]).slice(0, 3);
        return `**Top Performing Segments by ${catCols[0]}:**\n\n${sorted.map(([name, value], i) => `${i + 1}. **${name}**: ${formatINRSmart(value)}`).join('\n\n')}\n\n**Recommendation:** Focus resources on the top 2 segments while exploring growth potential in emerging segments.`;
      }
      return `Based on your data, the best performance metrics are:\n\n${kpis.slice(0, 3).map(k => `  **${k.label}**: ${k.value} (${k.change >= 0 ? '+' : ''}${k.change}%)`).join('\n')}`;
    }

    if (q.includes('focus') || q.includes('priority') || q.includes('should we')) {
      const criticalRecs = insights.filter(i => i.impact === 'high');
      const decliningKpis = kpis.filter(k => k.change < 0);
      let response = `**Strategic Focus Areas:**\n\n`;
      if (decliningKpis.length > 0) {
        response += `**Immediate Attention:**\n${decliningKpis.map(k => `  ${k.label} has declined ${Math.abs(k.change)}%`).join('\n')}\n\n`;
      }
      if (criticalRecs.length > 0) {
        response += `**High-Impact Opportunities:**\n${criticalRecs.slice(0, 2).map(i => `  ${i.title}`).join('\n')}`;
      }
      response += `\n\n**Health Score:** ${score.overall}/100 — ${score.overall >= 70 ? 'Strong position to scale' : score.overall >= 50 ? 'Room for optimization' : 'Immediate action needed'}`;
      return response;
    }

    if (q.includes('risk') || q.includes('concern') || q.includes('warning') || q.includes('declining')) {
      const risks = insights.filter(i => i.type === 'risk');
      const declining = kpis.filter(k => k.change < 0);
      let response = `**Risk Assessment:**\n\n`;
      if (risks.length > 0) {
        response += `**Identified Risks:**\n${risks.map(r => `  **${r.title}**: ${r.description.slice(0, 80)}`).join('\n\n')}\n\n`;
      }
      if (declining.length > 0) {
        response += `**Declining Metrics:**\n${declining.map(k => `  ${k.label}: ${k.change}%`).join('\n')}\n\n`;
      }
      response += `**Risk Level:** ${dna.riskLevel}\n\n**Recommendation:** ${score.weaknesses.length > 0 ? score.weaknesses[0] : 'Continue monitoring key metrics for early warning signs.'}`;
      return response;
    }

    if (q.includes('revenue') || q.includes('sales') || q.includes('money') || q.includes('profit')) {
      const revenueKpi = kpis.find(k => k.label.toLowerCase().includes('revenue') || k.label.toLowerCase().includes('profit'));
      if (revenueKpi) {
        return `**Revenue Analysis:**\n\n  **Total**: ${revenueKpi.value}\n  **Trend**: ${revenueKpi.change >= 0 ? '+' : ''}${revenueKpi.change}%\n  **Direction**: ${revenueKpi.trend === 'up' ? 'Growing' : revenueKpi.trend === 'down' ? 'Declining' : 'Stable'}\n\n**Key Insight:** ${revenueKpi.explanation}\n\n**Focus Area:** ${revenueKpi.change < 0 ? 'Address declining trend immediately' : 'Scale successful revenue streams'}.`;
      }
      return `Your primary metric ${numCols[0] || 'value'} shows:\n\n${kpis.slice(0, 3).map(k => `  **${k.label}**: ${k.value} (${k.change >= 0 ? '+' : ''}${k.change}%)`).join('\n')}`;
    }

    return `**Nexora AI Analysis:**\n\nYour ${dna.industry} dataset shows:\n\n  **Health Score**: ${score.overall}/100\n  **Growth Stage**: ${dna.growthStage}\n  **AI Confidence**: ${dna.aiConfidence}%\n\n**Top Insight:** ${insights[0]?.title || 'Data successfully analyzed'}\n\n**Quick Stats:**\n  ${kpis[0]?.label}: ${kpis[0]?.value}\n  Records: ${formatIndianNumber(data.rowCount)}\n  Dimensions: ${data.columnCount}\n\nTry asking about growth drivers, best segments, or strategic priorities!`;
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    await new Promise(r => setTimeout(r, 600));

    const response = generateResponse(input);

    const assistantMessage: Message = {
      role: 'assistant',
      content: response,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsTyping(false);
  };

  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
    setTimeout(() => {
      const kpis = generateKPIs(data);
      const score = generateBusinessScore(data);
      const insights = generateInsights(data);
      const dna = generateBusinessDNA(data);
      const numCols = detectNumericColumns(data);
      const catCols = detectCategoryColumns(data);

      const generateResponseInner = (q: string): string => {
        const ql = q.toLowerCase();
        if (ql.includes('growth') || ql.includes('driving')) {
          const gk = kpis.filter(k => k.change > 0);
          return gk.length > 0
            ? `**Growth Drivers:**\n${gk.slice(0, 3).map(k => `  ${k.label}: +${k.change}%`).join('\n')}\n\nScale these trends for maximum impact.`
            : 'No strong growth signals detected. Focus on stabilizing current metrics.';
        }
        if (ql.includes('best') || ql.includes('segment') || ql.includes('perform')) {
          if (catCols.length > 0 && numCols.length > 0) {
            const groups = groupByColumn(data, catCols[0], numCols[0]);
            const sorted = Object.entries(groups).sort((a, b) => b[1] - a[1]).slice(0, 3);
            return `**Top Segments by ${catCols[0]}:**\n${sorted.map(([n, v], i) => `${i + 1}. **${n}**: ${formatINRSmart(v)}`).join('\n')}`;
          }
          return `Top metrics: ${kpis.slice(0, 3).map(k => `${k.label}: ${k.value}`).join(', ')}`;
        }
        if (ql.includes('focus') || ql.includes('should')) {
          return `**Focus Areas:**\n  Health: ${score.overall}/100\n  ${score.weaknesses[0] || 'Optimize top-performing segments'}\n\n${insights.filter(i => i.impact === 'high').slice(0, 2).map(i => `  ${i.title}`).join('\n')}`;
        }
        if (ql.includes('risk')) {
          return `**Risk Level:** ${dna.riskLevel}\n${insights.filter(i => i.type === 'risk').slice(0, 2).map(i => `  ${i.title}`).join('\n') || '  No critical risks identified'}`;
        }
        return `Your ${dna.industry} data: Health ${score.overall}/100, ${dna.growthStage} stage. Ask about growth, segments, or risks!`;
      };

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: generateResponseInner(question),
        timestamp: new Date(),
      }]);
    }, 600);
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full flex items-center justify-center shadow-2xl transition-all
          ${isOpen ? 'bg-white/10 border border-white/20' : 'bg-gradient-to-r from-[#6C63FF] to-[#00E5FF]'} shadow-[#6C63FF]/30 hover:shadow-[#6C63FF]/50`}
      >
        {isOpen ? (
          <X className="w-5 h-5 text-white" />
        ) : (
          <MessageCircle className="w-5 h-5 text-white" />
        )}
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 right-6 z-40 w-[360px] max-w-[calc(100vw-48px)] h-[500px] max-h-[70vh] bg-[#0A0F1E]/95 backdrop-blur-xl border border-[#6C63FF]/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-white/10 bg-gradient-to-r from-[#6C63FF]/10 to-transparent">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6C63FF] to-[#00E5FF] flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold text-sm">Nexora AI Analyst</h3>
                <p className="text-white/30 text-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Powered by your data
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
              {messages.length === 0 ? (
                <div className="text-center pt-6">
                  <Sparkles className="w-7 h-7 text-[#6C63FF] mx-auto mb-3" />
                  <p className="text-white font-medium text-sm mb-1">Ask me anything about your data</p>
                  <p className="text-white/30 text-xs mb-4">I analyze your uploaded data to provide insights</p>

                  <div className="space-y-2">
                    <p className="text-white/20 text-[10px] uppercase tracking-wider">Try asking</p>
                    {SUGGESTED_QUESTIONS.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => handleSuggestedQuestion(q)}
                        className="w-full text-left p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-[#6C63FF]/20 text-white/60 text-xs transition-all"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-[#00E5FF]/15' : 'bg-[#6C63FF]/15'}`}>
                      {msg.role === 'user' ? (
                        <User className="w-3 h-3 text-[#00E5FF]" />
                      ) : (
                        <Bot className="w-3 h-3 text-[#6C63FF]" />
                      )}
                    </div>
                    <div className={`max-w-[80%] p-2.5 rounded-xl text-xs ${msg.role === 'user' ? 'bg-[#6C63FF]/15 text-white' : 'bg-white/[0.04] text-white/75'}`}>
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  </motion.div>
                ))
              )}

              {isTyping && (
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#6C63FF]/15 flex items-center justify-center">
                    <Bot className="w-3 h-3 text-[#6C63FF]" />
                  </div>
                  <div className="bg-white/[0.04] rounded-xl p-2.5">
                    <div className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <motion.div
                          key={i}
                          animate={{ y: [0, -3, 0] }}
                          transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.12 }}
                          className="w-1 h-1 rounded-full bg-[#6C63FF]"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-white/5">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask about your data..."
                  className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-[#6C63FF]/40 transition-colors"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="w-8 h-8 rounded-xl bg-gradient-to-r from-[#6C63FF] to-[#00E5FF] flex items-center justify-center disabled:opacity-40 transition-opacity"
                >
                  <Send className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
