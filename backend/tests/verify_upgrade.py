import os
print("=== Test 1: Imports ===")
try:
    from src.data.url_preprocessing import EnhancedURLFeaturizer
    print("✓ URL preprocessing")
    from src.models.url_encoder import URLEncoder, URLTokenizer
    print("✓ URL encoder")
    from src.models.fusion import CoAttentionFusion
    print("✓ Fusion")
    from src.models.phishing_detector import AdvancedPhishingDetector
    print("✓ Detector")
except Exception as e:
    print(f"Import Error: {e}")

print("\n=== Test 2: URL feature extraction ===")
try:
    from src.data.url_preprocessing import EnhancedURLFeaturizer
    f = EnhancedURLFeaturizer()
    features = f.extract_features("http://paypa1-verify.tk")
    print(f"Features: {len(features)} extracted")
    arr = f.features_to_array(features)
    print(f"Array length: {len(arr)}")
    assert len(arr) == 18, f"Expected 18 features, got {len(arr)}"
    print("✓ All 18 features extracted")
except Exception as e:
    print(f"Extraction Error: {e}")

print("\n=== Test 3: Model forward pass ===")
try:
    import torch
    from src.models.phishing_detector import AdvancedPhishingDetector
    model = AdvancedPhishingDetector(url_word_vocab_size=1000, num_url_features=18)
    text_ids = torch.randint(0, 50000, (2, 128))
    text_mask = torch.ones(2, 128, dtype=torch.long)
    url_chars = torch.randint(0, 128, (2, 200))
    url_words = torch.randint(0, 1000, (2, 20))
    url_feats = torch.randn(2, 18)
    outputs = model(text_ids, text_mask, url_chars, url_words, url_feats)
    print(f"Output keys: {list(outputs.keys())}")
    print(f"Logits shape: {outputs['logits'].shape}")
    print(f"Prob shape: {outputs['binary_prob'].shape}")
    assert outputs['logits'].shape == (2, 1)
    print("✓ Forward pass works")
except Exception as e:
    print(f"Model Error: {e}")
