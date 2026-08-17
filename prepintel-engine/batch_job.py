import random
from datetime import datetime, timezone, timedelta
from ingestion import run_ingestion
from dedup import assign_independence_factors
from weighting import calculate_recency_weight, calculate_source_weight, calculate_combined_weight
from bayesian import compute_beta_binomial_posterior, calculate_effective_sample_size, calculate_confidence_score
from trend import compute_trend_score, classify_trend
from scoring import compute_question_score
from pprint import pprint

# Mock data
RELIABILITY_SCORES = {
    'user_submission': 0.8,
    'scraped_public': 0.5,
    'manual_admin': 1.0
}

def generate_synthetic_reports(n=50):
    reports = []
    companies = ['amazon', 'google']
    roles = ['sde-1', 'sde-intern']
    cycles = ['2025', '2026']
    topics_pool = ['dynamic programming', 'arrays', 'graph', 'optimization']
    
    now = datetime.now(timezone.utc)
    for i in range(n):
        # some duplicates to test dedup
        is_dup = i > 0 and random.random() < 0.2
        if is_dup:
            text = reports[i-1]['raw_text']
        else:
            text = f"Interview asked about {random.choice(topics_pool)} and {random.choice(topics_pool)}."
            
        reports.append({
            'id': f'report_{i}',
            'status': 'pending',
            'company_id': random.choice(companies),
            'role_id': random.choice(roles),
            'round_id': 'oa',
            'cycle_id': random.choice(cycles),
            'raw_text': text,
            'source_type': random.choice(list(RELIABILITY_SCORES.keys())),
            'submitted_at': now - timedelta(days=random.randint(0, 400))
        })
    return reports

def run_batch_job():
    print("Generating synthetic reports...")
    reports = generate_synthetic_reports(100)
    
    print("1. Ingestion (Topic Extraction)")
    reports = run_ingestion(reports)
    
    print("2. Deduplication")
    reports = assign_independence_factors(reports)
    
    # 3-8. Weighting & Bayesian scoring per (company, role, round, cycle, topic)
    print("Running Bayesian math engine...")
    groups = {}
    for r in reports:
        w_r = calculate_recency_weight(r['submitted_at'])
        w_s = calculate_source_weight(r['source_type'], RELIABILITY_SCORES)
        w_i = calculate_combined_weight(w_r, w_s, r['independence_factor'])
        r['combined_weight'] = w_i
        
        group_key = (r['company_id'], r['role_id'], r['round_id'], r['cycle_id'])
        if group_key not in groups:
            groups[group_key] = {'reports': [], 'topics': set()}
            
        groups[group_key]['reports'].append(r)
        for t in r['extracted_topics']:
            groups[group_key]['topics'].add(t)
            
    topic_scores = []
    for group_key, data in groups.items():
        group_reports = data['reports']
        topics = data['topics']
        
        # Calculate N_eff for the group
        weights = [r['combined_weight'] for r in group_reports]
        n_eff = calculate_effective_sample_size(weights)
        conf_score = calculate_confidence_score(n_eff)
        
        for topic in topics:
            successes = 0.0
            failures = 0.0
            for r in group_reports:
                if topic in r['extracted_topics']:
                    successes += r['combined_weight']
                else:
                    failures += r['combined_weight']
                    
            post_mean, ci_low, ci_high = compute_beta_binomial_posterior(successes, failures)
            
            topic_scores.append({
                'company': group_key[0],
                'role': group_key[1],
                'cycle': group_key[3],
                'topic': topic,
                'n_eff': round(n_eff, 2),
                'confidence': conf_score,
                'posterior_mean': round(post_mean, 4),
                'ci_low': round(ci_low, 4),
                'ci_high': round(ci_high, 4)
            })
            
    print("\n--- Topic Scores Output (Sample) ---")
    pprint(sorted(topic_scores, key=lambda x: x['posterior_mean'], reverse=True)[:5])

if __name__ == "__main__":
    run_batch_job()
