import os
import re

main_path = r"e:\prepIntel\prepintel-engine\main.py"
with open(main_path, 'r', encoding='utf-8') as f:
    m_content = f.read()

old_topic_analysis = """    # Generate a deterministic trend score based on company name hash
    seed = sum(ord(c) for c in company)
    random.seed(seed)
    
    result = []
    for t, p in sorted_topics:
        if p > 0:
            trend = random.uniform(-0.15, 0.25)
            result.append({"topic": t, "weighted_probability": p, "trend_score": round(trend, 2)})"""

new_topic_analysis = """    # No more fake data. Trend score will be explicitly 0.0 or omitted if insufficient evidence exists.
    result = []
    for t, p in sorted_topics:
        if p > 0:
            result.append({"topic": t, "weighted_probability": p, "trend_score": 0.0})"""

m_content = m_content.replace(old_topic_analysis, new_topic_analysis)

with open(main_path, 'w', encoding='utf-8') as f:
    f.write(m_content)
