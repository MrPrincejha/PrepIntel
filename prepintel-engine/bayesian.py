from scipy.stats import beta
from typing import List, Tuple

def calculate_effective_sample_size(weights: List[float]) -> float:
    """
    Effective sample size (section 11): N_eff = (sum w_i)^2 / sum(w_i^2)
    """
    if not weights:
        return 0.0
    sum_w = sum(weights)
    sum_w2 = sum(w * w for w in weights)
    if sum_w2 == 0:
        return 0.0
    return (sum_w * sum_w) / sum_w2

def compute_beta_binomial_posterior(
    weighted_successes: float, 
    weighted_failures: float, 
    alpha_prior: float = 1.0, 
    beta_prior: float = 1.0
) -> Tuple[float, float, float]:
    """
    Returns (posterior_mean, credible_interval_low, credible_interval_high)
    """
    alpha_post = alpha_prior + weighted_successes
    beta_post = beta_prior + weighted_failures
    
    # Posterior mean
    posterior_mean = alpha_post / (alpha_post + beta_post)
    
    # 95% credible interval
    ci_low = beta.ppf(0.025, alpha_post, beta_post)
    ci_high = beta.ppf(0.975, alpha_post, beta_post)
    
    return posterior_mean, ci_low, ci_high

def calculate_confidence_score(n_eff: float) -> float:
    """
    derive a 0-100 confidence_score from N_eff using a logistic/sigmoid mapping.
    N_eff=1 -> low confidence, N_eff>=15 -> high confidence.
    """
    # Simple sigmoid scaling: max out around 100
    # Let's say N_eff=15 gives ~90 confidence, N_eff=1 gives ~10 confidence
    if n_eff <= 0:
        return 0.0
    
    # Sigmoid function centered around N_eff = 7
    k = 0.4
    x0 = 7.0
    score = 100.0 / (1.0 + math.exp(-k * (n_eff - x0)))
    return round(score, 2)

import math
