"""
Advanced Phishing Detector — complete integrated model.
Replaces the old fusion_model.py.

Architecture:
    Text → DeBERTa-v3 (768-d) ┐
                               ├→ Co-Attention (512-d) → Classifier → 1-d logit
    URL  → URLNet     (256-d) ┘
"""

import torch
import torch.nn as nn

from src.models.text_encoder import AdvancedTextEncoder
from src.models.url_encoder import URLEncoder
from src.models.fusion import CoAttentionFusion


class AdvancedPhishingDetector(nn.Module):
    """
    State-of-the-art multi-modal phishing / scam detector.

    Combines:
        • DeBERTa-v3  text encoder   (768-d mean-pooled)
        • URLNet      URL encoder    (256-d)
        • Co-Attention fusion        (512-d)
        • MLP classifier             → 1 logit
    """

    def __init__(
        self,
        url_word_vocab_size: int = 10000,
        num_url_features: int = 18,
        text_model_name: str = "microsoft/deberta-v3-base",
    ):
        super().__init__()

        # ── Encoders ─────────────────────────────────────────
        self.text_encoder = AdvancedTextEncoder(text_model_name)  # → 768
        self.url_encoder = URLEncoder(
            url_word_vocab_size=url_word_vocab_size,
            num_url_features=num_url_features,
        )  # → 256

        # ── Fusion ───────────────────────────────────────────
        self.fusion = CoAttentionFusion(
            text_dim=768, url_dim=256, common_dim=512,
        )  # → 512

        # ── Classifier head ──────────────────────────────────
        self.classifier = nn.Sequential(
            nn.Linear(512, 256),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(256, 64),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(64, 1),
        )

        self.noise_std = 0.01  # adversarial noise magnitude

    # ─────────────────────────────────────────────────────────
    #  Training / Inference forward
    # ─────────────────────────────────────────────────────────

    def forward(
        self,
        text_input_ids: torch.Tensor,
        text_attention_mask: torch.Tensor,
        url_char_indices: torch.Tensor,
        url_word_indices: torch.Tensor,
        url_handcrafted_features: torch.Tensor,
        apply_adversarial_noise: bool = False,
    ) -> dict:
        """
        Args:
            text_input_ids:           (B, seq_len)
            text_attention_mask:      (B, seq_len)
            url_char_indices:         (B, max_url_length)
            url_word_indices:         (B, max_words)
            url_handcrafted_features: (B, 18)
            apply_adversarial_noise:  inject Gaussian noise during training
        Returns:
            dict with keys: logits, binary_prob, text_features, url_features
        """
        text_features = self.text_encoder(text_input_ids, text_attention_mask)
        url_features = self.url_encoder(
            url_char_indices, url_word_indices, url_handcrafted_features,
        )

        if apply_adversarial_noise and self.training:
            text_features = text_features + torch.randn_like(text_features) * self.noise_std
            url_features = url_features + torch.randn_like(url_features) * self.noise_std

        fused = self.fusion(text_features, url_features)  # (B, 512)
        logits = self.classifier(fused)                   # (B, 1)

        return {
            "logits": logits,
            "binary_prob": torch.sigmoid(logits),
            "text_features": text_features,
            "url_features": url_features,
        }

    # ─────────────────────────────────────────────────────────
    #  User-friendly inference  (used by API)
    # ─────────────────────────────────────────────────────────

    def predict(self, text, url, tokenizer, url_tokenizer, url_featurizer, device="cpu"):
        """
        High-level predict method for a single (text, url) pair.

        Returns:
            dict with risk_score, is_scam, explanation
        """
        self.eval()
        with torch.no_grad():
            # ── Text ─────────────────────────────────────────
            text_enc = tokenizer(
                text or "",
                return_tensors="pt",
                max_length=256,
                truncation=True,
                padding="max_length",
            )
            text_input_ids = text_enc["input_ids"].to(device)
            text_attention_mask = text_enc["attention_mask"].to(device)

            # ── URL ──────────────────────────────────────────
            features_dict = url_featurizer.extract_features(url or "")
            feature_array = url_featurizer.features_to_array(features_dict)
            char_indices, word_indices = url_tokenizer(url or "")

            url_char_indices = torch.tensor(char_indices, dtype=torch.long).unsqueeze(0).to(device)
            url_word_indices = torch.tensor(word_indices, dtype=torch.long).unsqueeze(0).to(device)
            url_features = torch.tensor(feature_array, dtype=torch.float).unsqueeze(0).to(device)

            # ── Forward ──────────────────────────────────────
            outputs = self.forward(
                text_input_ids, text_attention_mask,
                url_char_indices, url_word_indices, url_features,
            )

            risk_score = outputs["binary_prob"].item()

            # ── Refined Risk Assessment (Fix False Positives) ──
            # If the URL is an official brand link with SSL and not new, 
            # we Trust it more than the neural prediction.
            is_perfect_brand = features_dict.get("min_brand_distance", 0) == 1.0
            is_not_typo = features_dict.get("is_typosquatting", 1) == 0.0
            has_ssl = features_dict.get("has_valid_ssl", 0) == 1.0
            is_old = features_dict.get("is_new_domain", 1) == 0.0

            trust_signal = is_perfect_brand and is_not_typo and has_ssl and is_old

            if trust_signal and risk_score > 0.15:
                # Cautiously trust verified official domains
                risk_score = 0.12  # Below standard threshold
                parts = [f"Verified official domain. Risk score adjusted to {risk_score:.2%}"]
            else:
                parts = [f"Risk score: {risk_score:.2%}"]

            # ── Explanation ──────────────────────────────────
            if features_dict.get("is_typosquatting", 0):
                parts.append("Possible typosquatting detected")
            if features_dict.get("is_new_domain", 0):
                parts.append("Recently registered domain")
            if not features_dict.get("has_valid_ssl", 0):
                parts.append("No valid SSL certificate")
            if features_dict.get("has_ip", 0):
                parts.append("URL contains IP address")
            if features_dict.get("brand_in_subdomain", 0):
                parts.append("Brand name in subdomain")

            return {
                "risk_score": round(risk_score, 4),
                "is_scam": risk_score > 0.5,
                "explanation": ". ".join(parts) + ".",
            }

    # ─────────────────────────────────────────────────────────
    #  Gradual unfreezing helpers
    # ─────────────────────────────────────────────────────────

    def freeze_text_encoder(self):
        """Freeze DeBERTa parameters (useful for first N epochs)."""
        for param in self.text_encoder.parameters():
            param.requires_grad = False

    def unfreeze_text_encoder(self):
        """Unfreeze DeBERTa parameters for fine-tuning."""
        for param in self.text_encoder.parameters():
            param.requires_grad = True
