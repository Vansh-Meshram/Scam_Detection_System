'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useAppStore } from '@/lib/store';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';

interface FeedbackPanelProps {
  text: string;
  url: string;
  riskScore: number;
  isScam: boolean;
}

export default function FeedbackPanel({ text, url, riskScore, isScam }: FeedbackPanelProps) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { feedbackCount, incrementFeedback } = useAppStore();

  const handleFeedback = async (isCorrect: boolean) => {
    setSubmitting(true);
    try {
      await api.feedback({
        text,
        url,
        predicted_score: riskScore,
        user_label: isCorrect ? (isScam ? 1 : 0) : (isScam ? 0 : 1),
      });

      incrementFeedback();
      setSubmitted(true);

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#00f0ff', '#39ff14', '#ff00e5', '#b14eff'],
      });

      toast.success('Neural feedback integrated!');
    } catch {
      toast.error('Failed to submit feedback. Backend may not be running.');
    } finally {
      setSubmitting(false);
    }
  };

  const getBadge = () => {
    if (feedbackCount >= 100) return { label: '◈ ELITE OPERATOR', color: '#ffe600' };
    if (feedbackCount >= 50) return { label: '⟁ CYBER ANALYST', color: '#00f0ff' };
    if (feedbackCount >= 10) return { label: '⟐ FIELD AGENT', color: '#39ff14' };
    return { label: '◉ RECRUIT', color: '#6b7fa8' };
  };

  const badge = getBadge();

  return (
    <Card hover={false} glow="cyan">
      <h3 className="text-base font-bold mb-4 flex items-center gap-2 tracking-wider uppercase"
        style={{ fontFamily: 'var(--font-heading)', color: '#00f0ff' }}
      >
        ⟁ IMPROVE NEURAL NET
      </h3>

      {submitted ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-6"
        >
          <div className="text-4xl mb-3">⟁</div>
          <p className="font-bold text-sm tracking-wider" style={{ color: '#39ff14', fontFamily: 'var(--font-heading)' }}>
            FEEDBACK INTEGRATED
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Neural network is adapting to your input
          </p>
        </motion.div>
      ) : (
        <>
          <p className="text-xs mb-4" style={{ color: 'var(--muted-foreground)' }}>
            Was this verdict accurate?
          </p>
          <div className="flex gap-3 mb-4">
            <Button
              variant="secondary"
              size="md"
              className="flex-1"
              onClick={() => handleFeedback(true)}
              isLoading={submitting}
            >
              ✓ CORRECT
            </Button>
            <Button
              variant="secondary"
              size="md"
              className="flex-1"
              onClick={() => handleFeedback(false)}
              isLoading={submitting}
            >
              ✕ WRONG
            </Button>
          </div>
        </>
      )}

      {/* Gamification */}
      <div className="pt-4 mt-4 border-t space-y-3" style={{ borderColor: 'rgba(0, 240, 255, 0.08)' }}>
        <div className="flex items-center justify-between">
          <span className="text-xs tracking-wider uppercase" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-heading)' }}>
            Contributions
          </span>
          <span className="font-bold text-lg tabular-nums" style={{ color: '#00f0ff', fontFamily: 'var(--font-heading)' }}>
            {feedbackCount}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold tracking-wider" style={{ color: badge.color, fontFamily: 'var(--font-heading)' }}>
            {badge.label}
          </span>
        </div>

        <div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0, 240, 255, 0.06)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{
                background: badge.color,
                width: `${Math.min(100, (feedbackCount % 10) * 10)}%`,
                boxShadow: `0 0 8px ${badge.color}40`,
              }}
            />
          </div>
          <p className="text-[10px] mt-1 tracking-wider" style={{ color: 'var(--muted-foreground)', fontFamily: 'var(--font-heading)' }}>
            {10 - (feedbackCount % 10)} MORE TO NEXT RANK
          </p>
        </div>
      </div>
    </Card>
  );
}
