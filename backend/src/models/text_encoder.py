"""
Text Encoder — DeBERTa-v3 with mean pooling.
Replaces the old RoBERTa-based encoder.
"""

import torch
import torch.nn as nn
from transformers import DebertaV2Model, DebertaV2Config


class AdvancedTextEncoder(nn.Module):
    """
    Uses microsoft/deberta-v3-base for text encoding.
    Outputs 768-d via mean pooling (better than [CLS] alone).
    """

    def __init__(self, model_name: str = "microsoft/deberta-v3-base"):
        super().__init__()
        self.deberta = DebertaV2Model.from_pretrained(model_name)
        self.output_dim = self.deberta.config.hidden_size  # 768

    def forward(
        self,
        input_ids: torch.Tensor,
        attention_mask: torch.Tensor,
    ) -> torch.Tensor:
        """
        Args:
            input_ids:      (B, seq_len)
            attention_mask:  (B, seq_len)
        Returns:
            (B, 768) mean-pooled text embedding
        """
        outputs = self.deberta(
            input_ids=input_ids,
            attention_mask=attention_mask,
        )
        last_hidden = outputs.last_hidden_state  # (B, L, 768)

        # Mean pooling: average over non-padded tokens
        mask_expanded = attention_mask.unsqueeze(-1).float()  # (B, L, 1)
        sum_hidden = (last_hidden * mask_expanded).sum(dim=1) # (B, 768)
        sum_mask   = mask_expanded.sum(dim=1).clamp(min=1e-9) # (B, 1)
        mean_pooled = sum_hidden / sum_mask                    # (B, 768)

        return mean_pooled