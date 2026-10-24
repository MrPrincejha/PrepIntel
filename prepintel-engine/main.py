from weighting import calculate_recency_weight, calculate_combined_weight, calculate_source_weight
from bayesian import compute_beta_binomial_posterior, calculate_effective_sample_size
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
from optimizer import knapsack_selection, apply_diversity_penalty, generate_weekly_buckets
from ocr import extract_text_from_images, refine_problem_description
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

def resolve_canonical_ids(company_slug: str, role_slug: str = None) -> tuple:
    if not sb: return None, None
    c_id, r_id = None, None
    try:
        c_res = sb.table("companies").select("id").eq("slug", company_slug.lower()).execute()
        if c_res.data: c_id = c_res.data[0]["id"]
        
        if role_slug:
            r_res = sb.table("roles").select("id").eq("slug", role_slug.lower()).execute()
            if r_res.data: r_id = r_res.data[0]["id"]
    except Exception as e:
        print(f"Error resolving IDs: {e}")
    return c_id, r_id

def fetch_raw_reports(company: str, role: str = None) -> List[Dict]:
    if not sb or not company: return []
    
    clean_c = company.lower().replace("-", " ").replace("+", " ").strip()
    first_word = clean_c.split()[0] if clean_c else clean_c
    
    reports = []
    seen_ids = set()
    
    try:
        # 1. Primary: Text match on company column (covers all scraped data: 1000+ reports)
        res_text = sb.table("raw_reports").select("*").ilike("company", f"%{first_word}%").execute()
        if res_text.data:
            for r in res_text.data:
                if r["id"] not in seen_ids:
                    seen_ids.add(r["id"])
                    reports.append(r)

        # 2. Secondary: Canonical UUID resolution for old seeded reports
        c_id, r_id = resolve_canonical_ids(company, role)
        if c_id:
            query = sb.table("raw_reports").select("*").eq("company_id", c_id)
            if r_id:
                query = query.eq("role_id", r_id)
            res_id = query.execute()
            if res_id.data:
                for r in res_id.data:
                    if r["id"] not in seen_ids:
                        seen_ids.add(r["id"])
                        reports.append(r)
                        
        # Filter by role if requested
        if role and role.lower() not in ["all", "any"]:
            clean_r = role.lower().replace("-", " ").replace("+", " ").strip()
            role_filtered = [r for r in reports if clean_r in str(r.get("role", "")).lower() or str(r.get("role", "")).lower() in clean_r]
            if role_filtered:
                reports = role_filtered
                
        return reports
    except Exception as e:
        print(f"Error fetching reports: {e}")
        return reports

TOPICS = {
    "hashing": ["hash", "map", "frequency", "duplicates", "membership", "unordered_map"],
    "prefix-sum": ["prefix sum", "range sum", "subarray sum", "difference array", "prefix xor"],
    "two-pointers": ["two pointers", "pair with target", "closest pair", "opposite direction"],
    "sliding-window": ["sliding window", "longest substring", "smallest subarray", "consecutive elements"],
    "binary-search": ["binary search", "log n", "lower_bound", "minimum possible", "maximum possible"],
    "intervals": ["intervals", "overlapping", "maximum activities", "interval scheduling"],
    "greedy": ["greedy", "locally optimal", "fractional knapsack", "job sequencing"],
    "heaps": ["priority queue", "min heap", "max heap", "top k", "kth largest"],
    "monotonic-stack": ["monotonic stack", "next greater", "previous smaller", "stock span", "largest rectangle"],
    "linked-list": ["linked list", "fast and slow", "detect cycle", "middle node"],
    "backtracking": ["backtracking", "permutations", "subsets", "combinations", "n-queens"],
    "bit-manipulation": ["bitmask", "xor", "bitwise"],
    "dynamic-programming": ["dp", "dynamic programming", "memoization", "tabulation", "knapsack", "lcs", "lis", "subset sum"],
    "game-theory": ["game theory", "nim", "sprague-grundy", "winning state"],
    "dfs-bfs": ["dfs", "depth first search", "bfs", "breadth first search", "connected components", "0-1 bfs"],
    "shortest-paths": ["dijkstra", "bellman-ford", "floyd-warshall", "shortest path"],
    "topological-sort": ["topological sort", "prerequisite", "course schedule", "dependency", "kahn"],
    "dsu": ["dsu", "union find", "disjoint set"],
    "mst": ["mst", "minimum spanning tree", "kruskal", "prim"],
    "trees": ["tree", "binary tree", "lca", "binary lifting", "tree diameter"],
    "segment-tree": ["segment tree", "fenwick", "sparse table", "range query"],
    "trie": ["trie", "prefix tree", "autocomplete"],
    "string-matching": ["kmp", "z algorithm", "rolling hash", "manacher", "palindrome"],
    "math": ["gcd", "lcm", "sieve", "prime factorization", "modular", "combinatorics"],
    "geometry": ["cross product", "polygon area", "convex hull"]
}

def analyze_topics_from_text(reports: List[Dict]) -> Dict[str, float]:
    scores = {k: 0 for k in TOPICS.keys()}
    total_matches = 0
    
    for r in reports:
        text = str(r.get("raw_text", "")).lower()
        for t_key, keywords in TOPICS.items():
            for kw in keywords:
                count = text.count(kw)
                scores[t_key] += count
                total_matches += count
                
    if total_matches == 0:
        # Fallback if no text matched
        return {"two-pointers": 0.3, "hashing": 0.3, "dfs-bfs": 0.4}
        
    # Normalize to probabilities
    return {k: v / total_matches for k, v in scores.items()}

@app.get("/api/v1/topics")
def get_topics(company: str, role: str = None, cycle: str = None):
    reports = fetch_raw_reports(company, role)
    if not reports:
        return []
        
    # Real Bayesian Aggregation
    # In a full pipeline, topics are extracted to report_topic_observations. 
    # Since we are live-aggregating for this MVP, we use the raw_text analyzer.
    topics_by_report = []
    for r in reports:
        # Simple extraction for now
        topics = []
        text = r.get("raw_text", "").lower()
        for t_slug, keywords in TOPICS.items():
            for kw in keywords:
                if kw in text:
                    topics.append(t_slug)
                    break
        
        # Calculate Weight
        # Handle created_at formatting
        try:
            r_date = datetime.fromisoformat(r.get("created_at", "").replace("Z", "+00:00"))
        except:
            r_date = datetime.now()
            
        w_r = calculate_recency_weight(r_date)
        w_s = calculate_source_weight(r.get("source_type", "user_submission"), {"user_submission": 1.0})
        # Default I_i to 1.0 since we haven't stored dedup clusters yet
        w_i = calculate_combined_weight(w_r, w_s, 1.0)
        
        topics_by_report.append({"topics": set(topics), "weight": w_i})
        
    # Aggregate
    all_possible_topics = TOPICS.keys()
    result = []
    
    # Effective sample size
    weights = [tr["weight"] for tr in topics_by_report]
    n_eff = calculate_effective_sample_size(weights)
    
    for t in all_possible_topics:
        successes = sum(tr["weight"] for tr in topics_by_report if t in tr["topics"])
        failures = sum(tr["weight"] for tr in topics_by_report if t not in tr["topics"])
        
        if successes > 0:
            post_mean, ci_low, ci_high = compute_beta_binomial_posterior(successes, failures)
            result.append({
                "topic": t, 
                "weighted_probability": round(post_mean, 2), 
                "n_eff": round(n_eff, 1),
                "trend_score": 0.0
            })
            
    # Sort and return top 5
    result = sorted(result, key=lambda x: x["weighted_probability"], reverse=True)[:5]
    return result

@app.get("/api/v1/difficulty")
def get_difficulty(company: str, role: str = None, cycle: str = None, round_type: str = Query("oa", alias="round")):
    reports = fetch_raw_reports(company, role)
    if not reports:
        return {"error": "Insufficient evidence"}
        
    import re
    easy_c, med_c, hard_c = 0, 0, 0
    for r in reports:
        raw_full_text = str(r.get("raw_text", ""))
        chunks = re.split(r'\n(?=#{1,4}\s*\d+\.\s|#{1,4}\s*(?:Q|Question|Problem)\s*\d+|(?:\*\*|)Question\s*\d+(?:\*\*|)\s*[:\-])', raw_full_text, flags=re.IGNORECASE)
        
        for i, chunk in enumerate(chunks):
            text = chunk.strip().lower()
            if len(text) < 40: continue
            
            if len(chunks) > 1 and i == 0:
                lines = [line.strip() for line in text.split('\n') if line.strip()]
                if lines and not re.match(r'^(?:#{1,4}\s*)?(?:\d+\.\s+|(?:Q|Question|Problem)\s*\d+\s*[:\-\.]?\s*|\*\*(?:Q|Question)\s*\d+\*\*\s*[:\-\.]?\s*)(.*)', lines[0], re.IGNORECASE):
                    continue
            
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

@app.get("/api/v1/trend")
def get_trend(company: str, role: str, topic: str = "all", months: int = 12):
    reports = fetch_raw_reports(company, role)
    if not reports:
        return {"monthly_data": [], "error": "Insufficient evidence"}
        
    topic_probs = analyze_topics_from_text(reports)
    top_topics = [t[0] for t in sorted(topic_probs.items(), key=lambda x: x[1], reverse=True)[:3]]
    if not top_topics:
        top_topics = ["hashing", "dynamic-programming", "greedy"]

    from datetime import datetime, timedelta
    now = datetime.now()
    
    # Bucket reports across the requested months
    monthly_counts = {}
    month_keys = []
    for i in range(months - 1, -1, -1):
        target_date = now - timedelta(days=i * 30)
        m_key = target_date.strftime("%b")
        if m_key not in monthly_counts:
            monthly_counts[m_key] = {t: 0 for t in top_topics}
            monthly_counts[m_key]["_total"] = 0
            month_keys.append(m_key)

    for r in reports:
        try:
            r_date = datetime.fromisoformat(str(r.get("created_at", "")).replace("Z", "+00:00"))
            m_key = r_date.strftime("%b")
        except:
            m_key = now.strftime("%b")
            
        text = str(r.get("raw_text", "")).lower()
        if m_key in monthly_counts:
            monthly_counts[m_key]["_total"] += 1
            for t in top_topics:
                if any(kw in text for kw in TOPICS.get(t, [])):
                    monthly_counts[m_key][t] += 1

    monthly_data = []
    for idx, m_key in enumerate(month_keys):
        data = monthly_counts[m_key]
        row = {"month": m_key}
        decay_factor = math.exp(-0.35 * (len(month_keys) - 1 - idx) / 12.0)
        for t in top_topics:
            base_prob = topic_probs.get(t, 0.2) * 100
            if data["_total"] > 0:
                obs_freq = (data[t] / data["_total"]) * 100
                score = round(0.6 * obs_freq + 0.4 * base_prob, 1)
            else:
                score = round(base_prob * (0.7 + 0.3 * decay_factor), 1)
            row[t] = max(10, min(95, score))
        monthly_data.append(row)

    return {"monthly_data": monthly_data, "topics": top_topics}

QUESTIONS_CACHE = {}

@app.get("/api/v1/questions")
def get_questions(company: str = "", role: str = "", cycle: str = "", limit: int = 50):
    cache_key = f"{company}_{role}_{cycle}_{limit}"
    now = time.time()
    if cache_key in QUESTIONS_CACHE and now - QUESTIONS_CACHE[cache_key]['time'] < 300: # 5 min cache
        return QUESTIONS_CACHE[cache_key]['data']

    reports = fetch_raw_reports(company, role)
    topic_probs = analyze_topics_from_text(reports) if reports else {}
    
    dynamic_questions = []
    
    question_idx = 0
    import re
    
    for r in reports:
        raw_full_text = str(r.get("raw_text", ""))
        if len(raw_full_text.strip()) < 20:
            continue
            
        chunks = re.split(r'\n(?=#{1,4}\s*\d+\.\s|#{1,4}\s*(?:Q|Question|Problem)\s*\d+|(?:\*\*|)Question\s*\d+(?:\*\*|)\s*[:\-])', raw_full_text, flags=re.IGNORECASE)
        
        for i, chunk in enumerate(chunks):
            text = chunk.strip()
            text_lower = text.lower()
            if len(text) < 40 or "write the complete problem statement" in text_lower or "[question title]" in text_lower:
                continue
                
            lines = [line.strip() for line in text.split('\n') if line.strip()]
            if not lines: continue
            
            first_line = lines[0]
            header_match = re.match(r'^(?:#{1,4}\s*)?(?:\d+\.\s+|(?:Q|Question|Problem)\s*\d+\s*[:\-\.]?\s*|\*\*(?:Q|Question)\s*\d+\*\*\s*[:\-\.]?\s*)(.*)', first_line, re.IGNORECASE)
            
            title = ""
            
            # 1. Numbered question header: e.g. "### 1. Two Sum"
            if header_match and len(header_match.group(1).strip()) > 3:
                raw_h = header_match.group(1).strip().replace("*", "").replace("#", "").strip()
                if not any(raw_h.lower().startswith(p) or p in raw_h.lower() for p in ["[question", "question title", "your solution"]):
                    title = raw_h

            # 2. Markdown heading: e.g. "# Absolute Difference" or "## Reverse Linked List"
            if not title:
                hash_match = re.match(r'^#{1,4}\s+(.+)', first_line)
                if hash_match:
                    h_cand = hash_match.group(1).strip().replace("*", "").replace("#", "").strip()
                    if 3 < len(h_cand) < 80 and not any(h_cand.lower().startswith(p) for p in ["company:", "round:", "role:", "year:", "note:", "question title", "[question", "eligibility"]):
                        title = h_cand
                
            # 3. Fallback scan body lines
            if not title:
                skip_prefixes = (
                    "prepintel", "overview", "questions", "roadmap", "reports", "bookmarks",
                    "progress", "analytics", "admin", "issues", "personalize", "search",
                    "company:", "role:", "year:", "round:", "note:", "input:", "output:",
                    "example", "explanation", "constraints:", "problem statement", "problem description",
                    "you are given", "consider the", "def ", "class ", "int ", "public ", "import ",
                    "eligibility", "criteria", "round 1", "round 2", "round 3", "this year"
                )
                for line in lines:
                    clean_line = line.strip().replace("#", "").replace("*", "").replace("-", "").strip()
                    clean_lower = clean_line.lower()
                    if len(clean_line) < 6 or clean_lower.startswith(skip_prefixes):
                        continue
                    if any(w in clean_lower for w in ["write the complete problem", "[question title]"]):
                        continue
                    if len(clean_line) > 8 and (company.lower() not in clean_lower or len(clean_line) > len(company) + 15):
                        title = clean_line[:60] + "..." if len(clean_line) > 60 else clean_line
                        break
                        
            if not title:
                title = f"Reported Question {question_idx+1}"
            
            q_tags = []
            text_lower = text.lower()
            for t_key, keywords in TOPICS.items():
                if any(kw in text_lower for kw in keywords):
                    q_tags.append(t_key)
                    
            if not q_tags:
                if topic_probs:
                    q_tags = [max(topic_probs.items(), key=lambda x: x[1])[0]]
                else:
                    q_tags = ["arrays"]
            
            l = len(text_lower)
            if "hard" in text_lower or l > 1200: diff = "Hard"
            elif "easy" in text_lower or l < 400: diff = "Easy"
            else: diff = "Medium"
            
            score = 50
            for tag in q_tags:
                if tag in topic_probs:
                    score += (topic_probs[tag] * 100)
                    
            dynamic_questions.append({
                "id": f"dyn_q{question_idx}",
                "title": title,
                "company": r.get("company", company),
                "raw_text": text,
                "tags": list(set(q_tags)),
                "difficulty": diff,
                "url": r.get("source_url") or f"/reports?company={company}&role={role}",
                "final_recommendation_score": min(99, int(score)),
                "topic_score": min(99, int(score)),
                "pattern_score": 75,
                "recency_score": 90,
                "difficulty_fit": 80,
                "direct_evidence_score": 95
            })
            question_idx += 1
            
    # Sort and filter distinct titles
    sorted_q = sorted(dynamic_questions, key=lambda x: x['final_recommendation_score'], reverse=True)
    seen_titles = set()
    unique_q = []
    for q in sorted_q:
        if q['title'] not in seen_titles:
            seen_titles.add(q['title'])
            unique_q.append(q)

    # Augment with canonical questions from database if fewer than 15 questions
    if sb and len(unique_q) < 15:
        first_word = company.lower().split()[0] if company else ""
        try:
            # 1. Company-matched questions in DB
            db_res = sb.table("questions").select("*").ilike("slug", f"%{first_word}%").limit(25).execute()
            for row in (db_res.data or []):
                t = row.get("canonical_title")
                if t and t not in seen_titles:
                    seen_titles.add(t)
                    unique_q.append({
                        "id": row.get("id"),
                        "title": t,
                        "company": company,
                        "raw_text": f"Canonical question frequently asked in {company} technical rounds.",
                        "tags": ["arrays", "problem-solving"],
                        "difficulty": row.get("difficulty_label", "Medium"),
                        "url": f"/questions/{row.get('id')}",
                        "final_recommendation_score": 88,
                        "topic_score": 85,
                        "pattern_score": 80,
                        "recency_score": 85,
                        "difficulty_fit": 80,
                        "direct_evidence_score": 90
                    })
                    if len(unique_q) >= limit:
                        break
                        
            # 2. General popular canonical questions if still under 10
            if len(unique_q) < 10:
                gen_res = sb.table("questions").select("*").limit(20).execute()
                for row in (gen_res.data or []):
                    t = row.get("canonical_title")
                    if t and t not in seen_titles:
                        seen_titles.add(t)
                        unique_q.append({
                            "id": row.get("id"),
                            "title": t,
                            "company": company,
                            "raw_text": f"Core interview problem recommended for {company}.",
                            "tags": ["two-pointers", "hashing"],
                            "difficulty": row.get("difficulty_label", "Medium"),
                            "url": f"/questions/{row.get('id')}",
                            "final_recommendation_score": 82,
                            "topic_score": 80,
                            "pattern_score": 75,
                            "recency_score": 80,
                            "difficulty_fit": 80,
                            "direct_evidence_score": 85
                        })
                        if len(unique_q) >= 15:
                            break
        except Exception as e:
            print(f"Error augmenting questions from DB: {e}")

    result = unique_q[:limit]
    QUESTIONS_CACHE[cache_key] = {'time': time.time(), 'data': result}
    return result

@app.post("/api/v1/prep-plan")
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

@app.post("/api/v1/ingest/screenshot")
async def ingest_screenshot(
    files: List[UploadFile] = File(...),
    company: str = Form(...),
    role: str = Form(...),
    round_name: str = Form(..., alias="round")
):
    try:
        contents_list = [(await f.read(), f.content_type) for f in files]
        extracted_text = extract_text_from_images(contents_list)
        refined_text = refine_problem_description(extracted_text)
        
        if sb:
            payload = {
                "company": company.capitalize(),
                "role": role,
                "round": round_name,
                "raw_text": refined_text,
                "status": "pending",
                "source": "user_screenshot_batch"
            }
            sb.table("raw_reports").insert(payload).execute()
        
        return {"status": "success", "extracted_text": refined_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class TextIngestRequest(BaseModel):
    company: str
    role: str
    round: str
    text: str
    url: Optional[str] = None
    user_id: Optional[str] = None

@app.post("/api/v1/ingest/text")
def ingest_text(req: TextIngestRequest):
    try:
        refined_text = refine_problem_description(req.text)
        
        if sb:
            c_id, r_id = resolve_canonical_ids(req.company, req.role)
            # If company doesn't exist, we should ideally create it or reject.
            # For now, if we can't resolve, we will store the raw name in metadata for manual mapping later.
            
            payload = {
                "company_id": c_id,
                "role_id": r_id,
                # "round_id" requires resolving too. We will just store the string in metadata if unresolved.
                "source_type": "user_submission",
                "source_url": req.url,
                "raw_text": refined_text,
                "submitted_by_user_id": req.user_id,
                "status": "pending",
                "metadata": {"raw_company": req.company, "raw_role": req.role, "raw_round": req.round}
            }
            sb.table("raw_reports").insert(payload).execute()
            
        return {"status": "success", "refined_text": refined_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PROGRESS_CACHE = {}
import time
import requests
from datetime import datetime, timezone
import datetime as dt_lib

@app.get("/api/v1/progress/unified")
def get_unified_progress(lc_handle: str = "", cf_handle: str = ""):
    cache_key = f"{lc_handle}_{cf_handle}"
    now = time.time()
    
    if cache_key in PROGRESS_CACHE and now - PROGRESS_CACHE[cache_key]['time'] < 3600:
        return PROGRESS_CACHE[cache_key]['data']
        
    unified_data = {
        "leetcode": {"accuracy": 0, "solved": 0},
        "codeforces": {"accuracy": 0, "solved": 0},
        "heatmap": [],
        "recent_activity": [],
        "overall_accuracy": 0,
        "combined_streak": 0,
        "max_streak": 0
    }
    
    daily_activity = {}
    recent_subs = []
    
    if lc_handle:
        try:
            lc_query = """
            query getUserProfile($username: String!) {
              matchedUser(username: $username) {
                submitStats {
                  acSubmissionNum { difficulty count submissions }
                }
                userCalendar {
                  submissionCalendar
                }
              }
              recentSubmissionList(username: $username, limit: 5) {
                title
                titleSlug
                timestamp
                statusDisplay
              }
            }
            """
            lc_res = requests.post("https://leetcode.com/graphql", json={
                "query": lc_query,
                "variables": {"username": lc_handle}
            }, headers={"Content-Type": "application/json"}, timeout=10)
            
            if lc_res.status_code == 200:
                lc_data = lc_res.json().get("data", {})
                matched = lc_data.get("matchedUser")
                if matched:
                    stats = matched.get("submitStats", {}).get("acSubmissionNum", [])
                    total_ac = sum(s.get("count", 0) for s in stats if s.get("difficulty") == "All")
                    total_sub = sum(s.get("submissions", 0) for s in stats if s.get("difficulty") == "All")
                    acc = round((total_ac / total_sub * 100) if total_sub > 0 else 0)
                    
                    unified_data["leetcode"]["accuracy"] = acc
                    unified_data["leetcode"]["solved"] = total_ac
                    
                    calendar_str = matched.get("userCalendar", {}).get("submissionCalendar", "{}")
                    import json
                    calendar = json.loads(calendar_str)
                    for ts_str, count in calendar.items():
                        ts = int(ts_str)
                        dt = datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%Y-%m-%d")
                        daily_activity[dt] = daily_activity.get(dt, 0) + count
                
                for sub in lc_data.get("recentSubmissionList", []):
                    recent_subs.append({
                        "platform": "LC",
                        "title": sub.get("title"),
                        "timestamp": int(sub.get("timestamp", 0)),
                        "status": sub.get("statusDisplay")
                    })
        except Exception as e:
            print("LC fetch error:", e)

    if cf_handle:
        try:
            cf_res = requests.get(f"https://codeforces.com/api/user.status?handle={cf_handle}", timeout=10)
            if cf_res.status_code == 200:
                subs = cf_res.json().get("result", [])
                
                total_subs = len(subs)
                ac_subs = sum(1 for s in subs if s.get("verdict") == "OK")
                acc = round((ac_subs / total_subs * 100) if total_subs > 0 else 0)
                
                unique_solved = len(set(s.get("problem", {}).get("name") for s in subs if s.get("verdict") == "OK"))
                
                unified_data["codeforces"]["accuracy"] = acc
                unified_data["codeforces"]["solved"] = unique_solved
                
                for s in subs:
                    ts = s.get("creationTimeSeconds", 0)
                    dt = datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%Y-%m-%d")
                    daily_activity[dt] = daily_activity.get(dt, 0) + 1
                    
                for s in subs[:5]:
                    recent_subs.append({
                        "platform": "CF",
                        "title": s.get("problem", {}).get("name", "Unknown"),
                        "timestamp": s.get("creationTimeSeconds", 0),
                        "status": "Accepted" if s.get("verdict") == "OK" else "Attempted"
                    })
        except Exception as e:
            print("CF fetch error:", e)
            
    recent_subs.sort(key=lambda x: x["timestamp"], reverse=True)
    unified_data["recent_activity"] = recent_subs[:5]
            
    lc_solved = unified_data["leetcode"]["solved"]
    cf_solved = unified_data["codeforces"]["solved"]
    total_solved = lc_solved + cf_solved
    
    if total_solved > 0:
        overall_acc = (unified_data["leetcode"]["accuracy"] * lc_solved + unified_data["codeforces"]["accuracy"] * cf_solved) / total_solved
        unified_data["overall_accuracy"] = round(overall_acc)
    
    sorted_dates = sorted(daily_activity.keys())
    today = dt_lib.datetime.now(dt_lib.timezone.utc).date()
    
    heatmap = []
    # 60 days
    for i in range(59, -1, -1):
        d = today - dt_lib.timedelta(days=i)
        d_str = d.strftime("%Y-%m-%d")
        heatmap.append({
            "date": d_str,
            "count": daily_activity.get(d_str, 0)
        })
    unified_data["heatmap"] = heatmap
    
    current_streak = 0
    max_streak = 0
    temp_streak = 0
    last_date = None
    
    for date_str in sorted_dates:
        d = dt_lib.datetime.strptime(date_str, "%Y-%m-%d").date()
        if last_date is None:
            temp_streak = 1
        else:
            diff = (d - last_date).days
            if diff == 1:
                temp_streak += 1
            elif diff > 1:
                temp_streak = 1
        
        if temp_streak > max_streak:
            max_streak = temp_streak
            
        last_date = d
        
    if last_date:
        diff_today = (today - last_date).days
        if diff_today <= 1:
            current_streak = temp_streak
            
    unified_data["combined_streak"] = current_streak
    unified_data["max_streak"] = max_streak
    
    PROGRESS_CACHE[cache_key] = {'time': now, 'data': unified_data}
    return unified_data
