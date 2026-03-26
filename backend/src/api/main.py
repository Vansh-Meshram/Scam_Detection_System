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
    description="Multi-modal Phishing & Scam Detection API (DeBERTa-v3 + URLNet + Co-Attention)",
)

# CORS middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://nextjs:3000",
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

    return PredictResponse(
        risk_score=result["risk_score"],
        is_scam=result["is_scam"],
        explanation=result["explanation"],
    )


@app.post("/feedback")
def submit_feedback(req: FeedbackRequest):
    store_feedback(req.text, req.url, req.predicted_score, req.user_label)
    return {"status": "Feedback stored successfully"}
