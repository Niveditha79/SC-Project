from fastapi import FastAPI, UploadFile, File, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
import pandas as pd
import io
import os
from dotenv import load_dotenv

# Import agents
from agents.data_agent import preprocess_data
from agents.model_agent import train_model
from agents.fairness_agent import compute_fairness_metrics, classify_risk
from agents.llm_agent import generate_bias_explanation, generate_mitigation_recommendations

load_dotenv(override=True)

app = FastAPI(title="BiasGuard API")

# Enable CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup frontend static and template serving
os.makedirs("static", exist_ok=True)
os.makedirs("templates", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

@app.get("/")
async def read_index(request: Request):
    return templates.TemplateResponse(request=request, name="index.html")

class LoginRequest(BaseModel):
    username: str
    password: str

@app.post("/api/login")
async def login(request: LoginRequest):
    # Mock login: Accepts any non-empty credentials
    if request.username and request.password:
        return {"success": True, "token": "mock-jwt-token-12345", "user": request.username}
    return {"success": False, "message": "Invalid credentials"}

@app.post("/api/upload")
async def upload_dataset(file: UploadFile = File(...)):
    contents = await file.read()
    df = pd.read_csv(io.BytesIO(contents))
    
    # Calculate dataset summary metrics
    rows = len(df)
    cols = len(df.columns)
    missing = int(df.isnull().sum().sum())
    
    # Simple heuristics for sensitive attributes and target
    sensitive_keywords = ["gender", "race", "age", "ethnicity", "sex"]
    detected_sensitive = [c for c in df.columns if any(k in c.lower() for k in sensitive_keywords)]
    
    binary_cols = [c for c in df.columns if len(df[c].dropna().unique()) == 2]
    suggested_target = binary_cols[0] if binary_cols else None

    # Get preview data (first 5 rows)
    preview_data = df.head(5).fillna("NaN").to_dict(orient="records")

    return {
        "filename": file.filename,
        "columns": df.columns.tolist(),
        "summary": {
            "rows": rows,
            "columns": cols,
            "missing_values": missing,
            "sensitive_attributes": detected_sensitive,
            "suggested_target": suggested_target
        },
        "preview": preview_data
    }

@app.post("/api/audit")
async def run_audit(
    file: UploadFile = File(...),
    target_col: str = Form(...),
    sensitive_col: str = Form(...),
    model_type: str = Form(...)
):
    try:
        # 1. Read file
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        # Validation
        if len(df[target_col].dropna().unique()) != 2:
            return {"error": f"Target column '{target_col}' is not binary. Please select a binary target."}

        # 2. Preprocess
        df_processed = preprocess_data(df, target_col=target_col)
        
        # 3. Model Training
        model, features, X_test, y_test, accuracy = train_model(
            df_processed, 
            target_col=target_col, 
            model_type=model_type
        )
        y_pred = model.predict(X_test)
        sensitive_features_test = X_test[sensitive_col]
        
        # 4. Fairness Metrics
        metrics = compute_fairness_metrics(y_test, y_pred, sensitive_features_test)
        risk_level = classify_risk(metrics)
        
        # 5. AI Explanations & Mitigation
        explanation = generate_bias_explanation(metrics, risk_level, target_col, sensitive_col)
        mitigation = generate_mitigation_recommendations(metrics, risk_level, target_col, sensitive_col)
        
        # Mock recommendation summary
        recommendation_summary = {
            "strategy": "Reweighing Training Samples",
            "confidence": 88,
            "expected_improvement": "14%"
        }
        
        # Format response
        return {
            "success": True,
            "accuracy": accuracy,
            "metrics": metrics,
            "risk_level": risk_level,
            "explanation": explanation,
            "mitigation": mitigation,
            "recommendation_summary": recommendation_summary
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
