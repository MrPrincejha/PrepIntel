from datetime import datetime
from typing import List, Dict

def compute_trend_score(monthly_probabilities: List[float], alpha: float = 0.2) -> float:
    """
    Compute EMA over monthly buckets, trend_score = p_recent - p_historical
    """
    if not monthly_probabilities:
        return 0.0
        
    # EMA calculation
    ema = monthly_probabilities[0]
    for p in monthly_probabilities[1:]:
        ema = alpha * p + (1 - alpha) * ema
        
    # p_recent vs p_historical (simplified EMA diff)
    p_recent = monthly_probabilities[-1]
    p_historical = ema
    
    return p_recent - p_historical

def classify_trend(trend_score: float, threshold: float = 0.05) -> str:
    if trend_score > threshold:
        return "Increasing"
    elif trend_score < -threshold:
        return "Decreasing"
    else:
        return "Stable"
