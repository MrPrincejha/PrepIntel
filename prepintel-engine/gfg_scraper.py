import os
import re
import time
import json
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
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
}

GFG_COMPANIES = [
    ("Google", "google"),
    ("Amazon", "amazon"),
    ("Microsoft", "microsoft"),
    ("Adobe", "adobe"),
    ("Goldman Sachs", "goldman-sachs"),
    ("Uber", "uber"),
    ("Flipkart", "flipkart"),
    ("Walmart", "walmart"),
    ("Salesforce", "salesforce"),
    ("Oracle", "oracle"),
    ("Cisco", "cisco"),
    ("Samsung", "samsung"),
    ("Qualcomm", "qualcomm"),
    ("TCS", "tcs"),
    ("Infosys", "infosys"),
    ("Accenture", "accenture"),
    ("Cognizant", "cognizant"),
    ("Wipro", "wipro"),
    ("Morgan Stanley", "morgan-stanley"),
    ("Paytm", "paytm"),
    ("Swiggy", "swiggy"),
    ("Zomato", "zomato"),
    ("Atlassian", "atlassian"),
    ("Intuit", "intuit")
]

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

def clean_html(raw_html: str) -> str:
    if not raw_html:
        return ""
    # Convert breaks and paragraphs
    text = re.sub(r'<br\s*/?>', '\n', raw_html, flags=re.IGNORECASE)
    text = re.sub(r'</p>', '\n\n', text, flags=re.IGNORECASE)
    text = re.sub(r'<strong>(.*?)</strong>', r'**\1**', text, flags=re.IGNORECASE)
    text = re.sub(r'<b>(.*?)</b>', r'**\1**', text, flags=re.IGNORECASE)
    text = re.sub(r'<li>(.*?)</li>', r'- \1\n', text, flags=re.IGNORECASE)
    text = re.sub(r'<[^>]+>', '', text)
    return text.strip()

def extract_and_insert_questions(supabase: Client, company: str, content: str, existing_slugs: set):
    if not supabase or not content or len(content.strip()) < 30:
        return
        
    chunks = re.split(r'\n(?=#{1,4}\s*\d+\.\s|#{1,4}\s*(?:Q|Question|Problem|Round)\s*\d+|(?:\*\*|)Question\s*\d+(?:\*\*|)\s*[:\-])', content, flags=re.IGNORECASE)
    
    questions_to_insert = []
    seen_titles = set()
    
    for chunk in chunks:
        text = chunk.strip()
        text_lower = text.lower()
        if len(text) < 40 or "write the complete problem statement" in text_lower or "[question title]" in text_lower:
            continue
            
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        if not lines:
            continue
            
        first_line = lines[0]
        header_match = re.match(r'^(?:#{1,4}\s*)?(?:\d+\.\s+|(?:Q|Question|Problem)\s*\d+\s*[:\-\.]?\s*|\*\*(?:Q|Question)\s*\d+\*\*\s*[:\-\.]?\s*)(.*)', first_line, re.IGNORECASE)
        
        title = ""
        if header_match and len(header_match.group(1).strip()) > 3:
            raw_h = header_match.group(1).strip().replace("*", "").replace("#", "").strip()
            if not any(raw_h.lower().startswith(p) or p in raw_h.lower() for p in ["[question", "question title", "your solution"]):
                title = raw_h
                
        if not title:
            for line in lines:
                clean_line = line.strip().replace("#", "").replace("*", "").replace("-", "").strip()
                if 10 < len(clean_line) < 60 and not clean_line.lower().startswith(("year:", "round:", "company:", "note:")):
                    title = clean_line
                    break
                    
        if not title or title.lower() in seen_titles:
            continue
            
        seen_titles.add(title.lower())
        
        base_slug = slugify(f"{company}-{title}")
        slug = base_slug
        counter = 1
        while slug in existing_slugs:
            slug = f"{base_slug}-{counter}"
            counter += 1
        existing_slugs.add(slug)
        
        if "hard" in text_lower or len(text) > 1200:
            diff = "Hard"
            est_time = 90
        elif "easy" in text_lower or len(text) < 400:
            diff = "Easy"
            est_time = 20
        else:
            diff = "Medium"
            est_time = 45
            
        questions_to_insert.append({
            "canonical_title": title[:100],
            "slug": slug,
            "difficulty_label": diff,
            "estimated_time_minutes": est_time
        })
        
    if questions_to_insert:
        try:
            supabase.table("questions").insert(questions_to_insert).execute()
            logger.info(f"Extracted and inserted {len(questions_to_insert)} questions for {company}")
        except Exception as e:
            logger.error(f"Failed to insert extracted questions: {e}")

def scrape_gfg_company_experiences(supabase: Client, existing_sources: set, existing_slugs: set) -> int:
    total_inserted = 0
    for comp_display, comp_slug in GFG_COMPANIES:
        source_id = f"gfg:experience:{comp_slug}"
        if source_id in existing_sources:
            continue
            
        url = f"https://www.geeksforgeeks.org/interview-experiences/{comp_slug}-interview-experience/"
        try:
            res = requests.get(url, headers=HEADERS, timeout=12)
            if res.status_code != 200:
                continue
                
            next_data = re.findall(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', res.text)
            if not next_data:
                continue
                
            data = json.loads(next_data[0])
            write_api = data.get('props', {}).get('pageProps', {}).get('postDataFromWriteApi', {})
            post_title = write_api.get('post_title') or f"{comp_display} Interview Experience"
            raw_content = write_api.get('post_content') or ""
            
            clean_content = clean_html(raw_content)
            if len(clean_content.strip()) < 80:
                continue
                
            payload = {
                "company": comp_display,
                "role": "Software Engineer",
                "round": "Interview Experience",
                "raw_text": f"# {post_title}\n\n{clean_content}",
                "status": "pending",
                "source": source_id,
                "source_url": url
            }
            
            if supabase:
                try:
                    supabase.table("raw_reports").insert(payload).execute()
                    existing_sources.add(source_id)
                    total_inserted += 1
                    logger.info(f"Inserted GFG report: [{comp_display}] {post_title}")
                    extract_and_insert_questions(supabase, comp_display, clean_content, existing_slugs)
                except Exception as e:
                    logger.error(f"Failed to insert GFG report {source_id}: {e}")
            else:
                logger.info(f"DRY RUN: [{comp_display}] {post_title}")
                
            time.sleep(0.5)
        except Exception as e:
            logger.error(f"Error fetching GFG {comp_display}: {e}")
            
    return total_inserted

def scrape_gfg_explore_problems(supabase: Client, existing_sources: set, existing_slugs: set) -> int:
    """Scrape company-tagged interview problems from GFG Explore."""
    url = "https://www.geeksforgeeks.org/explore?page=1&category=Interview%20Experiences"
    total_q = 0
    try:
        res = requests.get(url, headers=HEADERS, timeout=15)
        if res.status_code != 200:
            return 0
            
        next_data = re.findall(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', res.text)
        if not next_data:
            return 0
            
        data = json.loads(next_data[0])
        topic_data = data.get('props', {}).get('pageProps', {}).get('initialTopicWiseData', [])
        
        questions_to_insert = []
        for level_group in topic_data:
            problems = level_group.get('problems', [])
            for p in problems:
                name = p.get('problem_name')
                slug = p.get('slug')
                diff = p.get('difficulty', 'Medium')
                comp_tags = p.get('tags', {}).get('company_tags', [])
                prob_url = p.get('problem_url', '')
                
                if not name or not slug:
                    continue
                    
                target_slug = slugify(slug)
                if target_slug in existing_slugs:
                    continue
                    
                existing_slugs.add(target_slug)
                
                # Estimate time
                if diff.lower() in ['hard']: est = 90
                elif diff.lower() in ['easy', 'basic']: est = 25
                else: est = 45
                
                questions_to_insert.append({
                    "canonical_title": name[:100],
                    "slug": target_slug,
                    "difficulty_label": "Easy" if diff.lower() == 'basic' else diff,
                    "estimated_time_minutes": est
                })
                
        if questions_to_insert and supabase:
            try:
                # Chunks of 50
                for i in range(0, len(questions_to_insert), 50):
                    batch = questions_to_insert[i:i+50]
                    supabase.table("questions").insert(batch).execute()
                    total_q += len(batch)
                logger.info(f"Inserted {total_q} problems directly from GFG Explore")
            except Exception as e:
                logger.error(f"Error inserting GFG Explore problems: {e}")
                
    except Exception as e:
        logger.error(f"Error in GFG Explore scraping: {e}")
        
    return total_q

def run():
    supabase = init_supabase()
    existing_sources = set()
    existing_slugs = set()
    
    if supabase:
        try:
            res = supabase.table("raw_reports").select("source").like("source", "gfg:%").execute()
            existing_sources = {row["source"] for row in res.data if row.get("source")}
        except Exception as e:
            logger.error(f"Error fetching existing GFG sources: {e}")
            
        try:
            q_res = supabase.table("questions").select("slug").execute()
            existing_slugs = {row["slug"] for row in q_res.data if row.get("slug")}
        except Exception as e:
            logger.error(f"Error fetching question slugs: {e}")

    logger.info("--- Starting GeeksforGeeks Scraper ---")
    reports_count = scrape_gfg_company_experiences(supabase, existing_sources, existing_slugs)
    problems_count = scrape_gfg_explore_problems(supabase, existing_sources, existing_slugs)
    
    logger.info(f"GFG scraping complete. New reports: {reports_count}, New canonical questions: {problems_count}")

if __name__ == "__main__":
    run()
