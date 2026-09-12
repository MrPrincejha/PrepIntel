import os

main_path = r"e:\prepIntel\prepintel-engine\main.py"
with open(main_path, 'r', encoding='utf-8') as f:
    m_content = f.read()

import re

# We will just replace the get_trend function and topic analysis with a real implementation, 
# or simply remove the random.uniform.
old_trend_body = """def get_trend(company: str, role: str, topic: str, months: int = 12):
    # Deterministic dynamic trend based on company
    seed = sum(ord(c) for c in company)
    random.seed(seed)
    
    reports = fetch_raw_reports(company, role)
    if not reports:
        top_topics = ["two-pointers", "hashing", "dfs-bfs"]
    else:
        topic_probs = analyze_topics_from_text(reports)
        top_topics = [t[0] for t in sorted(topic_probs.items(), key=lambda x: x[1], reverse=True)[:3]]
        
    months_labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    data = []
    
    current_probs = {t: random.uniform(0.1, 0.5) for t in top_topics}
    
    for i in range(12):
        month_data = {"month": months_labels[i]}
        for t in top_topics:
            month_data[t] = round(current_probs[t], 2)
            current_probs[t] += random.uniform(-0.05, 0.08)
            current_probs[t] = max(0.05, min(0.95, current_probs[t]))
        data.append(month_data)
        
    return {"monthly_data": data}"""

new_trend_body = """def get_trend(company: str, role: str, topic: str, months: int = 12):
    reports = fetch_raw_reports(company, role)
    if not reports:
        return {"monthly_data": [], "error": "Insufficient evidence"}
        
    topic_probs = analyze_topics_from_text(reports)
    top_topics = [t[0] for t in sorted(topic_probs.items(), key=lambda x: x[1], reverse=True)[:3]]
    
    # Real trend would aggregate reports by month. For Phase 3, we simply return insufficient evidence
    # instead of generating fake random charts. We will build the true aggregation in Phase 5.
    return {"monthly_data": [], "message": "Pending true timeline aggregation (Phase 5)"}"""

m_content = m_content.replace(old_trend_body, new_trend_body)

with open(main_path, 'w', encoding='utf-8') as f:
    f.write(m_content)
