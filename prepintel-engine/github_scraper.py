import os
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), 'prepintel', '.env.local'))

import requests
import base64
import time
from typing import List, Dict
from supabase import create_client, Client
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Constants
TARGET_REPOS = [
    "perixtar/Tech-OA-Interview-Questions",
    "themysterysolver/PLACEMENT-QUESTIONS",
    "br0hit/companyq",
    "mrsac7/placement-resources",
    "jobream/Leetcode-Company-Wise-Problems"
]

def init_supabase() -> Client:
    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY")
    if not url or not key:
        logger.warning("SUPABASE_URL or SUPABASE_KEY missing. Running in dry-run mode.")
        return None
    return create_client(url, key)

def get_repo_files(repo: str, path: str = "", pat: str = None) -> List[Dict]:
    """Fetch tree of a repository recursively, finding interesting markdown/text files."""
    headers = {"Accept": "application/vnd.github.v3+json"}
    if pat:
        headers["Authorization"] = f"token {pat}"
        
    url = f"https://api.github.com/repos/{repo}/git/trees/main?recursive=1"
    
    response = requests.get(url, headers=headers)
    if response.status_code == 404:
        # Try master branch if main fails
        url = f"https://api.github.com/repos/{repo}/git/trees/master?recursive=1"
        response = requests.get(url, headers=headers)
        
    if response.status_code != 200:
        logger.error(f"Failed to fetch {repo} tree: {response.text}")
        return []
        
    tree = response.json().get("tree", [])
    
    # Filter for interesting text-based files
    valid_extensions = ('.md', '.txt', '.pdf')
    target_files = []
    
    for item in tree:
        if item["type"] == "blob":
            file_path = item["path"]
            if file_path.lower().endswith(valid_extensions):
                target_files.append({
                    "path": file_path,
                    "url": item["url"], # Blob URL
                    "size": item.get("size", 0)
                })
                
    return target_files

def fetch_file_content(blob_url: str, pat: str = None) -> str:
    """Fetch base64 content of a blob and decode it."""
    headers = {"Accept": "application/vnd.github.v3+json"}
    if pat:
        headers["Authorization"] = f"token {pat}"
        
    for attempt in range(3):
        try:
            res = requests.get(blob_url, headers=headers, timeout=10)
            if res.status_code == 200:
                data = res.json()
                if data.get("encoding") == "base64":
                    try:
                        content = base64.b64decode(data["content"]).decode('utf-8')
                        return content
                    except Exception as e:
                        logger.error(f"Failed to decode blob: {e}")
                        return ""
            return ""
        except requests.exceptions.RequestException as e:
            if attempt < 2:
                time.sleep(2)
                continue
            logger.error(f"Network error fetching blob: {e}")
            return ""
    return ""

def push_to_supabase(supabase: Client, repo: str, file_path: str, content: str):
    """Insert into raw_reports for downstream processing."""
    if not supabase:
        logger.info(f"DRY-RUN: Would insert {len(content)} chars from {repo}/{file_path}")
        return
        
    # Standardize metadata based on repo/folder (heuristic)
    company = "Unknown"
    role = "Software Engineer"
    
    # Expanded heuristics
    path_lower = file_path.lower()
    companies = ['google', 'amazon', 'meta', 'apple', 'netflix', 'microsoft', 'uber', 'salesforce', 'texas', 'bloomberg', 'tiktok', 'bytedance', 'stripe', 'lyft', 'airbnb', 'doordash', 'roblox', 'snap']
    for c in companies:
        if c in path_lower:
            company = c.capitalize()
            break
            
    payload = {
        "company": company,
        "role": role,
        "round": "OA/Interview",
        "raw_text": content,
        "status": "pending",
        "source": f"github:{repo}/{file_path}"
    }
    
    try:
        supabase.table("raw_reports").insert(payload).execute()
        logger.info(f"Inserted report from {repo}/{file_path}")
    except Exception as e:
        logger.error(f"DB Insert failed: {e}")

def run():
    pat = os.environ.get("GITHUB_PAT")
    if not pat:
        logger.warning("No GITHUB_PAT found. API limits will be restricted to 60/hr.")
        
    supabase = init_supabase()
    
    # Pre-fetch existing sources to avoid duplicates
    existing_sources = set()
    if supabase:
        try:
            res = supabase.table("raw_reports").select("source").like("source", "github:%").execute()
            existing_sources = {row["source"] for row in res.data if row.get("source")}
        except Exception as e:
            logger.error(f"Failed to fetch existing sources: {e}")
            
    for repo in TARGET_REPOS:
        logger.info(f"Scanning repository: {repo}")
        files = get_repo_files(repo, pat=pat)
        
        logger.info(f"Found {len(files)} target files in {repo}")
        
        processed = 0
        for f in files:
            source_id = f"github:{repo}/{f['path']}"
            if source_id in existing_sources:
                continue
                
            content = fetch_file_content(f["url"], pat=pat)
            if content and len(content.strip()) > 50:
                push_to_supabase(supabase, repo, f["path"], content)
                existing_sources.add(source_id)
                processed += 1
                
            # Limit to 50 new files per repo per run to respect API limits
            if processed >= 50:
                logger.info(f"Reached 50 new files for {repo}, moving to next.")
                break

if __name__ == "__main__":
    run()

