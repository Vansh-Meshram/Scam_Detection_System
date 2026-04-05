export const config = {
  appName: 'ScamGuard AI',
  version: '3.0.0',
  description: 'Hyper-optimized DistilBERT + URLNet Co-Attention neural network for real-time phishing and scam detection',
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000',
  modelInfo: {
    textEncoder: 'DistilBERT',
    urlEncoder: 'URLNet',
    fusion: 'Co-Attention',
    params: '~66M',
  },
};
