from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
from optimizer import knapsack_selection, apply_diversity_penalty, generate_weekly_buckets
from ocr import extract_text_from_images
import os
from dotenv import load_dotenv
from supabase import create_client
import math
import random

load_dotenv()

app = FastAPI(title="PrepIntel Engine API")

# Setup Supabase Client globally
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_KEY")
sb = create_client(supabase_url, supabase_key) if supabase_url and supabase_key else None

class PrepPlanRequest(BaseModel):
    company: str
    role: str
    cycle: str
    hours: int
    skill_profile: Optional[Dict[str, str]] = None

def fetch_raw_reports(company: str, role: str) -> List[Dict]:
    if not sb: return []
    # Fetch reports matching company (case insensitive via ilike)
    res = sb.table("raw_reports").select("*").ilike("company", f"%{company}%").execute()
    return res.data if res.data else []

def analyze_topics_from_text(reports: List[Dict]) -> Dict[str, float]:
    topics = {
        "arrays": ["array", "list", "vector", "matrix", "subarray"],
        "1d-dp": ["dp", "dynamic programming", "memoization", "subsequence", "tabulation"],
        "greedy": ["greedy", "interval", "scheduling", "maximum", "minimum"],
        "graphs": ["graph", "tree", "dfs", "bfs", "node", "edge", "traversal"],
        "hashing": ["hash", "map", "dictionary", "set", "frequency"],
        "binary-search": ["binary search", "log n", "sorted array", "mid"]
    }
    
    scores = {k: 0 for k in topics.keys()}
    total_matches = 0
    
    for r in reports:
        text = str(r.get("raw_text", "")).lower()
        for t_key, keywords in topics.items():
            for kw in keywords:
                count = text.count(kw)
                scores[t_key] += count
                total_matches += count
                
    if total_matches == 0:
        # Fallback if no text matched
        return {"arrays": 0.3, "hashing": 0.3, "graphs": 0.4}
        
    # Normalize to probabilities
    return {k: v / total_matches for k, v in scores.items()}

@app.get("/api/topics")
def get_topics(company: str, role: str, cycle: str):
    reports = fetch_raw_reports(company, role)
    if not reports:
        return [
            {"topic": "arrays", "weighted_probability": 0.33, "trend_score": 0.0},
            {"topic": "hashing", "weighted_probability": 0.33, "trend_score": 0.0},
            {"topic": "graphs", "weighted_probability": 0.34, "trend_score": 0.0}
        ]
        
    topic_probs = analyze_topics_from_text(reports)
    
    # Sort and return top 5
    sorted_topics = sorted(topic_probs.items(), key=lambda x: x[1], reverse=True)[:5]
    
    # Generate a deterministic trend score based on company name hash
    seed = sum(ord(c) for c in company)
    random.seed(seed)
    
    result = []
    for t, p in sorted_topics:
        if p > 0:
            trend = random.uniform(-0.15, 0.25)
            result.append({"topic": t, "weighted_probability": p, "trend_score": round(trend, 2)})
            
    return result

@app.get("/api/difficulty")
def get_difficulty(company: str, role: str, round_name: str, cycle: str):
    reports = fetch_raw_reports(company, role)
    if not reports:
        return {"easy_pct": 33, "medium_pct": 34, "hard_pct": 33}
        
    easy_c, med_c, hard_c = 0, 0, 0
    for r in reports:
        text = str(r.get("raw_text", "")).lower()
        l = len(text)
        if "hard" in text or l > 1200:
            hard_c += 1
        elif "easy" in text or l < 400:
            easy_c += 1
        else:
            med_c += 1
            
    total = easy_c + med_c + hard_c
    if total == 0:
        return {"easy_pct": 33, "medium_pct": 34, "hard_pct": 33}
        
    return {
        "easy_pct": int(easy_c / total * 100),
        "medium_pct": int(med_c / total * 100),
        "hard_pct": int(hard_c / total * 100)
    }

@app.get("/api/trend")
def get_trend(company: str, role: str, topic: str, months: int = 12):
    # Deterministic dynamic trend based on company
    seed = sum(ord(c) for c in company) + (1 if topic == 'all' else 0)
    random.seed(seed)
    
    months_labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    data = []
    current_prob = random.uniform(0.2, 0.5)
    
    for i in range(12):
        data.append({"month": months_labels[i], "probability": round(current_prob, 2)})
        # Random walk
        current_prob += random.uniform(-0.05, 0.08)
        current_prob = max(0.1, min(0.9, current_prob))
        
    return {"monthly_data": data}

@app.get("/api/questions")
def get_questions(company: str, role: str, cycle: str, limit: int = 50):
    reports = fetch_raw_reports(company, role)
    topic_probs = analyze_topics_from_text(reports) if reports else {}
    
    dynamic_questions = []
    
    for idx, r in enumerate(reports):
        text = str(r.get("raw_text", ""))
        if len(text.strip()) < 20:
            continue
            
        lines = [line.strip() for line in text.strip().split('\n') if line.strip()]
        title = lines[0][:60] + "..." if len(lines[0]) > 60 else lines[0]
        if not title:
            title = f"Reported Question {idx+1}"
            
        q_tags = []
        text_lower = text.lower()
        if "array" in text_lower or "list" in text_lower: q_tags.append("arrays")
        if "dp" in text_lower or "dynamic programming" in text_lower: q_tags.append("1d-dp")
        if "graph" in text_lower or "tree" in text_lower: q_tags.append("graphs")
        if "greedy" in text_lower: q_tags.append("greedy")
        if "hash" in text_lower or "map" in text_lower: q_tags.append("hashing")
        if "binary search" in text_lower or "mid" in text_lower: q_tags.append("binary-search")
        if not q_tags: q_tags = ["arrays"]
        
        l = len(text_lower)
        if "hard" in text_lower or l > 1200: diff = "Hard"
        elif "easy" in text_lower or l < 400: diff = "Easy"
        else: diff = "Medium"
        
        score = 50
        for tag in q_tags:
            if tag in topic_probs:
                score += (topic_probs[tag] * 100)
                
        dynamic_questions.append({
            "id": f"dyn_q{idx}",
            "title": title,
            "tags": list(set(q_tags)),
            "difficulty": diff,
            "url": f"/reports?company={company}&role={role}",
            "final_recommendation_score": min(99, int(score)),
            "topic_score": min(99, int(score)),
            "pattern_score": 70,
            "recency_score": 90,
            "difficulty_fit": 80,
            "direct_evidence_score": 100
        })
        
    if not dynamic_questions:
        base_questions = [
            {"id": "q1", "title": "Longest Increasing Subsequence", "tags": ["1d-dp", "binary-search"], "difficulty": "Hard", "url": "https://leetcode.com/problems/longest-increasing-subsequence/"},
            {"id": "q2", "title": "Merge Intervals", "tags": ["arrays", "sorting"], "difficulty": "Medium", "url": "https://leetcode.com/problems/merge-intervals/"},
            {"id": "q3", "title": "Two Sum", "tags": ["arrays", "hashing"], "difficulty": "Easy", "url": "https://leetcode.com/problems/two-sum/"},
            {"id": "q4", "title": "Course Schedule", "tags": ["graphs", "dfs"], "difficulty": "Medium", "url": "https://leetcode.com/problems/course-schedule/"},
            {"id": "q5", "title": "Meeting Rooms II", "tags": ["greedy", "arrays"], "difficulty": "Medium", "url": "https://leetcode.com/problems/meeting-rooms-ii/"},
            {"id": "q6", "title": "Number of Islands", "tags": ["graphs", "bfs"], "difficulty": "Medium", "url": "https://leetcode.com/problems/number-of-islands/"},
        ]
        dynamic_questions = base_questions
        for q in dynamic_questions:
            score = 50
            for tag in q['tags']:
                if tag in topic_probs: score += (topic_probs[tag] * 100)
            q['final_recommendation_score'] = min(99, int(score))
            q['topic_score'] = min(99, int(score))
            q['pattern_score'] = 70
            q['recency_score'] = 80
            q['difficulty_fit'] = 80
            q['direct_evidence_score'] = 90
            
    sorted_q = sorted(dynamic_questions, key=lambda x: x['final_recommendation_score'], reverse=True)
    
    # Ensure distinct titles to prevent clutter
    seen_titles = set()
    unique_q = []
    for q in sorted_q:
        if q['title'] not in seen_titles:
            seen_titles.add(q['title'])
            unique_q.append(q)
            
    return unique_q[:limit]

@app.post("/api/prep-plan")
def generate_prep_plan(req: PrepPlanRequest):
    all_q = get_questions(req.company, req.role, req.cycle, limit=100)
    if req.skill_profile:
        for q in all_q:
            max_mult = 1.0
            for tag in q['tags']:
                level = req.skill_profile.get(tag, "Medium")
                mult = 1.5 if level == "Weak" else 0.6 if level == "Strong" else 1.0
                if mult > max_mult: max_mult = mult
            q['final_recommendation_score'] = int(q['final_recommendation_score'] * max_mult)
            
    max_minutes = req.hours * 60
    selected = knapsack_selection(all_q, max_minutes)
    diverse_selection = apply_diversity_penalty(selected)
    buckets = generate_weekly_buckets(diverse_selection, minutes_per_week=300)
    return {"plan": buckets}

@app.post("/api/ingest/screenshot")
async def ingest_screenshot(
    files: List[UploadFile] = File(...),
    company: str = Form(...),
    role: str = Form(...),
    round_name: str = Form(..., alias="round")
):
    try:
        contents_list = [(await f.read(), f.content_type) for f in files]
        extracted_text = extract_text_from_images(contents_list)
        
        if sb:
            payload = {
                "company": company.capitalize(),
                "role": role,
                "round": round_name,
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
