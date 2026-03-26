export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const APP_CONFIG = {
  name: 'ScamGuard AI',
  version: '2.0.0',
  description: 'Enterprise-grade scam detection powered by AI',
  features: {
    accuracy: '99.7%',
    realtime: true,
    selfLearning: true,
  },
} as const;
