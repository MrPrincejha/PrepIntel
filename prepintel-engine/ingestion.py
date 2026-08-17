import re
from typing import List, Dict

# Mock topic structure for extraction
MOCK_TOPICS = {
    '1d-dp': ['dp', 'dynamic programming', 'memoization', '1d dp'],
    'arrays': ['array', 'arrays', 'list', 'vector'],
    'greedy': ['greedy', 'optimization', 'interval'],
    'graphs': ['graph', 'bfs', 'dfs', 'shortest path']
}

def extract_topics_from_text(raw_text: str, topics_dict: Dict[str, List[str]] = None) -> List[str]:
    """
    Keyword/regex matching against topics.slug + synonyms table.
    """
    if topics_dict is None:
        topics_dict = MOCK_TOPICS
        
    found_topics = []
    text_lower = raw_text.lower()
    
    for topic_slug, synonyms in topics_dict.items():
        for synonym in synonyms:
            # Simple word boundary regex match
            pattern = r'\b' + re.escape(synonym) + r'\b'
            if re.search(pattern, text_lower):
                found_topics.append(topic_slug)
                break # move to next topic if found
                
    return found_topics

def run_ingestion(reports: List[Dict]) -> List[Dict]:
    """
    Ingest new raw_reports -> run topic extraction -> write report_topic_observations
    """
    for report in reports:
        if report.get('status') == 'pending':
            extracted = extract_topics_from_text(report['raw_text'])
            report['extracted_topics'] = extracted
            report['status'] = 'processed'
    return reports
