# 📚 Scam Detection System — Guides

This project uses a **DistilBERT + URLNet Co-Attention** architecture for real-time phishing and scam detection.

## Available Guides

| Guide | Description |
|-------|-------------|
| [TRAINING_GUIDE.md](./TRAINING_GUIDE.md) | Complete step-by-step guide to train both DistilBERT and URLNet on Google Colab with GPU. Covers dataset preparation, training, evaluation, downloading weights, and connecting to the backend. |
| [BACKEND_CONNECTION_GUIDE.md](./BACKEND_CONNECTION_GUIDE.md) | Explains how the frontend, backend, and AI models connect. Covers why demo mode activates, how to fix it, CORS configuration, API endpoints, and the full prediction data flow. |

## Quick Start (If you already have trained weights)

```bash
# Terminal 1 — Backend
cd backend
pip install -r requirements.txt
python -m uvicorn src.api.main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` and start scanning!

## Quick Start (If you need to train first)

See [TRAINING_GUIDE.md](./TRAINING_GUIDE.md) for the complete walkthrough.
