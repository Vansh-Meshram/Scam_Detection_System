import sqlite3
import datetime
import os

DB_PATH = 'feedback.db'

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            text TEXT,
            url TEXT,
            predicted_score REAL,
            user_label INTEGER,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

def store_feedback(text, url, predicted_score, user_label):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute(
        'INSERT INTO feedback (text, url, predicted_score, user_label, timestamp) VALUES (?, ?, ?, ?, ?)',
        (text, url, predicted_score, user_label, datetime.datetime.now())
    )
    conn.commit()
    conn.close()

# Initialize on import
init_db()
