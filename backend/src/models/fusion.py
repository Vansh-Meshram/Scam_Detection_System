"""
Co-Attention Fusion — cross-modal attention between text and URL features.
Bridges DistilBERT text embeddings with URLNet URL embeddings.
"""

import torch
import torch.nn as nn


class CoAttentionFusion(nn.Module):
    """
    Multi-head cross-attention fusion.

    DistilBERT (768-d) and URLNet (256-d) are projected to a common dimension,
    then attend to each other via multi-head attention.  Residual
    connections + layer normalisation + a feed-forward network produce
    the final fused representation.

    Outputs 512-d.
    """

    def __init__(
        self,
        text_dim: int = 768,
        url_dim: int = 256,
        common_dim: int = 512,
        num_heads: int = 8,
        dropout: float = 0.1,
    ):
        super().__init__()

        # ── Projections to common space ──────────────────────
        self.text_proj = nn.Linear(text_dim, common_dim)
        self.url_proj = nn.Linear(url_dim, common_dim)

        # ── Cross-attention (text → URL and URL → text) ──────
        self.text_to_url_attn = nn.MultiheadAttention(
            embed_dim=common_dim,
            num_heads=num_heads,
            dropout=dropout,
            batch_first=True,
        )
        self.url_to_text_attn = nn.MultiheadAttention(
            embed_dim=common_dim,
            num_heads=num_heads,
            dropout=dropout,
            batch_first=True,
        )

        # ── Layer norms after cross-attention ────────────────
        self.text_norm = nn.LayerNorm(common_dim)
        self.url_norm = nn.LayerNorm(common_dim)

        # ── Feed-forward network ─────────────────────────────
        self.ffn = nn.Sequential(
            nn.Linear(common_dim * 2, common_dim * 4),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(common_dim * 4, common_dim * 2),
            nn.Dropout(dropout),
        )
        self.ffn_norm = nn.LayerNorm(common_dim * 2)

        # ── Final projection ─────────────────────────────────
        self.output_proj = nn.Linear(common_dim * 2, common_dim)
        self.output_dim = common_dim  # 512

    def forward(
        self,
        text_features: torch.Tensor,
        url_features: torch.Tensor,
    ) -> torch.Tensor:
        """
        Args:
            text_features: (B, 768)  — from DistilBERT
            url_features:  (B, 256)  — from URLNet
        Returns:
            (B, 512) fused representation
        """
        # Project to common dimension and add seq-len dim for attention
        text_proj = self.text_proj(text_features).unsqueeze(1)  # (B, 1, 512)
        url_proj = self.url_proj(url_features).unsqueeze(1)     # (B, 1, 512)

        # Cross-attention: text attends to URL
        text_attended, _ = self.text_to_url_attn(
            query=text_proj, key=url_proj, value=url_proj,
        )
        text_out = self.text_norm(text_proj + text_attended).squeeze(1)  # (B, 512)

        # Cross-attention: URL attends to text
        url_attended, _ = self.url_to_text_attn(
            query=url_proj, key=text_proj, value=text_proj,
        )
        url_out = self.url_norm(url_proj + url_attended).squeeze(1)  # (B, 512)

        # Concat + FFN with residual + norm
        combined = torch.cat([text_out, url_out], dim=-1)   # (B, 1024)
        ffn_out = self.ffn(combined)                        # (B, 1024)
        fused = self.ffn_norm(combined + ffn_out)           # (B, 1024)

        return self.output_proj(fused)                      # (B, 512)
