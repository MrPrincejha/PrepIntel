import math
from datetime import datetime, timezone

def calculate_recency_weight(report_date: datetime, current_date: datetime = None, lambda_param: float = 0.35) -> float:
    """
    Recency weighting (section 6): w_r(t) = exp(-lambda * age_in_days/365)
    default lambda_param=0.35 means a 1-year-old report is approx 0.70 weight.
    """
    if current_date is None:
        current_date = datetime.now(timezone.utc)
    
    age_in_days = max(0, (current_date - report_date).days)
    age_in_years = age_in_days / 365.0
    return math.exp(-lambda_param * age_in_years)

def calculate_source_weight(source_type: str, reliability_scores: dict) -> float:
    """
    Source weighting (section 7).
    """
    return reliability_scores.get(source_type, 1.0)

def calculate_combined_weight(recency_weight: float, source_weight: float, independence_factor: float) -> float:
    """
    Combined weight (section 8): w_i = w_s(i) * w_r(t_i) * I_i
    """
    return recency_weight * source_weight * independence_factor
