from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
from optimizer import knapsack_selection, apply_diversity_penalty, generate_weekly_buckets
from ocr import extract_text_from_images
import os
from supabase import create_client

app = FastAPI(title="PrepIntel Engine API")

class PrepPlanRequest(BaseModel):
    company: str
    role: str
    cycle: str
    hours: int
    skill_profile: Optional[Dict[str, str]] = None

@app.post("/api/prep-plan")
def generate_prep_plan(req: PrepPlanRequest):
    # Fetch questions (re-using the mock logic we have, pretending we fetch all)
    all_q = get_questions(req.company, req.role, req.cycle, limit=100)
    
    # 1. Apply Personalization if skill_profile provided
    if req.skill_profile:
        for q in all_q:
            max_mult = 1.0
            for tag in q['tags']:
                level = req.skill_profile.get(tag, "Medium")
                mult = 1.5 if level == "Weak" else 0.6 if level == "Strong" else 1.0
                if mult > max_mult:
                    max_mult = mult
            q['final_recommendation_score'] = int(q['final_recommendation_score'] * max_mult)
            
    # 2. Knapsack Selection (req.hours * 60 minutes)
    max_minutes = req.hours * 60
    selected = knapsack_selection(all_q, max_minutes)
    
    # 3. Apply Diversity Penalty / Greedy Rerank
    diverse_selection = apply_diversity_penalty(selected)
    
    # 4. Generate Weekly Buckets (assuming 5 hours a week)
    buckets = generate_weekly_buckets(diverse_selection, minutes_per_week=300)
    
    return {"plan": buckets}

# Mock data store for the REST endpoints since we aren't hooking up Postgres yet
@app.get("/api/topics")
def get_topics(company: str, role: str, cycle: str):
    return [
        {"topic": "arrays", "weighted_probability": 0.42, "trend_score": 0.05},
        {"topic": "1d-dp", "weighted_probability": 0.28, "trend_score": 0.12},
        {"topic": "greedy", "weighted_probability": 0.15, "trend_score": -0.03}
    ]

@app.get("/api/questions")
def get_questions(company: str, role: str, cycle: str, limit: int = 50):
    return [
        {
            "id": "q1",
            "title": "Longest Increasing Subsequence", 
            "final_recommendation_score": 95, 
            "tags": ["1d-dp", "binary-search"],
            "difficulty": "Hard",
            "url": "https://leetcode.com/problems/longest-increasing-subsequence/",
            "topic_score": 85,
            "pattern_score": 60,
            "recency_score": 90,
            "difficulty_fit": 75,
            "direct_evidence_score": 100
        },
        {
            "id": "q2",
            "title": "Merge Intervals", 
            "final_recommendation_score": 92, 
            "tags": ["arrays", "sorting"],
            "difficulty": "Medium",
            "url": "https://leetcode.com/problems/merge-intervals/",
            "topic_score": 95,
            "pattern_score": 80,
            "recency_score": 60,
            "difficulty_fit": 85,
            "direct_evidence_score": 80
        },
        {
            "id": "q3",
            "title": "Two Sum", 
            "final_recommendation_score": 72, 
            "tags": ["arrays", "hashing"],
            "difficulty": "Easy",
            "url": "https://leetcode.com/problems/two-sum/",
            "topic_score": 90,
            "pattern_score": 50,
            "recency_score": 40,
            "difficulty_fit": 55,
            "direct_evidence_score": 30
        },
        {
            "id": "q4",
            "title": "Course Schedule", 
            "final_recommendation_score": 88, 
            "tags": ["graphs"],
            "difficulty": "Medium",
            "url": "https://leetcode.com/problems/course-schedule/",
            "topic_score": 80,
            "pattern_score": 75,
            "recency_score": 80,
            "difficulty_fit": 80,
            "direct_evidence_score": 90
        }
    ][:limit]

@app.get("/api/difficulty")
def get_difficulty(company: str, role: str, round: str, cycle: str):
    return {
        "easy_pct": 20,
        "medium_pct": 60,
        "hard_pct": 20
    }

@app.get("/api/trend")
def get_trend(company: str, role: str, topic: str, months: int = 12):
    return {
        "monthly_data": [
            {"month": "Jan", "probability": 0.3},
            {"month": "Feb", "probability": 0.35},
            {"month": "Mar", "probability": 0.42}
        ]
    }

@app.post("/api/ingest/screenshot")
async def ingest_screenshot(
    files: List[UploadFile] = File(...),
    company: str = Form(...),
    role: str = Form(...),
    round: str = Form(...)
):
    try:
        # Pass list of (bytes, content_type) tuples
        contents_list = [(await f.read(), f.content_type) for f in files]
        
        extracted_text = extract_text_from_images(contents_list)
        
        url = os.environ.get("SUPABASE_URL")
        key = os.environ.get("SUPABASE_KEY")
        if url and key:
            sb = create_client(url, key)
            payload = {
                "company": company.capitalize(),
                "role": role,
                "round": round,
                "raw_text": extracted_text,
                "status": "pending",
                "source": "user_screenshot_batch"
            }
            sb.table("raw_reports").insert(payload).execute()
        
        return {"status": "success", "extracted_text": extracted_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
