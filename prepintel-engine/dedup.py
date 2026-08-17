import re
from typing import List, Dict

# Simple Trigram/Cosine similarity mock for text
def get_trigrams(text: str) -> set:
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s]', '', text)
    words = text.split()
    trigrams = set()
    for w in words:
        if len(w) >= 3:
            for i in range(len(w)-2):
                trigrams.add(w[i:i+3])
    return trigrams

def calculate_similarity(text1: str, text2: str) -> float:
    t1 = get_trigrams(text1)
    t2 = get_trigrams(text2)
    if not t1 or not t2:
        return 0.0
    intersection = len(t1.intersection(t2))
    return intersection / max(len(t1), len(t2))

def assign_independence_factors(reports: List[Dict]) -> List[Dict]:
    """
    Cluster raw_reports by (company_id, role_id, round_id, cycle_id) + text similarity.
    Assign independence_factor I_i: 1.0 unclustered, 0.3 likely-duplicate, 0.0 exact-duplicate.
    """
    # Group reports
    groups = {}
    for r in reports:
        key = (r['company_id'], r['role_id'], r['round_id'], r['cycle_id'])
        if key not in groups:
            groups[key] = []
        groups[key].append(r)
        
    for key, group in groups.items():
        # Compare all pairs in group to find duplicates
        for i in range(len(group)):
            if 'independence_factor' not in group[i]:
                group[i]['independence_factor'] = 1.0  # default
                
            for j in range(i + 1, len(group)):
                sim = calculate_similarity(group[i]['raw_text'], group[j]['raw_text'])
                if sim > 0.9:
                    # exact duplicate
                    group[j]['independence_factor'] = 0.0
                    group[j]['duplicate_of'] = group[i]['id']
                elif sim > 0.6:
                    # likely duplicate
                    if 'independence_factor' not in group[j] or group[j]['independence_factor'] > 0.3:
                        group[j]['independence_factor'] = 0.3
                        group[j]['duplicate_of'] = group[i]['id']
    return reports
