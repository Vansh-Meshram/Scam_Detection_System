# 🧠 Google Colab Training Guide — DistilBERT Scam Detection Model

Train the **DistilBERT + URLNet Co-Attention** phishing detection model on Google Colab with GPU acceleration.

---

## Prerequisites

- Google account with Google Drive
- Dataset CSV file with columns: `text`, `url`, `label` (0=safe, 1=scam)
- Recommended: Colab Pro for faster GPU access

---

## Step 1: Setup Runtime

1. Open [Google Colab](https://colab.research.google.com)
2. Go to **Runtime → Change runtime type → GPU (T4)**

---

## Step 2: Mount Google Drive

```python
from google.colab import drive
drive.mount('/content/drive')
```

---

## Step 3: Upload Project Files

Upload your entire `backend/` folder to Google Drive, then:

```python
import os
os.chdir('/content/drive/MyDrive/scam_detection_system/backend')
!ls src/models/  # verify files exist
```

---

## Step 4: Install Dependencies

```python
!pip install torch transformers scikit-learn pandas tldextract python-Levenshtein cachetools
```

---

## Step 5: Prepare Dataset

Upload your dataset CSV to `backend/data/combined_dataset.csv`. Expected format:

| text | url | label |
|------|-----|-------|
| "Verify your account now!" | "http://paypa1-verify.tk" | 1 |
| "Your order has shipped" | "https://amazon.com/orders" | 0 |

```python
import pandas as pd
df = pd.read_csv('data/combined_dataset.csv')
print(f"Dataset: {len(df)} samples")
print(f"Label distribution:\n{df['label'].value_counts()}")
```

---

## Step 6: Train the Model

```python
!python src/training/train.py \
    --data-path data/combined_dataset.csv \
    --epochs 10 \
    --batch-size 16 \
    --lr 2e-5 \
    --freeze-epochs 2 \
    --adversarial \
    --patience 3 \
    --save-dir models/
```

**What happens during training:**
- **Epochs 1-2**: DistilBERT is frozen; only URLNet, Fusion, and Classifier train
- **Epoch 3+**: DistilBERT unfreezes at 10% LR for fine-tuning
- **Early stopping**: Stops if validation loss doesn't improve for 3 epochs
- **Best model** is saved automatically to `models/phishing_detector.pt`

---

## Step 7: Evaluate Results

```python
!python tests/test_upgrade.py
```

Expected output: all 6 tests pass (URL features, URLEncoder, Fusion, Full model, Adversarial, Preprocessing).

---

## Step 8: Download Trained Model

```python
from google.colab import files
files.download('models/phishing_detector.pt')
files.download('models/url_vocab.json')
```

Place both files in your local `backend/models/` directory.

---

## Step 9: Verify Locally

```bash
cd backend
python -m uvicorn src.api.main:app --reload
# API should start on http://localhost:8000
```

Test with:
```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"text": "", "url": "http://paypa1-verify.tk"}'
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| CUDA out of memory | Reduce `--batch-size` to 8 |
| Import errors | Ensure `backend/` is the CWD and run `pip install` again |
| Low accuracy | Increase `--epochs` to 15, ensure balanced dataset |
| Model won't load | Verify `phishing_detector.pt` was saved to `models/` |

---

## Training Tips

1. **More data = better**: Aim for 10K+ samples with balanced labels
2. **Data augmentation**: Duplicate scam samples with paraphrasing for balance
3. **Learning rate**: Start with `2e-5`, try `1e-5` for fine-tuning
4. **Freeze epochs**: Use 2-3 freeze epochs to stabilize URLNet first
