import os
from supabase import create_client

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
sb = create_client(url, key)

tables = ["companies", "roles", "recruitment_cycles", "rounds", "questions", "raw_reports", "bookmarks", "user_progress", "user_skill_profile", "topics", "topic_scores", "question_scores"]
for t in tables:
    try:
        res = sb.table(t).select("*", count="exact").limit(1).execute()
        print(f"Table '{t}': count={res.count}")
    except Exception as e:
        print(f"Table '{t}': error -> {e}")
