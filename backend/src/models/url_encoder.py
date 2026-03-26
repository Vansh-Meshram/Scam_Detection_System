"""
URLNet — Neural URL encoder.
Combines CharacterCNN + WordLevelEncoder (BiLSTM) + handcrafted features.
Also contains the URLTokenizer used during data preprocessing.
"""

import re
import torch
import torch.nn as nn


# ══════════════════════════════════════════════════════════════
#  URLTokenizer  (unchanged from original)
# ══════════════════════════════════════════════════════════════

class URLTokenizer:
    """Convert a raw URL string to padded char-index and word-index sequences."""

    def __init__(self, max_url_length=200, max_words=20):
        self.max_url_length = max_url_length
        self.max_words = max_words

        # Character vocab: simple ASCII mapping
        self.char_to_idx = {chr(i): i for i in range(256)}

        # Word vocab
        self.word_to_idx = {"<PAD>": 0, "<UNK>": 1}

    def build_word_vocab(self, urls, min_freq=2, max_vocab=50000):
        from collections import Counter

        word_counts = Counter()
        for url in urls:
            words = re.split(r"\W+", str(url).lower())
            word_counts.update([w for w in words if w])

        valid_words = [
            w for w, count in word_counts.most_common(max_vocab) if count >= min_freq
        ]
        for w in valid_words:
            if w not in self.word_to_idx:
                self.word_to_idx[w] = len(self.word_to_idx)

    def __call__(self, url: str):
        if not isinstance(url, str):
            url = ""

        # Char indices
        char_indices = [self.char_to_idx.get(c, 0) for c in url[: self.max_url_length]]
        char_indices += [0] * max(0, self.max_url_length - len(char_indices))

        # Word indices
        words = re.split(r"\W+", url.lower())
        words = [w for w in words if w][: self.max_words]
        word_indices = [
            self.word_to_idx.get(w, self.word_to_idx["<UNK>"]) for w in words
        ]
        word_indices += [0] * max(0, self.max_words - len(word_indices))

        return char_indices, word_indices


# ══════════════════════════════════════════════════════════════
#  CharacterCNN
# ══════════════════════════════════════════════════════════════

class CharacterCNN(nn.Module):
    """
    Multi-scale character-level CNN for URL patterns.
    Input:  (B, max_url_length)  long tensor of char indices
    Output: (B, 256)
    """

    def __init__(self, num_chars=128, embed_dim=32, out_dim=256):
        super().__init__()
        self.embedding = nn.Embedding(num_chars, embed_dim)

        # Three parallel conv branches with different kernel sizes
        self.conv3 = nn.Conv1d(embed_dim, 64, kernel_size=3, padding=1)
        self.conv5 = nn.Conv1d(embed_dim, 64, kernel_size=5, padding=2)
        self.conv7 = nn.Conv1d(embed_dim, 64, kernel_size=7, padding=3)

        self.pool = nn.AdaptiveMaxPool1d(output_size=1)

        self.fc = nn.Linear(64 * 3, out_dim)
        self.dropout = nn.Dropout(0.1)

    def forward(self, char_indices: torch.Tensor) -> torch.Tensor:
        """char_indices: (B, L)  →  (B, 256)"""
        x = self.embedding(char_indices)          # (B, L, 32)
        x = x.transpose(1, 2)                    # (B, 32, L)

        c3 = torch.relu(self.conv3(x))           # (B, 64, L)
        c5 = torch.relu(self.conv5(x))           # (B, 64, L)
        c7 = torch.relu(self.conv7(x))           # (B, 64, L)

        c3 = self.pool(c3).squeeze(-1)           # (B, 64)
        c5 = self.pool(c5).squeeze(-1)           # (B, 64)
        c7 = self.pool(c7).squeeze(-1)           # (B, 64)

        cat = torch.cat([c3, c5, c7], dim=-1)    # (B, 192)
        out = self.dropout(torch.relu(self.fc(cat)))  # (B, 256)
        return out


# ══════════════════════════════════════════════════════════════
#  WordLevelEncoder  (BiLSTM)
# ══════════════════════════════════════════════════════════════

class WordLevelEncoder(nn.Module):
    """
    Bidirectional LSTM over URL word tokens.
    Input:  (B, max_words)  long tensor of word indices
    Output: (B, 256)
    """

    def __init__(self, vocab_size=10000, embed_dim=64, hidden_dim=128, out_dim=256):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=0)
        self.lstm = nn.LSTM(
            input_size=embed_dim,
            hidden_size=hidden_dim,
            num_layers=1,
            batch_first=True,
            bidirectional=True,
        )
        self.dropout = nn.Dropout(0.1)
        # hidden_dim * 2 because bidirectional
        assert hidden_dim * 2 == out_dim, "hidden_dim * 2 must equal out_dim"

    def forward(self, word_indices: torch.Tensor) -> torch.Tensor:
        """word_indices: (B, W)  →  (B, 256)"""
        x = self.embedding(word_indices)       # (B, W, 64)
        _, (h_n, _) = self.lstm(x)             # h_n: (2, B, 128)

        # Concat forward-last and backward-last hidden states
        fwd = h_n[0]                           # (B, 128)
        bwd = h_n[1]                           # (B, 128)
        out = torch.cat([fwd, bwd], dim=-1)    # (B, 256)
        return self.dropout(out)


# ══════════════════════════════════════════════════════════════
#  URLEncoder  (full URLNet)
# ══════════════════════════════════════════════════════════════

class URLEncoder(nn.Module):
    """
    Fuses CharacterCNN + WordLevelEncoder + handcrafted features.

    Architecture:
        URL → [Char-CNN (256-d)]  ┐
           → [Word-LSTM (256-d)]  ├→ Fusion MLP → 256-d
           → [Features  (64-d)]  ┘
    """

    def __init__(
        self,
        url_word_vocab_size: int = 10000,
        num_url_features: int = 18,
        max_url_length: int = 200,
        output_dim: int = 256,
    ):
        super().__init__()
        self.char_cnn = CharacterCNN(num_chars=256, embed_dim=32, out_dim=256)
        self.word_encoder = WordLevelEncoder(
            vocab_size=max(2, url_word_vocab_size + 2),
            embed_dim=64,
            hidden_dim=128,
            out_dim=256,
        )
        self.feature_proj = nn.Sequential(
            nn.Linear(num_url_features, 64),
            nn.ReLU(),
            nn.Dropout(0.1),
        )
        self.fusion = nn.Sequential(
            nn.Linear(256 + 256 + 64, 512),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(512, output_dim),
            nn.ReLU(),
        )
        self.output_dim = output_dim

    def forward(
        self,
        char_indices: torch.Tensor,
        word_indices: torch.Tensor,
        handcrafted_features: torch.Tensor,
    ) -> torch.Tensor:
        """
        Args:
            char_indices:          (B, max_url_length)
            word_indices:          (B, max_words)
            handcrafted_features:  (B, num_url_features)
        Returns:
            (B, 256)
        """
        char_out = self.char_cnn(char_indices)               # (B, 256)
        word_out = self.word_encoder(word_indices)            # (B, 256)
        feat_out = self.feature_proj(handcrafted_features)   # (B, 64)

        combined = torch.cat([char_out, word_out, feat_out], dim=-1)  # (B, 576)
        return self.fusion(combined)                          # (B, 256)
