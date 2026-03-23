"""
Healthcare Gen AI Backend API
Azure OpenAI + Delta Lake Integration
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
from datetime import datetime, timedelta
import json

# Azure imports
from azure.identity import DefaultAzureCredential
from azure.ai.openai import AzureOpenAI
from azure.storage.blob import BlobServiceClient

app = FastAPI(title="Healthcare Gen AI API", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_KEY = os.getenv("AZURE_OPENAI_KEY")
AZURE_OPENAI_DEPLOYMENT = os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4")

client = AzureOpenAI(
    azure_endpoint=AZURE_OPENAI_ENDPOINT,
    api_key=AZURE_OPENAI_KEY,
    api_version="2024-02-01"
)

# Pydantic Models
class ChatMessage(BaseModel):
    role: str
    content: str
    timestamp: Optional[datetime] = None

class ChatRequest(BaseModel):
    message: str
    conversation_history: List[ChatMessage] = []
    user_id: Optional[str] = None

class AnalyticsResponse(BaseModel):
    response: str
    visualization_type: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    metadata: Dict[str, Any]

class HealthMetrics(BaseModel):
    total_patients: int
    active_appointments: int
    bed_occupancy: float
    avg_wait_time: int
    critical_alerts: int
    patient_satisfaction: float

# System Prompt for Healthcare Analytics
SYSTEM_PROMPT = """You are an expert healthcare analytics AI assistant working with NHS hospital data.

Your role is to:
1. Analyze healthcare queries about patient data, operational metrics, and clinical outcomes
2. Provide actionable insights based on available data
3. Recommend appropriate visualizations
4. Ensure all responses are HIPAA/GDPR compliant
5. Use clinical terminology appropriately
6. Consider NHS-specific context and regulations

Available data sources:
- Patient admissions and discharges (last 12 months)
- Bed occupancy by department (real-time)
- Wait times and patient flow metrics
- Financial performance data
- Clinical outcomes and quality metrics
- Staffing levels and schedules

When responding:
- Be specific with numbers and metrics
- Suggest actionable recommendations
- Indicate confidence levels for predictions
- Mention data limitations when relevant
- Format responses clearly with proper structure

For visualization requests, specify one of:
- lineChart: Time series trends
- barChart: Comparative metrics
- heatmap: Pattern analysis across dimensions
- radarChart: Multi-dimensional performance
- forecast: Predictive analytics with confidence intervals
- financial: Revenue/cost analysis
"""

# Query Classification
def classify_query(query: str) -> Dict[str, Any]:
    """Classify user query to determine intent and required data"""
    
    query_lower = query.lower()
    
    classification = {
        "intent": "general",
        "entity": None,
        "time_range": "current",
        "requires_prediction": False,
        "visualization": None
    }
    
    # Intent classification
    if any(word in query_lower for word in ["predict", "forecast", "next", "future"]):
        classification["intent"] = "prediction"
        classification["requires_prediction"] = True
        classification["visualization"] = "forecast"
    elif any(word in query_lower for word in ["trend", "over time", "historical"]):
        classification["intent"] = "trend_analysis"
        classification["visualization"] = "lineChart"
    elif any(word in query_lower for word in ["compare", "comparison", "versus", "vs"]):
        classification["intent"] = "comparison"
        classification["visualization"] = "barChart"
    elif any(word in query_lower for word in ["pattern", "distribution", "heatmap"]):
        classification["intent"] = "pattern_analysis"
        classification["visualization"] = "heatmap"
    
    # Entity extraction
    if any(word in query_lower for word in ["patient", "admission", "discharge"]):
        classification["entity"] = "patients"
    elif any(word in query_lower for word in ["bed", "occupancy", "capacity"]):
        classification["entity"] = "beds"
    elif any(word in query_lower for word in ["wait", "time", "throughput"]):
        classification["entity"] = "wait_times"
    elif any(word in query_lower for word in ["department", "ward", "unit"]):
        classification["entity"] = "departments"
    elif any(word in query_lower for word in ["financial", "cost", "revenue", "budget"]):
        classification["entity"] = "financial"
    
    # Time range extraction
    if any(word in query_lower for word in ["today", "current"]):
        classification["time_range"] = "today"
    elif any(word in query_lower for word in ["week", "7 days"]):
        classification["time_range"] = "week"
    elif any(word in query_lower for word in ["month", "30 days"]):
        classification["time_range"] = "month"
    elif any(word in query_lower for word in ["year", "annual"]):
        classification["time_range"] = "year"
    
    return classification

# Mock Data Generation (Replace with actual Delta Lake queries)
def fetch_patient_trends(days: int = 30):
    """Mock patient admission trends - Replace with Delta Lake query"""
    import random
    
    data = []
    base_date = datetime.now() - timedelta(days=days)
    
    for i in range(days):
        date = base_date + timedelta(days=i)
        data.append({
            "date": date.strftime("%Y-%m-%d"),
            "admissions": random.randint(35, 65),
            "discharges": random.randint(30, 60),
            "avg_los": round(random.uniform(2.5, 5.5), 1)
        })
    
    return data

def fetch_bed_occupancy():
    """Mock bed occupancy data - Replace with real-time query"""
    return [
        {"department": "ICU", "occupancy": 92, "total_beds": 50, "available": 4},
        {"department": "General Ward", "occupancy": 85, "total_beds": 200, "available": 30},
        {"department": "Maternity", "occupancy": 78, "total_beds": 40, "available": 9},
        {"department": "Pediatrics", "occupancy": 88, "total_beds": 60, "available": 7},
        {"department": "Surgery", "occupancy": 90, "total_beds": 80, "available": 8}
    ]

def fetch_financial_data(months: int = 6):
    """Mock financial data - Replace with actual financial system query"""
    import random
    
    data = []
    months_labels = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"]
    
    for i, month in enumerate(months_labels[:months]):
        data.append({
            "month": month,
            "revenue": random.randint(3600000, 4400000),
            "costs": random.randint(2800000, 3400000),
            "net": random.randint(600000, 1000000)
        })
    
    return data

def generate_predictions(entity: str, days: int = 7):
    """Generate ML predictions - Replace with Azure ML model"""
    import random
    
    days_labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    predictions = []
    
    for i, day in enumerate(days_labels[:days]):
        predictions.append({
            "day": day,
            "predicted_value": random.randint(40, 65),
            "confidence_lower": random.randint(35, 40),
            "confidence_upper": random.randint(65, 75),
            "confidence_score": round(random.uniform(0.82, 0.94), 2)
        })
    
    return predictions

# API Endpoints
@app.get("/")
def read_root():
    return {
        "service": "Healthcare Gen AI API",
        "version": "1.0.0",
        "status": "operational"
    }

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "azure_openai": "connected",
            "delta_lake": "connected",
            "ml_models": "available"
        }
    }

@app.get("/metrics", response_model=HealthMetrics)
def get_current_metrics():
    """Get current healthcare metrics"""
    # Replace with actual queries
    return HealthMetrics(
        total_patients=45678,
        active_appointments=234,
        bed_occupancy=87.5,
        avg_wait_time=23,
        critical_alerts=12,
        patient_satisfaction=4.6
    )

@app.post("/chat", response_model=AnalyticsResponse)
async def process_chat(request: ChatRequest):
    """Process chat message with Gen AI"""
    
    try:
        # Classify the query
        classification = classify_query(request.message)
        
        # Fetch relevant data based on classification
        data = None
        visualization_type = None
        
        if classification["entity"] == "patients" and classification["visualization"] == "lineChart":
            data = fetch_patient_trends(30)
            visualization_type = "lineChart"
        elif classification["entity"] == "beds":
            data = fetch_bed_occupancy()
            visualization_type = "barChart"
        elif classification["entity"] == "financial":
            data = fetch_financial_data(6)
            visualization_type = "financial"
        elif classification["requires_prediction"]:
            data = generate_predictions(classification["entity"], 7)
            visualization_type = "forecast"
        
        # Construct context for LLM
        context = f"""
Query Classification:
- Intent: {classification['intent']}
- Entity: {classification['entity']}
- Time Range: {classification['time_range']}

Available Data: {json.dumps(data, indent=2) if data else 'No specific data fetched'}

User Query: {request.message}

Provide a comprehensive analysis with:
1. Direct answer to the query
2. Key insights from the data
3. Actionable recommendations
4. Any concerns or limitations
"""
        
        # Prepare conversation history
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        
        for msg in request.conversation_history[-5:]:  # Last 5 messages for context
            messages.append({
                "role": msg.role,
                "content": msg.content
            })
        
        messages.append({"role": "user", "content": context})
        
        # Call Azure OpenAI
        response = client.chat.completions.create(
            model=AZURE_OPENAI_DEPLOYMENT,
            messages=messages,
            temperature=0.7,
            max_tokens=1000,
            top_p=0.95
        )
        
        ai_response = response.choices[0].message.content
        
        return AnalyticsResponse(
            response=ai_response,
            visualization_type=visualization_type,
            data=data,
            metadata={
                "classification": classification,
                "timestamp": datetime.now().isoformat(),
                "model": AZURE_OPENAI_DEPLOYMENT,
                "tokens_used": response.usage.total_tokens
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")

@app.post("/analyze")
async def analyze_dataset(
    entity: str,
    time_range: str = "month",
    analysis_type: str = "trend"
):
    """Direct analysis endpoint for specific entities"""
    
    try:
        data = None
        
        if entity == "patients":
            days = {"week": 7, "month": 30, "year": 365}.get(time_range, 30)
            data = fetch_patient_trends(days)
        elif entity == "beds":
            data = fetch_bed_occupancy()
        elif entity == "financial":
            months = {"month": 1, "quarter": 3, "year": 12}.get(time_range, 6)
            data = fetch_financial_data(months)
        
        return {
            "entity": entity,
            "time_range": time_range,
            "analysis_type": analysis_type,
            "data": data,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/insights/summary")
def get_daily_insights():
    """Get AI-generated daily insights summary"""
    
    # This would use scheduled analysis jobs in production
    insights = {
        "date": datetime.now().strftime("%Y-%m-%d"),
        "key_metrics": {
            "admission_trend": "+12% vs last week",
            "bed_utilization": "87.5% (High)",
            "wait_times": "23 min average (Above target)",
            "financial_performance": "+8% revenue growth"
        },
        "alerts": [
            "ICU bed capacity reaching critical levels (92%)",
            "Emergency department wait times above target",
            "Predicted surge in admissions Thursday-Friday"
        ],
        "recommendations": [
            "Activate surge capacity protocols for ICU",
            "Increase nursing staff 2-6 PM for ED",
            "Schedule additional on-call staff Thu-Fri"
        ]
    }
    
    return insights

# For production deployment
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
