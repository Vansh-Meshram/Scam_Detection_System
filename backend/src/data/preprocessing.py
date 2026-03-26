"""
Text and URL preprocessing utilities.
"""

import re
from src.data.url_preprocessing import EnhancedURLFeaturizer
from src.models.url_encoder import URLTokenizer


# ── Basic text cleaning ──────────────────────────────────────

def clean_text(text):
    """
    Basic text cleaning: lowercasing, removing extra spaces.
    Preserves meaningful punctuation.
    """
    if not isinstance(text, str):
        return ""
    text = text.lower()
    text = re.sub(r"\s+", " ", text).strip()
    return text


def extract_url_features(url):
    """
    Legacy 8-feature URL extractor (kept for backward compatibility).
    For the new pipeline, use preprocess_url_advanced() instead.
    """
    if not url or not isinstance(url, str):
        return {
            "length": 0, "num_dots": 0, "num_hyphens": 0, "num_digits": 0,
            "num_special_chars": 0, "has_ip": 0, "has_at": 0, "has_double_slash": 0,
        }

    features = {}
    features["length"] = len(url)
    features["num_dots"] = url.count(".")
    features["num_hyphens"] = url.count("-")
    features["num_digits"] = sum(c.isdigit() for c in url)

    special_chars = '!@#$%^&*()_+=[]{}|\\:";\'<>,?'
    features["num_special_chars"] = sum(c in special_chars for c in url)

    ip_pattern = r"\b(?:\d{1,3}\.){3}\d{1,3}\b"
    features["has_ip"] = 1 if re.search(ip_pattern, url) else 0
    features["has_at"] = 1 if "@" in url else 0

    url_no_scheme = re.sub(r"^https?://", "", url)
    features["has_double_slash"] = 1 if "//" in url_no_scheme else 0

    return features


# ── Module-level singletons ──────────────────────────────────

_url_featurizer = EnhancedURLFeaturizer(skip_network=True)
_url_tokenizer = URLTokenizer(max_url_length=200, max_words=20)


def get_url_featurizer() -> EnhancedURLFeaturizer:
    """Access the shared EnhancedURLFeaturizer."""
    return _url_featurizer


def get_url_tokenizer() -> URLTokenizer:
    """Access the shared URLTokenizer."""
    return _url_tokenizer


def set_url_tokenizer(tokenizer: URLTokenizer):
    """Replace the shared URLTokenizer (used during training after vocab build)."""
    global _url_tokenizer
    _url_tokenizer = tokenizer


def preprocess_url_advanced(url: str):
    """
    Full URL preprocessing pipeline.

    Returns:
        (char_indices, word_indices, feature_array)
    """
    features_dict = _url_featurizer.extract_features(url)
    feature_array = _url_featurizer.features_to_array(features_dict)
    char_indices, word_indices = _url_tokenizer(url)
    return char_indices, word_indices, feature_array