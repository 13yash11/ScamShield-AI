# ScamShield AI - Backend Integration Guide for FastAPI & Gemini

This guide provides the exact schemas, API endpoints, and configuration needed to connect your Python FastAPI backend to this React frontend.

---

## 1. Quick Frontend Setup (For Backend Developer)

To run this frontend locally alongside your FastAPI server:

```bash
# 1. Install dependencies
npm install

# 2. Configure API endpoint in .env
# Create a .env file with:
VITE_API_BASE_URL=http://localhost:8000/api/v1

# 3. Start frontend dev server
npm run dev
# Running at http://localhost:5173
```

---

## 2. FastAPI CORS Configuration (Required)

In your `main.py`, make sure to enable CORS for the Vite development server (`http://localhost:5173`):

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="ScamShield AI Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 3. Endpoints & Pydantic Data Models

The frontend expects endpoints under the `/api/v1` prefix.

### A. Text Scanner (`POST /api/v1/scan/text`)
**Request Body**:
```json
{
  "text": "URGENT: Your bank account has been suspended. Click here to verify: https://bit.ly/bank-sec"
}
```

**FastAPI Pydantic Model**:
```python
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import uuid

class TextScanRequest(BaseModel):
    text: str = Field(..., min_length=10)

class ScanResult(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    scanType: str  # "text" | "screenshot" | "url"
    target: str
    riskLevel: str  # "LOW" | "MEDIUM" | "HIGH"
    riskScore: int  # 0 to 100
    summary: str
    warningSigns: List[str]
    suspiciousPhrases: Optional[List[str]] = []
    explanation: str
    recommendations: List[str]
    detectionMethod: str
    limitations: str
    createdAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
```

**Sample Response**:
```json
{
  "id": "scan_8f3a92",
  "scanType": "text",
  "target": "URGENT: Your bank account has been suspended. Click here to verify...",
  "riskLevel": "HIGH",
  "riskScore": 92,
  "summary": "High-confidence banking credential phishing attempt using artificial urgency.",
  "warningSigns": [
    "Artificial urgency demanding immediate action",
    "Impersonation of banking institution without verifiable security context",
    "Shortened or unverified hyperlink masking target destination"
  ],
  "suspiciousPhrases": [
    "URGENT: Your bank account has been suspended",
    "Click here to verify"
  ],
  "explanation": "Legitimate banking institutions do not suspend accounts via unsolicited SMS/chat messages requiring credential verification through unverified web links.",
  "recommendations": [
    "Do not click the embedded link or disclose passwords/OTPs.",
    "Report and block the sender number.",
    "Log into your bank account only through the official banking app or URL."
  ],
  "detectionMethod": "Heuristic phrase parsing and Gemini AI threat categorization.",
  "limitations": "Analysis based on message content and known phishing patterns. Always verify through official channels.",
  "createdAt": "2026-10-31T12:00:00Z"
}
```

---

### B. Screenshot Scanner (`POST /api/v1/scan/file`)
**Request**: `multipart/form-data` with form field `file` (PNG, JPEG, WEBP).

**FastAPI Implementation Outline**:
```python
from fastapi import UploadFile, File

@app.post("/api/v1/scan/file", response_model=ScanResult)
async def scan_file(file: UploadFile = File(...)):
    contents = await file.read()
    # 1. Pass image bytes to Google Gemini API (gemini-1.5-flash / gemini-2.0)
    # 2. Extract text and evaluate threat indicators
    # 3. Return matching ScanResult schema
```

---

### C. URL Scanner (`POST /api/v1/scan/url`)
**Request Body**:
```json
{
  "url": "https://secure-login-account-verify.example-bank.biz"
}
```

---

### D. Authentication Endpoints (Optional / Supabase Compatible)
If implementing authentication through FastAPI rather than Supabase directly:
- `POST /api/v1/auth/signup`: Accepts `{ fullName, email, phoneNumber, password }`, returns `{ success: true, user: { id, fullName, email, phoneNumber, role: "user" } }`
- `POST /api/v1/auth/login`: Accepts `{ identifier, password }`, returns `{ success: true, token: "JWT...", user: { ... } }`
- `GET /api/v1/auth/me`: Validates `Authorization: Bearer <token>` header and returns `{ user: { ... } }`
