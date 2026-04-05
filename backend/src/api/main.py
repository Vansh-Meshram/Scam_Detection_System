"""
Scam Detection API — FastAPI application.
Endpoints: /predict, /feedback, /health
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from src.api.dependencies import (
    load_model_artifacts,
    get_model,
    get_tokenizer,
    get_url_tokenizer,
    get_url_featurizer,
    get_device,
)
from src.self_learning.feedback_store import store_feedback

app = FastAPI(
    title="Scam Detection API",
    description="Multi-modal Phishing & Scam Detection API (DistilBERT + URLNet + Co-Attention)",
)

# CORS middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://nextjs:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://nextjs:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    load_model_artifacts()


# ── Request / Response schemas (UNCHANGED) ───────────────────

class PredictRequest(BaseModel):
    text: Optional[str] = ""
    url: Optional[str] = ""


class PredictResponse(BaseModel):
    risk_score: float
    is_scam: bool
    explanation: str


class FeedbackRequest(BaseModel):
    text: Optional[str] = ""
    url: Optional[str] = ""
    predicted_score: float
    user_label: int


# ── Endpoints ────────────────────────────────────────────────

@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    if not req.text and not req.url:
        raise HTTPException(status_code=400, detail="Must provide text or url")

    model = get_model()
    tokenizer = get_tokenizer()
    url_tokenizer = get_url_tokenizer()
    url_featurizer = get_url_featurizer()
    device = get_device()

    result = model.predict(
        text=req.text,
        url=req.url,
        tokenizer=tokenizer,
        url_tokenizer=url_tokenizer,
        url_featurizer=url_featurizer,
        device=device,
    )

    # ════════════════════════════════════════════════════════════
    #  Integrate Sklearn URL Model Ensembling
    # ════════════════════════════════════════════════════════════
    from src.api.dependencies import get_sklearn_url_model, get_sklearn_vectorizer
    url_model_sklearn = get_sklearn_url_model()
    url_vec = get_sklearn_vectorizer()

    if req.url and url_model_sklearn and url_vec:
        try:
            # Strip http://, https://, and www. to match the SkLearn model's training data features.
            import re
            cleaned_url = re.sub(r"^https?://", "", req.url)
            cleaned_url = re.sub(r"^www\.", "", cleaned_url)

            # Vectorize the cleaned URL and predict class probability.
            transformed = url_vec.transform([cleaned_url])
            probs = url_model_sklearn.predict_proba(transformed)[0]
            
            # class 1 is typically phishing
            sklearn_score = float(probs[1])
            
            # Ensemble: Calculate a weighted average (e.g. 50% Sklearn, 50% Neural)
            current_score = result["risk_score"]
            new_score = (current_score * 0.5) + (sklearn_score * 0.5)
            
            # Additional heuristic: If sklearn score is extremely high / low, trust it more.
            if sklearn_score > 0.85:
                 new_score = (current_score * 0.3) + (sklearn_score * 0.7)
            elif sklearn_score < 0.15:
                 new_score = (current_score * 0.3) + (sklearn_score * 0.7)
                 
            result["risk_score"] = round(min(0.99, max(0.01, new_score)), 4)
            result["is_scam"] = result["risk_score"] > 0.65
            
            # Append to explanation
            sk_expl = f"SkLearn LogReg Analysis -> Risk: {sklearn_score:.2%}."
            result["explanation"] += " " + sk_expl

        except Exception as e:
            pass # ignore errors and fallback to original score

    return PredictResponse(
        risk_score=result["risk_score"],
        is_scam=result["is_scam"],
        explanation=result["explanation"],
    )


@app.post("/feedback")
def submit_feedback(req: FeedbackRequest):
    store_feedback(req.text, req.url, req.predicted_score, req.user_label)
    return {"status": "Feedback stored successfully"}
