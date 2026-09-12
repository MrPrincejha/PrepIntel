import re
from typing import List, Dict

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

def calculate_jaccard_similarity(text1: str, text2: str) -> float:
    """
    Calculates Jaccard similarity between two sets of trigrams.
    Correctly identified as Jaccard similarity rather than cosine.
    """
    t1 = get_trigrams(text1)
    t2 = get_trigrams(text2)
    if not t1 or not t2:
        return 0.0
    intersection = len(t1.intersection(t2))
    union = len(t1.union(t2))
    return intersection / union if union > 0 else 0.0

def assign_independence_factors(reports: List[Dict]) -> List[Dict]:
    """
    Cluster raw_reports by (company_id, role_id, round_id, cycle_id) + text similarity.
    Assign independence_factor I_i: 1.0 unclustered, 0.3 likely-duplicate, 0.0 exact-duplicate.
    In a real PostgreSQL production environment, this should ideally use pg_trgm via a query 
    rather than O(N^2) Python all-pairs comparison, but this serves as the MVP cluster algorithm.
    """
    # Group reports
    groups = {}
    for r in reports:
        # Graceful fallback to name if IDs are missing during transition
        c_id = r.get('company_id') or r.get('company')
        r_id = r.get('role_id') or r.get('role')
        rnd_id = r.get('round_id') or r.get('round')
        cyc_id = r.get('cycle_id') or r.get('cycle')
        
        key = (c_id, r_id, rnd_id, cyc_id)
        if key not in groups:
            groups[key] = []
        groups[key].append(r)
        
    for key, group in groups.items():
        # Compare all pairs in group to find duplicates
        for i in range(len(group)):
            if 'independence_factor' not in group[i]:
                group[i]['independence_factor'] = 1.0  # default
                
            for j in range(i + 1, len(group)):
                sim = calculate_jaccard_similarity(group[i].get('raw_text', ''), group[j].get('raw_text', ''))
                if sim > 0.8:
                    # exact duplicate
                    group[j]['independence_factor'] = 0.0
                    group[j]['cluster_id'] = group[i].get('cluster_id') or group[i]['id']
                elif sim > 0.5:
                    # likely duplicate / strong overlap
                    if 'independence_factor' not in group[j] or group[j]['independence_factor'] > 0.3:
                        group[j]['independence_factor'] = 0.3
                        group[j]['cluster_id'] = group[i].get('cluster_id') or group[i]['id']
    return reports
