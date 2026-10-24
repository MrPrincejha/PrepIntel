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

TRACKS = ["algorithms", "data-structures"]

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

def fetch_hackerrank_challenges(track: str, offset: int = 0, limit: int = 50) -> List[Dict]:
    url = f"https://www.hackerrank.com/rest/contests/master/tracks/{track}/challenges?offset={offset}&limit={limit}"
    try:
        res = requests.get(url, headers=HEADERS, timeout=12)
        if res.status_code == 200:
            return res.json().get("models", [])
        else:
            logger.error(f"HackerRank returned HTTP {res.status_code} for track {track}")
            return []
    except Exception as e:
        logger.error(f"Failed to fetch HackerRank track {track}: {e}")
        return []

def run(limit_per_track: int = 50):
    supabase = init_supabase()
    existing_sources = set()
    existing_slugs = set()
    
    if supabase:
        try:
            res = supabase.table("raw_reports").select("source").like("source", "hackerrank:%").execute()
            existing_sources = {row["source"] for row in res.data if row.get("source")}
        except Exception as e:
            logger.error(f"Error fetching existing HackerRank sources: {e}")
            
        try:
            q_res = supabase.table("questions").select("slug").execute()
            existing_slugs = {row["slug"] for row in q_res.data if row.get("slug")}
        except Exception as e:
            logger.error(f"Error fetching question slugs: {e}")

    logger.info("--- Starting HackerRank Scraper ---")
    total_q_inserted = 0
    total_r_inserted = 0

    for track in TRACKS:
        logger.info(f"Fetching HackerRank track: {track}")
        challenges = fetch_hackerrank_challenges(track, offset=0, limit=limit_per_track)
        logger.info(f"Found {len(challenges)} challenges in {track}")
        
        questions_to_insert = []
        for ch in challenges:
            name = ch.get("name")
            slug = ch.get("slug")
            diff = ch.get("difficulty_name") or "Medium"
            preview = ch.get("preview") or ""
            
            if not name or not slug:
                continue
                
            source_id = f"hackerrank:{track}:{slug}"
            
            # Insert report if new
            if source_id not in existing_sources:
                payload = {
                    "company": "Tech General",
                    "role": "Software Engineer",
                    "round": "Coding Assessment",
                    "raw_text": f"# {name}\n\n**Difficulty:** {diff}\n**Track:** {track}\n\n{preview}",
                    "status": "pending",
                    "source": source_id,
                    "source_url": f"https://www.hackerrank.com/challenges/{slug}/problem"
                }
                if supabase:
                    try:
                        supabase.table("raw_reports").insert(payload).execute()
                        existing_sources.add(source_id)
                        total_r_inserted += 1
                    except Exception as e:
                        logger.error(f"Error inserting HackerRank report {slug}: {e}")

            # Insert question if new
            target_slug = slugify(slug)
            if target_slug not in existing_slugs:
                existing_slugs.add(target_slug)
                
                diff_lower = diff.lower()
                if diff_lower in ["hard", "advanced", "expert"]:
                    norm_diff = "Hard"
                    est = 60
                elif diff_lower in ["easy", "basic"]:
                    norm_diff = "Easy"
                    est = 20
                else:
                    norm_diff = "Medium"
                    est = 40
                
                questions_to_insert.append({
                    "canonical_title": name[:100],
                    "slug": target_slug,
                    "difficulty_label": norm_diff,
                    "estimated_time_minutes": est
                })

        if questions_to_insert and supabase:
            try:
                for i in range(0, len(questions_to_insert), 50):
                    batch = questions_to_insert[i:i+50]
                    supabase.table("questions").insert(batch).execute()
                    total_q_inserted += len(batch)
                logger.info(f"Inserted {len(questions_to_insert)} questions from HackerRank {track}")
            except Exception as e:
                logger.error(f"Error inserting questions from HackerRank {track}: {e}")
                
        time.sleep(1)

    logger.info(f"HackerRank scraping complete. New reports: {total_r_inserted}, New questions: {total_q_inserted}")

if __name__ == "__main__":
    run()
