# 🛡️ ScamGuard AI — Multi-Model Adversarially Robust Self-Learning Scam Detection System

> A real-time, multi-modal scam & phishing detection engine powered by **DistilBERT** (text analysis) and **URLBERT** (URL analysis) transformer models, served via a Flask API and presented through a cyberpunk-themed Next.js dashboard.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🧠 **Dual Transformer Architecture** | DistilBERT for text/SMS/email analysis + URLBERT for URL phishing detection |
| ⚡ **Real-Time Inference** | Flask REST API processes inputs and returns risk scores in milliseconds |
| 🔄 **Self-Learning Feedback Loop** | Users can flag false positives/negatives; feedback is stored and used for periodic retraining |
| 🛡️ **Adversarial Robustness** | Leet-speak normalization (`p@yp4l` → `paypal`), typosquatting detection via Levenshtein distance |
| 🌐 **Multi-Modal Input** | Accepts emails, SMS messages, and URLs — auto-detects input type |
| 📊 **Analytics Dashboard** | Visual risk breakdowns, scan history, and model confidence metrics |
| 🎨 **Cyberpunk UI** | Neon-themed dark interface with glassmorphism, micro-animations, and Framer Motion transitions |

---

## 🏗️ Architecture

```
┌─────────────────────────────┐      HTTP (POST /predict)      ┌──────────────────────────────┐
│        FRONTEND             │ ──────────────────────────────► │          BACKEND             │
│   Next.js 16 + React 19    │                                 │        Flask + PyTorch       │
│   TailwindCSS 4             │ ◄────────────────────────────── │                              │
│   Framer Motion             │      JSON { risk_score,        │  DistilBERT (Text Model)     │
│   Recharts                  │              is_scam,           │  URLBERT (URL Model)         │
│   Zustand (State)           │              explanation }      │  Leet-Speak Normalizer       │
│   Port: 3001                │                                 │  Domain Whitelisting         │
└─────────────────────────────┘                                 │  Port: 5000                  │
                                                                └──────────────────────────────┘
```

---

## 📁 Project Structure

```
scam_detection_system/
├── backend/
│   ├── app.py                    # Flask server — model loading, API endpoints, inference logic
│   ├── requirements.txt          # Python dependencies
│   ├── models/
│   │   ├── textmodel/            # Fine-tuned DistilBERT weights (config.json, model.safetensors)
│   │   └── urlbert_official/     # Fine-tuned URLBERT weights (config.json, model.safetensors)
│   ├── src/
│   │   ├── api/                  # FastAPI alternative endpoints & dependencies
│   │   ├── training/             # Training scripts (train.py, evaluate.py)
│   │   ├── models/               # Model architecture definitions
│   │   ├── data/                 # Data loading & preprocessing
│   │   └── self_learning/        # Feedback-based retraining pipeline
│   ├── data/                     # Training datasets (CSV)
│   ├── saved_models/             # Checkpoint storage
│   ├── feedback.db               # SQLite database for user feedback
│   └── weights.json              # Model weight configuration
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx              # Landing page — hero, stats, protocol sequence
│   │   ├── analyze/page.tsx      # Neural Threat Scanner — main scan interface
│   │   ├── analytics/            # Analytics dashboard
│   │   ├── history/              # Scan history viewer
│   │   ├── layout.tsx            # Root layout with cyberpunk theme
│   │   ├── globals.css           # Global styles, neon effects, animations
│   │   └── providers.tsx         # React context providers
│   ├── components/
│   │   ├── analysis/             # RiskGauge, DetectionInsights, ModelBreakdown
│   │   ├── feedback/             # FeedbackPanel for self-learning
│   │   ├── layout/               # Header, Sidebar, Footer
│   │   └── common/               # Shared UI components (Button, etc.)
│   ├── lib/                      # API config, Zustand store, utilities
│   ├── types/                    # TypeScript type definitions
│   └── package.json
│
├── START_GUIDE.md                # Quick-start instructions
├── TRAINING_GUIDE.md             # Model training documentation
├── BACKEND_CONNECTION_GUIDE.md   # Frontend ↔ Backend connectivity guide
└── README.md                     # ← You are here
```

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.9+** with `pip`
- **Node.js 18+** with `npm`
- **CUDA** (optional — GPU acceleration for inference)

### 1. Clone the Repository

```bash
git clone https://github.com/Vansh-Meshram/Scam_Detection_system.git
cd Scam_Detection_system
```

### 2. Set Up the Backend

```bash
cd backend

# Create and activate a virtual environment (recommended)
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS / Linux

# Install Python dependencies
pip install -r requirements.txt
pip install flask flask-cors
```

> **Note:** Model weight files (`model.safetensors`, `config.json`, `tokenizer.json`, etc.) must be placed inside `backend/models/textmodel/` and `backend/models/urlbert_official/`. These are not included in the repository due to size constraints.

### 3. Set Up the Frontend

```bash
cd frontend

# Install Node.js dependencies
npm install
```

### 4. Configure Environment

Create a `.env.local` file in the `frontend/` directory:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:5000
```

---

## ▶️ Running the Application

You need **two terminal windows** — one for the backend, one for the frontend.

### Terminal 1 — Start the Backend

```bash
cd backend
python app.py
```

You should see:

```
--- 🛰️ Scam Detection System Booting ---
✅ All AI Engines Online!
🚀 Backend is live at http://127.0.0.1:5000
```

### Terminal 2 — Start the Frontend

```bash
cd frontend
npm run dev
```

You should see:

```
▲ Next.js 16.x
- Local: http://localhost:3001
```

Open **http://localhost:3001** in your browser.

---

## 🔬 How It Works

### Detection Pipeline

```
User Input (Email / SMS / URL)
        │
        ▼
  ┌─────────────────┐
  │  Input Classifier │ ──── Auto-detects: URL vs Text payload
  └────────┬──────────┘
           │
     ┌─────┴─────┐
     ▼           ▼
┌─────────┐  ┌──────────┐
│DistilBERT│  │  URLBERT  │
│(Text)    │  │  (URL)    │
└────┬─────┘  └────┬─────┘
     │              │
     ▼              ▼
  text_risk      url_risk
     │              │
     └──────┬───────┘
            ▼
   risk_score = max(text_risk, url_risk)
            │
            ▼
   is_scam = risk_score > 0.65
```

### Adversarial Defense Layers

1. **Leet-Speak Normalization** — Converts obfuscated characters (`p@yp4l` → `paypal`, `g00gle` → `google`)
2. **Domain Whitelisting** — Known-safe domains (google.com, amazon.in, etc.) receive minimal risk scores
3. **OTP / Verification Heuristic** — Standard authentication messages (OTPs, security codes) are exempted from false positives
4. **Fallback Simulation** — Frontend includes an intelligent local inference engine for offline operation

---

## 🧪 API Reference

### `POST /predict`

Analyze text and/or URL for phishing indicators.

**Request:**

```json
{
  "text": "Your PayPal account has been suspended. Click here to verify.",
  "url": "http://paypa1-secure-login.xyz/verify"
}
```

**Response:**

```json
{
  "risk_score": 0.94,
  "is_scam": true,
  "explanation": "🚨 Suspicious neural patterns detected. High-risk URL detected. Text semantics match scam payloads."
}
```

### `GET /health`

Health check endpoint.

**Response:**

```json
{
  "status": "ok",
  "device": "cpu"
}
```

---

## 🏋️ Training

To train the DistilBERT model from scratch with adversarial training:

```bash
cd backend
python -m src.training.train
```

Add `--no-adv` to disable adversarial training for quicker iterations.

Refer to [TRAINING_GUIDE.md](TRAINING_GUIDE.md) for detailed instructions including Google Colab setup.

---

## 🔄 Self-Learning

User feedback is stored in `backend/feedback.db`. To retrain the model with collected feedback:

```bash
cd backend
python -m src.self_learning.retrain
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Text Model** | DistilBERT (HuggingFace Transformers) |
| **URL Model** | URLBERT (fine-tuned BERT for URL classification) |
| **Backend Framework** | Flask + Flask-CORS |
| **ML Runtime** | PyTorch |
| **Frontend Framework** | Next.js 16 + React 19 |
| **Styling** | TailwindCSS 4 |
| **Animations** | Framer Motion |
| **Charts** | Recharts |
| **State Management** | Zustand |
| **Typography** | Orbitron, Rajdhani (Google Fonts) |

---

## 📄 Additional Documentation

- [START_GUIDE.md](START_GUIDE.md) — Quick-start instructions
- [TRAINING_GUIDE.md](TRAINING_GUIDE.md) — Complete model training walkthrough
- [BACKEND_CONNECTION_GUIDE.md](BACKEND_CONNECTION_GUIDE.md) — Troubleshooting frontend ↔ backend connectivity

---

## 👥 Authors

**Vansh Meshram** — Final Year Project

---

## 📜 License

This project is developed as part of an academic final-year project.
