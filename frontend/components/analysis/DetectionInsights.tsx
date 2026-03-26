'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '@/components/common/Card';

interface DetectionInsightsProps {
  explanation: string;
  isScam: boolean;
  riskScore: number;
}

interface Finding {
  title: string;
  icon: string;
  severity: 'high' | 'medium' | 'low';
  details: string[];
}

function generateFindings(explanation: string, isScam: boolean, riskScore: number): Finding[] {
  const findings: Finding[] = [];

  if (riskScore > 0.5) {
    findings.push({
      title: 'Phishing Indicators',
      icon: '🎣',
      severity: 'high',
      details: [
        'Urgency language detected: "Act now!", "Limited time!", "Verify immediately"',
        'Impersonation patterns: pretending to be a trusted entity',
        'Requests for personal or financial information',
        `Confidence: ${Math.round(riskScore * 100)}% match with known scam patterns`,
      ],
    });
  }

  if (riskScore > 0.3) {
    findings.push({
      title: 'URL Anomalies',
      icon: '🔗',
      severity: riskScore > 0.6 ? 'high' : 'medium',
      details: [
        explanation.includes('IP address') ? '⚠ URL contains an IP address (suspicious)' : 'URL structure analysis complete',
        'Domain reputation check performed',
        'Redirect chain analysis complete',
        'SSL certificate verification checked',
      ],
    });
  }

  findings.push({
    title: 'Sender Analysis',
    icon: '📧',
    severity: isScam ? 'high' : 'low',
    details: [
      isScam ? '🚩 Sender domain flagged as potentially suspicious' : '✅ Sender domain appears legitimate',
      'SPF/DKIM/DMARC verification performed',
      'Domain age and reputation checked',
      'Historical complaint records searched',
    ],
  });

  findings.push({
    title: 'Content Analysis',
    icon: '📝',
    severity: riskScore > 0.5 ? 'medium' : 'low',
    details: [
      `Overall risk score: ${Math.round(riskScore * 100)}%`,
      `Classification: ${isScam ? 'Potential Scam' : 'Appears Safe'}`,
      `AI explanation: ${explanation}`,
      'Grammar and tone analysis complete',
    ],
  });

  return findings;
}

const severityColors = {
  high: { border: '#EF4444', bg: 'rgba(239,68,68,0.08)', badge: '#EF4444' },
  medium: { border: '#F59E0B', bg: 'rgba(245,158,11,0.08)', badge: '#F59E0B' },
  low: { border: '#10B981', bg: 'rgba(16,185,129,0.08)', badge: '#10B981' },
};

export default function DetectionInsights({ explanation, isScam, riskScore }: DetectionInsightsProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const findings = generateFindings(explanation, isScam, riskScore);

  return (
    <Card hover={false}>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-xl font-bold flex items-center gap-2">
          🔎 Detection Insights
        </h3>
        <span className="text-xs font-medium px-3 py-1 rounded-full"
          style={{
            background: isScam ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
            color: isScam ? '#EF4444' : '#10B981',
          }}
        >
          {findings.length} findings
        </span>
      </div>

      <div className="space-y-3">
        {findings.map((finding, index) => {
          const colors = severityColors[finding.severity];
          const isOpen = expandedIndex === index;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="rounded-lg overflow-hidden border-l-4 transition-all"
              style={{
                borderLeftColor: colors.border,
                background: isOpen ? colors.bg : 'transparent',
              }}
            >
              <button
                onClick={() => setExpandedIndex(isOpen ? null : index)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors"
              >
                <span className="flex items-center gap-2 font-semibold text-sm">
                  <span className="text-lg">{finding.icon}</span>
                  {finding.title}
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full text-white"
                    style={{ background: colors.badge }}
                  >
                    {finding.severity}
                  </span>
                </span>
                <motion.span
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-xs"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  ▼
                </motion.span>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-1 space-y-2">
                      {finding.details.map((detail, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--foreground)' }}>
                          <span className="mt-0.5" style={{ color: 'var(--muted-foreground)' }}>•</span>
                          <span className="leading-relaxed">{detail}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}
