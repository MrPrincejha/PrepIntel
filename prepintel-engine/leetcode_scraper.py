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

GRAPHQL_URL = "https://leetcode.com/graphql/"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Content-Type": "application/json",
    "Referer": "https://leetcode.com/discuss/interview-experience/"
}

KNOWN_COMPANIES = [
    "Google", "Amazon", "Meta", "Facebook", "Microsoft", "Apple", "Netflix",
    "Uber", "Adobe", "Goldman Sachs", "Atlassian", "Bloomberg", "Salesforce",
    "LinkedIn", "Twitter", "X", "TikTok", "ByteDance", "Stripe", "Airbnb",
    "DoorDash", "Roblox", "Snap", "Oracle", "Cisco", "Walmart", "Paypal",
    "Morgan Stanley", "JPMorgan", "Qualcomm", "Nvidia", "TCS", "Infosys",
    "Accenture", "Cognizant", "Wipro", "Capgemini", "Samsung", "Intuit"
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

def extract_company_from_node(node: Dict) -> str:
    title = node.get("title", "")
    tags = [t.get("name", "").lower() for t in node.get("tags", [])]
    
    # 1. Check tags
    for comp in KNOWN_COMPANIES:
        c_low = comp.lower()
        if c_low in tags:
            return comp
        if c_low == "meta" and "facebook" in tags:
            return "Meta"

    # 2. Check title
    title_words = re.findall(r'\b[A-Za-z0-9]+\b', title)
    for comp in KNOWN_COMPANIES:
        c_low = comp.lower()
        for w in title_words:
            if w.lower() == c_low:
                return comp
        if comp.lower() in title.lower():
            return comp
            
    return "Tech General"

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

def fetch_leetcode_discussions(category: str = "interview-experience", first: int = 15, skip: int = 0) -> List[Dict]:
    query = """
    query categoryTopicList($categories: [String!]!, $first: Int!, $orderBy: TopicSortingOption, $skip: Int) {
      categoryTopicList(categories: $categories, first: $first, orderBy: $orderBy, skip: $skip) {
        totalNum
        edges {
          node {
            id
            title
            post {
              id
              creationDate
              content
            }
            tags {
              name
              slug
            }
          }
        }
      }
    }
    """
    payload = {
        "operationName": "categoryTopicList",
        "variables": {
            "categories": [category],
            "first": first,
            "orderBy": "newest_to_oldest",
            "skip": skip
        },
        "query": query
    }
    
    try:
        res = requests.post(GRAPHQL_URL, json=payload, headers=HEADERS, timeout=15)
        if res.status_code == 200:
            edges = res.json().get("data", {}).get("categoryTopicList", {}).get("edges", [])
            return [edge.get("node") for edge in edges if edge.get("node")]
        else:
            logger.error(f"LeetCode GraphQL returned HTTP {res.status_code}")
            return []
    except Exception as e:
        logger.error(f"Failed to query LeetCode GraphQL: {e}")
        return []

def run(max_pages: int = 2, per_page: int = 20):
    supabase = init_supabase()
    
    existing_sources = set()
    existing_slugs = set()
    
    if supabase:
        try:
            res = supabase.table("raw_reports").select("source").like("source", "leetcode:%").execute()
            existing_sources = {row["source"] for row in res.data if row.get("source")}
        except Exception as e:
            logger.error(f"Error fetching existing leetcode sources: {e}")
            
        try:
            q_res = supabase.table("questions").select("slug").execute()
            existing_slugs = {row["slug"] for row in q_res.data if row.get("slug")}
        except Exception as e:
            logger.error(f"Error fetching question slugs: {e}")

    categories = ["interview-experience", "interview-question"]
    total_inserted = 0

    for cat in categories:
        logger.info(f"--- Fetching LeetCode Discuss Category: {cat} ---")
        for page in range(max_pages):
            skip = page * per_page
            nodes = fetch_leetcode_discussions(category=cat, first=per_page, skip=skip)
            logger.info(f"Fetched {len(nodes)} discussions (page {page + 1})")
            
            for node in nodes:
                topic_id = node.get("id")
                source_id = f"leetcode:discuss:{topic_id}"
                if source_id in existing_sources:
                    continue
                    
                post = node.get("post", {})
                content = post.get("content", "")
                if not content or len(content.strip()) < 80:
                    continue
                    
                company = extract_company_from_node(node)
                title = node.get("title", "")
                
                payload = {
                    "company": company,
                    "role": "Software Engineer",
                    "round": "Interview Experience",
                    "raw_text": f"# {title}\n\n{content}",
                    "status": "pending",
                    "source": source_id,
                    "source_url": f"https://leetcode.com/discuss/{cat}/{topic_id}"
                }
                
                if supabase:
                    try:
                        supabase.table("raw_reports").insert(payload).execute()
                        existing_sources.add(source_id)
                        total_inserted += 1
                        logger.info(f"Inserted report: [{company}] {title[:50]}...")
                        extract_and_insert_questions(supabase, company, content, existing_slugs)
                    except Exception as e:
                        logger.error(f"Failed to insert report {source_id}: {e}")
                else:
                    logger.info(f"DRY RUN: [{company}] {title}")
                    
            time.sleep(1) # Polite delay
            
    logger.info(f"LeetCode scraping complete. Total new reports inserted: {total_inserted}")

if __name__ == "__main__":
    run()
