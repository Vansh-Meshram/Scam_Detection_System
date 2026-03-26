import os
import pandas as pd
import torch
from torch.utils.data import Dataset
from src.data.preprocessing import preprocess_text, extract_url_features


def load_and_merge_data(data_dir="data"):
    """
    Loads the combined_dataset.csv produced by integrate_datasets.py.
    Falls back to loading individual files if combined_dataset.csv is not found.
    Returns a DataFrame with columns: text, url, label.
    """
    combined_path = os.path.join(data_dir, "combined_dataset.csv")
    if os.path.exists(combined_path):
        df = pd.read_csv(combined_path, low_memory=False)
        df["text"] = df["text"].fillna("")
        if "source" in df.columns:
            df["url"] = df.apply(
                lambda r: r["text"] if r.get("source") == "url" else "", axis=1
            )
        else:
            df["url"] = ""
        df["label"] = df["label"].astype(int)
        print(f"Loaded combined dataset: {len(df)} records.")
        merged_df = df[["text", "url", "label"]].copy()

        # ── Include feedback data (combined path) ────────
        merged_df = _append_feedback(merged_df, data_dir)
        return merged_df

    # Fallback: try individual files
    dfs = []

    email_path = os.path.join(data_dir, "emails.csv")
    if os.path.exists(email_path):
        df_email = pd.read_csv(
            email_path, sep="\t", on_bad_lines="skip", low_memory=False
        )
        if "text" in df_email.columns and "binary_label" in df_email.columns:
            df_email = df_email[["text", "binary_label"]].copy()
            df_email.rename(columns={"binary_label": "label"}, inplace=True)
            df_email["url"] = ""
            dfs.append(df_email)

    sms_path = os.path.join(data_dir, "msg.csv")
    if os.path.exists(sms_path):
        df_sms = pd.read_csv(sms_path, sep="\t", encoding="latin-1")
        if "v1" in df_sms.columns and "v2" in df_sms.columns:
            df_sms = df_sms[["v2", "v1"]].copy()
            df_sms.columns = ["text", "label"]
            df_sms["label"] = df_sms["label"].map({"spam": 1, "ham": 0})
            df_sms["url"] = ""
            dfs.append(df_sms)

    url_path = os.path.join(data_dir, "url.csv")
    if os.path.exists(url_path):
        df_url = pd.read_csv(url_path, sep="\t")
        if "url" in df_url.columns and "type" in df_url.columns:
            df_url["label"] = df_url["type"].apply(
                lambda x: 0 if x == "benign" else 1
            )
            df_url["text"] = df_url["url"]
            df_url = df_url[["text", "url", "label"]].copy()
            dfs.append(df_url)

    if not dfs:
        raise FileNotFoundError(
            "No valid dataset files found in the data directory."
        )

    # ── THIS WAS MISSING ─────────────────────────────────
    merged_df = pd.concat(dfs, ignore_index=True)
    merged_df["text"] = merged_df["text"].fillna("")
    merged_df["url"] = merged_df["url"].fillna("")

    # ── Include feedback data (fallback path) ────────────
    merged_df = _append_feedback(merged_df, data_dir)

    return merged_df


def _append_feedback(df, data_dir):
    """Append feedback.csv to the dataset if it exists."""
    feedback_path = os.path.join(data_dir, "feedback.csv")
    if os.path.exists(feedback_path):
        try:
            df_feedback = pd.read_csv(feedback_path)
            if all(col in df_feedback.columns for col in ["text", "label"]):
                if "url" not in df_feedback.columns:
                    df_feedback["url"] = ""
                df_feedback["text"] = df_feedback["text"].fillna("")
                df_feedback["url"] = df_feedback["url"].fillna("")
                df = pd.concat(
                    [df, df_feedback[["text", "url", "label"]]],
                    ignore_index=True,
                )
                print(f"Added {len(df_feedback)} feedback samples.")
        except Exception as e:
            print(f"Warning: Could not load feedback data: {e}")
    return df


class ScamDataset(Dataset):
    """
    PyTorch Dataset for scam detection.
    Handles both text and URL processing.
    """
    
    def __init__(self, data, tokenizer, max_length=256):
        """
        Args:
            data: DataFrame with columns ['text', 'url', 'label']
            tokenizer: Transformers tokenizer (e.g., DebertaV2Tokenizer)
            max_length: Maximum sequence length for text
        """
        self.data = data.reset_index(drop=True)
        self.tokenizer = tokenizer
        self.max_length = max_length
    
    def __len__(self):
        return len(self.data)
    
    def __getitem__(self, idx):
        row = self.data.iloc[idx]
        
        # Text processing
        text = str(row.get('text', ''))
        text = preprocess_text(text)
        
        # Tokenize text
        encoding = self.tokenizer(
            text,
            add_special_tokens=True,
            max_length=self.max_length,
            padding='max_length',
            truncation=True,
            return_attention_mask=True,
            return_tensors='pt'
        )
        
        # URL processing
        url = str(row.get('url', ''))
        url_data = extract_url_features(url)
        
        # Label
        label = float(row.get('label', 0))
        
        return {
            'text_input_ids': encoding['input_ids'].flatten(),
            'text_attention_mask': encoding['attention_mask'].flatten(),
            'url_char_indices': torch.tensor(url_data['char_indices'], dtype=torch.long),
            'url_word_indices': torch.tensor(url_data['word_indices'], dtype=torch.long),
            'url_features': torch.tensor(url_data['handcrafted_features'], dtype=torch.float32),
            'label': torch.tensor(label, dtype=torch.float32)
        }