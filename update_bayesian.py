import os

main_path = r"e:\prepIntel\prepintel-engine\main.py"
with open(main_path, 'r', encoding='utf-8') as f:
    m_content = f.read()

# Make sure bayesian and weighting are imported
if "from bayesian import " not in m_content:
    m_content = "from bayesian import compute_beta_binomial_posterior, calculate_effective_sample_size\n" + m_content
if "from weighting import " not in m_content:
    m_content = "from weighting import calculate_recency_weight, calculate_combined_weight, calculate_source_weight\n" + m_content
if "from datetime import datetime" not in m_content:
    m_content = "from datetime import datetime\n" + m_content

old_get_topics = """def get_topics(company: str, role: str, cycle: str):
    reports = fetch_raw_reports(company, role)
    if not reports:
        return [
            {"topic": "two-pointers", "weighted_probability": 0.33, "trend_score": 0.0},
            {"topic": "hashing", "weighted_probability": 0.33, "trend_score": 0.0},
            {"topic": "dfs-bfs", "weighted_probability": 0.34, "trend_score": 0.0}
        ]
        
    topic_probs = analyze_topics_from_text(reports)
    
    # Sort and return top 5
    sorted_topics = sorted(topic_probs.items(), key=lambda x: x[1], reverse=True)[:5]
    
    # No more fake data. Trend score will be explicitly 0.0 or omitted if insufficient evidence exists.
    result = []
    for t, p in sorted_topics:
        if p > 0:
            result.append({"topic": t, "weighted_probability": p, "trend_score": 0.0})
            
    return result"""

new_get_topics = """def get_topics(company: str, role: str = None, cycle: str = None):
    reports = fetch_raw_reports(company, role)
    if not reports:
        return []
        
    # Real Bayesian Aggregation
    # In a full pipeline, topics are extracted to report_topic_observations. 
    # Since we are live-aggregating for this MVP, we use the raw_text analyzer.
    topics_by_report = []
    for r in reports:
        # Simple extraction for now
        topics = []
        text = r.get("raw_text", "").lower()
        for t_slug, keywords in TOPICS.items():
            for kw in keywords:
                if kw in text:
                    topics.append(t_slug)
                    break
        
        # Calculate Weight
        # Handle created_at formatting
        try:
            r_date = datetime.fromisoformat(r.get("created_at", "").replace("Z", "+00:00"))
        except:
            r_date = datetime.now()
            
        w_r = calculate_recency_weight(r_date)
        w_s = calculate_source_weight(r.get("source_type", "user_submission"), {"user_submission": 1.0})
        # Default I_i to 1.0 since we haven't stored dedup clusters yet
        w_i = calculate_combined_weight(w_r, w_s, 1.0)
        
        topics_by_report.append({"topics": set(topics), "weight": w_i})
        
    # Aggregate
    all_possible_topics = TOPICS.keys()
    result = []
    
    # Effective sample size
    weights = [tr["weight"] for tr in topics_by_report]
    n_eff = calculate_effective_sample_size(weights)
    
    for t in all_possible_topics:
        successes = sum(tr["weight"] for tr in topics_by_report if t in tr["topics"])
        failures = sum(tr["weight"] for tr in topics_by_report if t not in tr["topics"])
        
        if successes > 0:
            post_mean, ci_low, ci_high = compute_beta_binomial_posterior(successes, failures)
            result.append({
                "topic": t, 
                "weighted_probability": round(post_mean, 2), 
                "n_eff": round(n_eff, 1),
                "trend_score": 0.0
            })
            
    # Sort and return top 5
    result = sorted(result, key=lambda x: x["weighted_probability"], reverse=True)[:5]
    return result"""

m_content = m_content.replace(old_get_topics, new_get_topics)

with open(main_path, 'w', encoding='utf-8') as f:
    f.write(m_content)
