"""
Evaluation utilities for the AdvancedPhishingDetector.
"""

import torch
from sklearn.metrics import accuracy_score, precision_recall_fscore_support


def evaluate_model(model, dataloader, device):
    """
    Evaluates the model on the given dataloader and returns metrics.
    """
    model.eval()
    all_preds = []
    all_labels = []

    with torch.no_grad():
        for batch in dataloader:
            text_ids  = batch["text_input_ids"].to(device)
            text_mask = batch["text_attention_mask"].to(device)
            url_chars = batch["url_char_indices"].to(device)
            url_words = batch["url_word_indices"].to(device)
            url_feats = batch["url_features"].to(device)
            labels    = batch["label"]

            outputs = model(
                text_input_ids=text_ids,
                text_attention_mask=text_mask,
                url_char_indices=url_chars,
                url_word_indices=url_words,
                url_handcrafted_features=url_feats,
            )

            preds = (outputs["binary_prob"].squeeze(-1) > 0.5).cpu().int()

            all_preds.extend(preds.tolist())
            all_labels.extend(labels.tolist())

    if not all_labels:
        return {"accuracy": 0, "precision": 0, "recall": 0, "f1": 0}

    acc = accuracy_score(all_labels, all_preds)
    precision, recall, f1, _ = precision_recall_fscore_support(
        all_labels, all_preds, average="binary", zero_division=0,
    )

    return {
        "accuracy": acc,
        "precision": precision,
        "recall": recall,
        "f1": f1,
    }
