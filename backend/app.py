import os
import torch
import re
import traceback
from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import AutoTokenizer, AutoModelForSequenceClassification

# --- 1. INITIALIZATION ---
app = Flask(__name__)
CORS(app)  # Enables frontend-to-backend communication

# Determine if a GPU is available, otherwise default to CPU
device = "cuda" if torch.cuda.is_available() else "cpu"

# --- 2. CLEAN PATH CONFIGURATION ---
# We use abspath to prevent the library from mistaking a Windows path for a URL
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# CRITICAL: These must match your folder names in C:\...\backend\models\
TEXT_MODEL_PATH = os.path.abspath(os.path.join(BASE_DIR, "models", "textmodel"))
URL_MODEL_PATH = os.path.abspath(os.path.join(BASE_DIR, "models", "urlbert_official"))

print(f"\n--- 🛰️ Scam Detection System Booting ---")
print(f"Running on: {device.upper()}")

# --- 3. LOAD MODELS (Strict Local Mode) ---
try:
    # ── LOAD TEXT MODEL ──
    print(f"🔄 Loading Text Model from: {TEXT_MODEL_PATH}")
    text_tokenizer = AutoTokenizer.from_pretrained(TEXT_MODEL_PATH, local_files_only=True)
    text_model = AutoModelForSequenceClassification.from_pretrained(TEXT_MODEL_PATH, local_files_only=True).to(device)
    
    # ── LOAD URLBERT MODEL ──
    print(f"🔄 Loading Official URLBERT from: {URL_MODEL_PATH}")
    
    # This prints exactly what Python sees in your folder to help us debug
    if os.path.exists(URL_MODEL_PATH):
        print(f"📁 Files found in URL folder: {os.listdir(URL_MODEL_PATH)}")
    
    url_tokenizer = AutoTokenizer.from_pretrained(URL_MODEL_PATH, local_files_only=True)
    url_model = AutoModelForSequenceClassification.from_pretrained(URL_MODEL_PATH, local_files_only=True).to(device)
    
    print("✅ All AI Engines Online!")

except Exception as e:
    print(f"❌ LOAD ERROR: {e}")
    print(f"\n💡 DEBUG INFO:")
    print(f"Target URL Folder: {URL_MODEL_PATH}")
    print("Ensure 'config.json' and 'model.safetensors' (or pytorch_model.bin) are inside.")

# --- 4. DETECTION LOGIC ---

WHITELIST = ["google.com", "vit.ac.in", "wikipedia.org", "amazon.com", "microsoft.com", "github.com", "amazon.in"]

def normalize_leet(text):
    """Convert obfuscated scam text (leet-speak) back to normal English."""
    leet_map = {'0':'o','1':'i','3':'e','4':'a','5':'s','7':'t','8':'b','9':'g','@':'a','$':'s','!':'i','|':'l'}
    return ''.join([leet_map.get(ch, ch) for ch in text])

def _run_model(model, tokenizer, input_string):
    """Helper to run transformer and return probability of Class 1 (Scam)."""
    inputs = tokenizer(input_string, return_tensors="pt", truncation=True, max_length=512).to(device)
    with torch.no_grad():
        outputs = model(**inputs)
        probs = torch.nn.functional.softmax(outputs.logits, dim=-1)
        # Assuming Index 1 is 'Scam'
        return probs[0][1].item()

def get_text_score(text):
    if not text.strip(): return 0.0
    lower_text = text.lower()
    # Heuristic for safe OTPs
    if (re.search(r'\b(verification code|otp|security code)\b', lower_text) and re.search(r'\b\d{4,8}\b', lower_text)):
        return 0.05
    
    original_score = _run_model(text_model, text_tokenizer, text)
    normalized_text = normalize_leet(text)
    return max(original_score, _run_model(text_model, text_tokenizer, normalized_text)) if normalized_text != text else original_score

def get_url_score(url):
    if any(domain in url.lower() for domain in WHITELIST):
        return 0.01 
    return _run_model(url_model, url_tokenizer, url)

# --- 5. API ENDPOINTS ---
@app.route('/predict', methods=['POST', 'OPTIONS'])
def predict():
    try:
        data = request.get_json() or {}
        email_body = data.get('text', '')
        url_input = data.get('url', '') or (data.get('urls')[0] if data.get('urls') else '')

        text_risk = get_text_score(email_body) if email_body else 0.0
        url_risk = get_url_score(url_input) if url_input else 0.0
        
        risk_score = max(text_risk, url_risk)
        is_scam = risk_score > 0.65 
        
        explanation = "🚨 Suspicious neural patterns detected." if is_scam else "✅ Analysis complete. Target appears safe."
        if is_scam:
            if url_risk > 0.65: explanation += " High-risk URL detected."
            if text_risk > 0.65: explanation += " Text semantics match scam payloads."

        return jsonify({"risk_score": float(risk_score), "is_scam": bool(is_scam), "explanation": explanation.strip()})
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e), "risk_score": 0.0, "is_scam": False}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "device": device})

if __name__ == '__main__':
    print("\n🚀 Backend is live at http://127.0.0.1:5000")
    app.run(debug=True, port=5000)