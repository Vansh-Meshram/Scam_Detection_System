# 🧠 Google Colab Training Guide — DistilBERT + URLNet Scam Detection

Train the full **DistilBERT + URLNet Co-Attention** phishing detection model on Google Colab with free GPU acceleration, then connect it to your FastAPI backend.

---

## 📋 Table of Contents

1. [Architecture Overview](#-architecture-overview)
2. [Prerequisites](#-prerequisites)
3. [Step 1 — Colab Setup](#step-1--colab-setup)
4. [Step 2 — Upload Project to Google Drive](#step-2--upload-project-to-google-drive)
5. [Step 3 — Install Dependencies](#step-3--install-dependencies)
6. [Step 4 — Prepare Dataset](#step-4--prepare-dataset)
7. [Step 5 — Train the Model](#step-5--train-the-model)
8. [Step 6 — Evaluate](#step-6--evaluate)
9. [Step 7 — Download Trained Weights](#step-7--download-trained-weights)
10. [Step 8 — Connect to Backend](#step-8--connect-to-backend)
11. [Troubleshooting](#-troubleshooting)
12. [Training Tips](#-training-tips)

---

## 🏗️ Architecture Overview

Our model is a **dual-encoder Co-Attention** network:

```
Text (email/SMS)  ──→  DistilBERT  (768-d)  ─┐
                                               ├─→  Co-Attention Fusion (512-d)  ─→  Classifier  ─→  Scam/Safe
URL               ──→  URLNet      (256-d)  ─┘
                        ├── CharacterCNN (3/5/7 kernels)
                        ├── BiLSTM word encoder
                        └── 18 handcrafted features
```

**Training happens in a single script (`train.py`) that trains BOTH models simultaneously.**

| Component        | What it does                                         | Output Dim |
|------------------|------------------------------------------------------|------------|
| DistilBERT       | Encodes email/SMS text into semantic embeddings      | 768        |
| URLNet CharCNN   | Detects character-level URL patterns (e.g. `paypa1`) | 256        |
| URLNet BiLSTM    | Encodes URL word tokens                              | 256        |
| Handcrafted      | 18 features: entropy, TLD, SSL, typosquatting, etc.  | 18 → 64    |
| Co-Attention     | Cross-attention between text and URL representations | 512        |
| Classifier       | MLP head with temperature scaling                    | 1 (logit)  |

---

## ✅ Prerequisites

- ✅ A Google account with Google Drive
- ✅ Your `backend/` folder with all the source code
- ✅ Dataset CSV file (`combined_dataset.csv`) with columns: `text`, `url`, `label`
- ⭐ Recommended: Google Colab Pro for guaranteed T4 GPU access

---

## Step 1 — Colab Setup

1. Go to [Google Colab](https://colab.research.google.com)
2. Create a **New Notebook**
3. Go to **Runtime → Change runtime type → GPU (T4)**
4. Verify GPU is available:

```python
# Cell 1: Verify GPU
import torch
print(f"CUDA available: {torch.cuda.is_available()}")
print(f"GPU: {torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'NONE'}")
```

Expected output: `CUDA available: True` and `GPU: Tesla T4`

---

## Step 2 — Upload Project to Google Drive

### Option A: Upload via Google Drive Web UI
1. Go to [drive.google.com](https://drive.google.com)
2. Create folder: `My Drive/scam_detection_system/`
3. Upload your entire `backend/` folder into it
4. Make sure `backend/data/combined_dataset.csv` is uploaded too (~213 MB)

### Option B: Upload via Colab (slower but easier)
```python
# Cell 2: Mount Google Drive
from google.colab import drive
drive.mount('/content/drive')
```

Then mount and navigate:

```python
# Cell 3: Navigate to project
import os

PROJECT_DIR = '/content/drive/MyDrive/scam_detection_system/backend'
os.chdir(PROJECT_DIR)

# Verify the structure
print("📁 Project files:")
!ls -la
print("\n📁 Source models:")
!ls -la src/models/
print("\n📁 Data:")
!ls -lh data/
```

You should see:
```
src/models/phishing_detector.py
src/models/url_encoder.py
src/models/text_encoder.py
src/models/fusion.py
src/data/url_preprocessing.py
data/combined_dataset.csv
```

---

## Step 3 — Install Dependencies

```python
# Cell 4: Install all dependencies
!pip install -q torch transformers scikit-learn pandas numpy \
    tldextract python-Levenshtein cachetools \
    python-whois dnspython pyOpenSSL
```

> **Note:** We don't need `fastapi`, `uvicorn`, or `spacy` for training — only for running the API server locally.

---

## Step 4 — Prepare Dataset

Your CSV should have exactly these columns:

| text | url | label |
|------|-----|-------|
| "Verify your account immediately!" | "http://paypa1-verify.tk" | 1 |
| "Your Amazon order has shipped" | "https://amazon.com/orders/123" | 0 |
| "Click here to claim free gift" | "http://fr33-g1fts.xyz/claim" | 1 |
| "" | "https://google.com" | 0 |

- `label`: **1 = scam/phishing**, **0 = safe/legitimate**
- `text` can be empty (URL-only detection)
- `url` can be empty (text-only detection)
- Both **can** be present (best accuracy — uses full Co-Attention)

```python
# Cell 5: Inspect dataset
import pandas as pd

df = pd.read_csv('data/combined_dataset.csv')
print(f"📊 Total samples: {len(df):,}")
print(f"\n📊 Label distribution:")
print(df['label'].value_counts())
print(f"\n📊 Sample rows:")
df.sample(5)
```

**Ideal**: 10K+ samples with roughly balanced labels (40-60% split is fine).

---

## Step 5 — Train the Model

This is the main training cell. It trains **both DistilBERT and URLNet simultaneously**.

```python
# Cell 6: Train the full model
!python -m src.training.train \
    --data-path data/combined_dataset.csv \
    --epochs 10 \
    --batch-size 16 \
    --lr 2e-5 \
    --freeze-epochs 2 \
    --adversarial \
    --patience 3 \
    --save-dir models/
```

### What happens during training:

| Phase | Epochs | What's happening |
|-------|--------|------------------|
| **🔒 Freeze Phase** | 1–2 | DistilBERT is **frozen**. Only URLNet (CharCNN + BiLSTM), Co-Attention fusion, and the classifier train from scratch. This prevents the randomly-initialized URL layers from corrupting DistilBERT's pre-trained knowledge. |
| **🔓 Fine-tune Phase** | 3–10 | DistilBERT **unfreezes** at 10% of the learning rate. Both models fine-tune end-to-end together. The lower LR prevents catastrophic forgetting of DistilBERT's language understanding. |
| **🛑 Early Stopping** | Any | If validation loss doesn't improve for 3 consecutive epochs (`--patience 3`), training stops automatically to prevent overfitting. |
| **⚔️ Adversarial Training** | All | Gaussian noise is injected into feature vectors during training (70% clean / 30% adversarial loss) to improve robustness against evasion attacks. |

### Expected output:
```
Device: cuda
Loading dataset...
Total samples: 523,456
URL word vocab size: 24,831
URL vocab saved → models/url_vocab.json
Text encoder frozen for first 2 epochs
Total params: 67,438,593 | Trainable: 1,572,865

Epoch 1/10 | Train Loss: 0.4521 | Train Acc: 0.7834 | Val Loss: 0.3201 | Val Acc: 0.8567
  ✓ Best model saved → models/phishing_detector.pt
Epoch 2/10 | Train Loss: 0.2987 | Train Acc: 0.8723 | Val Loss: 0.2456 | Val Acc: 0.9012
  ✓ Best model saved → models/phishing_detector.pt
  ↳ Text encoder unfrozen. Trainable: 67,438,593
Epoch 3/10 | Train Loss: 0.1823 | Train Acc: 0.9345 | Val Loss: 0.1567 | Val Acc: 0.9478
  ✓ Best model saved → models/phishing_detector.pt
...
Training complete!
```

### ⚡ If you run out of GPU memory:
```python
# Use smaller batch size:
!python -m src.training.train \
    --data-path data/combined_dataset.csv \
    --epochs 10 \
    --batch-size 8 \
    --lr 2e-5 \
    --freeze-epochs 2 \
    --adversarial \
    --patience 3 \
    --save-dir models/
```

---

## Step 6 — Evaluate

```python
# Cell 7: Quick evaluation
import torch
from transformers import AutoTokenizer
from src.models.phishing_detector import AdvancedPhishingDetector
from src.models.url_encoder import URLTokenizer
from src.data.url_preprocessing import EnhancedURLFeaturizer
import json

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

# Load the trained model
checkpoint = torch.load('models/phishing_detector.pt', map_location=device)
model = AdvancedPhishingDetector(
    url_word_vocab_size=checkpoint.get('url_word_vocab_size', 10000),
    num_url_features=checkpoint.get('num_url_features', 18),
)
model.load_state_dict(checkpoint['model_state_dict'])
model.to(device)
model.eval()

# Load tokenizers
tokenizer = AutoTokenizer.from_pretrained('distilbert-base-uncased')
url_tokenizer = URLTokenizer(max_url_length=200, max_words=20)
with open('models/url_vocab.json', 'r') as f:
    url_tokenizer.word_to_idx = json.load(f)
url_featurizer = EnhancedURLFeaturizer(skip_network=True)

print(f"✅ Model loaded successfully!")
print(f"   Epoch: {checkpoint.get('epoch', '?')}")
print(f"   Val Loss: {checkpoint.get('val_loss', '?'):.4f}")
print(f"   Val Acc: {checkpoint.get('val_acc', '?'):.4f}")

# Test predictions
test_cases = [
    ("Verify your PayPal account immediately!", "http://paypa1-verify.tk/login"),
    ("Your Amazon order has shipped", "https://amazon.com/orders/123-456"),
    ("", "http://g00gle-security.xyz/verify"),
    ("Congratulations! You won a free iPhone!", ""),
    ("Meeting tomorrow at 3pm, see you there", ""),
]

print("\n" + "="*70)
print("TEST PREDICTIONS")
print("="*70)

for text, url in test_cases:
    result = model.predict(
        text=text, url=url,
        tokenizer=tokenizer,
        url_tokenizer=url_tokenizer,
        url_featurizer=url_featurizer,
        device=device,
    )
    status = "🚨 SCAM" if result['is_scam'] else "✅ SAFE"
    print(f"\n{status} | Risk: {result['risk_score']:.2%}")
    print(f"  Text: {text or '(none)'}")
    print(f"  URL:  {url or '(none)'}")
    print(f"  → {result['explanation']}")
```

---

## Step 7 — Download Trained Weights

You need **exactly 2 files** from Colab:

```python
# Cell 8: Download model files
from google.colab import files

# These are the two critical files:
files.download('models/phishing_detector.pt')   # ~250 MB (the trained neural network)
files.download('models/url_vocab.json')          # ~900 KB (URL word vocabulary)

print("✅ Download complete! Place both files in your local backend/models/ folder.")
```

### After downloading, your local file structure must be:
```
backend/
├── models/
│   ├── phishing_detector.pt    ← TRAINED MODEL WEIGHTS (from Colab)
│   └── url_vocab.json          ← URL VOCABULARY (from Colab)
├── src/
│   ├── api/
│   │   ├── main.py
│   │   └── dependencies.py
│   ├── models/
│   │   ├── phishing_detector.py
│   │   ├── url_encoder.py
│   │   ├── text_encoder.py
│   │   └── fusion.py
│   └── data/
│       └── url_preprocessing.py
└── requirements.txt
```

---

## Step 8 — Connect to Backend

### 8.1 Install backend dependencies locally

```bash
cd backend
pip install -r requirements.txt
```

### 8.2 Start the FastAPI server

```bash
cd backend
python -m uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000
```

You should see:
```
INFO:     Device: cpu
INFO:     URL vocab loaded (24831 words)
INFO:     Model loaded from models/phishing_detector.pt    ← THIS IS CRITICAL
INFO:     Uvicorn running on http://0.0.0.0:8000
```

> ⚠️ **If you see** `"Using untrained model for demonstration"` **instead, that means `phishing_detector.pt` is missing from `models/`!**

### 8.3 Test the API directly

```bash
# Test with a scam URL:
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"text": "", "url": "http://paypa1-verify.tk/login"}'

# Test with legitimate URL:
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"text": "", "url": "https://google.com"}'

# Test with scam text:
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"text": "URGENT: Your account has been compromised. Click link to verify.", "url": ""}'

# Health check:
curl http://localhost:8000/health
```

### 8.4 Start the Next.js frontend

In a **separate terminal**:
```bash
cd frontend
npm run dev
```

The frontend connects to `http://localhost:8000` by default (configured in `frontend/lib/config.ts`).

### 8.5 Verify full stack

1. Open `http://localhost:3000` in your browser
2. Click **"INITIATE SCAN"**
3. Paste a suspicious URL like `http://paypa1-verify.tk`
4. Click **"Initiate Scan"**
5. ✅ You should get a real neural network prediction (NOT the demo simulation)

### How to tell if you're getting REAL predictions vs DEMO:
- **REAL**: Risk scores are precise like `87.34%`, explanation mentions specific features
- **DEMO**: Risk scores are always ~85-97% for scams, ~5-15% for safe, uses keyword matching

Check your **browser Developer Console** (F12 → Console tab):
- ✅ No errors = backend is connected
- ❌ `"Backend unreachable"` = backend isn't running or CORS blocked

---

## 🛠️ Troubleshooting

| Problem | Solution |
|---------|----------|
| `CUDA out of memory` | Reduce `--batch-size` to `8` or `4` |
| `ModuleNotFoundError` | Make sure you're in the `backend/` directory: `os.chdir('/content/drive/MyDrive/scam_detection_system/backend')` |
| Training loss doesn't decrease | Check label balance. Increase `--freeze-epochs` to 3. |
| Frontend says "Backend unreachable" | Start FastAPI: `python -m uvicorn src.api.main:app --reload --port 8000` |
| Backend says "Using untrained model" | `phishing_detector.pt` is missing from `backend/models/`. Download it from Colab. |
| CORS errors in browser | Already handled in `main.py`. Make sure frontend is on `localhost:3000`. |
| Download fails from Colab | Use `from google.colab import files; files.download(...)` or copy from Google Drive manually. |
| Low accuracy (< 80%) | Need more/better data. Ensure dataset has 10K+ samples with balanced labels. |

---

## 💡 Training Tips

1. **More data = better**: Aim for **10K+ samples** with roughly balanced labels
2. **Data augmentation**: Duplicate scam samples with slight paraphrasing to balance the dataset
3. **Freeze epochs**: Use `2–3` freeze epochs. More = stronger URLNet, fewer = more emphasis on text
4. **Learning rate**: Start at `2e-5`. If unstable, try `1e-5`
5. **Batch size**: 16 is ideal for T4. Use 8 if you get OOM errors
6. **Monitor validation**: If val loss increases while train loss decreases → overfitting → reduce epochs
7. **Re-training**: If you add new data, you can fine-tune from the existing checkpoint instead of training from scratch

---

## 📁 Files Generated After Training

| File | Size | Description |
|------|------|-------------|
| `models/phishing_detector.pt` | ~250 MB | Full model checkpoint (weights + optimizer + metadata) |
| `models/url_vocab.json` | ~900 KB | URL word vocabulary (built from your dataset URLs) |

**Both files are required** for the backend to work correctly.
