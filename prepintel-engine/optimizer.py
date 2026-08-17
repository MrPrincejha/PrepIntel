from typing import List, Dict

def estimate_time(difficulty: str) -> int:
    if difficulty.lower() == "easy":
        return 20
    elif difficulty.lower() == "medium":
        return 45
    return 90

def knapsack_selection(questions: List[Dict], max_time: int) -> List[Dict]:
    """
    Standard DP Knapsack to maximize final_recommendation_score within max_time (minutes).
    """
    # Filter out questions that have no time or zero score
    items = []
    for q in questions:
        t = estimate_time(q.get('difficulty', 'Medium'))
        v = q.get('final_recommendation_score', 0)
        items.append((t, v, q))
        
    n = len(items)
    # DP table: dp[i][w] stores max value using first i items up to w time
    # To keep memory footprint small, we can just use 1D array if we only need max value,
    # but we need the actual items, so 2D array is needed.
    # Alternatively, use memoization.
    
    dp = [[0] * (max_time + 1) for _ in range(n + 1)]
    
    for i in range(1, n + 1):
        t, v, _ = items[i - 1]
        for w in range(max_time + 1):
            if t <= w:
                dp[i][w] = max(v + dp[i - 1][w - t], dp[i - 1][w])
            else:
                dp[i][w] = dp[i - 1][w]
                
    # Backtrack to find chosen items
    chosen = []
    w = max_time
    for i in range(n, 0, -1):
        if dp[i][w] != dp[i - 1][w]:
            t, v, q = items[i - 1]
            chosen.append(q)
            w -= t
            
    return chosen

def apply_diversity_penalty(selected: List[Dict]) -> List[Dict]:
    """
    Simple greedy diversity re-rank for MVP:
    If a topic appears too many times, push it down the priority queue.
    """
    # For MVP, we'll just sort them to ensure varying topics are adjacent,
    # or limit topics to max 40% of the plan.
    topic_counts = {}
    for q in selected:
        primary = q['tags'][0] if q['tags'] else "unknown"
        topic_counts[primary] = topic_counts.get(primary, 0) + 1
        
    # Re-sort to alternate topics greedily
    final_list = []
    remaining = selected[:]
    last_topic = None
    
    while remaining:
        # Find the highest score question that doesn't share the last topic
        best_idx = -1
        for i, q in enumerate(remaining):
            primary = q['tags'][0] if q['tags'] else "unknown"
            if primary != last_topic:
                best_idx = i
                break
                
        if best_idx == -1:
            # If all remaining have the same topic, just take the best one
            best_idx = 0
            
        chosen = remaining.pop(best_idx)
        final_list.append(chosen)
        last_topic = chosen['tags'][0] if chosen['tags'] else "unknown"
        
    return final_list

def generate_weekly_buckets(questions: List[Dict], minutes_per_week: int = 300) -> List[Dict]:
    """
    Group the output into week-buckets (e.g. 300 mins/week = 5 hours/week).
    """
    weeks = []
    current_week = []
    current_time = 0
    week_idx = 1
    
    for q in questions:
        t = estimate_time(q.get('difficulty', 'Medium'))
        if current_time + t > minutes_per_week and current_week:
            # finalize week
            topics = set(cq['tags'][0] for cq in current_week if cq.get('tags'))
            weeks.append({
                "week": f"Week {week_idx}",
                "days": f"Days {(week_idx-1)*7 + 1}-{(week_idx)*7}",
                "topics": list(topics)[:3], # top 3 topics
                "questions": current_week,
                "progress": 0,
                "total_minutes": current_time
            })
            current_week = []
            current_time = 0
            week_idx += 1
            
        current_week.append(q)
        current_time += t
        
    if current_week:
        topics = set(cq['tags'][0] for cq in current_week if cq.get('tags'))
        weeks.append({
            "week": f"Week {week_idx}",
            "days": f"Days {(week_idx-1)*7 + 1}-{(week_idx)*7}",
            "topics": list(topics)[:3],
            "questions": current_week,
            "progress": 0,
            "total_minutes": current_time
        })
        
    return weeks
