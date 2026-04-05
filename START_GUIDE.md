# How to Run the ScamGuard Detection System

To get both the frontend and backend running locally, you will need two separate terminal windows.

## 1. Start the Python Backend
The backend runs the DistilBERT neural models and exposes them via a Flask API on port 5000.

Open your first terminal and run:
```bash
# Navigate to the backend directory
cd backend

# Start the python application
python app.py
```
*You should see a message saying:* `🚀 Backend is live at http://127.0.0.1:5000`

---

## 2. Start the Next.js Frontend
The frontend provides the Cyberpunk dashboard UI and connects to the running backend.

Open a **second, new terminal** and run:
```bash
# Navigate to the frontend directory
cd frontend

# Start the development server
npm run dev
```
*You should see a message saying it's ready on* `http://localhost:3001`. You can then open that URL in your browser.

> **Note on Errors:** If you see any errors like `Error: Can't resolve 'tailwindcss'` when starting the frontend, it means your `node_modules` might be out of sync. You can fix it quickly by running `npm install` inside the `frontend` folder before running `npm run dev`.
