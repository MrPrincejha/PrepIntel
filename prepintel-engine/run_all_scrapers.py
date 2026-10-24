"""
PrepIntel Multi-Source Ingestion Pipeline
Orchestrates scrapers across top technical interview sources:
1. GitHub Placement & Interview Repositories (github_scraper.py)
2. LeetCode Discuss: Real Interview Experiences & OA Questions (leetcode_scraper.py)
3. GeeksforGeeks: Company Interview Experiences & Problems (gfg_scraper.py)
4. HackerRank: Algorithms & Data Structures Assessment Tracks (hackerrank_scraper.py)
5. LeetCode Catalog: Top High-Frequency Canonical Interview Problems (leetcode_problems_scraper.py)
"""

import logging
import time

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def run_all():
    logger.info("==================================================")
    logger.info("       PREPINTEL MULTI-SOURCE SCRAPER ENGINE      ")
    logger.info("==================================================")
    start_time = time.time()
    
    # 1. GitHub Scraper
    try:
        logger.info("\n>>> [1/5] Running GitHub Scraper (9 Repos)...")
        import github_scraper
        github_scraper.run()
    except Exception as e:
        logger.error(f"GitHub scraper error: {e}")

    # 2. LeetCode Discussions Scraper
    try:
        logger.info("\n>>> [2/5] Running LeetCode Discussions Scraper...")
        import leetcode_scraper
        leetcode_scraper.run(max_pages=2, per_page=20)
    except Exception as e:
        logger.error(f"LeetCode Discuss scraper error: {e}")

    # 3. GeeksforGeeks Scraper
    try:
        logger.info("\n>>> [3/5] Running GeeksforGeeks Scraper (24+ Companies)...")
        import gfg_scraper
        gfg_scraper.run()
    except Exception as e:
        logger.error(f"GeeksforGeeks scraper error: {e}")

    # 4. HackerRank Tracks Scraper
    try:
        logger.info("\n>>> [4/5] Running HackerRank Tracks Scraper...")
        import hackerrank_scraper
        hackerrank_scraper.run(limit_per_track=50)
    except Exception as e:
        logger.error(f"HackerRank scraper error: {e}")

    # 5. LeetCode Top Canonical Problems
    try:
        logger.info("\n>>> [5/5] Running LeetCode Canonical Catalog Scraper...")
        import leetcode_problems_scraper
        leetcode_problems_scraper.run(limit=150)
    except Exception as e:
        logger.error(f"LeetCode catalog scraper error: {e}")

    elapsed = round(time.time() - start_time, 2)
    logger.info(f"\n==================================================")
    logger.info(f"All 5 multi-source scrapers finished in {elapsed}s.")
    logger.info(f"==================================================")

if __name__ == "__main__":
    run_all()
