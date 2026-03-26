"""Quick verification script for the upgraded model."""
import sys

def test_url_features():
    print("=== Test 1: URL Feature Extraction ===")
    from src.data.url_preprocessing import EnhancedURLFeaturizer
    f = EnhancedURLFeaturizer()
    features = f.extract_features("http://paypa1-verify.tk")
    arr = f.features_to_array(features)
    names = f.get_feature_names()
    print(f"  Feature count: {len(arr)}")
    print(f"  Feature names count: {len(names)}")
    print(f"  is_typosquatting: {features['is_typosquatting']}")
    print(f"  is_suspicious_tld: {features['is_suspicious_tld']}")
    print(f"  url_entropy: {features['url_entropy']:.3f}")
    assert len(arr) == 18, f"Expected 18 features, got {len(arr)}"
    assert len(names) == 18, f"Expected 18 names, got {len(names)}"
    print("  PASS\n")

def test_url_encoder():
    print("=== Test 2: URLEncoder Forward ===")
    import torch
    from src.models.url_encoder import URLEncoder, URLTokenizer
    enc = URLEncoder(url_word_vocab_size=1000, num_url_features=18)
    chars = torch.randint(0, 128, (2, 200))
    words = torch.randint(0, 1000, (2, 20))
    feats = torch.randn(2, 18)
    out = enc(chars, words, feats)
    print(f"  Output shape: {out.shape}")
    assert out.shape == (2, 256), f"Expected (2, 256), got {out.shape}"
    print("  PASS\n")

def test_fusion():
    print("=== Test 3: CoAttentionFusion ===")
    import torch
    from src.models.fusion import CoAttentionFusion
    fus = CoAttentionFusion(text_dim=768, url_dim=256, common_dim=512)
    text_f = torch.randn(2, 768)
    url_f = torch.randn(2, 256)
    out = fus(text_f, url_f)
    print(f"  Output shape: {out.shape}")
    assert out.shape == (2, 512), f"Expected (2, 512), got {out.shape}"
    print("  PASS\n")

def test_full_model():
    print("=== Test 4: AdvancedPhishingDetector Forward ===")
    import torch
    from src.models.phishing_detector import AdvancedPhishingDetector
    model = AdvancedPhishingDetector(url_word_vocab_size=1000, num_url_features=18)
    text_ids = torch.randint(0, 50000, (2, 128))
    text_mask = torch.ones(2, 128, dtype=torch.long)
    url_chars = torch.randint(0, 128, (2, 200))
    url_words = torch.randint(0, 1000, (2, 20))
    url_feats = torch.randn(2, 18)
    outputs = model(text_ids, text_mask, url_chars, url_words, url_feats)
    print(f"  Output keys: {list(outputs.keys())}")
    print(f"  Logits shape: {outputs['logits'].shape}")
    print(f"  Prob shape: {outputs['binary_prob'].shape}")
    assert outputs['logits'].shape == (2, 1)
    assert outputs['binary_prob'].shape == (2, 1)
    print("  PASS\n")

def test_adversarial():
    print("=== Test 5: Adversarial Noise ===")
    import torch
    from src.models.phishing_detector import AdvancedPhishingDetector
    model = AdvancedPhishingDetector(url_word_vocab_size=1000, num_url_features=18)
    model.train()
    text_ids = torch.randint(0, 50000, (2, 128))
    text_mask = torch.ones(2, 128, dtype=torch.long)
    url_chars = torch.randint(0, 128, (2, 200))
    url_words = torch.randint(0, 1000, (2, 20))
    url_feats = torch.randn(2, 18)
    out_clean = model(text_ids, text_mask, url_chars, url_words, url_feats, apply_adversarial_noise=False)
    out_noisy = model(text_ids, text_mask, url_chars, url_words, url_feats, apply_adversarial_noise=True)
    # With noise, outputs should differ
    print(f"  Clean prob: {out_clean['binary_prob'].detach().flatten().tolist()}")
    print(f"  Noisy prob: {out_noisy['binary_prob'].detach().flatten().tolist()}")
    print("  PASS\n")

def test_preprocessing():
    print("=== Test 6: Preprocessing Pipeline ===")
    from src.data.preprocessing import preprocess_url_advanced
    char_idx, word_idx, feats = preprocess_url_advanced("https://www.google.com/login")
    print(f"  char_indices length: {len(char_idx)}")
    print(f"  word_indices length: {len(word_idx)}")
    print(f"  features length: {len(feats)}")
    assert len(char_idx) == 200
    assert len(word_idx) == 20
    assert len(feats) == 18
    print("  PASS\n")


if __name__ == "__main__":
    tests = [test_url_features, test_url_encoder, test_fusion,
             test_full_model, test_adversarial, test_preprocessing]
    passed = 0
    failed = 0
    for test in tests:
        try:
            test()
            passed += 1
        except Exception as e:
            print(f"  FAIL: {e}\n")
            failed += 1
    print(f"{'='*40}")
    print(f"Results: {passed} passed, {failed} failed")
    sys.exit(1 if failed else 0)
