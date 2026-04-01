"""
Training script for AdvancedPhishingDetector.
"""

import os
import json
import argparse
import logging
from datetime import datetime

import torch
import torch.nn as nn
from torch.utils.data import DataLoader, random_split
from torch.optim import AdamW
from transformers import AutoTokenizer

from src.data.loader import ScamDataset, load_and_merge_data
from src.data.preprocessing import set_url_tokenizer
from src.models.phishing_detector import AdvancedPhishingDetector
from src.models.url_encoder import URLTokenizer

# ── Logging ──────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger(__name__)


def parse_args():
    parser = argparse.ArgumentParser(description="Train scam detection model")
    parser.add_argument("--data-path",   type=str,   default="data/combined_dataset.csv")
    parser.add_argument("--epochs",      type=int,   default=10)
    parser.add_argument("--batch-size",  type=int,   default=16)
    parser.add_argument("--lr",          type=float, default=2e-5)
    parser.add_argument("--max-length",  type=int,   default=256)
    parser.add_argument("--val-split",   type=float, default=0.15)
    parser.add_argument("--save-dir",    type=str,   default="models/")
    parser.add_argument("--freeze-epochs", type=int, default=2,
                        help="Number of epochs to freeze the text encoder")
    parser.add_argument("--adversarial", action="store_true", default=True)
    parser.add_argument("--adv-epsilon", type=float, default=0.01)
    parser.add_argument("--patience",    type=int,   default=3,
                        help="Early stopping patience")
    return parser.parse_args()


def train():
    args = parse_args()
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"Device: {device}")

    # ══════════════════════════════════════════════════════════
    #  1. DATA
    # ══════════════════════════════════════════════════════════
    logger.info("Loading dataset...")
    df = load_and_merge_data(data_dir="data")
    logger.info(f"Total samples: {len(df)}")

    # Build URL word vocabulary
    url_tokenizer = URLTokenizer(max_url_length=200, max_words=20)
    urls = df["url"].dropna().tolist()
    url_tokenizer.build_word_vocab(urls, min_freq=2, max_vocab=50000)
    set_url_tokenizer(url_tokenizer)
    logger.info(f"URL word vocab size: {len(url_tokenizer.word_to_idx)}")

    # Save vocabulary for API inference
    os.makedirs(args.save_dir, exist_ok=True)
    vocab_path = os.path.join(args.save_dir, "url_vocab.json")
    with open(vocab_path, "w") as f:
        json.dump(url_tokenizer.word_to_idx, f)
    logger.info(f"URL vocab saved → {vocab_path}")

    # Text tokenizer — DistilBERT
    text_tokenizer = AutoTokenizer.from_pretrained(
        "distilbert-base-uncased"
    )

    # Dataset & split
    dataset = ScamDataset(
        data=df,
        tokenizer=text_tokenizer,
        max_length=args.max_length,
    )

    val_size = int(len(dataset) * args.val_split)
    train_size = len(dataset) - val_size
    train_ds, val_ds = random_split(dataset, [train_size, val_size])

    train_loader = DataLoader(
        train_ds, batch_size=args.batch_size, shuffle=True,
        num_workers=0, pin_memory=True,
    )
    val_loader = DataLoader(
        val_ds, batch_size=args.batch_size, shuffle=False,
        num_workers=0, pin_memory=True,
    )
    logger.info(f"Train: {train_size} | Val: {val_size}")

    # ══════════════════════════════════════════════════════════
    #  2. MODEL
    # ══════════════════════════════════════════════════════════
    model = AdvancedPhishingDetector(
        url_word_vocab_size=len(url_tokenizer.word_to_idx),
        num_url_features=18,
    ).to(device)

    # Freeze text encoder for initial epochs
    model.freeze_text_encoder()
    logger.info(f"Text encoder frozen for first {args.freeze_epochs} epochs")

    total_params = sum(p.numel() for p in model.parameters())
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    logger.info(f"Total params: {total_params:,} | Trainable: {trainable:,}")

    # ══════════════════════════════════════════════════════════
    #  3. OPTIMIZER & SCHEDULER
    # ══════════════════════════════════════════════════════════
    optimizer = AdamW(model.parameters(), lr=args.lr, weight_decay=0.01)
    total_steps = len(train_loader) * args.epochs
    warmup_steps = int(total_steps * 0.1)
    scheduler = torch.optim.lr_scheduler.LinearLR(
        optimizer, start_factor=0.1, total_iters=max(warmup_steps, 1),
    )
    criterion = nn.BCEWithLogitsLoss()

    # ══════════════════════════════════════════════════════════
    #  4. TRAINING LOOP
    # ══════════════════════════════════════════════════════════
    best_val_loss = float("inf")
    patience_counter = 0

    for epoch in range(args.epochs):
        # ── Gradual unfreezing ────────────────────────────────
        if epoch == args.freeze_epochs:
            model.unfreeze_text_encoder()
            # Lower LR for fine-tuning pre-trained weights
            for pg in optimizer.param_groups:
                pg["lr"] = args.lr * 0.1
            trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
            logger.info(f"  ↳ Text encoder unfrozen. Trainable: {trainable:,}")

        model.train()
        total_loss = 0.0
        correct = 0
        total = 0

        for batch_idx, batch in enumerate(train_loader):
            # Move to device
            text_ids  = batch["text_input_ids"].to(device)
            text_mask = batch["text_attention_mask"].to(device)
            url_chars = batch["url_char_indices"].to(device)
            url_words = batch["url_word_indices"].to(device)
            url_feats = batch["url_features"].to(device)
            labels    = batch["label"].to(device)

            # ── Clean forward pass ───────────────────────────
            optimizer.zero_grad()
            outputs = model(
                text_input_ids=text_ids,
                text_attention_mask=text_mask,
                url_char_indices=url_chars,
                url_word_indices=url_words,
                url_handcrafted_features=url_feats,
                apply_adversarial_noise=False,
            )
            loss = criterion(outputs["logits"].squeeze(-1), labels)

            # ── Adversarial pass (optional) ──────────────────
            if args.adversarial:
                outputs_adv = model(
                    text_input_ids=text_ids,
                    text_attention_mask=text_mask,
                    url_char_indices=url_chars,
                    url_word_indices=url_words,
                    url_handcrafted_features=url_feats,
                    apply_adversarial_noise=True,
                )
                loss_adv = criterion(outputs_adv["logits"].squeeze(-1), labels)
                loss = 0.7 * loss + 0.3 * loss_adv

            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()
            scheduler.step()

            total_loss += loss.item()
            preds = (outputs["binary_prob"].squeeze(-1) >= 0.5).float()
            correct += (preds == labels).sum().item()
            total += labels.size(0)

            if (batch_idx + 1) % 50 == 0:
                logger.info(
                    f"  Epoch {epoch+1} | Batch {batch_idx+1}/{len(train_loader)} | "
                    f"Loss: {loss.item():.4f}"
                )

        train_acc = correct / max(total, 1)
        avg_loss = total_loss / max(len(train_loader), 1)

        # ── Validation ───────────────────────────────────────
        val_loss, val_acc = evaluate(model, val_loader, criterion, device)

        logger.info(
            f"Epoch {epoch+1}/{args.epochs} | "
            f"Train Loss: {avg_loss:.4f} | Train Acc: {train_acc:.4f} | "
            f"Val Loss: {val_loss:.4f} | Val Acc: {val_acc:.4f}"
        )

        # ── Save best + early stopping ───────────────────────
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            patience_counter = 0
            save_path = os.path.join(args.save_dir, "phishing_detector.pt")
            torch.save(
                {
                    "epoch": epoch + 1,
                    "model_state_dict": model.state_dict(),
                    "optimizer_state_dict": optimizer.state_dict(),
                    "val_loss": val_loss,
                    "val_acc": val_acc,
                    "url_word_vocab_size": len(url_tokenizer.word_to_idx),
                    "num_url_features": 18,
                    "url_word_vocab": url_tokenizer.word_to_idx,
                },
                save_path,
            )
            logger.info(f"  ✓ Best model saved → {save_path}")
        else:
            patience_counter += 1
            if patience_counter >= args.patience:
                logger.info(f"Early stopping at epoch {epoch+1}")
                break

    logger.info("Training complete!")


def evaluate(model, loader, criterion, device):
    """Run evaluation on a DataLoader. Returns (avg_loss, accuracy)."""
    model.eval()
    total_loss = 0.0
    correct = 0
    total = 0

    with torch.no_grad():
        for batch in loader:
            text_ids  = batch["text_input_ids"].to(device)
            text_mask = batch["text_attention_mask"].to(device)
            url_chars = batch["url_char_indices"].to(device)
            url_words = batch["url_word_indices"].to(device)
            url_feats = batch["url_features"].to(device)
            labels    = batch["label"].to(device)

            outputs = model(
                text_input_ids=text_ids,
                text_attention_mask=text_mask,
                url_char_indices=url_chars,
                url_word_indices=url_words,
                url_handcrafted_features=url_feats,
            )

            loss = criterion(outputs["logits"].squeeze(-1), labels)
            total_loss += loss.item()

            preds = (outputs["binary_prob"].squeeze(-1) >= 0.5).float()
            correct += (preds == labels).sum().item()
            total += labels.size(0)

    avg_loss = total_loss / max(len(loader), 1)
    accuracy = correct / max(total, 1)
    return avg_loss, accuracy


if __name__ == "__main__":
    train()