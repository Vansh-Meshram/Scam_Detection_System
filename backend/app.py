import os
import torch
from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import AutoTokenizer, AutoModelForSequenceClassification

# --- 1. INITIALIZATION ---
app = Flask(__name__)
CORS(app)  # Enables frontend-to-backend communication

# Determine if a GPU is available, otherwise default to CPU
device = "cuda" if torch.cuda.is_available() else "cpu"

# --- 2. CLEAN PATH CONFIGURATION (Fixes Windows Space Errors) ---
# Finds the exact folder where THIS app.py file is saved
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Normalizing paths to remove hidden characters or trailing spaces
TEXT_MODEL_PATH = os.path.normpath(os.path.join(BASE_DIR, "models", "textmodel"))
URL_MODEL_PATH = os.path.normpath(os.path.join(BASE_DIR, "models", "urlmodel"))

print(f"\n--- 🛰️ Scam Detection System Booting ---")
print(f"Running on: {device.upper()}")
print(f"Targeting Text Model: {TEXT_MODEL_PATH}")

# Safety check: Verify the folder exists before attempting to load
if not os.path.exists(TEXT_MODEL_PATH):
    print(f"❌ CRITICAL ERROR: Folder not found at {TEXT_MODEL_PATH}")
    print(f"Current Directory Contents: {os.listdir(BASE_DIR)}")
else:
    print(f"✅ Model folders located. Initializing AI...")

# --- 3. LOAD MODELS (Offline Mode) ---
try:
    # 'local_files_only=True' stops the Repo ID error by forcing local loading
    text_tokenizer = AutoTokenizer.from_pretrained(TEXT_MODEL_PATH, local_files_only=True)
    text_model = AutoModelForSequenceClassification.from_pretrained(TEXT_MODEL_PATH, local_files_only=True).to(device)
    
    url_tokenizer = AutoTokenizer.from_pretrained(URL_MODEL_PATH, local_files_only=True)
    url_model = AutoModelForSequenceClassification.from_pretrained(URL_MODEL_PATH, local_files_only=True).to(device)
    print("✅ All AI Engines Online!")
except Exception as e:
    print(f"❌ LOAD ERROR: {e}")

# --- 4. DETECTION LOGIC ---
# Whitelist bypasses the AI for known safe domains
WHITELIST = ["google.com", "vit.ac.in", "wikipedia.org", "amazon.com", "microsoft.com", "github.com"]

def get_text_score(text):
    if not text.strip(): return 0.0
    inputs = text_tokenizer(text, return_tensors="pt", truncation=True, max_length=512).to(device)
    with torch.no_grad():
        outputs = text_model(**inputs)
        probs = torch.nn.functional.softmax(outputs.logits, dim=-1)
        return probs[0][0].item()

def get_url_score(url):
    if any(domain in url.lower() for domain in WHITELIST):
        return 0.01 
    inputs = url_tokenizer(url, return_tensors="pt", truncation=True, max_length=128).to(device)
    with torch.no_grad():
        outputs = url_model(**inputs)
        probs = torch.nn.functional.softmax(outputs.logits, dim=-1)
        return probs[0][0].item()

# --- 5. API ENDPOINTS ---
@app.route('/predict', methods=['POST', 'OPTIONS'])
def predict():
    try:
        data = request.get_json()
        if not data: data = {}
        
        email_body = data.get('text', '')
        url_input = data.get('url', '')
        
        # Check if the UI sent 'urls' array (older format), take the first one or ignore
        if not url_input and data.get('urls'):
            url_input = data.get('urls')[0]

        # Run AI Analysis
        text_risk = get_text_score(email_body) if email_body else 0.0
        url_risk = get_url_score(url_input) if url_input else 0.0
        
        risk_score = max(text_risk, url_risk)
        is_scam = risk_score > 0.6
        
        explanation = ""
        if is_scam:
            explanation = "Suspicious neural patterns detected. "
            if url_risk > 0.6: explanation += "High-risk URL classification. "
            if text_risk > 0.6: explanation += "Text semantics match known scam payloads. "
        else:
            explanation = "Analysis complete. Trust signals established. Target appears safe."

        return jsonify({
            "risk_score": float(risk_score),
            "is_scam": bool(is_scam),
            "explanation": explanation.strip()
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e), "risk_score": 0.0, "is_scam": False, "explanation": "Error analyzing payload"}), 500

if __name__ == '__main__':
    print("\n🚀 Backend is live at http://127.0.0.1:5000")
    app.run(debug=True, port=5000)