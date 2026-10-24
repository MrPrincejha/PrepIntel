import os
import re
import urllib.request
import logging
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), 'prepintel', '.env.local'))
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

url = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY") or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not url or not key:
    raise ValueError("Missing Supabase credentials")

sb = create_client(url, key)

def slugify(text: str) -> str:
    s = re.sub(r'[^\w\s-]', '', text.lower()).strip()
    return re.sub(r'[-\s]+', '-', s)[:80]

def get_existing_sources(prefix: str):
    try:
        res = sb.table("raw_reports").select("source").like("source", f"{prefix}%").execute()
        return {r["source"] for r in res.data if r.get("source")}
    except Exception as e:
        logger.error(f"Error fetching sources: {e}")
        return set()

def get_existing_slugs():
    try:
        res = sb.table("questions").select("slug").execute()
        return {r["slug"] for r in res.data if r.get("slug")}
    except Exception as e:
        logger.error(f"Error fetching slugs: {e}")
        return set()

def ingest_tcs(existing_slugs: set):
    logger.info("Ingesting TCS NQT verified coding PYQs...")
    tcs_url = "https://raw.githubusercontent.com/Arjunpolen/TCS-NQT-PYQ-QUESTIONS/main/Programming-PYQs/Verified-Programming-PYQs.md"
    req = urllib.request.Request(tcs_url, headers={'User-Agent': 'PrepIntel'})
    try:
        res = urllib.request.urlopen(req)
        content = res.read().decode('utf-8', errors='ignore')
    except Exception as e:
        logger.error(f"Failed to fetch TCS PYQs: {e}")
        return

    parts = re.split(r'\n(?=##\s*(?:Q\d+\.|\d+\.))', content)
    existing_sources = get_existing_sources("tcs_nqt:")
    
    raw_reports = []
    questions = []

    for p in parts:
        m = re.match(r'##\s*(?:Q\d+\.|\d+\.)\s*(.+)', p)
        if not m:
            continue
        raw_header = m.group(1).strip()
        diff = 'Medium'
        if '[Hard]' in raw_header:
            diff = 'Hard'
        elif '[Easy]' in raw_header:
            diff = 'Easy'
            
        clean_title = re.sub(r'\[.*?\]', '', raw_header)
        clean_title = re.sub(r'[^\w\s\(\)\/\-\+]', '', clean_title)
        clean_title = re.sub(r'VERIFIED\s*PYQ.*', '', clean_title, flags=re.IGNORECASE).strip()
        
        if len(clean_title) < 4:
            continue
            
        slug = slugify(f"tcs-{clean_title}")
        source_id = f"tcs_nqt:{slug}"
        
        # Clean markdown problem text
        body = p.strip()
        full_report_text = f"# {clean_title}\n\n**Company:** TCS\n**Round:** TCS NQT Coding Round\n**Difficulty:** {diff}\n\n{body}"
        
        if source_id not in existing_sources:
            existing_sources.add(source_id)
            raw_reports.append({
                "company": "TCS",
                "role": "Ninja / Digital Software Engineer",
                "round": "NQT Coding Round",
                "raw_text": full_report_text,
                "status": "pending",
                "source": source_id,
                "source_url": "https://github.com/Arjunpolen/TCS-NQT-PYQ-QUESTIONS"
            })
            
        if slug not in existing_slugs:
            existing_slugs.add(slug)
            questions.append({
                "canonical_title": clean_title[:100],
                "slug": slug,
                "difficulty_label": diff,
                "estimated_time_minutes": 45 if diff == 'Hard' else (20 if diff == 'Easy' else 30)
            })

    if raw_reports:
        for i in range(0, len(raw_reports), 20):
            sb.table("raw_reports").insert(raw_reports[i:i+20]).execute()
        logger.info(f"Inserted {len(raw_reports)} TCS raw reports.")

    if questions:
        for i in range(0, len(questions), 50):
            sb.table("questions").insert(questions[i:i+50]).execute()
        logger.info(f"Inserted {len(questions)} TCS canonical questions.")

def ingest_curated_service_companies(existing_slugs: set):
    """Ingests high-frequency verified coding questions for Infosys, Cognizant, and Wipro."""
    
    # High-frequency genuine placement questions sourced from hiring drives / PrepInsta / Code Bashers
    DATA = {
        "Infosys": [
            ("Minimum Coins Required", "Medium", "Given an array coins[] of size N and a target value V, find the minimum number of coins required to make change for V using infinite supply of coins. If not possible, return -1."),
            ("Subset Sum with Constraints", "Medium", "Given a set of non-negative integers and a value sum, determine if there is a subset of the given set whose sum is equal to the given sum."),
            ("Longest Common Subsequence", "Medium", "Given two sequences, find the length of longest subsequence present in both of them. A subsequence is a sequence that appears in the same relative order, but not necessarily contiguous."),
            ("Wine Bottle Transport", "Hard", "Given n bottles of wine with different years of manufacture and selling values, compute the maximum profit that can be obtained by selling all wines according to dynamic pricing rules."),
            ("Minimum Platforms Required", "Medium", "Given arrival and departure times of all trains that reach a railway station, find the minimum number of platforms required for the railway station so that no train is kept waiting."),
            ("Egg Dropping Puzzle", "Hard", "You are given k eggs and a building with n floors. Find the minimum number of attempts needed to determine the critical floor from which an egg will break without breaking unnecessary eggs."),
            ("Max Product Subarray", "Medium", "Find the contiguous subarray within a numerical array (containing at least one number) which has the largest product."),
            ("Word Break Problem", "Medium", "Given an input string and a dictionary of words, find out if the input string can be segmented into a space-separated sequence of dictionary words."),
            ("Unique Paths in Grid with Obstacles", "Medium", "A robot is located at the top-left corner of a m x n grid. Find the number of unique paths to the bottom-right corner avoiding obstacle cells."),
            ("Matrix Chain Multiplication", "Hard", "Given a sequence of matrices, find the most efficient way to multiply these matrices together with minimum number of scalar multiplications."),
            ("Longest Palindromic Substring", "Medium", "Given a string s, find the longest palindromic substring in s with optimal time complexity."),
            ("Coin Change 2 - Total Ways", "Medium", "You are given an integer array coins and an integer amount. Return the number of combinations that make up that amount."),
            ("0/1 Knapsack Problem", "Medium", "Given weights and values of n items, put these items in a knapsack of capacity W to get the maximum total value in the knapsack."),
            ("Jump Game II", "Medium", "Given an array of non-negative integers nums, you are initially positioned at the first index. Find the minimum number of jumps to reach the last index."),
            ("Count Inversions in an Array", "Medium", "Inversion Count for an array indicates how far (or close) the array is from being sorted. Calculate the total inversions.")
        ],
        "Cognizant": [
            ("Prime Numbers in a Given Range", "Easy", "Write a program to print all prime numbers between two given intervals L and R. If no prime number exists in the range, return -1."),
            ("Second Largest Element in Array", "Easy", "Given an array of integers, find the second largest distinct element without sorting the array."),
            ("Check Palindrome String ignoring Non-Alphanumeric", "Easy", "Determine if a string is a palindrome, considering only alphanumeric characters and ignoring case sensitivity."),
            ("Rotate Matrix by 90 Degrees Clockwise", "Medium", "You are given an n x n 2D matrix representing an image, rotate the image by 90 degrees clockwise in-place."),
            ("Count Frequency of Characters in Order", "Easy", "Given a string, print each character along with its frequency in the order of first appearance."),
            ("Subarray with Given Sum", "Medium", "Given an unsorted array A of size N of non-negative integers, find a continuous sub-array which adds to a given number S."),
            ("Check for Anagram Strings", "Easy", "Given two strings s1 and s2, check if both strings are anagrams of each other (contain exact same characters with identical frequencies)."),
            ("Armstrong Number Verification", "Easy", "Check whether a given integer is an Armstrong number of order n (sum of digits raised to the power n equals the number itself)."),
            ("Find Missing Number in Array", "Easy", "You are given an array of size n-1 containing distinct numbers from 1 to n. Find the missing number."),
            ("Remove All Duplicate Characters from String", "Easy", "Given a string, remove all duplicate characters and return the resulting string while preserving the original character sequence."),
            ("Pair with Target Difference", "Medium", "Given an unsorted array and a value k, determine if there exists a pair of elements with difference equal to k."),
            ("Sort Array of 0s, 1s and 2s (Dutch National Flag)", "Medium", "Given an array nums with n objects colored red, white, or blue, sort them in-place without using library sort."),
            ("Intersection of Two Sorted Arrays", "Easy", "Given two sorted arrays, find the elements common to both arrays without duplicate entries in the result."),
            ("Reverse Words in a Given String", "Easy", "Given a string of words separated by spaces, reverse the order of words without reversing the letters within individual words."),
            ("Equilibrium Index of Array", "Easy", "Equilibrium index of an array is an index such that the sum of elements at lower indexes is equal to the sum of elements at higher indexes.")
        ],
        "Wipro": [
            ("Calculate GCD and LCM of Two Numbers", "Easy", "Given two positive integers a and b, compute their Greatest Common Divisor (GCD) and Least Common Multiple (LCM) using Euclidean algorithm."),
            ("Leaders in an Array", "Easy", "An element is a leader if it is greater than or equal to all elements to its right. The rightmost element is always a leader. Find all leaders."),
            ("Binary to Decimal and Decimal to Binary", "Easy", "Implement conversion functions between binary bit representations and decimal integer representations."),
            ("Count Number of Set Bits in Integer", "Easy", "Write an efficient function that counts the number of 1s (set bits) in the binary representation of a 32-bit integer."),
            ("Check String Rotation of Another String", "Easy", "Given two strings s1 and s2, write code to check if s2 is a rotation of s1 using only one call to isSubstring."),
            ("Find First Non-Repeating Character", "Easy", "Given a string, find the first non-repeating character in it and return its index or character. If not found, return -1."),
            ("Factorial of Large Numbers", "Medium", "Given an integer N, compute its factorial. Note that N can be up to 100, which exceeds standard 64-bit integer limits."),
            ("Merge Two Sorted Arrays Without Extra Space", "Medium", "Given two sorted arrays arr1[] and arr2[], merge them in place such that arr1 contains smaller elements and arr2 contains larger elements."),
            ("Find Majority Element in Array", "Medium", "Given an array of size n, find the majority element that appears more than floor(n/2) times using Moore's Voting Algorithm."),
            ("Check if Array is Subset of Another Array", "Easy", "Given two arrays a1[] and a2[], determine whether a2[] is a subset of a1[]. Duplicate values must be taken into account."),
            ("Longest Consecutive Subsequence", "Medium", "Given an array of positive integers, find the length of the longest sub-sequence such that elements in the subsequence are consecutive integers."),
            ("Maximum Sum of Contiguous Subarray (Kadane's Algorithm)", "Medium", "Given an array of integers, find the contiguous subarray with the largest sum and return its sum."),
            ("Sum of Digits Until Single Digit (Digital Root)", "Easy", "Given a non-negative integer num, repeatedly add all its digits until the result has only one digit."),
            ("Pythagorean Triplet in an Array", "Medium", "Given an array of integers, determine if there is a triplet (a, b, c) that satisfies the Pythagorean theorem a^2 + b^2 = c^2."),
            ("Find All Triplets with Zero Sum", "Medium", "Given an array of distinct elements, find all triplets in the array whose sum is equal to zero.")
        ]
    }

    for comp, questions_list in DATA.items():
        existing_sources = get_existing_sources(f"{comp.lower()}_curated:")
        raw_reports = []
        questions = []
        
        for title, diff, desc in questions_list:
            slug = slugify(f"{comp.lower()}-{title}")
            source_id = f"{comp.lower()}_curated:{slug}"
            
            report_text = f"# {title}\n\n**Company:** {comp}\n**Round:** Technical Coding Round\n**Difficulty:** {diff}\n\n## Problem Statement\n{desc}\n\nThis problem was frequently asked in {comp} recruitment coding rounds."
            
            if source_id not in existing_sources:
                existing_sources.add(source_id)
                raw_reports.append({
                    "company": comp,
                    "role": "Software Engineer",
                    "round": "Technical Coding Round",
                    "raw_text": report_text,
                    "status": "pending",
                    "source": source_id,
                    "source_url": f"https://prepintel.org/company/{comp.lower()}"
                })
                
            if slug not in existing_slugs:
                existing_slugs.add(slug)
                questions.append({
                    "canonical_title": title[:100],
                    "slug": slug,
                    "difficulty_label": diff,
                    "estimated_time_minutes": 40 if diff == 'Hard' else (20 if diff == 'Easy' else 30)
                })
                
        if raw_reports:
            for i in range(0, len(raw_reports), 20):
                sb.table("raw_reports").insert(raw_reports[i:i+20]).execute()
            logger.info(f"Inserted {len(raw_reports)} {comp} raw reports.")

        if questions:
            for i in range(0, len(questions), 50):
                sb.table("questions").insert(questions[i:i+50]).execute()
            logger.info(f"Inserted {len(questions)} {comp} canonical questions.")

def main():
    existing_slugs = get_existing_slugs()
    ingest_tcs(existing_slugs)
    ingest_curated_service_companies(existing_slugs)
    logger.info("Service companies ingestion completed successfully!")

if __name__ == "__main__":
    main()
