import os
import re
import time
import logging
from typing import List, Dict, Optional
import requests
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), 'prepintel', '.env.local'))
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json"
}

def init_supabase() -> Optional[Client]:
    url = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY") or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    if not url or not key:
        logger.warning("SUPABASE_URL or SUPABASE_KEY missing. Running in dry-run mode.")
        return None
    return create_client(url, key)

def slugify(text: str) -> str:
    s = re.sub(r'[^\w\s-]', '', text.lower()).strip()
    return re.sub(r'[-\s]+', '-', s)[:80]

def run(limit: int = 150):
    supabase = init_supabase()
    existing_slugs = set()
    
    if supabase:
        try:
            q_res = supabase.table("questions").select("slug").execute()
            existing_slugs = {row["slug"] for row in q_res.data if row.get("slug")}
        except Exception as e:
            logger.error(f"Error fetching question slugs: {e}")

    logger.info("--- Starting LeetCode Catalog Scraper ---")
    try:
        res = requests.get("https://leetcode.com/api/problems/all/", headers=HEADERS, timeout=15)
        if res.status_code != 200:
            logger.error(f"LeetCode returned status {res.status_code}")
            return
            
        data = res.json()
        stat_pairs = data.get("stat_status_pairs", [])
        logger.info(f"Fetched {len(stat_pairs)} problems from LeetCode API")
        
        # Sort by total_submitted descending to pick the most popular interview questions
        popular_problems = sorted(
            stat_pairs,
            key=lambda x: x.get("stat", {}).get("total_submitted", 0),
            reverse=True
        )
        
        diff_map = {1: ("Easy", 20), 2: ("Medium", 40), 3: ("Hard", 60)}
        
        questions_to_insert = []
        for pair in popular_problems[:limit]:
            stat = pair.get("stat", {})
            title = stat.get("question__title")
            raw_slug = stat.get("question__title_slug")
            level = pair.get("difficulty", {}).get("level", 2)
            
            if not title or not raw_slug:
                continue
                
            clean_slug = slugify(raw_slug)
            if clean_slug in existing_slugs:
                continue
                
            diff_label, est_time = diff_map.get(level, ("Medium", 40))
            existing_slugs.add(clean_slug)
            
            questions_to_insert.append({
                "canonical_title": title[:100],
                "slug": clean_slug,
                "difficulty_label": diff_label,
                "estimated_time_minutes": est_time
            })
            
        if questions_to_insert and supabase:
            total_inserted = 0
            for i in range(0, len(questions_to_insert), 50):
                batch = questions_to_insert[i:i+50]
                supabase.table("questions").insert(batch).execute()
                total_inserted += len(batch)
            logger.info(f"Inserted {total_inserted} high-frequency canonical problems into public.questions")
        else:
            logger.info("No new problems to insert or running in dry-run mode.")
            
    except Exception as e:
        logger.error(f"Error fetching LeetCode catalog: {e}")

if __name__ == "__main__":
    run()
