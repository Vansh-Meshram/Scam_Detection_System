'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import Sidebar from '@/components/layout/Sidebar';
import Button from '@/components/common/Button';
import Textarea from '@/components/common/Textarea';
import Input from '@/components/common/Input';
import Card from '@/components/common/Card';
import RiskGauge from '@/components/analysis/RiskGauge';
import DetectionInsights from '@/components/analysis/DetectionInsights';
import ModelBreakdown from '@/components/analysis/ModelBreakdown';
import FeedbackPanel from '@/components/feedback/FeedbackPanel';

type TabId = 'full' | 'url' | 'text';

export default function AnalyzePage() {
  const [activeTab, setActiveTab] = useState<TabId>('full');
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');

  const {
    currentAnalysis,
    setCurrentAnalysis,
    isAnalyzing,
    setIsAnalyzing,
    addToHistory,
  } = useAppStore();

  const handleAnalyze = async () => {
    const inputText = activeTab !== 'url' ? text : '';
    const inputUrl = activeTab !== 'text' ? url : '';

    if (!inputText && !inputUrl) {
      toast.error('Please enter text or a URL to analyze');
      return;
    }

    setIsAnalyzing(true);
    setCurrentAnalysis(null);

    try {
      const result = await api.predict({ text: inputText, url: inputUrl });
      setCurrentAnalysis(result);
      addToHistory({
        text: inputText,
        url: inputUrl,
        risk_score: result.risk_score,
        is_scam: result.is_scam,
      });
      toast.success('Analysis complete!');
    } catch {
      // Use simulated result for demo purposes when backend is unreachable
      const simulated = simulateResult(inputText, inputUrl);
      setCurrentAnalysis(simulated);
      addToHistory({
        text: inputText,
        url: inputUrl,
        risk_score: simulated.risk_score,
        is_scam: simulated.is_scam,
      });
      toast('Using simulated analysis (backend unavailable)', { icon: '🔄' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClear = () => {
    setText('');
    setUrl('');
    setCurrentAnalysis(null);
  };

  const tabs = [
    { id: 'full' as TabId, label: 'Email/SMS & URL', icon: '📧' },
    { id: 'url' as TabId, label: 'URL Only', icon: '🔗' },
    { id: 'text' as TabId, label: 'Text Only', icon: '📝' },
  ];

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--background)' }}>
      <Sidebar />

      <div className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-extrabold" style={{ color: 'var(--foreground)' }}>
            Threat Analysis
          </h1>
          <p className="mt-2 text-base" style={{ color: 'var(--muted-foreground)' }}>
            Paste a suspicious message or URL to analyze it for threats
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ====== LEFT: INPUT ====== */}
          <div className="space-y-6">
            <Card hover={false}>
              {/* Tab Navigation */}
              <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ background: 'var(--secondary)' }}>
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? 'bg-[#1E88E5] text-white shadow-md'
                        : 'hover:bg-[var(--background)]'
                    }`}
                    style={activeTab !== tab.id ? { color: 'var(--muted-foreground)' } : undefined}
                  >
                    <span className="sm:hidden text-lg">{tab.icon}</span>
                    <span className="hidden sm:inline">{tab.icon} {tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Input Fields */}
              <div className="space-y-4">
                <AnimatePresence mode="wait">
                  {(activeTab === 'full' || activeTab === 'text') && (
                    <motion.div
                      key="text-input"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <Textarea
                        label="📧 Message Content"
                        placeholder="Paste the suspicious email, SMS, or message content here...&#10;&#10;Example: You have won $1,000,000! Click here to claim your prize immediately. Verify your identity now!"
                        rows={8}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        showCount
                        maxLength={5000}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  {(activeTab === 'full' || activeTab === 'url') && (
                    <motion.div
                      key="url-input"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <Input
                        label="🔗 URL"
                        icon="🌐"
                        type="url"
                        placeholder="https://suspicious-link.com/verify"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleAnalyze}
                    isLoading={isAnalyzing}
                    className="flex-1"
                    size="lg"
                  >
                    🔬 Analyze with AI
                  </Button>
                  <Button variant="ghost" onClick={handleClear} size="lg">
                    🗑️
                  </Button>
                </div>
              </div>
            </Card>

            {/* Info Card */}
            <Card hover={false}>
              <h3 className="font-bold text-base mb-3" style={{ color: 'var(--foreground)' }}>
                🛡️ What We Analyze
              </h3>
              <ul className="space-y-2.5">
                {[
                  { icon: '🔍', text: 'Phishing patterns & urgency language detection' },
                  { icon: '🔗', text: 'URL legitimacy, domain age & redirect chains' },
                  { icon: '📧', text: 'Sender verification (SPF, DKIM, DMARC)' },
                  { icon: '🛡️', text: 'Adversarial attack resistance testing' },
                ].map((item) => (
                  <li key={item.text} className="flex items-start gap-2.5 text-sm leading-relaxed"
                    style={{ color: 'var(--muted-foreground)' }}
                  >
                    <span className="mt-0.5">{item.icon}</span>
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* ====== RIGHT: RESULTS ====== */}
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {isAnalyzing ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Card hover={false}>
                    <div className="flex flex-col items-center py-16">
                      <div className="relative">
                        <div className="w-16 h-16 border-4 border-[#1E88E5] border-t-transparent rounded-full animate-spin" />
                        <div className="absolute inset-0 w-16 h-16 border-4 border-[#764ba2] border-b-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                      </div>
                      <p className="text-lg font-semibold mt-6" style={{ color: 'var(--foreground)' }}>
                        Analyzing threat...
                      </p>
                      <p className="text-sm mt-2" style={{ color: 'var(--muted-foreground)' }}>
                        Running RoBERTa text encoder, URL analysis & adversarial checks
                      </p>
                    </div>
                  </Card>
                </motion.div>

              ) : currentAnalysis ? (
                <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                  {/* Risk Gauge */}
                  <Card hover={false} glow={currentAnalysis.is_scam ? 'red' : 'green'}>
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                      🎯 Threat Assessment
                    </h3>
                    <RiskGauge score={currentAnalysis.risk_score} />
                  </Card>

                  {/* Detection Insights */}
                  <DetectionInsights
                    explanation={currentAnalysis.explanation}
                    isScam={currentAnalysis.is_scam}
                    riskScore={currentAnalysis.risk_score}
                  />

                  {/* Model Breakdown */}
                  <ModelBreakdown riskScore={currentAnalysis.risk_score} />

                  {/* Feedback */}
                  <FeedbackPanel
                    text={text}
                    url={url}
                    riskScore={currentAnalysis.risk_score}
                    isScam={currentAnalysis.is_scam}
                  />
                </motion.div>

              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Card hover={false}>
                    <div className="text-center py-20">
                      <motion.div
                        animate={{ y: [0, -8, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        className="text-7xl mb-6"
                      >
                        🔍
                      </motion.div>
                      <p className="text-xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                        Ready to Analyze
                      </p>
                      <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                        Enter a suspicious message or URL and click "Analyze with AI"
                      </p>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==============================
// Simulated result when backend is unavailable
// ==============================
function simulateResult(text: string, url: string) {
  const suspiciousWords = ['win', 'won', 'prize', 'free', 'click', 'verify', 'urgent', 'immediately', 'account', 'suspended', 'password', 'confirm', 'expire', 'limited'];
  const lowerText = (text + ' ' + url).toLowerCase();
  let score = 0.1;

  for (const word of suspiciousWords) {
    if (lowerText.includes(word)) score += 0.08;
  }

  if (url && url.includes('http')) score += 0.1;
  if (lowerText.includes('!')) score += 0.05 * (lowerText.split('!').length - 1);
  if (lowerText.includes('$')) score += 0.1;

  score = Math.min(0.98, Math.max(0.05, score));

  const is_scam = score > 0.5;
  let explanation = is_scam
    ? 'High risk indicators found in the message content.'
    : 'Message appears safe with no major threats detected.';

  if (url && /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(url)) {
    explanation += ' Warning: URL contains an IP address.';
    score = Math.min(0.98, score + 0.15);
  }

  return {
    risk_score: Math.round(score * 10000) / 10000,
    is_scam,
    explanation,
  };
}
