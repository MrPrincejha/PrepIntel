import os
import csv
import re
import io
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

# Top 30 tech & fintech companies
COMPANY_MAP = {
    "google": "Google",
    "amazon": "Amazon",
    "microsoft": "Microsoft",
    "adobe": "Adobe",
    "apple": "Apple",
    "facebook": "Meta",
    "goldmansachs": "Goldman Sachs",
    "uber": "Uber",
    "bloomberg": "Bloomberg",
    "walmart": "Walmart",
    "cisco": "Cisco",
    "salesforce": "Salesforce",
    "oracle": "Oracle",
    "atlassian": "Atlassian",
    "netflix": "Netflix",
    "airbnb": "Airbnb",
    "stripe": "Stripe",
    "linkedin": "LinkedIn",
    "twitter": "Twitter",
    "snap": "Snap",
    "bytedance": "ByteDance",
    "paypal": "PayPal",
    "intuit": "Intuit",
    "morganstanley": "Morgan Stanley",
    "jpmorgan": "JPMorgan",
    "tcs": "TCS",
    "infosys": "Infosys",
    "cognizant": "Cognizant",
    "wipro": "Wipro",
    "samsung": "Samsung"
}

def init_supabase() -> Optional[Client]:
    url = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY") or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    if not url or not key:
        logger.warning("SUPABASE_URL or SUPABASE_KEY missing.")
        return None
    return create_client(url, key)

def slugify(text: str) -> str:
    s = re.sub(r'[^\w\s-]', '', text.lower()).strip()
    return re.sub(r'[-\s]+', '-', s)[:80]

def ingest_krishnadey_company_questions(supabase: Client, existing_slugs: set, max_per_company: int = 25):
    """Fetches company-wise interview questions directly via raw.githubusercontent.com (No API rate limits)"""
    logger.info(f"Ingesting frequency-ranked interview questions for {len(COMPANY_MAP)} companies...")
    
    total_new_reports = 0
    total_new_questions = 0

    existing_sources = set()
    if supabase:
        try:
            res = supabase.table("raw_reports").select("source").like("source", "companyq:%").execute()
            existing_sources = {row["source"] for row in res.data if row.get("source")}
        except Exception as e:
            logger.error(f"Error fetching existing companyq sources: {e}")

    for c_key, company_display in COMPANY_MAP.items():
        # Try _alltime.csv first, then _1year.csv
        urls = [
            f"https://raw.githubusercontent.com/krishnadey30/LeetCode-Questions-CompanyWise/master/{c_key}_alltime.csv",
            f"https://raw.githubusercontent.com/krishnadey30/LeetCode-Questions-CompanyWise/master/{c_key}_1year.csv"
        ]
        
        csv_text = None
        for u in urls:
            try:
                r = requests.get(u, timeout=10)
                if r.status_code == 200 and len(r.text) > 100:
                    csv_text = r.text
                    break
            except Exception:
                pass
                
        if not csv_text:
            continue
            
        reader = csv.DictReader(io.StringIO(csv_text))
        raw_reports_batch = []
        questions_batch = []
        
        count = 0
        for row in reader:
            title = row.get("Title") or row.get("title")
            diff = row.get("Difficulty") or row.get("difficulty") or "Medium"
            lc_link = row.get("Leetcode Question Link") or row.get("url") or ""
            
            if not title:
                continue
                
            clean_title = title.strip()
            target_slug = slugify(f"{c_key}-{clean_title}")
            diff_norm = "Hard" if "hard" in diff.lower() else ("Easy" if "easy" in diff.lower() else "Medium")
            est_time = 60 if diff_norm == "Hard" else (20 if diff_norm == "Easy" else 40)
            
            # Form rich report text
            report_text = f"# {clean_title}\n\n**Company:** {company_display}\n**Difficulty:** {diff_norm}\n**LeetCode Link:** {lc_link.strip()}\n\nThis is a frequently asked interview question in {company_display} technical rounds."
            source_id = f"companyq:{c_key}:{clean_title.lower().replace(' ', '_')}"
            
            if source_id not in existing_sources:
                existing_sources.add(source_id)
                raw_reports_batch.append({
                    "company": company_display,
                    "role": "Software Engineer",
                    "round": "Technical Round",
                    "raw_text": report_text,
                    "status": "pending",
                    "source": source_id,
                    "source_url": lc_link.strip() or f"https://leetcode.com/problemset/all/?search={clean_title}"
                })
            
            if target_slug not in existing_slugs:
                existing_slugs.add(target_slug)
                questions_batch.append({
                    "canonical_title": clean_title[:100],
                    "slug": target_slug,
                    "difficulty_label": diff_norm,
                    "estimated_time_minutes": est_time
                })
                
            count += 1
            if count >= max_per_company:
                break
                
        if raw_reports_batch and supabase:
            try:
                for i in range(0, len(raw_reports_batch), 25):
                    supabase.table("raw_reports").insert(raw_reports_batch[i:i+25]).execute()
                total_new_reports += len(raw_reports_batch)
            except Exception as e:
                logger.error(f"Error inserting reports for {company_display}: {e}")
                
        if questions_batch and supabase:
            try:
                for i in range(0, len(questions_batch), 50):
                    supabase.table("questions").insert(questions_batch[i:i+50]).execute()
                total_new_questions += len(questions_batch)
            except Exception as e:
                logger.error(f"Error inserting questions for {company_display}: {e}")
                
        logger.info(f"Done {company_display}: {len(raw_reports_batch)} reports, {len(questions_batch)} questions.")
        time.sleep(0.2)
        
    logger.info(f"Company-wise scraping complete! Total reports added: {total_new_reports}, questions: {total_new_questions}")

def run():
    supabase = init_supabase()
    existing_slugs = set()
    if supabase:
        try:
            q_res = supabase.table("questions").select("slug").execute()
            existing_slugs = {row["slug"] for row in q_res.data if row.get("slug")}
        except Exception as e:
            logger.error(f"Error fetching slugs: {e}")
            
    ingest_krishnadey_company_questions(supabase, existing_slugs, max_per_company=25)

if __name__ == "__main__":
    run()
