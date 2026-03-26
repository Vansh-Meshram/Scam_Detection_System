"""
API dependencies — loads model artifacts at startup.
"""

import os
import json
import logging

import torch
from transformers import DebertaV2Tokenizer

from src.models.phishing_detector import AdvancedPhishingDetector
from src.models.url_encoder import URLTokenizer
from src.data.url_preprocessing import EnhancedURLFeaturizer

logger = logging.getLogger(__name__)

# ── Globals (populated by load_model_artifacts) ──────────────
_model = None
_tokenizer = None
_url_tokenizer = None
_url_featurizer = None
_device = None


def load_model_artifacts(
    model_path: str = "models/phishing_detector.pt",
    vocab_path: str = "models/url_vocab.json",
):
    """
    Load all model artefacts.  Called once at API startup.
    """
    global _model, _tokenizer, _url_tokenizer, _url_featurizer, _device

    _device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Device: {_device}")

    # ── Text tokenizer ───────────────────────────────────────
    _tokenizer = DebertaV2Tokenizer.from_pretrained("microsoft/deberta-v3-base")

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
        _model = AdvancedPhishingDetector(
            url_word_vocab_size=len(_url_tokenizer.word_to_idx),
            num_url_features=18,
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
