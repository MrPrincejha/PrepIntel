"""
PrepIntel Unified Ingestion Runner
Orchestrates scrapers across multiple interview intelligence sources:
1. GitHub Placement & Interview Repositories (github_scraper.py)
2. LeetCode Discuss: Interview Experiences & Interview Questions (leetcode_scraper.py)
3. GeeksforGeeks Interview Experiences (gfg_scraper.py)
"""

import logging
import sys
import time

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def run_all():
    logger.info("==================================================")
    logger.info("       PREPINTEL MULTI-SOURCE SCRAPER RUNNER      ")
    logger.info("==================================================")
    start_time = time.time()
    
    # 1. GitHub Scraper
    try:
        logger.info("\n>>> [1/3] Running GitHub Scraper...")
        import github_scraper
        github_scraper.run()
    except Exception as e:
        logger.error(f"GitHub scraper encountered an error: {e}")

    # 2. LeetCode Discussions Scraper
    try:
        logger.info("\n>>> [2/3] Running LeetCode Discussions Scraper...")
        import leetcode_scraper
        leetcode_scraper.run(max_pages=2, per_page=20)
    except Exception as e:
        logger.error(f"LeetCode scraper encountered an error: {e}")

    # 3. GeeksforGeeks Scraper
    try:
        logger.info("\n>>> [3/3] Running GeeksforGeeks Scraper...")
        import gfg_scraper
        gfg_scraper.run()
    except Exception as e:
        logger.error(f"GeeksforGeeks scraper encountered an error: {e}")

    elapsed = round(time.time() - start_time, 2)
    logger.info(f"\n==================================================")
    logger.info(f"All scrapers completed successfully in {elapsed}s.")
    logger.info(f"==================================================")

if __name__ == "__main__":
    run_all()
