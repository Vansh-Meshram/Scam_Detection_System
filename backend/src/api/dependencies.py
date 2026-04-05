"""
API dependencies — loads model artifacts at startup.
"""

import os
import json
import logging

import torch
from transformers import AutoTokenizer

from src.models.phishing_detector import AdvancedPhishingDetector
from src.models.url_encoder import URLTokenizer
from src.data.url_preprocessing import EnhancedURLFeaturizer
import joblib

logger = logging.getLogger(__name__)

# ── Globals (populated by load_model_artifacts) ──────────────
_model = None
_tokenizer = None
_url_tokenizer = None
_url_featurizer = None
_device = None

_sklearn_url_model = None
_sklearn_vectorizer = None


def load_model_artifacts(
    model_path: str = "models/phishing_detector.pt",
    vocab_path: str = "models/url_vocab.json",
):
    """
    Load all model artefacts.  Called once at API startup.
    """
    global _model, _tokenizer, _url_tokenizer, _url_featurizer, _device
    global _sklearn_url_model, _sklearn_vectorizer

    _device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Device: {_device}")

    # Load Sklearn URL models
    sklearn_model_path = r"models/url_model (1).pkl"
    sklearn_vec_path = r"models/vectorizer (1).pkl"
    if os.path.exists(sklearn_model_path) and os.path.exists(sklearn_vec_path):
        try:
            _sklearn_url_model = joblib.load(sklearn_model_path)
            _sklearn_vectorizer = joblib.load(sklearn_vec_path)
            logger.info("Sklearn URL models loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load sklearn URL models: {e}")
    else:
        logger.warning("Sklearn URL models not found.")

    # ── Text tokenizer ───────────────────────────────────────
    distil_path = "models/distilbert_model"
    if os.path.exists(distil_path):
        _tokenizer = AutoTokenizer.from_pretrained(distil_path)
    else:
        _tokenizer = AutoTokenizer.from_pretrained("distilbert-base-uncased")

    # ── URL tokenizer with saved vocabulary ──────────────────
    _url_tokenizer = URLTokenizer(max_url_length=200, max_words=20)
    if os.path.exists(vocab_path):
        with open(vocab_path, "r") as f:
            vocab = json.load(f)
        _url_tokenizer.word_to_idx = vocab
        logger.info(f"URL vocab loaded ({len(vocab)} words)")
    else:
        logger.warning(f"URL vocab not found at {vocab_path}; using default vocab.")

    # ── URL featurizer ───────────────────────────────────────
    _url_featurizer = EnhancedURLFeaturizer()

    # ── Model ────────────────────────────────────────────────
    if os.path.exists(model_path):
        checkpoint = torch.load(model_path, map_location=_device)
        _model = AdvancedPhishingDetector(
            url_word_vocab_size=checkpoint.get("url_word_vocab_size", 10000),
            num_url_features=checkpoint.get("num_url_features", 18),
        )
        _model.load_state_dict(checkpoint["model_state_dict"])
        logger.info(f"Model loaded from {model_path}")
    else:
        logger.warning(
            f"Model checkpoint not found at {model_path}. "
            "Using untrained model for demonstration."
        )
        distil_path = "models/distilbert_model"
        _model = AdvancedPhishingDetector(
            url_word_vocab_size=len(_url_tokenizer.word_to_idx),
            num_url_features=18,
            text_model_name=distil_path if os.path.exists(distil_path) else "distilbert-base-uncased"
        )

    _model.to(_device)
    _model.eval()


# ── Accessor functions ───────────────────────────────────────

def get_model():
    return _model

def get_tokenizer():
    return _tokenizer

def get_url_tokenizer():
    return _url_tokenizer

def get_url_featurizer():
    return _url_featurizer

def get_device():
    return _device

def get_sklearn_url_model():
    return _sklearn_url_model

def get_sklearn_vectorizer():
    return _sklearn_vectorizer

