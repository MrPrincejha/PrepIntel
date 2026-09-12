import hashlib
import re
from typing import List, Dict, Optional
from datetime import datetime, timezone

# Example robust ingestion pipeline per Phase 4 specifications

def compute_content_hash(text: str) -> str:
    """Normalize text and compute a deterministic hash to prevent duplicates."""
    if not text:
        return ""
    # Normalize: lower case, strip extra whitespace and punctuation
    normalized = re.sub(r'\s+', ' ', text.lower()).strip()
    normalized = re.sub(r'[^\w\s]', '', normalized)
    return hashlib.sha256(normalized.encode('utf-8')).hexdigest()

def extract_topics_layered(raw_text: str, topics_db: List[Dict]) -> List[Dict]:
    """
    Layered classifier for topics:
    1. Exact taxonomy match (high confidence)
    2. Semantic / LLM fallback (simulated here as placeholder)
    """
    found_topics = []
    text_lower = raw_text.lower()
    
    for topic in topics_db:
        topic_id = topic['id']
        slug = topic['slug']
        synonyms = topic.get('synonyms', [slug])
        
        # Layer 1: Taxonomy regex match
        matched = False
        for synonym in synonyms:
            pattern = r'\b' + re.escape(synonym) + r'\b'
            if re.search(pattern, text_lower):
                found_topics.append({
                    "topic_id": topic_id,
                    "confidence": 0.9,
                    "extraction_method": "taxonomy_regex"
                })
                matched = True
                break
                
        # Layer 2: LLM / Semantic fallback could go here if not matched
        if not matched:
            pass
            
    return found_topics

def process_raw_report(report: Dict, topics_db: List[Dict]) -> Dict:
    """
    Processes a single raw report idempotently.
    Updates status and returns observations to be inserted.
    """
    try:
        raw_text = report.get('raw_text', '')
        content_hash = compute_content_hash(raw_text)
        
        # Extraction
        observations = extract_topics_layered(raw_text, topics_db)
        
        return {
            "success": True,
            "report_id": report['id'],
            "content_hash": content_hash,
            "observations": observations,
            "status": "classified",
            "processing_error": None
        }
    except Exception as e:
        return {
            "success": False,
            "report_id": report['id'],
            "status": "failed",
            "processing_error": str(e)
        }

def run_ingestion_batch(reports: List[Dict], topics_db: List[Dict]) -> List[Dict]:
    """
    Batch processor for ingestion pipeline.
    """
    results = []
    for report in reports:
        if report.get('status') in ['pending', 'failed']:
            res = process_raw_report(report, topics_db)
            results.append(res)
    return results
