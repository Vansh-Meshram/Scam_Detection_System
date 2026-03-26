"""
Self-learning retraining trigger.
Picks up user feedback from SQLite and triggers a new training run.
"""

import os
import sys
import subprocess
import sqlite3
import pandas as pd


def trigger_retraining():
    """
    Loads feedback from SQLite, exports to CSV, and triggers a
    training run via subprocess (avoids argparse conflicts).
    """
    print("Initiating self-learning retraining cycle...")

    DB_PATH = "feedback.db"
    if not os.path.exists(DB_PATH):
        print("No feedback data found.")
        return

    conn = sqlite3.connect(DB_PATH)
    df_feedback = pd.read_sql_query(
        "SELECT text, url, user_label as label FROM feedback", conn
    )
    conn.close()

    if len(df_feedback) == 0:
        print("Feedback table is empty, nothing new to learn.")
        return

    print(f"Loaded {len(df_feedback)} feedback samples.")
    os.makedirs("data", exist_ok=True)

    # Append to feedback CSV
    feedback_csv = "data/feedback.csv"
    if os.path.exists(feedback_csv):
        df_old = pd.read_csv(feedback_csv)
        df_combined = pd.concat([df_old, df_feedback])
    else:
        df_combined = df_feedback

    df_combined.to_csv(feedback_csv, index=False)

    # Trigger training via subprocess to avoid argparse conflicts
    project_root = os.path.dirname(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    )

    print("Starting training process with updated data...")
    result = subprocess.run(
        [sys.executable, "src/training/train.py", "--epochs", "2", "--batch-size", "16"],
        capture_output=True,
        text=True,
        cwd=project_root,
    )

    if result.returncode != 0:
        print(f"Retraining failed:\n{result.stderr}")
    else:
        print("Retraining complete. New model saved.")
        if result.stdout:
            print(result.stdout[-500:])  # Last 500 chars of output


if __name__ == "__main__":
    trigger_retraining()
