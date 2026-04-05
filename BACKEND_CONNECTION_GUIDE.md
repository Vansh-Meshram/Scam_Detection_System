# 🔌 Backend Connection Guide — How the Pieces Fit Together

This guide explains how the DistilBERT + URLNet model connects to the FastAPI backend and the Next.js frontend.

---

## 📋 Table of Contents

1. [System Architecture](#-system-architecture)
2. [The Problem — Why Demo Mode Activates](#-the-problem--why-demo-mode-activates)
3. [The Fix — Step by Step](#-the-fix--step-by-step)
4. [How the Backend Loads the Model](#-how-the-backend-loads-the-model)
5. [How the Frontend Connects](#-how-the-frontend-connects)
6. [Running the Full Stack](#-running-the-full-stack)
7. [Verifying Real AI vs Demo Mode](#-verifying-real-ai-vs-demo-mode)
8. [CORS Configuration](#-cors-configuration)

---

## 🏗️ System Architecture

```
┌────────────────────────────────┐
│     Next.js Frontend           │
│     http://localhost:3000      │
│                                │
│  User types URL/text → Click   │
│  "Initiate Scan" → POST to    │──────────────────────┐
│  /predict endpoint             │                      │
│                                │                      │
│  If backend unreachable:       │                      ▼
│   → Falls back to Demo Mode   │        ┌──────────────────────────┐
│   → Uses runSimulation()      │        │   FastAPI Backend        │
│   → Keywords only, NO AI!     │        │   http://localhost:8000  │
└────────────────────────────────┘        │                          │
                                          │   POST /predict          │
                                          │   ├─ DistilBERT encodes  │
                                          │   │  text → 768-d        │
                                          │   ├─ URLNet encodes      │
                                          │   │  URL  → 256-d        │
                                          │   ├─ Co-Attention fuses  │
                                          │   │  both → 512-d        │
                                          │   ├─ Classifier → score  │
                                          │   └─ Returns JSON        │
                                          │      {risk_score, is_scam,│
                                          │       explanation}       │
                                          │                          │
                                          │   Loads from:            │
                                          │   models/phishing_detector.pt │
                                          │   models/url_vocab.json  │
                                          └──────────────────────────┘
```

---

## 🔴 The Problem — Why Demo Mode Activates

Your frontend has this logic in `app/analyze/page.tsx` (line ~140):

```javascript
const response = await safeFetch(`${config.apiUrl}/predict`, { ... });

if (response && response.ok) {
    finalData = await response.json();    // ← REAL API RESULT
} else {
    finalData = runSimulation(input);     // ← FAKE KEYWORD SIMULATOR
}
```

**Demo Mode activates when ANY of these are true:**

| Reason | What Happens |
|--------|-------------|
| ❌ Backend not running | `fetch()` throws network error → `safeFetch` returns `null` → runs simulation |
| ❌ `phishing_detector.pt` missing | Backend starts but crashes on `/predict` → returns 500 error → runs simulation |
| ❌ CORS blocked | Browser blocks the request → `fetch()` fails → runs simulation |
| ❌ Wrong port | Frontend calls `localhost:8000` but backend is on different port |

**The simulation (`runSimulation()`) is NOT your real AI.** It's just a keyword-matching script that looks for words like "verify", "login", ".tk" etc. It completely bypasses DistilBERT and URLNet.

---

## ✅ The Fix — Step by Step

### Checklist:

```
[ ] 1. Train model on Colab (see TRAINING_GUIDE.md)
[ ] 2. Download phishing_detector.pt and url_vocab.json
[ ] 3. Place both in backend/models/
[ ] 4. Install backend dependencies: pip install -r requirements.txt
[ ] 5. Start backend:  python -m uvicorn src.api.main:app --reload --port 8000
[ ] 6. Verify backend: curl http://localhost:8000/health → {"status": "ok"}
[ ] 7. Start frontend: cd frontend && npm run dev
[ ] 8. Open http://localhost:3000/analyze and scan a URL
```

---

## 🧠 How the Backend Loads the Model

On startup, `src/api/dependencies.py` runs `load_model_artifacts()`:

```python
# 1. Picks compute device (GPU if available, else CPU)
_device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# 2. Loads DistilBERT tokenizer (downloads from HuggingFace ~250MB first time)
_tokenizer = AutoTokenizer.from_pretrained("distilbert-base-uncased")

# 3. Loads URL vocabulary from models/url_vocab.json
_url_tokenizer = URLTokenizer(max_url_length=200, max_words=20)
with open("models/url_vocab.json", "r") as f:
    _url_tokenizer.word_to_idx = json.load(f)

# 4. Creates URL feature extractor (18 features)
_url_featurizer = EnhancedURLFeaturizer()

# 5. CRITICAL: Loads trained model weights from models/phishing_detector.pt
checkpoint = torch.load("models/phishing_detector.pt", map_location=_device)
_model = AdvancedPhishingDetector(
    url_word_vocab_size=checkpoint.get("url_word_vocab_size", 10000),
    num_url_features=checkpoint.get("num_url_features", 18),
)
_model.load_state_dict(checkpoint["model_state_dict"])
```

**If `phishing_detector.pt` is missing**, it falls back to an untrained model:
```python
else:
    logger.warning("Model checkpoint not found. Using untrained model for demonstration.")
    _model = AdvancedPhishingDetector(...)
    # ← This model has RANDOM WEIGHTS. Its predictions are meaningless.
```

### Required files in `backend/models/`:

| File | Source | Purpose |
|------|--------|---------|
| `phishing_detector.pt` | Trained on Colab | Neural network weights (~250 MB) |
| `url_vocab.json` | Generated during training | URL word vocabulary mapping |

---

## 🌐 How the Frontend Connects

### Configuration (`frontend/lib/config.ts`)
```typescript
export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  // ...
};
```

### API Client (`frontend/lib/api.ts`)
```typescript
export const api = {
  async predict(data: PredictRequest): Promise<PredictResponse> {
    return fetchAPI<PredictResponse>('/predict', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
```

### Analyze Page (`frontend/app/analyze/page.tsx`)
The analyze page sends:
```json
// If input looks like a URL:
{ "url": "http://paypa1-verify.tk", "text": "" }

// If input looks like text:
{ "url": "", "text": "Verify your account immediately!" }
```

---

## 🚀 Running the Full Stack

### Terminal 1 — Backend
```bash
cd scam_detection_system/backend
pip install -r requirements.txt
python -m uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000
```

Watch for these log messages:
```
✅ GOOD:  "Model loaded from models/phishing_detector.pt"
❌ BAD:   "Model checkpoint not found. Using untrained model"
```

### Terminal 2 — Frontend
```bash
cd scam_detection_system/frontend
npm install
npm run dev
```

### Browser
Open `http://localhost:3000/analyze`

---

## 🔍 Verifying Real AI vs Demo Mode

### Open Browser DevTools (F12 → Console)

**✅ Real AI connected:**
- No red errors in Console
- Network tab shows `POST /predict` → Status `200`
- Risk scores are precise (e.g. `73.45%`, `12.89%`)
- Explanation mentions specific features: "Possible typosquatting detected", "No valid SSL certificate"

**❌ Demo Mode active:**
- Console shows: `[Neural Link] Backend unreachable. Activating local inference fallback.`
- Risk scores are always in obvious ranges (~85-97% for scams, ~5-15% for safe)
- Same URLs always get similar scores
- Only detects obvious keywords like "verify", "login", ".tk"

### Quick test from command line:
```bash
# This should return a real prediction:
curl -s -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"text": "", "url": "http://paypa1-verify.tk"}' | python -m json.tool
```

Expected real response:
```json
{
    "risk_score": 0.8734,
    "is_scam": true,
    "explanation": "Risk score: 87.34%. Possible typosquatting detected. No valid SSL certificate."
}
```

---

## 🔒 CORS Configuration

Already configured in `backend/src/api/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",      # Next.js dev server
        "http://127.0.0.1:3000",      # Alternative localhost
        "http://nextjs:3000",         # Docker networking
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

If your frontend runs on a different port, add it to the `allow_origins` list.

---

## 📊 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Returns `{"status": "ok"}` if server is running |
| `/predict` | POST | Takes `{"text": "...", "url": "..."}`, returns risk assessment |
| `/feedback` | POST | Submit correction: `{"text": "...", "url": "...", "predicted_score": 0.85, "user_label": 0}` |

### `/predict` Request/Response:

**Request:**
```json
{
    "text": "Verify your PayPal account!",
    "url": "http://paypa1-verify.tk/login"
}
```

**Response:**
```json
{
    "risk_score": 0.9234,
    "is_scam": true,
    "explanation": "Risk score: 92.34%. Possible typosquatting detected. No valid SSL certificate. Recently registered domain."
}
```

---

## 🔄 Summary Flow

```
1. User opens http://localhost:3000/analyze
2. Types: "http://paypa1-verify.tk"
3. Clicks "Initiate Scan"
4. Frontend sends POST to http://localhost:8000/predict
5. Backend receives request
6. DistilBERT tokenizes text → 768-d embedding
7. URLNet processes URL:
   - CharCNN extracts character patterns → 256-d
   - BiLSTM encodes word tokens → 256-d
   - 18 handcrafted features extracted → 64-d
   - All three fused → 256-d URL embedding
8. Co-Attention cross-attention between text (768-d) and URL (256-d) → 512-d
9. Classifier MLP: 512 → 256 → 128 → 64 → 1 logit
10. Temperature-scaled sigmoid → calibrated probability
11. Heuristic signals (typosquatting, SSL, TLD) add/subtract from score
12. Final risk_score returned as JSON
13. Frontend renders the cyberpunk verdict UI
```
