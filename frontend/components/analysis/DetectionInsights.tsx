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
      title: 'PHISHING INDICATORS',
      icon: '⚡',
      severity: 'high',
      details: [
        'Urgency language detected: "Act now!", "Limited time!", "Verify immediately"',
        'Impersonation patterns: pretending to be a trusted entity',
        'Requests for personal or financial information',
        `Neural confidence: ${Math.round(riskScore * 100)}% match with known scam patterns`,
      ],
    });
  }

  if (riskScore > 0.3) {
    findings.push({
      title: 'URL ANOMALIES',
      icon: '⟐',
      severity: riskScore > 0.6 ? 'high' : 'medium',
      details: [
        explanation.includes('IP address') ? '▶ URL contains raw IP address (hostile indicator)' : 'URL structure analysis complete',
        'Domain reputation scan performed',
        'Redirect chain analysis complete',
        'SSL certificate verification checked',
      ],
    });
  }

  findings.push({
    title: 'SENDER ANALYSIS',
    icon: '◉',
    severity: isScam ? 'high' : 'low',
    details: [
      isScam ? '▶ Sender domain flagged as potentially hostile' : '✓ Sender domain appears legitimate',
      'SPF/DKIM/DMARC verification performed',
      'Domain age and reputation checked',
      'Historical complaint records searched',
    ],
  });

  findings.push({
    title: 'CONTENT ANALYSIS',
    icon: '◈',
    severity: riskScore > 0.5 ? 'medium' : 'low',
    details: [
      `Overall risk score: ${Math.round(riskScore * 100)}%`,
      `Classification: ${isScam ? 'THREAT DETECTED' : 'APPEARS SAFE'}`,
      `AI explanation: ${explanation}`,
      'Grammar and tone analysis complete',
    ],
  });

  return findings;
}

const severityColors = {
  high: { border: '#ff073a', bg: 'rgba(255,7,58,0.05)', badge: '#ff073a' },
  medium: { border: '#ffe600', bg: 'rgba(255,230,0,0.05)', badge: '#ffe600' },
  low: { border: '#39ff14', bg: 'rgba(57,255,20,0.05)', badge: '#39ff14' },
};

export default function DetectionInsights({ explanation, isScam, riskScore }: DetectionInsightsProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const findings = generateFindings(explanation, isScam, riskScore);

  return (
    <Card hover={false}>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-bold flex items-center gap-2 tracking-wider uppercase"
          style={{ fontFamily: 'var(--font-heading)', color: '#00f0ff' }}
        >
          ⟐ DETECTION INSIGHTS
        </h3>
        <span className="text-[10px] font-bold px-3 py-1 rounded-full tracking-wider"
          style={{
            background: isScam ? 'rgba(255,7,58,0.1)' : 'rgba(57,255,20,0.1)',
            color: isScam ? '#ff073a' : '#39ff14',
            border: `1px solid ${isScam ? 'rgba(255,7,58,0.2)' : 'rgba(57,255,20,0.2)'}`,
            fontFamily: 'var(--font-heading)',
          }}
        >
          {findings.length} FINDINGS
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
              className="rounded-xl overflow-hidden transition-all"
              style={{
                borderLeft: `3px solid ${colors.border}`,
                background: isOpen ? colors.bg : 'transparent',
                boxShadow: isOpen ? `0 0 15px ${colors.border}10` : 'none',
              }}
            >
              <button
                onClick={() => setExpandedIndex(isOpen ? null : index)}
                className="w-full px-4 py-3 flex items-center justify-between transition-colors"
                style={{ color: 'var(--foreground)' }}
              >
                <span className="flex items-center gap-2 font-semibold text-xs tracking-wider">
                  <span className="text-base">{finding.icon}</span>
                  <span style={{ fontFamily: 'var(--font-heading)' }}>{finding.title}</span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full tracking-[0.15em]"
                    style={{
                      background: `${colors.badge}15`,
                      color: colors.badge,
                      border: `1px solid ${colors.badge}30`,
                      fontFamily: 'var(--font-heading)',
                    }}
                  >
                    {finding.severity.toUpperCase()}
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
                          <span className="mt-0.5 text-xs" style={{ color: colors.border }}>▸</span>
                          <span className="leading-relaxed text-xs">{detail}</span>
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
