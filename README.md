# Multi Model Adversarially Robust Self-Learning AI System for Scam Detection

This project detects phishing and scam messages across emails, SMS, and URLs using a multimodal, adversarially robust, and self-learning AI architecture.

## Getting Started

### 1. Prerequisites
- Python 3.9+ installed
- Docker and Docker Compose (if deploying via containers)

### 2. Setup
1. Clone the repository and navigate into it.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   python -m spacy download en_core_web_sm
   ```
3. Place your dataset CSV files inside the `data/` directory:
   - `emails.csv` (requires columns `text` and `label`)
   - `sms.csv` (requires columns `text` and `label`)
   - `urls.csv` (requires columns `url` and `label`)

### 3. Training
To train the model from scratch with adversarial training:
```bash
python -m src.training.train
```
Add `--no-adv` if you wish to disable adversarial training during quick testing.

### 4. Running the Application
**Option A: Locally using Python**
1. Run the FastAPI backend:
   ```bash
   uvicorn src.api.main:app --host 0.0.0.0 --port 8000
   ```
2. Run the Streamlit frontend in a different terminal:
   ```bash
   streamlit run src.frontend.app
   ```

**Option B: Using Docker Compose**
Run the following command in the project root:
```bash
docker-compose up --build
```
Access the frontend UI at `http://localhost:8501`.

### 5. Self-Learning
A feedback database `feedback.db` is maintained. You can periodically retrain the model with collected user feedback by running:
```bash
python -m src.self_learning.retrain
```
