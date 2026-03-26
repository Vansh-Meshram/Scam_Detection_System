# Scam Detection Model Upgrade — DeBERTa-v3 + URLNet + Co-Attention

Upgrade the scam detection system from its current partially-upgraded state to the full target architecture with advanced URL analysis, URLNet neural encoder, and cross-modal co-attention fusion.

## Current State Assessment

The codebase (`scam_detection_system/src/`) is **partially upgraded** from a previous attempt:

| Component | Current State | Gap |
|---|---|---|
| `text_encoder.py` | ✅ DeBERTa-v3 with mean pooling | None — already correct |
| `url_preprocessing.py` | 18 **lexical** features only | Missing domain age, SSL, typosquatting |
| `url_encoder.py` | Only `URLTokenizer` (no neural net) | Missing `CharacterCNN`, `WordLevelEncoder`, `URLEncoder` |
| `fusion.py` | Simple gated attention | Needs multi-head cross-attention with residual+LayerNorm |
| `phishing_detector.py` | Inline char/word CNN (simplified) | Needs to use new `URLEncoder`, add `predict()` method |
| `evaluate.py` | Old API (`input_ids`, `url_features`) | Needs new model forward signature |
| `dependencies.py` | Still imports `RobertaTokenizer` + old `MultimodalFusionModel` | Full rewrite for new model |
| `main.py` | Old inference using vectorizer | Full rewrite for new URL pipeline |
| `retrain.py` | Calls `train(epochs=2, adv_train=True)` | `train()` now uses `argparse`, no kwargs |
| `requirements.txt` | Missing advanced URL packages | Add 6 new packages |

## Proposed Changes

### 1. URL Preprocessing

#### [MODIFY] [url_preprocessing.py](file:///c:/Users/meshr/OneDrive/Desktop/FinalYear_project/scam_detection_system/src/data/url_preprocessing.py)

Full rewrite (~280 lines) with 18 advanced features grouped into:
- **Lexical (10)**: url_length, domain_length, num_dots, num_hyphens, num_digits, digit_ratio, has_ip, has_at, url_entropy, is_suspicious_tld
- **Domain Reputation (2)**: domain_age_days, is_new_domain (via python-whois, cached)
- **SSL (2)**: has_https, has_valid_ssl (via pyOpenSSL, 5s timeout)
- **Brand Similarity (2)**: min_brand_distance, is_typosquatting (via python-Levenshtein)
- **Structure (2)**: num_subdomains, brand_in_subdomain

All network lookups are wrapped in try/except with safe defaults.

---

### 2. URLNet Architecture

#### [MODIFY] [url_encoder.py](file:///c:/Users/meshr/OneDrive/Desktop/FinalYear_project/scam_detection_system/src/models/url_encoder.py)

Keep existing `URLTokenizer` class (it works correctly). Add three new `nn.Module` classes:

- **`CharacterCNN`**: Multi-scale convolutions (kernels 3/5/7) → 256-d
- **`WordLevelEncoder`**: Bidirectional LSTM → 256-d
- **`URLEncoder`**: Fuses char-CNN (256-d) + word-LSTM (256-d) + handcrafted features (64-d) → 256-d

---

### 3. Co-Attention Fusion

#### [MODIFY] [fusion.py](file:///c:/Users/meshr/OneDrive/Desktop/FinalYear_project/scam_detection_system/src/models/fusion.py)

Replace simple gated attention with proper co-attention:
- Project text (768-d) and URL (256-d) to common 512-d space
- Multi-head attention (8 heads): text→URL and URL→text
- Residual connections + layer normalization
- Feed-forward network
- Final fusion: concat → 512-d output

---

### 4. Phishing Detector

#### [MODIFY] [phishing_detector.py](file:///c:/Users/meshr/OneDrive/Desktop/FinalYear_project/scam_detection_system/src/models/phishing_detector.py)

- Use new `URLEncoder` instead of inline CNN
- Wire through new `CoAttentionFusion`
- Add `predict(text, url, tokenizer, url_tokenizer, url_featurizer)` method for API use
- Keep adversarial noise injection and epoch-based freezing

---

### 5. Evaluate

#### [MODIFY] [evaluate.py](file:///c:/Users/meshr/OneDrive/Desktop/FinalYear_project/scam_detection_system/src/training/evaluate.py)

Update to use new model forward signature with `text_input_ids`, `text_attention_mask`, `url_char_indices`, `url_word_indices`, `url_features`. Fix typo `precision_recall_f1_score_support` → `precision_recall_fscore_support`.

---

### 6. API Layer

#### [MODIFY] [dependencies.py](file:///c:/Users/meshr/OneDrive/Desktop/FinalYear_project/scam_detection_system/src/api/dependencies.py)

Replace `RobertaTokenizer` + `MultimodalFusionModel` with `DebertaV2Tokenizer` + `AdvancedPhishingDetector`. Load `url_tokenizer` with saved word vocab from checkpoint.

#### [MODIFY] [main.py](file:///c:/Users/meshr/OneDrive/Desktop/FinalYear_project/scam_detection_system/src/api/main.py)

Replace old vectorizer-based URL processing with `preprocess_url_advanced()` pipeline. Update model inference call to new signature. **API endpoints remain identical** (same request/response schemas).

---

### 7. Retrain Compatibility

#### [MODIFY] [retrain.py](file:///c:/Users/meshr/OneDrive/Desktop/FinalYear_project/scam_detection_system/src/self_learning/retrain.py)

Fix `train()` call — it now uses `argparse` and takes no kwargs. Use `subprocess` or `sys.argv` override.

---

### 8. Dependencies

#### [MODIFY] [requirements.txt](file:///c:/Users/meshr/OneDrive/Desktop/FinalYear_project/scam_detection_system/requirements.txt)

Append:
```
tldextract>=3.4.4
python-whois>=0.8.0
dnspython>=2.4.0
pyOpenSSL>=23.2.0
python-Levenshtein>=0.21.1
cachetools>=5.3.1
```

---

## Verification Plan

### Automated Tests

Since there are no existing unit tests in the project, we will create a verification script.

**Step 1**: Install dependencies
```bash
cd scam_detection_system && pip install -r requirements.txt
```

**Step 2**: Test all imports
```bash
cd scam_detection_system && python -c "from src.data.url_preprocessing import EnhancedURLFeaturizer; print('✓ URL preprocessing')"
cd scam_detection_system && python -c "from src.models.url_encoder import URLEncoder, URLTokenizer; print('✓ URL encoder')"
cd scam_detection_system && python -c "from src.models.fusion import CoAttentionFusion; print('✓ Fusion')"
cd scam_detection_system && python -c "from src.models.phishing_detector import AdvancedPhishingDetector; print('✓ Detector')"
```

**Step 3**: Test URL feature extraction
```bash
cd scam_detection_system && python -c "
from src.data.url_preprocessing import EnhancedURLFeaturizer
f = EnhancedURLFeaturizer()
features = f.extract_features('http://paypa1-verify.tk')
print(f'Features: {len(features)} extracted')
arr = f.features_to_array(features)
print(f'Array length: {len(arr)}')
assert len(arr) == 18, f'Expected 18 features, got {len(arr)}'
print('✓ All 18 features extracted')
"
```

**Step 4**: Test model forward pass with dummy data
```bash
cd scam_detection_system && python -c "
import torch
from src.models.phishing_detector import AdvancedPhishingDetector
model = AdvancedPhishingDetector(url_word_vocab_size=1000, num_url_features=18)
text_ids = torch.randint(0, 50000, (2, 128))
text_mask = torch.ones(2, 128, dtype=torch.long)
url_chars = torch.randint(0, 128, (2, 200))
url_words = torch.randint(0, 1000, (2, 20))
url_feats = torch.randn(2, 18)
outputs = model(text_ids, text_mask, url_chars, url_words, url_feats)
print(f'Output keys: {list(outputs.keys())}')
print(f'Logits shape: {outputs[\"logits\"].shape}')
print(f'Prob shape: {outputs[\"binary_prob\"].shape}')
assert outputs['logits'].shape == (2, 1)
print('✓ Forward pass works')
"
```

### Manual Verification

Training requires the dataset and GPU. The user should run:
```bash
cd scam_detection_system && python src/training/train.py --epochs 3 --batch-size 16
```
