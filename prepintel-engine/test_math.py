from bayesian import calculate_effective_sample_size, compute_beta_binomial_posterior
from weighting import calculate_recency_weight, calculate_source_weight, calculate_combined_weight
from datetime import datetime, timedelta, timezone
import math

print("Running Unit Tests...")

# --- Bayesian Tests ---

# If weights are equal, N_eff should equal N
weights = [1.0, 1.0, 1.0, 1.0]
n_eff = calculate_effective_sample_size(weights)
assert n_eff == 4.0, "N_eff should equal 4.0 for equal weights"

# If weights are extremely skewed, N_eff drops
weights_skewed = [100.0, 1.0, 1.0, 1.0]
n_eff_skewed = calculate_effective_sample_size(weights_skewed)
assert n_eff_skewed < 4.0, "N_eff should be < 4.0 for skewed weights"

# Strong evidence for success
post_mean, ci_low, ci_high = compute_beta_binomial_posterior(weighted_successes=10, weighted_failures=1)
assert post_mean > 0.8, "Posterior mean should be high"
assert ci_low < post_mean < ci_high, "Credible intervals should bound the mean"

# Strong evidence for failure
post_mean, ci_low, ci_high = compute_beta_binomial_posterior(weighted_successes=1, weighted_failures=10)
assert post_mean < 0.2, "Posterior mean should be low"

# --- Weighting Tests ---

now = datetime.now(timezone.utc)
    
# 0 days old -> weight 1.0
w_today = calculate_recency_weight(now, now)
assert w_today == 1.0, "Weight for today should be 1.0"
    
# 365 days old -> weight exp(-0.35)
past = now - timedelta(days=365)
w_year = calculate_recency_weight(past, now)
assert math.isclose(w_year, math.exp(-0.35), rel_tol=1e-5), "Weight for 1 year should be ~0.7"

w = calculate_combined_weight(recency_weight=0.5, source_weight=1.0, independence_factor=0.3)
assert math.isclose(w, 0.15, rel_tol=1e-5), "Combined weight should be exactly 0.15"

print("All Math Unit Tests Passed Successfully! 🚀")
