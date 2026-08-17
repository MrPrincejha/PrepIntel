def compute_question_score(
    topic_score: float,
    pattern_score: float,
    recency_score: float,
    difficulty_fit: float,
    direct_evidence_score: float,
    weights: dict = None
) -> float:
    """
    Question scoring (sections 23-25, MVP subset only): 
    Score(q) = w1*topic_score + w2*pattern_score + w3*recency + w4*difficulty_fit + w5*direct_evidence_score
    """
    if weights is None:
        weights = {
            'w1': 0.4,
            'w2': 0.2,
            'w3': 0.1,
            'w4': 0.1,
            'w5': 0.2
        }
        
    raw_score = (
        weights['w1'] * topic_score +
        weights['w2'] * pattern_score +
        weights['w3'] * recency_score +
        weights['w4'] * difficulty_fit +
        weights['w5'] * direct_evidence_score
    )
    
    # Normalize to 0-100 (assuming individual inputs are bounded 0-100, if inputs are 0-1 then multiply by 100)
    # Let's assume inputs are 0-1 probabilities/scores
    return round(raw_score * 100.0, 2)
