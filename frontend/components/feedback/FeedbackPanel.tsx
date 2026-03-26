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
        colors: ['#1E88E5', '#10B981', '#F59E0B', '#764ba2'],
      });

      toast.success('Thank you for your feedback! 🎉');
    } catch {
      toast.error('Failed to submit feedback. The AI backend may not be running.');
    } finally {
      setSubmitting(false);
    }
  };

  const getBadge = () => {
    if (feedbackCount >= 100) return { label: '🏆 Expert Contributor', color: '#F59E0B' };
    if (feedbackCount >= 50) return { label: '⭐ Active Contributor', color: '#1E88E5' };
    if (feedbackCount >= 10) return { label: '🌱 Rising Contributor', color: '#10B981' };
    return { label: '👋 New Contributor', color: '#94A3B8' };
  };

  const badge = getBadge();

  return (
    <Card hover={false} glow="blue">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        💡 Help Improve Our AI
      </h3>

      {submitted ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-6"
        >
          <div className="text-5xl mb-3">🎉</div>
          <p className="font-semibold text-lg" style={{ color: 'var(--foreground)' }}>
            Feedback Submitted!
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Your contribution helps make ScamGuard smarter
          </p>
        </motion.div>
      ) : (
        <>
          <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
            Was this prediction accurate?
          </p>
          <div className="flex gap-3 mb-4">
            <Button
              variant="secondary"
              size="md"
              className="flex-1"
              onClick={() => handleFeedback(true)}
              isLoading={submitting}
            >
              👍 Yes, correct
            </Button>
            <Button
              variant="secondary"
              size="md"
              className="flex-1"
              onClick={() => handleFeedback(false)}
              isLoading={submitting}
            >
              👎 No, wrong
            </Button>
          </div>
        </>
      )}

      {/* Gamification */}
      <div className="pt-4 mt-4 border-t space-y-3" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Your contributions
          </span>
          <span className="font-bold text-lg tabular-nums" style={{ color: '#1E88E5' }}>
            {feedbackCount}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium" style={{ color: badge.color }}>
            {badge.label}
          </span>
        </div>

        {/* Progress to next level */}
        <div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--secondary)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: badge.color, width: `${Math.min(100, (feedbackCount % 10) * 10)}%` }}
            />
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>
            {10 - (feedbackCount % 10)} more to next milestone
          </p>
        </div>
      </div>
    </Card>
  );
}
