"""
Advanced Phishing Detector — complete integrated model.

Architecture:
    Text → DistilBERT  (768-d) ┐
                                ├→ Co-Attention (512-d) → Classifier → 1-d logit
    URL  → URLNet      (256-d) ┘
"""

import torch
import torch.nn as nn

from src.models.text_encoder import AdvancedTextEncoder
from src.models.url_encoder import URLEncoder
from src.models.fusion import CoAttentionFusion


class AdvancedPhishingDetector(nn.Module):
    """
    Multi-modal phishing / scam detector with calibrated confidence.

    Combines:
        • DistilBERT text encoder   (768-d mean-pooled)
        • URLNet      URL encoder   (256-d)
        • Co-Attention fusion        (512-d)
        • MLP classifier + temperature scaling → 1 logit
    """

    def __init__(
        self,
        url_word_vocab_size: int = 10000,
        num_url_features: int = 18,
        text_model_name: str = "distilbert-base-uncased",
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

        # ── Classifier head with deeper capacity ─────────────
        self.classifier = nn.Sequential(
            nn.Linear(512, 256),
            nn.GELU(),
            nn.Dropout(0.3),
            nn.Linear(256, 128),
            nn.GELU(),
            nn.Dropout(0.2),
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(64, 1),
        )

        # ── Temperature scaling for calibrated probabilities ─
        self.temperature = nn.Parameter(torch.ones(1) * 1.5)

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

        # Temperature-scaled sigmoid for calibrated confidence
        scaled_logits = logits / self.temperature.clamp(min=0.1)

        return {
            "logits": logits,
            "binary_prob": torch.sigmoid(scaled_logits),
            "text_features": text_features,
            "url_features": url_features,
        }

    # ─────────────────────────────────────────────────────────
    #  User-friendly inference  (used by API)
    # ─────────────────────────────────────────────────────────

    def predict(self, text, url, tokenizer, url_tokenizer, url_featurizer, device="cpu"):
        """
        High-level predict method for a single (text, url) pair.
        Uses multi-signal calibration for improved confidence accuracy.

        Returns:
            dict with risk_score, is_scam, explanation, confidence_signals
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

            neural_score = outputs["binary_prob"].item()

            # ══════════════════════════════════════════════════
            #  Multi-Signal Confidence Calibration
            # ══════════════════════════════════════════════════
            confidence_signals = []
            url_penalty = 0.0
            url_trust = 0.0

            # Signal 1: Typosquatting detection
            if features_dict.get("is_typosquatting", 0):
                url_penalty += 0.15
                confidence_signals.append("⚡ Typosquatting detected — domain mimics known brand")

            # Signal 2: New / unestablished domain
            if features_dict.get("is_new_domain", 0):
                url_penalty += 0.10
                confidence_signals.append("⚡ Recently registered domain — no reputation history")

            # Signal 3: Missing SSL
            if not features_dict.get("has_valid_ssl", 0):
                url_penalty += 0.08
                confidence_signals.append("⚡ No valid SSL certificate — data transmitted unencrypted")

            # Signal 4: IP address in URL
            if features_dict.get("has_ip", 0):
                url_penalty += 0.12
                confidence_signals.append("⚡ URL contains raw IP address — server identity hidden")

            # Signal 5: Brand in subdomain (phishing pattern)
            if features_dict.get("brand_in_subdomain", 0):
                url_penalty += 0.10
                confidence_signals.append("⚡ Known brand name in subdomain — impersonation tactic")

            # Signal 6: Suspicious TLD
            if features_dict.get("is_suspicious_tld", 0):
                url_penalty += 0.05
                confidence_signals.append("⚡ Suspicious top-level domain detected")

            # Signal 7: High URL entropy (obfuscation)
            if features_dict.get("url_entropy", 0) > 4.5:
                url_penalty += 0.05
                confidence_signals.append("⚡ High URL entropy — possible obfuscation")

            # Trust signals (reduce score for verified legitimate domains)
            is_perfect_brand = features_dict.get("min_brand_distance", 0) == 1.0
            is_not_typo = features_dict.get("is_typosquatting", 1) == 0.0
            has_ssl = features_dict.get("has_valid_ssl", 0) == 1.0
            is_old = features_dict.get("is_new_domain", 1) == 0.0
            has_https = features_dict.get("has_https", 0) == 1.0

            if is_perfect_brand and is_not_typo:
                url_trust += 0.10
                confidence_signals.append("✅ Domain matches known brand exactly")
            if has_ssl and has_https:
                url_trust += 0.08
                confidence_signals.append("✅ Valid SSL certificate with HTTPS")
            if is_old:
                url_trust += 0.05
                confidence_signals.append("✅ Established domain with history")

            # ── Weighted ensemble: neural 70% + heuristic 30% ──
            heuristic_score = min(1.0, max(0.0, 0.3 + url_penalty - url_trust))
            risk_score = 0.70 * neural_score + 0.30 * heuristic_score

            # Override: verified official domain with low neural score
            full_trust = is_perfect_brand and is_not_typo and has_ssl and is_old
            if full_trust and neural_score < 0.3:
                risk_score = min(risk_score, 0.12)
                confidence_signals = ["✅ Verified official domain — all trust signals confirmed"]

            risk_score = round(min(0.99, max(0.01, risk_score)), 4)

            # ── Build explanation ────────────────────────────
            parts = [f"Risk score: {risk_score:.2%}"]

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

            if full_trust and risk_score <= 0.12:
                parts = [f"Verified official domain. Risk score adjusted to {risk_score:.2%}"]

            return {
                "risk_score": risk_score,
                "is_scam": risk_score > 0.5,
                "explanation": ". ".join(parts) + ".",
            }

    # ─────────────────────────────────────────────────────────
    #  Gradual unfreezing helpers
    # ─────────────────────────────────────────────────────────

    def freeze_text_encoder(self):
        """Freeze DistilBERT parameters (useful for first N epochs)."""
        for param in self.text_encoder.parameters():
            param.requires_grad = False

    def unfreeze_text_encoder(self):
        """Unfreeze DistilBERT parameters for fine-tuning."""
        for param in self.text_encoder.parameters():
            param.requires_grad = True
